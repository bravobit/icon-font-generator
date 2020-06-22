# @bravobit/icon-font-generator

> The best icon font generator.

[![npm version](https://badge.fury.io/js/%40bravobit%2Ficon-font-generator.svg)](https://badge.fury.io/js/%40bravobit%2Ficon-font-generator)
[![npm license](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

- Use <kbd>⌘ Command</kbd> + <kbd>F</kbd> or <kbd>ctrl</kbd> + <kbd>F</kbd> to search for a keyword.
- Contributions welcome, please see [contribution guide](.github/CONTRIBUTING.md).

## Features

* Easy implementation
* Library can be consumed by command line and Node

## Installation

To use the icon font generator in your own project install it via `npm`:

```bash
$ npm install @bravobit/icon-font-generator --save
```

## How to use (command-line)

```bash
$ icon-font-generator --input icons --output out --name myfontname
```

| Argument | Alt | Description |
| --- | --- | --- |
| `--input` | `-i` | The input directory for the SVG icons. |
| `--output` | `-o` | The output directory for the fonts. |
| `--name` | `-n` | The name for the font. |
| `--dry-run` | n/a | When enabled this will not write any files. |