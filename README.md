# @bravobit/icon-font-generator

> Turn a folder of SVG icons into a ready to use icon font.

[![npm version](https://badge.fury.io/js/%40bravobit%2Ficon-font-generator.svg)](https://badge.fury.io/js/%40bravobit%2Ficon-font-generator)
[![npm license](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

Point it at a directory of `.svg` files and it writes `SVG`, `TTF`, `WOFF`, `WOFF2` and `EOT` fonts.
Every icon is reachable both by its code point and by its name, so you can use either
`content: "\e000"` or `data-icon="my-icon"` in CSS.

- Contributions welcome, please see the [contribution guide](.github/CONTRIBUTING.md).

## Requirements

Node.js **24.14.0** or newer. The package is ESM only.

## Installation

```bash
npm install --save-dev @bravobit/icon-font-generator
```

Or run it without installing:

```bash
npx @bravobit/icon-font-generator --input icons --output dist --name my-icons
```

## Command line

```bash
icon-font-generator --input icons --output dist --name my-icons
```

| Option      | Alt  | Description                                                                            | Default   |
| ----------- | ---- | -------------------------------------------------------------------------------------- | --------- |
| `--input`   | `-i` | Directory containing the `.svg` icons. **Required.**                                   | –         |
| `--output`  | `-o` | Directory the font files are written to. Created when it does not exist. **Required.** | –         |
| `--name`    | `-n` | Font family name and output file name.                                                 | `default` |
| `--type`    | `-t` | Format to generate. Repeat the flag to pick several.                                   | all       |
| `--quiet`   | `-q` | Suppress progress and warnings; only print the generated paths.                        | off       |
| `--help`    | `-h` | Show the help text.                                                                    | –         |
| `--version` | `-v` | Show the version.                                                                      | –         |

Relative `--input` and `--output` paths resolve against the current working directory; absolute
paths are used as given.

### Examples

Generate every format:

```bash
icon-font-generator -i icons -o dist -n my-icons
```

Generate only the two formats a modern browser needs:

```bash
icon-font-generator -i icons -o dist -n my-icons -t woff2 -t woff
```

Collect the generated paths in a build script:

```bash
files=$(icon-font-generator -i icons -o dist -n my-icons --quiet)
```

## Output formats

| Format  | File           | Notes                                                                    |
| ------- | -------------- | ------------------------------------------------------------------------ |
| `svg`   | `<name>.svg`   | SVG font. The source every other format is built from.                   |
| `ttf`   | `<name>.ttf`   | TrueType.                                                                |
| `woff`  | `<name>.woff`  | Web Open Font Format.                                                    |
| `woff2` | `<name>.woff2` | Web Open Font Format 2. Smallest, and all you need for current browsers. |
| `eot`   | `<name>.eot`   | Embedded OpenType, only relevant for legacy Internet Explorer.           |

The paths are printed to **stdout** in the order the formats were requested. Progress, warnings and
errors go to **stderr**, so the output stays usable in a pipeline. Colour is dropped automatically
when stderr is not a terminal or when `NO_COLOR` is set.

### Exit codes

| Code | Meaning                                                               |
| ---- | --------------------------------------------------------------------- |
| `0`  | The font was generated.                                               |
| `1`  | The font could not be generated (missing input, unparseable icon, …). |
| `2`  | The command line was used incorrectly (unknown flag, missing option). |

## Node API

```javascript
import iconFontGenerator from '@bravobit/icon-font-generator';

const paths = await iconFontGenerator({
  input: 'icons',
  output: 'dist',
  name: 'my-icons',
  types: ['woff2', 'woff'],
});

console.log(paths); // ['/abs/path/dist/my-icons.woff2', '/abs/path/dist/my-icons.woff']
```

| Option       | Description                                                      | Default                                  |
| ------------ | ---------------------------------------------------------------- | ---------------------------------------- |
| `input`      | Directory containing the `.svg` icons. **Required.**             | –                                        |
| `output`     | Directory the font files are written to. **Required.**           | –                                        |
| `name`       | Font family name and output file name.                           | `'default'`                              |
| `types`      | Formats to generate.                                             | `['svg', 'ttf', 'woff', 'woff2', 'eot']` |
| `onProgress` | Called with progress messages.                                   | –                                        |
| `onWarning`  | Called for non-fatal problems, such as non-SVG files in `input`. | –                                        |

Resolves with the absolute paths of the written files, in the order the formats were requested.

### Error handling

Every problem the generator detects itself is thrown as an `IconFontGeneratorError` with a stable
`code`:

```javascript
import iconFontGenerator, {isIconFontGeneratorError} from '@bravobit/icon-font-generator';

try {
  await iconFontGenerator({input: 'icons', output: 'dist'});
} catch (error) {
  if (isIconFontGeneratorError(error) && error.code === 'NO_ICONS') {
    // ...
  }
}
```

| Code                     | Cause                                                       |
| ------------------------ | ----------------------------------------------------------- |
| `INVALID_OPTIONS`        | Missing or malformed option, or an unknown format.          |
| `INPUT_NOT_FOUND`        | The input directory does not exist.                         |
| `INPUT_NOT_A_DIRECTORY`  | The input path points at a file.                            |
| `INPUT_UNREADABLE`       | The input directory could not be read.                      |
| `NO_ICONS`               | The input directory contains no `.svg` files.               |
| `TOO_MANY_ICONS`         | More icons than fit in the Unicode Private Use Area (6400). |
| `DUPLICATE_LIGATURE`     | Two icon names collapse onto the same ligature.             |
| `INVALID_SVG`            | An icon is empty, unreadable or not an SVG.                 |
| `FONT_GENERATION_FAILED` | A font encoder rejected the input.                          |
| `OUTPUT_NOT_WRITABLE`    | The output directory or a font file could not be written.   |

TypeScript declarations ship with the package; no `@types` install is needed.

## How icons become glyphs

1. Every `.svg` file in `input` is read, sorted by file name and optimised with SVGO.
   Files are sorted so the code points below are identical on every machine.
2. Each icon gets the next code point in the Unicode Private Use Area, starting at `U+E000`.
3. Each icon also gets a **ligature** based on its file name, with hyphens replaced by underscores
   (`arrow-left.svg` becomes `arrow_left`).
4. The glyphs are written into an SVG font, which is converted to the remaining formats.

Consequences worth knowing:

- Non-SVG files in the input directory are skipped with a warning. Entries whose name starts with
  a dot are skipped without one, unless they end in `.svg`.
- Adding an icon in the middle of the alphabet shifts the code points of the icons after it.
  Reference icons by their **ligature** if you want names that survive a rebuild.
- `arrow-left.svg` and `arrow_left.svg` cannot live in the same font, because both produce the
  ligature `arrow_left`. This is reported as an error instead of silently dropping one of them.
- Generated `TTF`, `WOFF`, `WOFF2` and `EOT` files embed a build timestamp, so they differ between
  runs even when the icons did not change. The `SVG` font is byte-for-byte reproducible.

## Using the font

```css
@font-face {
  font-weight: normal;
  font-display: block;
  font-family: 'my-icons';
  src:
    url('my-icons.woff2') format('woff2'),
    url('my-icons.woff') format('woff'),
    url('my-icons.ttf') format('truetype');
}

.icon-font::before {
  display: flex;
  direction: ltr;
  line-height: 1;
  width: inherit;
  height: inherit;
  word-wrap: normal;
  font-size: inherit;
  font-style: normal;
  font-weight: normal;
  white-space: nowrap;
  text-transform: none;
  letter-spacing: normal;
  vertical-align: middle;
  content: attr(data-icon);
  font-family: 'my-icons';
  font-feature-settings: 'liga';
  text-rendering: optimizeLegibility;
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
}
```

Because `content` reads the `data-icon` attribute, the icon name goes straight into the HTML:

```html
<div class="icon-font" data-icon="arrow_left"></div>
```

Add the `EOT` and `SVG` sources to the `src` list as well if you still support Internet Explorer.

## Upgrading from 1.x

The generated fonts are unchanged, but the packaging is not:

- **The package is ESM only.** `const generator = require('@bravobit/icon-font-generator')` no longer
  returns the function. Use `import generator from '@bravobit/icon-font-generator'`, or
  `require('@bravobit/icon-font-generator').default`.
- **Node 24.14.0 or newer is required.**
- **Failures now exit with a non-zero status.** 1.x exited `0` on every error, so pipelines silently
  passed. Scripts that relied on that need to handle the new exit codes.
- **Errors and progress moved to stderr.** stdout only carries the generated file paths.
- **Absolute `--input` / `--output` paths now work.** 1.x joined them onto the working directory,
  which created directories such as `./tmp/out` for `--output /tmp/out`.
- **Icons are sorted before code points are assigned**, so a rebuild yields the same code points on
  every platform. On filesystems that do not return directory entries in alphabetical order, the
  assigned code points may differ from 1.x.
- **Input that used to pass silently now fails**: an empty input directory, an unparseable or
  non-SVG icon, and two icons that collapse onto the same ligature.

All command names, flags, option names, default values and output file names are unchanged.

## Development

```bash
npm install
npm run build       # bundle src/ to dist/ with tsdown
npm test            # build, then run the test suite
npm run lint        # eslint, including type-aware rules
npm run lint:fix    # eslint --fix
npm run typecheck   # tsc over src/ and test/
npm run check       # build, lint, typecheck and test
```

`src/` is laid out along the pipeline:

```
src/
  index.ts        public exports
  generator.ts    the pipeline
  options.ts      option validation
  output.ts       writing the files
  icons/          reading, optimising and naming the source icons
  fonts/          one encoder per output format
  cli/            commander wiring, exit codes and stdout/stderr
```

## License

Distributed under the MIT License. See `LICENSE` for more information.
