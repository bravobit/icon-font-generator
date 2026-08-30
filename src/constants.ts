import type {FontFormat} from './types';

export const FONT_FORMATS = ['svg', 'ttf', 'woff', 'woff2', 'eot'] as const satisfies readonly FontFormat[];

export const PRIVATE_USE_AREA_START = 0xe000;
export const PRIVATE_USE_AREA_END = 0xf8ff;
export const MAX_ICONS = PRIVATE_USE_AREA_END - PRIVATE_USE_AREA_START + 1;

export const DEFAULT_FONT_NAME = 'default';
export const SVG_EXTENSION = '.svg';
