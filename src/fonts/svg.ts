import {IconFontGeneratorError, messageOf} from '../errors';
import {SVGIcons2SVGFontStream} from 'svgicons2svgfont';
import type {Icon, SvgFont} from '../types';
import {Readable} from 'node:stream';

export async function generateSvg(fontName: string, icons: readonly Icon[]): Promise<SvgFont> {
    const fontStream = new SVGIcons2SVGFontStream({
        fontName,
        fontWeight: 'normal',
        normalize: true,
        fixedWidth: true,
        centerHorizontally: true,
        fontHeight: 1000,
    });

    const data = await new Promise<string>((resolve, reject) => {
        const chunks: Buffer[] = [];

        fontStream
            .on('data', (chunk: Buffer | string) => {
                chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            })
            .on('error', (error: unknown) => {
                reject(
                    new IconFontGeneratorError(
                        'FONT_GENERATION_FAILED',
                        `Cannot build the SVG font: ${messageOf(error)}`,
                        {cause: error},
                    ),
                );
            })
            .on('end', () => {
                resolve(Buffer.concat(chunks).toString('utf8'));
            });

        for (const icon of icons) {
            fontStream.write(toGlyphStream(icon));
        }

        fontStream.end();
    });

    return {format: 'svg', ext: 'svg', data, type: 'utf8'};
}

function toGlyphStream(icon: Icon): Readable {
    const glyph = Readable.from([icon.data]) as Readable & {metadata: {unicode: string[]; name: string}};

    glyph.metadata = {
        unicode: [String.fromCodePoint(icon.codepoint), icon.ligature],
        name: icon.name,
    };

    return glyph;
}
