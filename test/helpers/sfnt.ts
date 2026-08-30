import assert from 'node:assert/strict';
import {inflateSync} from 'node:zlib';

// Minimal SFNT reader, so the tests can assert what is inside a generated font rather than only
// that the file is non-empty.

export const SFNT_TRUETYPE_VERSION = 0x00010000;

export interface SfntTable {
    tag: string;
    offset: number;
    length: number;
}

export interface Sfnt {
    version: number;
    numTables: number;
    tables: Map<string, SfntTable>;
    buffer: Buffer;
}

export function parseSfnt(buffer: Buffer): Sfnt {
    assert.ok(buffer.length > 12, 'font is too short to contain an SFNT header');

    const version = buffer.readUInt32BE(0);
    const numTables = buffer.readUInt16BE(4);
    const tables = new Map<string, SfntTable>();

    for (let index = 0; index < numTables; index++) {
        const record = 12 + index * 16;
        tables.set(buffer.subarray(record, record + 4).toString('latin1'), {
            tag: buffer.subarray(record, record + 4).toString('latin1'),
            offset: buffer.readUInt32BE(record + 8),
            length: buffer.readUInt32BE(record + 12),
        });
    }

    return {version, numTables, tables, buffer};
}

function table(font: Sfnt, tag: string): SfntTable {
    const found = font.tables.get(tag);
    assert.ok(found, `font is missing the "${tag}" table`);
    return found;
}

export function readNumGlyphs(font: Sfnt): number {
    return font.buffer.readUInt16BE(table(font, 'maxp').offset + 4);
}

export function readUnitsPerEm(font: Sfnt): number {
    return font.buffer.readUInt16BE(table(font, 'head').offset + 18);
}

/** Only the format 4 and format 12 subtables that svg2ttf emits are supported. */
export function readCmap(font: Sfnt): Map<number, number> {
    const cmap = table(font, 'cmap');
    const {buffer} = font;
    const numSubtables = buffer.readUInt16BE(cmap.offset + 2);
    const mapping = new Map<number, number>();

    for (let index = 0; index < numSubtables; index++) {
        const record = cmap.offset + 4 + index * 8;
        const subtable = cmap.offset + buffer.readUInt32BE(record + 4);
        const format = buffer.readUInt16BE(subtable);

        if (format === 4) {
            readCmapFormat4(buffer, subtable, mapping);
        } else if (format === 12) {
            readCmapFormat12(buffer, subtable, mapping);
        }
    }

    assert.ok(mapping.size > 0, 'cmap contained no usable subtable');

    return mapping;
}

function readCmapFormat4(buffer: Buffer, subtable: number, mapping: Map<number, number>): void {
    const segCountX2 = buffer.readUInt16BE(subtable + 6);
    const segCount = segCountX2 / 2;
    const endCodes = subtable + 14;
    const startCodes = endCodes + segCountX2 + 2;
    const idDeltas = startCodes + segCountX2;
    const idRangeOffsets = idDeltas + segCountX2;

    for (let segment = 0; segment < segCount; segment++) {
        const end = buffer.readUInt16BE(endCodes + segment * 2);
        const start = buffer.readUInt16BE(startCodes + segment * 2);
        const delta = buffer.readInt16BE(idDeltas + segment * 2);
        const rangeOffset = buffer.readUInt16BE(idRangeOffsets + segment * 2);

        if (start === 0xffff) {
            continue;
        }

        for (let code = start; code <= end && code !== 0x10000; code++) {
            let glyphId: number;

            if (rangeOffset === 0) {
                glyphId = (code + delta) & 0xffff;
            } else {
                const address = idRangeOffsets + segment * 2 + rangeOffset + (code - start) * 2;
                glyphId = buffer.readUInt16BE(address);
                if (glyphId !== 0) {
                    glyphId = (glyphId + delta) & 0xffff;
                }
            }

            if (glyphId !== 0) {
                mapping.set(code, glyphId);
            }
        }
    }
}

function readCmapFormat12(buffer: Buffer, subtable: number, mapping: Map<number, number>): void {
    const numGroups = buffer.readUInt32BE(subtable + 12);

    for (let group = 0; group < numGroups; group++) {
        const record = subtable + 16 + group * 12;
        const start = buffer.readUInt32BE(record);
        const end = buffer.readUInt32BE(record + 4);
        const startGlyphId = buffer.readUInt32BE(record + 8);

        for (let code = start; code <= end; code++) {
            mapping.set(code, startGlyphId + (code - start));
        }
    }
}

