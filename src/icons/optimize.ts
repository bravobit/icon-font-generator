import {IconFontGeneratorError, messageOf} from '../errors';
import {optimize} from 'svgo';

const SVG_ROOT = /^\s*(?:<\?xml[^>]*\?>\s*|<!DOCTYPE[^>]*>\s*|<!--[\s\S]*?-->\s*)*<svg[\s/>]/i;

export function optimizeSvg(source: string, iconPath: string): string {
    if (source.trim() === '') {
        throw new IconFontGeneratorError('INVALID_SVG', `${iconPath} is empty.`);
    }

    let optimized: string;

    try {
        optimized = optimize(source, {path: iconPath}).data;
    } catch (error) {
        throw new IconFontGeneratorError('INVALID_SVG', `Cannot parse ${iconPath}: ${messageOf(error)}`, {
            cause: error,
            hint: 'The file is not valid XML.',
        });
    }

    // SVGO accepts any well formed XML, so an HTML document would pass without this check.
    if (!SVG_ROOT.test(optimized)) {
        throw new IconFontGeneratorError('INVALID_SVG', `${iconPath} does not contain an <svg> root element.`);
    }

    return optimized;
}
