#!/usr/bin/env node
import {type CliOptions, createProgram, EXIT_FAILURE, EXIT_OK, EXIT_USAGE, type Streams} from './program';
import {isIconFontGeneratorError, messageOf} from '../errors';
import {createLogger, type Logger} from './logger';
import {iconFontGenerator} from '../generator';
import {CommanderError} from 'commander';

export async function run(argv: readonly string[], streams: Streams): Promise<number> {
    const program = createProgram(streams);

    try {
        program.parse([...argv], {from: 'user'});
    } catch (error) {
        if (error instanceof CommanderError) {
            return error.exitCode === 0 ? EXIT_OK : EXIT_USAGE;
        }

        throw error;
    }

    const options = program.opts<CliOptions>();

    return await generate(options, createLogger({quiet: options.quiet === true, ...streams}));
}

async function generate(options: CliOptions, logger: Logger): Promise<number> {
    try {
        const paths = await iconFontGenerator({
            input: options.input,
            output: options.output,
            name: options.name,
            types: options.type,
            onProgress: message => {
                logger.progress(message);
            },
            onWarning: message => {
                logger.warn(message);
            },
        });

        for (const filePath of paths) {
            logger.result(filePath);
        }

        logger.progress(`Done, wrote ${paths.length} file${paths.length === 1 ? '' : 's'}.`);

        return EXIT_OK;
    } catch (error) {
        if (isIconFontGeneratorError(error)) {
            logger.error(error.message, error.hint);

            return error.code === 'INVALID_OPTIONS' ? EXIT_USAGE : EXIT_FAILURE;
        }

        logger.error(messageOf(error));
        logger.error('This is unexpected, please report it at https://github.com/bravobit/icon-font-generator/issues');

        return EXIT_FAILURE;
    }
}

process.exitCode = await run(process.argv.slice(2), {stdout: process.stdout, stderr: process.stderr});
