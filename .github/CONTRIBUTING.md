# Contributing

Thanks for helping out.

## Getting started

You need Node.js 24.14.0 or newer.

```bash
npm install
npm run check   # lint, typecheck and the full test suite
```

## Working on the code

- The source lives in `src/` and is bundled to `dist/` by `npm run build` (tsdown). Never edit `dist/`.
- `src/` is organised per layer: `icons/` reads and names the input, `fonts/` holds one encoder
  per output format, `cli/` is command-line only, and `generator.ts` ties them together.
- Relative imports inside `src/` are extensionless because the bundler resolves them. Test files
  keep their `.ts` extension, because Node runs those directly through type stripping.
- `npm test` builds first and then runs the tests against `dist/`, which is what actually ships.
- Linting is ESLint with typescript-eslint's `strictTypeChecked` rules, so it is type-aware and
  needs a valid `tsconfig.json`. `npm run lint:fix` fixes what it can.
- There is no autoformatter. Match the surrounding style: four spaces, single quotes, semicolons,
  trailing commas, no spaces inside braces, and lines under 120 characters.
- Test fixtures live in `test/fixtures/`. `test/fixtures/golden/basic.svg` is the SVG font as it was
  generated before the 2.0 modernisation; a change to it means the font output changed, so treat a
  failure of that test as a red flag rather than something to regenerate.

## Pull requests

- Give the pull request a useful title and describe what changed and why.
- Open a separate pull request per change.
- Add or update tests for the behaviour you change, especially anything in the font pipeline.
- Make sure `npm run check` passes before you push.
- Flag any change to the generated font output, the CLI flags or the exit codes explicitly. Those
  are the parts people depend on.
