const {ensureDirectories, writeFile} = require('./utils/files');
const {generateWoff2} = require('./modules/generate-woff2');
const {generateWoff} = require('./modules/generate-woff');
const {generateEot} = require('./modules/generate-eot');
const {generateSvg} = require('./modules/generate-svg');
const {generateTtf} = require('./modules/generate-ttf');
const {getIcons} = require('./utils/icons');
const path = require('path');

module.exports = async function iconFontGenerator(options) {
    const {name, input, output, dryRun} = options;

    // 1. Get all the icons in the input directory.
    const icons = await getIcons(input);

    // 2. Generate the fonts.
    const fontName = name || 'default';
    const svg = await generateSvg(fontName, icons);
    const ttf = await generateTtf(svg.data);
    const woff = await generateWoff(ttf.data);
    const woff2 = await generateWoff2(ttf.data);
    const eot = await generateEot(ttf.data);

    // 3. Write the files.
    await ensureDirectories(output);
    for (const item of [svg, ttf, woff, woff2, eot]) {
        const filePath = path.join(output, `${fontName}.${item.ext}`);

        if (!dryRun) {
            await writeFile(filePath, item.data, item.type);
        }
    }
};