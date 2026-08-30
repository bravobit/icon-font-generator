import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import {describe, it} from 'node:test';
import {promisify} from 'node:util';
import {fixture, makeTempDir} from './helpers/tmp.ts';

const CLI = path.join(import.meta.dirname, '..', 'dist', 'cli.js');
const run = promisify(execFile);

/**
 * The CLI's colour handling reads the environment, so the child process gets a deterministic one.
 * npm sets FORCE_COLOR for lifecycle scripts started from a terminal, and it outranks NO_COLOR,
 * which would otherwise make these tests pass only when run outside a TTY.
 */
function cliEnv(): NodeJS.ProcessEnv {
    const env = {...process.env};

    delete env.FORCE_COLOR;

    return {...env, NO_COLOR: '1'};
}

/** The mirror image of cliEnv: a terminal-like environment where colour is expected. */
function colourEnv(): NodeJS.ProcessEnv {
    const env = {...process.env};

    delete env.NO_COLOR;

    return {...env, FORCE_COLOR: '1'};
}

interface CliResult {
    code: number;
    stdout: string;
    stderr: string;
}

async function cli(args: string[], env: NodeJS.ProcessEnv = cliEnv()): Promise<CliResult> {
    try {
        const {stdout, stderr} = await run(process.execPath, [CLI, ...args], {env});

        return {code: 0, stdout, stderr};
    } catch (error) {
        const failure = error as {code?: number; stdout?: string; stderr?: string};

        return {code: failure.code ?? 1, stdout: failure.stdout ?? '', stderr: failure.stderr ?? ''};
    }
}

describe('--help', () => {
    it('prints usage on stdout and exits 0', async () => {
        const result = await cli(['--help']);

        assert.equal(result.code, 0);
        assert.equal(result.stderr, '');
        assert.match(result.stdout, /Usage/);
        assert.match(result.stdout, /--input/);
        assert.match(result.stdout, /--output/);
        assert.match(result.stdout, /--name/);
        assert.match(result.stdout, /--type/);
        assert.match(result.stdout, /Exit codes/);
    });

    it('is also available as -h', async () => {
        assert.equal((await cli(['-h'])).stdout, (await cli(['--help'])).stdout);
    });
});

describe('--version', () => {
    it('prints the package version and exits 0', async () => {
        const manifest = JSON.parse(
            await fs.readFile(path.join(import.meta.dirname, '..', 'package.json'), 'utf8'),
        ) as {
            version: string;
        };
        const result = await cli(['--version']);

        assert.equal(result.code, 0);
        assert.equal(result.stdout.trim(), manifest.version);
    });
});

describe('generating a font', () => {
    it('writes only the generated paths to stdout and progress to stderr', async () => {
        const output = await makeTempDir();
        const result = await cli(['--input', fixture('basic'), '--output', output, '--name', 'test']);

        assert.equal(result.code, 0);

        const lines = result.stdout.trim().split('\n');
        assert.deepEqual(
            lines.map(line => path.basename(line)),
            ['test.svg', 'test.ttf', 'test.woff', 'test.woff2', 'test.eot'],
        );
        for (const line of lines) {
            assert.ok(await fs.stat(line), `${line} should exist`);
        }

        assert.match(result.stderr, /Reading icons/);
        assert.match(result.stderr, /Done, wrote 5 files/);
    });

    it('supports the short flags', async () => {
        const output = await makeTempDir();
        const result = await cli(['-i', fixture('basic'), '-o', output, '-n', 'short', '-t', 'ttf', '-t', 'woff']);

        assert.equal(result.code, 0);
        assert.deepEqual(
            result.stdout
                .trim()
                .split('\n')
                .map(line => path.basename(line)),
            ['short.ttf', 'short.woff'],
        );
    });

    it('resolves relative paths against the working directory', async () => {
        const workingDirectory = await fs.realpath(await makeTempDir());
        await fs.cp(fixture('basic'), path.join(workingDirectory, 'icons'), {recursive: true});

        const {stdout} = await run(process.execPath, [CLI, '-i', 'icons', '-o', 'out', '-n', 'rel'], {
            cwd: workingDirectory,
            env: cliEnv(),
        });

        assert.equal(path.dirname(stdout.trim().split('\n')[0]!), path.join(workingDirectory, 'out'));
        assert.ok((await fs.stat(path.join(workingDirectory, 'out', 'rel.svg'))).size > 0);
    });

    it('accepts an absolute output path without nesting it under the working directory', async () => {
        const output = path.join(await makeTempDir(), 'absolute');
        const result = await cli(['-i', fixture('basic'), '-o', output, '-n', 'abs', '-t', 'svg']);

        assert.equal(result.code, 0);
        assert.equal(result.stdout.trim(), path.join(output, 'abs.svg'));
    });

    it('defaults the font name to "default"', async () => {
        const output = await makeTempDir();
        const result = await cli(['-i', fixture('basic'), '-o', output, '-t', 'svg']);

        assert.equal(path.basename(result.stdout.trim()), 'default.svg');
    });
});

