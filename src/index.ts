export type {BinaryFont, FontFormat, GeneratedFont, GeneratorOptions, Icon, ResolvedOptions, SvgFont} from './types';
export {DEFAULT_FONT_NAME, FONT_FORMATS, PRIVATE_USE_AREA_END, PRIVATE_USE_AREA_START} from './constants';
export {iconFontGenerator, iconFontGenerator as default} from './generator';
export {IconFontGeneratorError, isIconFontGeneratorError} from './errors';
export type {IconFontGeneratorErrorCode} from './errors';
export {toLigature} from './icons';