export function readNames(font: Sfnt): Map<number, string> {
    const name = table(font, 'name');
    const {buffer} = font;
    const count = buffer.readUInt16BE(name.offset + 2);
    const stringOffset = name.offset + buffer.readUInt16BE(name.offset + 4);
    const names = new Map<number, string>();

    for (let index = 0; index < count; index++) {
        const record = name.offset + 6 + index * 12;
        const platformId = buffer.readUInt16BE(record);
        const nameId = buffer.readUInt16BE(record + 6);
        const length = buffer.readUInt16BE(record + 8);
        const offset = stringOffset + buffer.readUInt16BE(record + 10);
        const raw = buffer.subarray(offset, offset + length);

        // Platform 3 (Windows) stores UTF-16BE, platform 1 (Macintosh) stores single bytes.
        const value = platformId === 3 ? raw.swap16().toString('utf16le') : raw.toString('latin1');

        if (!names.has(nameId)) {
            names.set(nameId, value);
        }
    }

    return names;
}

/** Rebuilds the SFNT a WOFF wraps, so the same assertions can run against it. */
export function unwrapWoff(buffer: Buffer): Buffer {
    assert.equal(buffer.subarray(0, 4).toString('latin1'), 'wOFF', 'not a WOFF file');
    assert.equal(buffer.readUInt32BE(8), buffer.length, 'WOFF header length does not match the file size');

    const numTables = buffer.readUInt16BE(12);
    const totalSfntSize = buffer.readUInt32BE(16);
    const sfnt = Buffer.alloc(totalSfntSize);

    sfnt.writeUInt32BE(buffer.readUInt32BE(4), 0);
    sfnt.writeUInt16BE(numTables, 4);

    // searchRange / entrySelector / rangeShift are not needed by the readers above.
    let payloadOffset = 12 + numTables * 16;

    for (let index = 0; index < numTables; index++) {
        const record = 44 + index * 20;
        const tag = buffer.subarray(record, record + 4);
        const offset = buffer.readUInt32BE(record + 4);
        const compLength = buffer.readUInt32BE(record + 8);
        const origLength = buffer.readUInt32BE(record + 12);
        const origChecksum = buffer.readUInt32BE(record + 16);
        const raw = buffer.subarray(offset, offset + compLength);
        const data = compLength < origLength ? inflateSync(raw) : raw;

        assert.equal(data.length, origLength, `WOFF table "${tag.toString('latin1')}" has the wrong length`);

        const directory = 12 + index * 16;
        tag.copy(sfnt, directory);
        sfnt.writeUInt32BE(origChecksum, directory + 4);
        sfnt.writeUInt32BE(payloadOffset, directory + 8);
        sfnt.writeUInt32BE(origLength, directory + 12);
        data.copy(sfnt, payloadOffset);

        payloadOffset += origLength + ((4 - (origLength % 4)) % 4);
    }

    return sfnt;
}

export interface Woff2Header {
    signature: string;
    flavor: number;
    length: number;
    numTables: number;
    totalSfntSize: number;
    totalCompressedSize: number;
}

/** WOFF2 transforms its table directory, so without a full decoder only the header is checkable. */
export function readWoff2Header(buffer: Buffer): Woff2Header {
    return {
        signature: buffer.subarray(0, 4).toString('latin1'),
        flavor: buffer.readUInt32BE(4),
        length: buffer.readUInt32BE(8),
        numTables: buffer.readUInt16BE(12),
        totalSfntSize: buffer.readUInt32BE(16),
        totalCompressedSize: buffer.readUInt32BE(20),
    };
}

export interface EotHeader {
    eotSize: number;
    fontDataSize: number;
    version: number;
    magicNumber: number;
}

export function readEotHeader(buffer: Buffer): EotHeader {
    return {
        eotSize: buffer.readUInt32LE(0),
        fontDataSize: buffer.readUInt32LE(4),
        version: buffer.readUInt32LE(8),
        magicNumber: buffer.readUInt16LE(34),
    };
}
