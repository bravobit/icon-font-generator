import {assertUniqueLigatures, codepointAt, toLigature} from './naming';
import {IconFontGeneratorError, messageOf} from '../errors';
import {MAX_ICONS, SVG_EXTENSION} from '../constants';
import type {Icon, ResolvedOptions} from '../types';
import {listSvgFileNames} from './directory';
import {optimizeSvg} from './optimize';
import fs from 'node:fs/promises';
import path from 'node:path';

export {toLigature} from './naming';

export async function readIcons(options: ResolvedOptions): Promise<Icon[]> {
    const fileNames = await listSvgFileNames(options.input, options.onWarning);

    if (fileNames.length === 0) {
        throw new IconFontGeneratorError('NO_ICONS', `No .svg files found in ${options.input}.`, {
            hint: 'Point --input at a directory that contains the icons you want to turn into a font.',
        });
    }

    if (fileNames.length > MAX_ICONS) {
        throw new IconFontGeneratorError(
            'TOO_MANY_ICONS',
            `Found ${fileNames.length} icons, but only ${MAX_ICONS} fit in the Unicode Private Use Area.`,
            {hint: 'Split the icons over multiple fonts.'},
        );
    }

    const icons = await Promise.all(fileNames.map((fileName, index) => toIcon(options.input, fileName, index)));

    assertUniqueLigatures(icons);

    return icons;
}

async function toIcon(directory: string, fileName: string, index: number): Promise<Icon> {
    const iconPath = path.join(directory, fileName);
    const name = fileName.slice(0, -SVG_EXTENSION.length);

    return {
        path: iconPath,
        name,
        ligature: toLigature(name),
        codepoint: codepointAt(index),
        data: optimizeSvg(await read(iconPath), iconPath),
    };
}

async function read(iconPath: string): Promise<string> {
    try {
        return await fs.readFile(iconPath, 'utf8');
    } catch (error) {
        throw new IconFontGeneratorError('INVALID_SVG', `Cannot read ${iconPath}: ${messageOf(error)}`, {cause: error});
    }
}
