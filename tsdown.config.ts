import {readFileSync} from 'node:fs';
import {defineConfig} from 'tsdown';

const {version} = JSON.parse(readFileSync(new URL('package.json', import.meta.url), 'utf8')) as {version: string};

export default defineConfig({
    entry: {index: 'src/index.ts', cli: 'src/cli/main.ts'},
    format: 'esm',
    platform: 'node',
    target: 'node24',
    outDir: 'dist',
    outExtensions: () => ({js: '.js'}),
    outputOptions: {chunkFileNames: 'shared/[name].js'},
    define: {__PACKAGE_VERSION__: JSON.stringify(version)},
    dts: {sourcemap: true},
    sourcemap: true,
    clean: true,
    treeshake: true,
});
