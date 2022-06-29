# @bravobit/icon-font-generator

> Very easy icon font generator.

[![npm version](https://badge.fury.io/js/%40bravobit%2Ficon-font-generator.svg)](https://badge.fury.io/js/%40bravobit%2Ficon-font-generator)
[![npm license](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

- Use <kbd>⌘ Command</kbd> + <kbd>F</kbd> or <kbd>ctrl</kbd> + <kbd>F</kbd> to search for a keyword.
- Contributions welcome, please see [contribution guide](.github/CONTRIBUTING.md).

## Features

* Easy implementation
* Library can be consumed by command line and Node
* The generated font can be used in HTML/CSS

## Installation

To use the icon font generator in your own project install it via `npm`:

```bash
$ npm install @bravobit/icon-font-generator --save
```

## How to use (command-line)

```bash
$ icon-font-generator --input icons --output out --name myfontname
```

| Argument   | Alt  | Description                                         |
|------------|------|-----------------------------------------------------|
| `--input`  | `-i` | The input directory with the SVG icons.             |
| `--output` | `-o` | The output directory for the fonts.                 |
| `--name`   | `-n` | The name for the font.                              |
| `--type`      | `-t` | The type to generate (can be added multiple times). |

## How to use (node)

```javascript
const iconFontGenerator = require('@bravobit/icon-font-generator');
const path = require('path');

async function main() {
    const inputDirectory = path.join(process.cwd(), '<input-directory>');
    const outputDirectory = path.join(process.cwd(), '<output-directory>');

    await iconFontGenerator({
        input: inputDirectory,
        output: outputDirectory,
        name: '<font-name>',
        types: ['svg', 'ttf']
    });

    console.log('done.');
}
```

| Argument | Description | Default value |
| --- | --- | --- |
| `input` | The input directory with the SVG icons. | n/a |
| `output` | The output directory for the fonts. | n/a |
| `name` | The name for the font. | `default` |
| `types` | The font types that will be created in the output directory. | `['svg', 'ttf', 'woff', 'woff2', 'eot']` |

## How to use (CSS)

Add the `@font-face` and `::before` styling to your stylesheet.

```css
@font-face {
    font-weight: normal;
    font-display: block;
    font-family: 'icon-font';
    src: url('<font-name>.eot'),
         url('<font-name>.eot?#iefix') format('embedded-opentype'),
         url('<font-name>.woff2') format('woff2'),
         url('<font-name>.woff') format('woff'),
         url('<font-name>.ttf') format('truetype'),
         url('<font-name>.svg') format('svg');
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
    font-family: 'icon-font';
    font-feature-settings: 'liga';
    text-rendering: optimizeLegibility;
    -moz-osx-font-smoothing: grayscale;
    -webkit-font-smoothing: antialiased;
}
```

Because of de content `data-icon` property you can enter the icon name in the HTML. 

```html
<div class="icon-font" 
     data-icon="<icon-name>">
</div>
```

## License

Distributed under the MIT License. See `LICENSE` for more information.
