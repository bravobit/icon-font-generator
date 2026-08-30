import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {after} from 'node:test';

const created: string[] = [];

/** Removed automatically once the test file finishes. */
export async function makeTempDir(prefix = 'icon-font-generator-'): Promise<string> {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
    created.push(directory);
    return directory;
}

after(async () => {
    await Promise.all(created.map(directory => fs.rm(directory, {recursive: true, force: true})));
});

export const FIXTURES = path.join(import.meta.dirname, '..', 'fixtures');

export function fixture(name: string): string {
    return path.join(FIXTURES, name);
}
