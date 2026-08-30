import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {describe, it} from 'node:test';
import {inspect} from 'node:util';
import iconFontGenerator, {
    DEFAULT_FONT_NAME,
    FONT_FORMATS,
    type FontFormat,
    isIconFontGeneratorError,
    PRIVATE_USE_AREA_START,
    toLigature,
} from '../dist/index.js';
import {fixture, makeTempDir} from './helpers/tmp.ts';

async function generate(
    input: string,
    options: {name?: string; types?: string[]} = {},
): Promise<{output: string; paths: string[]; warnings: string[]}> {
    const output = await makeTempDir();
    const warnings: string[] = [];
    const paths = await iconFontGenerator({
        input,
        output,
        name: options.name ?? 'test',
        types: options.types ?? null,
        onWarning: message => warnings.push(message),
    });

    return {output, paths, warnings};
}

async function expectError(promise: Promise<unknown>, code: string): Promise<Error & {code: string}> {
    const error = await promise.then(
        () => null,
        (thrown: unknown) => thrown,
    );

    assert.ok(error, 'expected the call to reject');
    assert.ok(isIconFontGeneratorError(error), `expected an IconFontGeneratorError, got ${inspect(error)}`);
    assert.equal(error.code, code);

    return error;
}

describe('a normal icon folder', () => {
    it('writes every supported format by default', async () => {
        const {output, paths} = await generate(fixture('basic'));

        assert.deepEqual(
            paths.map(filePath => path.basename(filePath)),
            FONT_FORMATS.map(format => `test.${format}`),
        );

        for (const filePath of paths) {
            assert.equal(path.isAbsolute(filePath), true, `${filePath} should be absolute`);
            const stats = await fs.stat(filePath);
            assert.ok(stats.size > 0, `${filePath} should not be empty`);
        }

        assert.deepEqual((await fs.readdir(output)).sort(), FONT_FORMATS.map(format => `test.${format}`).sort());
    });

    it('handles a folder with a single icon', async () => {
        const {paths} = await generate(fixture('single'), {types: ['svg']});
        const svg = await fs.readFile(paths[0]!, 'utf8');

        assert.match(svg, /glyph-name="star"/);
        assert.match(svg, /unicode="&#xE000;"/);
    });

    it('creates the output directory when it does not exist', async () => {
        const output = path.join(await makeTempDir(), 'nested', 'deeper');
        const paths = await iconFontGenerator({input: fixture('basic'), output, name: 'test', types: ['svg']});

        assert.equal(paths.length, 1);
        assert.ok((await fs.stat(output)).isDirectory());
    });
});

describe('format selection', () => {
    for (const format of FONT_FORMATS) {
        it(`generates only ${format} when asked for it`, async () => {
            const {output, paths} = await generate(fixture('basic'), {types: [format]});

            assert.deepEqual(
                paths.map(filePath => path.basename(filePath)),
                [`test.${format}`],
            );
            assert.deepEqual(await fs.readdir(output), [`test.${format}`]);
        });
    }

    it('returns the paths in the requested order', async () => {
        const {paths} = await generate(fixture('basic'), {types: ['woff2', 'svg', 'ttf']});

        assert.deepEqual(
            paths.map(filePath => path.basename(filePath)),
            ['test.woff2', 'test.svg', 'test.ttf'],
        );
    });

    it('collapses duplicate formats', async () => {
        const {paths} = await generate(fixture('basic'), {types: ['svg', 'svg', 'SVG']});

        assert.deepEqual(
            paths.map(filePath => path.basename(filePath)),
            ['test.svg'],
        );
    });

    it('falls back to every format for an empty list', async () => {
        const {paths} = await generate(fixture('basic'), {types: []});

        assert.equal(paths.length, FONT_FORMATS.length);
    });

    it('rejects an unknown format', async () => {
        const error = await expectError(generate(fixture('basic'), {types: ['otf']}), 'INVALID_OPTIONS');

        assert.match(error.message, /otf/);
    });
});

describe('naming and unicode', () => {
    it('assigns sequential Private Use Area code points in sorted file order', async () => {
        const {paths} = await generate(fixture('naming'), {types: ['svg']});
        const svg = await fs.readFile(paths[0]!, 'utf8');
        const glyphNames = [...svg.matchAll(/glyph-name="([^"]+)"/g)].map(match => match[1]);

        // Two glyphs per icon: the code point glyph and the ligature glyph (suffixed by -1).
        assert.deepEqual(glyphNames, [
            'Alpha',
            'Alpha-1',
            'arrow-left',
            'arrow-left-1',
            'beta',
            'beta-1',
            'zoom-out',
            'zoom-out-1',
        ]);

        const codepoints = [...svg.matchAll(/unicode="&#x([0-9A-F]{4});"/g)].map(match =>
            Number.parseInt(match[1]!, 16),
        );
        assert.deepEqual(codepoints, [
            PRIVATE_USE_AREA_START,
            PRIVATE_USE_AREA_START + 1,
            PRIVATE_USE_AREA_START + 2,
            PRIVATE_USE_AREA_START + 3,
        ]);
    });

    it('turns hyphens in file names into underscores in the ligature', async () => {
        const {paths} = await generate(fixture('naming'), {types: ['svg']});
        const svg = await fs.readFile(paths[0]!, 'utf8');

        // "arrow_left" as a sequence of XML character references.
        // eslint-disable-next-line @typescript-eslint/no-misused-spread -- an ASCII literal, so code points are exactly what is wanted.
        const expected = [...'arrow_left']
            .map(character => `&#x${character.codePointAt(0)?.toString(16).toUpperCase()};`)
            .join('');
        assert.ok(svg.includes(expected), 'expected an arrow_left ligature glyph');
        assert.equal(toLigature('zoom-out'), 'zoom_out');
        assert.equal(toLigature('already_fine'), 'already_fine');
    });

    it('uses the name for both the font family and the file name', async () => {
        const {paths} = await generate(fixture('basic'), {name: 'my-icons', types: ['svg']});
        const svg = await fs.readFile(paths[0]!, 'utf8');

        assert.equal(path.basename(paths[0]!), 'my-icons.svg');
        assert.match(svg, /font-family="my-icons"/);
        assert.match(svg, /<font id="my-icons"/);
    });

    it(`defaults the name to "${DEFAULT_FONT_NAME}"`, async () => {
        const output = await makeTempDir();
        const paths = await iconFontGenerator({input: fixture('basic'), output, types: ['svg']});

        assert.equal(path.basename(paths[0]!), `${DEFAULT_FONT_NAME}.svg`);
    });

    it('rejects a name that would escape the output directory', async () => {
        for (const name of ['../evil', 'nested/name', '.', '..']) {
            await expectError(generate(fixture('basic'), {name, types: ['svg']}), 'INVALID_OPTIONS');
        }
    });
});

