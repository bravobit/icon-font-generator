import {IconFontGeneratorError, messageOf} from '../errors';
import type {BinaryFont} from '../types';
import ttf2eot from 'ttf2eot';

export function generateEot(ttf: Buffer): BinaryFont {
    try {
        return {
            format: 'eot',
            ext: 'eot',
            data: Buffer.copyBytesFrom(ttf2eot(new Uint8Array(ttf))),
            type: 'binary',
        };
    } catch (error) {
        throw new IconFontGeneratorError('FONT_GENERATION_FAILED', `Cannot build the EOT font: ${messageOf(error)}`, {
            cause: error,
        });
    }
}
