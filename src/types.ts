export type FontFormat = 'svg' | 'ttf' | 'woff' | 'woff2' | 'eot';

export interface GeneratorOptions {
    input: string;
    output: string;
    name?: string | null | undefined;
    types?: readonly string[] | null | undefined;
    onWarning?: ((message: string) => void) | undefined;
    onProgress?: ((message: string) => void) | undefined;
}

export interface ResolvedOptions {
    input: string;
    output: string;
    name: string;
    types: FontFormat[];
    onWarning: (message: string) => void;
    onProgress: (message: string) => void;
}

export interface Icon {
    path: string;
    name: string;
    ligature: string;
    codepoint: number;
    data: string;
}

export interface GeneratedFont {
    format: FontFormat;
    ext: FontFormat;
    data: string | Buffer;
    type: 'utf8' | 'binary';
}

export type SvgFont = GeneratedFont & {data: string};
export type BinaryFont = GeneratedFont & {data: Buffer};
