import type {BinaryFont, FontFormat} from '../types';
import {generateWoff2} from './woff2';
import {generateWoff} from './woff';
import {generateEot} from './eot';
export {generateSvg} from './svg';
export {generateTtf} from './ttf';

export const TTF_ENCODERS: Record<Exclude<FontFormat, 'svg' | 'ttf'>, (ttf: Buffer) => BinaryFont> = {
    woff: generateWoff,
    woff2: generateWoff2,
    eot: generateEot,
};
