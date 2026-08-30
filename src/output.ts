import {IconFontGeneratorError, messageOf} from './errors';
import type {GeneratedFont} from './types';
import fs from 'node:fs/promises';
import path from 'node:path';

export async function writeFonts(directory: string, name: string, fonts: readonly GeneratedFont[]): Promise<string[]> {
    await ensureDirectory(directory);

    const paths: string[] = [];

    for (const font of fonts) {
        const filePath = path.join(directory, `${name}.${font.ext}`);

        await write(filePath, font);
        paths.push(filePath);
    }

    return paths;
}

async function ensureDirectory(directory: string): Promise<void> {
    try {
        await fs.mkdir(directory, {recursive: true});
    } catch (error) {
        throw new IconFontGeneratorError(
            'OUTPUT_NOT_WRITABLE',
            `Cannot create output directory ${directory}: ${messageOf(error)}`,
            {cause: error},
        );
    }
}

async function write(filePath: string, font: GeneratedFont): Promise<void> {
    try {
        await fs.writeFile(filePath, font.data, typeof font.data === 'string' ? 'utf8' : null);
    } catch (error) {
        throw new IconFontGeneratorError('OUTPUT_NOT_WRITABLE', `Cannot write ${filePath}: ${messageOf(error)}`, {
            cause: error,
        });
    }
}
