import {DEFAULT_FONT_NAME, FONT_FORMATS} from '../constants';
import {Command, Option} from 'commander';

export const EXIT_OK = 0;
export const EXIT_FAILURE = 1;
export const EXIT_USAGE = 2;

export interface CliOptions {
    input: string;
    output: string;
    name: string;
    type: string[];
    quiet?: boolean;
}

export interface Streams {
    stdout: NodeJS.WriteStream;
    stderr: NodeJS.WriteStream;
}

const AFTER_HELP = `
Output:
  The generated file paths go to stdout, progress and problems go to stderr.
  Colour is dropped when stderr is not a terminal or when NO_COLOR is set.

Exit codes:
  ${EXIT_OK}  the font was generated
  ${EXIT_FAILURE}  the font could not be generated
  ${EXIT_USAGE}  the command line was used incorrectly

Examples:
  icon-font-generator --input icons --output dist
  icon-font-generator -i icons -o dist -n my-icons -t woff2 -t ttf`;

export function createProgram(streams: Streams): Command {
    return new Command()
        .name('icon-font-generator')
        .description('Generate an icon font from a folder of SVG icons.')
        .requiredOption('-i, --input <dir>', 'directory containing the .svg icons')
        .requiredOption('-o, --output <dir>', 'directory the font files are written to, created when missing')
        .option('-n, --name <name>', 'font family name and output file name', DEFAULT_FONT_NAME)
        .addOption(
            new Option('-t, --type <format>', 'format to generate, repeat to pick several')
                .argParser(collect)
                .default([], FONT_FORMATS.join(', ')),
        )
        .addOption(new Option('-q, --quiet', 'suppress progress and warnings; only print the generated paths'))
        .helpOption('-h, --help', 'show this help')
        .version(__PACKAGE_VERSION__, '-v, --version', 'show the version')
        .addHelpText('after', AFTER_HELP)
        .allowExcessArguments(false)
        .showHelpAfterError('(run "icon-font-generator --help" to see the available options)')
        .exitOverride()
        .configureOutput({
            writeOut: chunk => streams.stdout.write(chunk),
            writeErr: chunk => streams.stderr.write(chunk),
            outputError: (chunk, write) => {
                write(chunk);
            },
        });
}

function collect(value: string, previous: string[]): string[] {
    return [...previous, value];
}
