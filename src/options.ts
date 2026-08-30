import type {FontFormat, GeneratorOptions, ResolvedOptions} from './types';
import {DEFAULT_FONT_NAME, FONT_FORMATS} from './constants';
import {IconFontGeneratorError} from './errors';
import path from 'node:path';

const NOOP = (): void => undefined;

export function resolveOptions(options: GeneratorOptions | null | undefined): ResolvedOptions {
    if (!options || typeof options !== 'object') {
        throw new IconFontGeneratorError('INVALID_OPTIONS', 'Options object is required.');
    }

    if (!options.input || typeof options.input !== 'string') {
        throw new IconFontGeneratorError('INVALID_OPTIONS', 'Option "input" is required and must be a directory path.');
    }

    if (!options.output || typeof options.output !== 'string') {
        throw new IconFontGeneratorError(
            'INVALID_OPTIONS',
            'Option "output" is required and must be a directory path.',
        );
    }

    return {
        input: path.resolve(options.input),
        output: path.resolve(options.output),
        name: resolveName(options.name),
        types: resolveTypes(options.types),
        onWarning: typeof options.onWarning === 'function' ? options.onWarning : NOOP,
        onProgress: typeof options.onProgress === 'function' ? options.onProgress : NOOP,
    };
}

function resolveName(name: string | null | undefined): string {
    if (name === null || name === undefined || name === '') {
        return DEFAULT_FONT_NAME;
    }

    if (typeof name !== 'string') {
        throw new IconFontGeneratorError('INVALID_OPTIONS', 'Option "name" must be a string.');
    }

    const trimmed = name.trim();

    if (trimmed === '') {
        throw new IconFontGeneratorError('INVALID_OPTIONS', 'Option "name" must not be empty.');
    }

    if (trimmed !== path.basename(trimmed) || trimmed === '.' || trimmed === '..' || /[\\/\0]/.test(trimmed)) {
        throw new IconFontGeneratorError(
            'INVALID_OPTIONS',
            `Option "name" must be a plain file name, received ${JSON.stringify(name)}.`,
            {
                hint: 'The name is used as the font family and as the output file name, so it cannot contain path separators.',
            },
        );
    }

    return trimmed;
}

function resolveTypes(types: readonly string[] | null | undefined): FontFormat[] {
    if (types === null || types === undefined) {
        return [...FONT_FORMATS];
    }

    if (!Array.isArray(types)) {
        throw new IconFontGeneratorError('INVALID_OPTIONS', 'Option "types" must be an array of font formats.');
    }

    if (types.length === 0) {
        return [...FONT_FORMATS];
    }

    const resolved: FontFormat[] = [];

    for (const type of types as readonly unknown[]) {
        const candidate = typeof type === 'string' ? type.trim().toLowerCase() : type;

        if (!isFontFormat(candidate)) {
            throw new IconFontGeneratorError(
                'INVALID_OPTIONS',
                `Unknown font format ${JSON.stringify(String(type))}.`,
                {
                    hint: `Supported formats are: ${FONT_FORMATS.join(', ')}.`,
                },
            );
        }

        if (!resolved.includes(candidate)) {
            resolved.push(candidate);
        }
    }

    return resolved;
}

function isFontFormat(value: unknown): value is FontFormat {
    return typeof value === 'string' && (FONT_FORMATS as readonly string[]).includes(value);
}
