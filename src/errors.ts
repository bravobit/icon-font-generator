export type IconFontGeneratorErrorCode =
    | 'INVALID_OPTIONS'
    | 'INPUT_NOT_FOUND'
    | 'INPUT_NOT_A_DIRECTORY'
    | 'INPUT_UNREADABLE'
    | 'NO_ICONS'
    | 'TOO_MANY_ICONS'
    | 'DUPLICATE_LIGATURE'
    | 'INVALID_SVG'
    | 'FONT_GENERATION_FAILED'
    | 'OUTPUT_NOT_WRITABLE';

export class IconFontGeneratorError extends Error {
    override readonly name = 'IconFontGeneratorError';
    readonly code: IconFontGeneratorErrorCode;
    readonly hint: string | undefined;

    constructor(code: IconFontGeneratorErrorCode, message: string, options: {cause?: unknown; hint?: string} = {}) {
        super(message, options.cause === undefined ? undefined : {cause: options.cause});
        this.code = code;
        this.hint = options.hint;
    }
}

export function isIconFontGeneratorError(value: unknown): value is IconFontGeneratorError {
    return value instanceof IconFontGeneratorError;
}

export function messageOf(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }

    return typeof error === 'string' ? error : String(error);
}
