import {IconFontGeneratorError, messageOf} from '../errors';
import type {BinaryFont} from '../types';
import ttf2woff2 from 'ttf2woff2';

export function generateWoff2(ttf: Buffer): BinaryFont {
    try {
        return {
            format: 'woff2',
            ext: 'woff2',
            data: Buffer.copyBytesFrom(ttf2woff2(new Uint8Array(ttf))),
            type: 'binary',
        };
    } catch (error) {
        throw new IconFontGeneratorError('FONT_GENERATION_FAILED', `Cannot build the WOFF2 font: ${messageOf(error)}`, {
            cause: error,
        });
    }
}
