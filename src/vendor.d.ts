declare module 'svg2ttf' {
    interface Svg2TtfOptions {
        copyright?: string;
        description?: string;
        ts?: number;
        url?: string;
        version?: string;
    }

    interface Svg2TtfResult {
        buffer: Uint8Array;
    }

    export default function svg2ttf(svgFontString: string, options?: Svg2TtfOptions): Svg2TtfResult;
}

declare module 'ttf2woff' {
    export default function ttf2woff(ttf: Uint8Array, options?: {metadata?: string}): Uint8Array;
}

declare module 'ttf2eot' {
    export default function ttf2eot(ttf: Uint8Array, options?: Record<string, unknown>): Uint8Array;
}

declare module 'ttf2woff2' {
    export default function ttf2woff2(ttf: Uint8Array): Uint8Array;
}
