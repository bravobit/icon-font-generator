import {IconFontGeneratorError, messageOf} from '../errors';
import {SVG_EXTENSION} from '../constants';
import type {Stats} from 'node:fs';
import fs from 'node:fs/promises';

export async function listSvgFileNames(directory: string, onWarning: (message: string) => void): Promise<string[]> {
    const entries = await readEntries(directory);
    const svgFileNames: string[] = [];
    const skipped: string[] = [];

    for (const entry of entries) {
        if (entry.toLowerCase().endsWith(SVG_EXTENSION) && entry.length > SVG_EXTENSION.length) {
            svgFileNames.push(entry);
        } else if (!entry.startsWith('.')) {
            skipped.push(entry);
        }
    }

    if (skipped.length > 0) {
        onWarning(describeSkipped(skipped));
    }

    return svgFileNames.sort(compareCodeUnits);
}

async function readEntries(directory: string): Promise<string[]> {
    let stats: Stats;

    try {
        stats = await fs.stat(directory);
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            throw new IconFontGeneratorError('INPUT_NOT_FOUND', `Input directory does not exist: ${directory}`, {
                cause: error,
            });
        }

        throw new IconFontGeneratorError(
            'INPUT_UNREADABLE',
            `Cannot read input directory ${directory}: ${messageOf(error)}`,
            {
                cause: error,
            },
        );
    }

    if (!stats.isDirectory()) {
        throw new IconFontGeneratorError('INPUT_NOT_A_DIRECTORY', `Input path is not a directory: ${directory}`, {
            hint: 'The --input option expects a folder of .svg files, not a single file.',
        });
    }

    try {
        return await fs.readdir(directory);
    } catch (error) {
        throw new IconFontGeneratorError(
            'INPUT_UNREADABLE',
            `Cannot read input directory ${directory}: ${messageOf(error)}`,
            {
                cause: error,
            },
        );
    }
}

function describeSkipped(skipped: string[]): string {
    const preview = skipped.slice(0, 5).join(', ');
    const rest = skipped.length > 5 ? ` (and ${skipped.length - 5} more)` : '';

    return `Ignored ${skipped.length} non-SVG entr${skipped.length === 1 ? 'y' : 'ies'}: ${preview}${rest}`;
}

function compareCodeUnits(a: string, b: string): number {
    if (a === b) {
        return 0;
    }

    return a < b ? -1 : 1;
}
