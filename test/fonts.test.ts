import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {before, describe, it} from 'node:test';
import iconFontGenerator, {PRIVATE_USE_AREA_START} from '../dist/index.js';
import {
    parseSfnt,
    readCmap,
    readEotHeader,
    readNames,
    readNumGlyphs,
    readUnitsPerEm,
    readWoff2Header,
    SFNT_TRUETYPE_VERSION,
    type Sfnt,
    unwrapWoff,
} from './helpers/sfnt.ts';
import {fixture, makeTempDir} from './helpers/tmp.ts';

const FONT_NAME = 'verify';
const ICONS = ['email', 'inbox'];
/**
 * svg2ttf turns each ligature into a GSUB substitution over the individual characters of the icon
 * name, so the font holds `.notdef`, one glyph per icon code point and one glyph per distinct
 * character used by any ligature.
 */
const LIGATURE_CHARACTERS = new Set(ICONS.join(''));
const EXPECTED_GLYPHS = 1 + ICONS.length + LIGATURE_CHARACTERS.size;

let output: string;

before(async () => {
    output = await makeTempDir();
    await iconFontGenerator({input: fixture('basic'), output, name: FONT_NAME});
});

function file(extension: string): string {
    return path.join(output, `${FONT_NAME}.${extension}`);
}

/**
 * The structural assertions that must hold for the TrueType data, whether it came from the .ttf
 * file directly or from unwrapping the .woff container.
 */
function assertValidSfnt(font: Sfnt, source: string): void {
    assert.equal(font.version, SFNT_TRUETYPE_VERSION, `${source}: not a TrueType font`);

    for (const tag of ['head', 'hhea', 'maxp', 'cmap', 'glyf', 'loca', 'name', 'hmtx', 'post', 'OS/2']) {
        assert.ok(font.tables.has(tag), `${source}: missing required table "${tag}"`);
    }

    assert.ok(font.tables.has('GSUB'), `${source}: missing GSUB, so the ligatures were not written`);
    assert.equal(readNumGlyphs(font), EXPECTED_GLYPHS, `${source}: unexpected glyph count`);
    assert.equal(readUnitsPerEm(font), 1000, `${source}: unexpected units per em`);

    const cmap = readCmap(font);
    ICONS.forEach((icon, index) => {
        const codepoint = PRIVATE_USE_AREA_START + index;
        assert.ok(cmap.has(codepoint), `${source}: U+${codepoint.toString(16).toUpperCase()} (${icon}) is not mapped`);
        assert.notEqual(cmap.get(codepoint), 0, `${source}: ${icon} maps to .notdef`);
    });

    const uniqueGlyphIds = new Set(ICONS.map((_, index) => cmap.get(PRIVATE_USE_AREA_START + index)));
    assert.equal(uniqueGlyphIds.size, ICONS.length, `${source}: icons share a glyph id`);

    // The ligature characters have to be reachable too, otherwise GSUB has nothing to substitute.
    for (const character of LIGATURE_CHARACTERS) {
        const codepoint = character.codePointAt(0)!;
        assert.ok(cmap.has(codepoint), `${source}: ligature character "${character}" is not mapped`);
    }

    assert.equal(cmap.size, ICONS.length + LIGATURE_CHARACTERS.size, `${source}: unexpected cmap size`);

    const names = readNames(font);
    assert.equal(names.get(1), FONT_NAME, `${source}: unexpected font family in the name table`);
    assert.equal(names.get(6), FONT_NAME, `${source}: unexpected PostScript name`);
}

describe('SVG output', () => {
    it('is a valid SVG font with a glyph per icon and per ligature', async () => {
        const svg = await fs.readFile(file('svg'), 'utf8');

        assert.match(svg, /^<\?xml version="1\.0" standalone="no"\?>/);
        assert.match(svg, new RegExp(`<font id="${FONT_NAME}"`));
        assert.match(svg, new RegExp(`font-family="${FONT_NAME}"`));
        assert.match(svg, /units-per-em="1000"/);
        assert.match(svg, /<missing-glyph/);

        const glyphs = [...svg.matchAll(/<glyph glyph-name="([^"]+)"/g)].map(match => match[1]);
        assert.deepEqual(glyphs, ['email', 'email-1', 'inbox', 'inbox-1']);

        // Every glyph carries actual outline data.
        const outlines = [...svg.matchAll(/ d="([^"]+)"/g)].map(match => match[1]!);
        assert.equal(outlines.length, glyphs.length);
        for (const outline of outlines) {
            assert.ok(outline.length > 20, 'glyph outline looks empty');
        }
    });
});

describe('TTF output', () => {
    it('is a structurally valid TrueType font', async () => {
        assertValidSfnt(parseSfnt(await fs.readFile(file('ttf'))), 'ttf');
    });
});

describe('WOFF output', () => {
    it('wraps a TrueType font that still contains every glyph and mapping', async () => {
        const woff = await fs.readFile(file('woff'));

        assert.equal(woff.subarray(0, 4).toString('latin1'), 'wOFF');
        assert.equal(woff.readUInt32BE(4), SFNT_TRUETYPE_VERSION, 'unexpected WOFF flavor');
        assert.equal(woff.readUInt32BE(8), woff.length, 'WOFF length field does not match the file size');

        const ttf = await fs.readFile(file('ttf'));
        assert.ok(woff.length < ttf.length, 'WOFF should be smaller than the TTF it wraps');

        // Decompress the container and run the full TTF verification over the result.
        assertValidSfnt(parseSfnt(unwrapWoff(woff)), 'woff');
    });
});

describe('WOFF2 output', () => {
    it('has a valid WOFF2 header describing the same font', async () => {
        const header = readWoff2Header(await fs.readFile(file('woff2')));
        const ttf = parseSfnt(await fs.readFile(file('ttf')));
        const size = (await fs.stat(file('woff2'))).size;

        assert.equal(header.signature, 'wOF2');
        assert.equal(header.flavor, SFNT_TRUETYPE_VERSION);
        assert.equal(header.length, size, 'WOFF2 length field does not match the file size');
        assert.equal(header.numTables, ttf.numTables, 'WOFF2 declares a different table count than the TTF');
        assert.ok(header.totalCompressedSize > 0);
        assert.ok(size < (await fs.stat(file('woff'))).size, 'WOFF2 should be smaller than WOFF');
    });
});

describe('EOT output', () => {
    it('has a valid EOT header embedding the TTF', async () => {
        const eot = await fs.readFile(file('eot'));
        const ttf = await fs.readFile(file('ttf'));
        const header = readEotHeader(eot);

        assert.equal(header.eotSize, eot.length, 'EOT size field does not match the file size');
        assert.equal(header.magicNumber, 0x504c, 'missing the EOT magic number');
        assert.equal(header.version, 0x00020001, 'unexpected EOT version');
        assert.equal(header.fontDataSize, ttf.length, 'EOT does not embed the whole TTF');
        assert.ok(eot.includes(ttf), 'the embedded font data differs from the generated TTF');
    });
});

describe('cross-format consistency', () => {
    it('reports the same total SFNT size for WOFF and WOFF2', async () => {
        const woff = await fs.readFile(file('woff'));
        const woff2 = await fs.readFile(file('woff2'));

        assert.equal(woff.readUInt32BE(16), readWoff2Header(woff2).totalSfntSize);
    });
});