describe('--quiet', () => {
    it('keeps stdout intact and silences stderr', async () => {
        const output = await makeTempDir();
        const result = await cli(['-i', fixture('mixed'), '-o', output, '-n', 'quiet', '-t', 'svg', '--quiet']);

        assert.equal(result.code, 0);
        assert.equal(result.stderr, '');
        assert.equal(path.basename(result.stdout.trim()), 'quiet.svg');
    });

    it('still reports warnings without --quiet', async () => {
        const output = await makeTempDir();
        const result = await cli(['-i', fixture('mixed'), '-o', output, '-n', 'loud', '-t', 'svg']);

        assert.match(result.stderr, /warning: Ignored 2 non-SVG entries/);
    });
});

describe('exit codes', () => {
    it('exits 2 without arguments', async () => {
        const result = await cli([]);

        assert.equal(result.code, 2);
        assert.equal(result.stdout, '');
        assert.match(result.stderr, /required option '-i, --input <dir>' not specified/);
    });

    it('exits 2 when only --input is given', async () => {
        const result = await cli(['-i', fixture('basic')]);

        assert.equal(result.code, 2);
        assert.match(result.stderr, /required option '-o, --output <dir>' not specified/);
    });

    it('exits 2 on an unknown flag and names it', async () => {
        const output = await makeTempDir();
        const result = await cli(['-i', fixture('basic'), '-o', output, '--nope']);

        assert.equal(result.code, 2);
        assert.equal(result.stdout, '');
        assert.match(result.stderr, /error: unknown option '--nope'/);
        assert.match(result.stderr, /--help/);
        assert.deepEqual(await fs.readdir(output), []);
    });

    it('exits 2 on an unknown flag even when the required options are missing too', async () => {
        const result = await cli(['--nope']);

        assert.equal(result.code, 2);
        assert.match(result.stderr, /error:/);
        assert.match(result.stderr, /--help/);
    });

    it('exits 2 on an unexpected positional argument', async () => {
        const result = await cli(['-i', fixture('basic'), '-o', await makeTempDir(), 'icons']);

        assert.equal(result.code, 2);
        assert.match(result.stderr, /error: too many arguments/);
    });

    it('exits 2 on an unknown --type', async () => {
        const output = await makeTempDir();
        const result = await cli(['-i', fixture('basic'), '-o', output, '-t', 'otf']);

        assert.equal(result.code, 2);
        assert.match(result.stderr, /Unknown font format "otf"/);
        assert.match(result.stderr, /hint: Supported formats are: svg, ttf, woff, woff2, eot\./);
    });

    it('exits 1 when the input directory does not exist', async () => {
        const output = await makeTempDir();
        const result = await cli(['-i', fixture('does-not-exist'), '-o', output]);

        assert.equal(result.code, 1);
        assert.equal(result.stdout, '');
        assert.match(result.stderr, /error: Input directory does not exist/);
        assert.doesNotMatch(result.stderr, /at Module/, 'a stack trace leaked into stderr');
    });

    it('exits 1 when the input directory holds no icons', async () => {
        const result = await cli(['-i', await makeTempDir(), '-o', await makeTempDir()]);

        assert.equal(result.code, 1);
        assert.match(result.stderr, /error: No \.svg files found/);
        assert.match(result.stderr, /hint: Point --input/);
    });

    it('exits 1 on an unparseable icon and names the file', async () => {
        const result = await cli(['-i', fixture('invalid'), '-o', await makeTempDir()]);

        assert.equal(result.code, 1);
        assert.match(result.stderr, /error: Cannot parse .*broken\.svg/);
    });

    it('exits 1 on colliding ligatures', async () => {
        const result = await cli(['-i', fixture('collision'), '-o', await makeTempDir()]);

        assert.equal(result.code, 1);
        assert.match(result.stderr, /error: Icons .* both map to the ligature "arrow_left"/);
    });

    it('writes nothing to the output directory when it fails', async () => {
        const output = await makeTempDir();
        await cli(['-i', fixture('collision'), '-o', output]);

        assert.deepEqual(await fs.readdir(output), []);
    });
});

describe('non-interactive behaviour', () => {
    it('emits no ANSI escape codes when the streams are pipes', async () => {
        const output = await makeTempDir();
        const result = await cli(['-i', fixture('mixed'), '-o', output, '-n', 'plain', '-t', 'svg']);
        const failure = await cli(['-i', fixture('does-not-exist'), '-o', output]);
        // eslint-disable-next-line no-control-regex -- asserting the absence of ANSI escapes is the point.
        const ansi = /\u001b\[/;

        assert.doesNotMatch(result.stdout + result.stderr, ansi);
        assert.doesNotMatch(failure.stderr, ansi);
    });

    it('does emit colour when the environment asks for it', async () => {
        const output = await makeTempDir();
        const result = await cli(
            ['-i', fixture('basic'), '-o', output, '-n', 'colour', '-t', 'svg'],
            colourEnv(),
        );

        assert.equal(result.code, 0);
        // eslint-disable-next-line no-control-regex -- asserting the presence of ANSI escapes is the point.
        assert.match(result.stderr, /\u001b\[/);
        // eslint-disable-next-line no-control-regex -- the generated paths must stay plain either way.
        assert.doesNotMatch(result.stdout, /\u001b\[/);
    });

    it('never prompts and terminates on its own', async () => {
        const output = await makeTempDir();
        const result = await cli(['-i', fixture('basic'), '-o', output, '-n', 'ci']);

        assert.equal(result.code, 0);
    });
});
