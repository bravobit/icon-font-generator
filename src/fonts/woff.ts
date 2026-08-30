import {IconFontGeneratorError, messageOf} from '../errors';
import type {BinaryFont} from '../types';
import ttf2woff from 'ttf2woff';

export function generateWoff(ttf: Buffer): BinaryFont {
    try {
        return {
            format: 'woff',
            ext: 'woff',
            data: Buffer.copyBytesFrom(ttf2woff(new Uint8Array(ttf))),
            type: 'binary',
        };
    } catch (error) {
        throw new IconFontGeneratorError('FONT_GENERATION_FAILED', `Cannot build the WOFF font: ${messageOf(error)}`, {
            cause: error,
        });
    }
}