describe('reproducibility', () => {
    it('produces identical SVG font output across runs', async () => {
        const first = await generate(fixture('naming'), {types: ['svg']});
        const second = await generate(fixture('naming'), {types: ['svg']});

        assert.equal(await fs.readFile(first.paths[0]!, 'utf8'), await fs.readFile(second.paths[0]!, 'utf8'));
    });

    it('matches the SVG font generated before the 2.0 modernisation', async () => {
        const {paths} = await generate(fixture('basic'), {types: ['svg']});

        assert.equal(await fs.readFile(paths[0]!, 'utf8'), await fs.readFile(fixture('golden/basic.svg'), 'utf8'));
    });
});

describe('invalid input', () => {
    it('reports a missing input directory', async () => {
        const error = await expectError(generate(fixture('does-not-exist')), 'INPUT_NOT_FOUND');

        assert.match(error.message, /does-not-exist/);
    });

    it('reports an input path that is a file', async () => {
        await expectError(generate(fixture('basic/email.svg')), 'INPUT_NOT_A_DIRECTORY');
    });

    it('reports an empty input directory', async () => {
        await expectError(generate(await makeTempDir()), 'NO_ICONS');
    });

    it('reports a directory that only holds non-SVG files', async () => {
        const input = await makeTempDir();
        await fs.writeFile(path.join(input, 'readme.txt'), 'nothing to see');

        await expectError(generate(input), 'NO_ICONS');
    });

    it('names the file that fails to parse', async () => {
        const error = await expectError(generate(fixture('invalid')), 'INVALID_SVG');

        assert.match(error.message, /broken\.svg/);
    });

    it('rejects well formed XML that is not an SVG', async () => {
        const error = await expectError(generate(fixture('not-svg')), 'INVALID_SVG');

        assert.match(error.message, /notes\.svg/);
        assert.match(error.message, /<svg> root element/);
    });

    it('rejects an empty SVG file', async () => {
        const input = await makeTempDir();
        await fs.writeFile(path.join(input, 'blank.svg'), '');

        const error = await expectError(generate(input), 'INVALID_SVG');
        assert.match(error.message, /blank\.svg is empty/);
    });

    it('requires input and output', async () => {
        const output = await makeTempDir();

        await expectError(iconFontGenerator({input: '', output}), 'INVALID_OPTIONS');
        await expectError(iconFontGenerator({input: fixture('basic'), output: ''}), 'INVALID_OPTIONS');
        await expectError(iconFontGenerator(null as unknown as {input: string; output: string}), 'INVALID_OPTIONS');
    });
});

describe('conflicting icons', () => {
    it('refuses two icons that collapse onto the same ligature', async () => {
        const error = await expectError(generate(fixture('collision')), 'DUPLICATE_LIGATURE');

        assert.match(error.message, /arrow-left/);
        assert.match(error.message, /arrow_left/);
    });
});

describe('warnings', () => {
    it('warns about non-SVG entries but still generates the font', async () => {
        const {paths, warnings} = await generate(fixture('mixed'), {types: ['svg']});

        assert.equal(paths.length, 1);
        assert.equal(warnings.length, 1);
        assert.match(warnings[0]!, /Ignored 2 non-SVG entries/);
        assert.match(warnings[0]!, /README\.md/);
        assert.doesNotMatch(warnings[0]!, /hidden/, 'dotfiles should be ignored without a warning');
    });

    it('accepts an uppercase .SVG extension', async () => {
        const {paths} = await generate(fixture('mixed'), {types: ['svg']});
        const svg = await fs.readFile(paths[0]!, 'utf8');

        assert.match(svg, /glyph-name="also-keep"/);
        assert.match(svg, /glyph-name="keep"/);
    });
});

describe('module surface', () => {
    it('exposes the generator as both a default and a named export', async () => {
        const module = await import('../dist/index.js');

        assert.equal(typeof module.default, 'function');
        assert.equal(module.default, module.iconFontGenerator);
    });

    it('exports the supported formats', () => {
        assert.deepEqual([...FONT_FORMATS] as FontFormat[], ['svg', 'ttf', 'woff', 'woff2', 'eot']);
    });
});
