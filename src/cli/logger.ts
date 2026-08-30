import {styleText} from 'node:util';

export interface Logger {
    progress(message: string): void;
    warn(message: string): void;
    error(message: string, hint?: string): void;
    result(message: string): void;
}

export interface LoggerOptions {
    quiet: boolean;
    stdout: NodeJS.WriteStream;
    stderr: NodeJS.WriteStream;
}

export function createLogger({quiet, stdout, stderr}: LoggerOptions): Logger {
    const paint = (stream: NodeJS.WriteStream, format: Parameters<typeof styleText>[0], message: string): string =>
        styleText(format, message, {stream, validateStream: true});

    return {
        progress(message) {
            if (!quiet) {
                stderr.write(`${paint(stderr, 'dim', message)}\n`);
            }
        },
        warn(message) {
            if (!quiet) {
                stderr.write(`${paint(stderr, 'yellow', 'warning:')} ${message}\n`);
            }
        },
        error(message, hint) {
            stderr.write(`${paint(stderr, 'red', 'error:')} ${message}\n`);

            if (hint) {
                stderr.write(`${paint(stderr, 'dim', `hint: ${hint}`)}\n`);
            }
        },
        result(message) {
            stdout.write(`${message}\n`);
        },
    };
}
