import {IconFontGeneratorError, messageOf} from '../errors';
import type {BinaryFont} from '../types';
import svg2ttf from 'svg2ttf';

export function generateTtf(svgFont: string): BinaryFont {
    try {
        return {format: 'ttf', ext: 'ttf', data: Buffer.copyBytesFrom(svg2ttf(svgFont).buffer), type: 'binary'};
    } catch (error) {
        throw new IconFontGeneratorError('FONT_GENERATION_FAILED', `Cannot build the TTF font: ${messageOf(error)}`, {
            cause: error,
        });
    }
}
