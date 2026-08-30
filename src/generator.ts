import type {BinaryFont, FontFormat, GeneratedFont, GeneratorOptions, Icon} from './types';
import {generateSvg, generateTtf, TTF_ENCODERS} from './fonts';
import {resolveOptions} from './options';
import {writeFonts} from './output';
import {readIcons} from './icons';

export async function iconFontGenerator(options: GeneratorOptions): Promise<string[]> {
    const resolved = resolveOptions(options);
    const {name, types, onProgress} = resolved;

    onProgress(`Reading icons from ${resolved.input}`);
    const icons = await readIcons(resolved);

    onProgress(`Building "${name}" from ${icons.length} icon${icons.length === 1 ? '' : 's'}`);
    const fonts = await generateFonts(name, types, icons, onProgress);

    return await writeFonts(resolved.output, name, fonts);
}

async function generateFonts(
    fontName: string,
    types: readonly FontFormat[],
    icons: readonly Icon[],
    onProgress: (message: string) => void,
): Promise<GeneratedFont[]> {
    const svg = await generateSvg(fontName, icons);

    let ttf: BinaryFont | undefined;
    const toTtf = () => (ttf ??= generateTtf(svg.data));

    return types.map(type => {
        if (type === 'svg') {
            return svg;
        }

        if (type === 'ttf') {
            return toTtf();
        }

        onProgress(`Encoding ${type.toUpperCase()}`);

        return TTF_ENCODERS[type](toTtf().data);
    });
}
