const {ensureDirectories, writeFile} = require('./utils/files');
const {generateWoff2} = require('./modules/generate-woff2');
const {generateWoff} = require('./modules/generate-woff');
const {generateEot} = require('./modules/generate-eot');
const {generateSvg} = require('./modules/generate-svg');
const {generateTtf} = require('./modules/generate-ttf');
const {validate} = require('./utils/validate');
const {getIcons} = require('./utils/icons');
const path = require('path');

module.exports = async function iconFontGenerator(options) {
    // 1. Validate the options.
    const {name, input, output, types} = validate(options);

    // 2. Get all the icons in the input directory.
    const icons = await getIcons(input);

    // 3. Generate the fonts.
    const fontName = name || 'default';
    const svg = await generateSvg(fontName, icons);
    const ttf = await generateTtf(svg.data);
    const woff = await generateWoff(ttf.data);
    const woff2 = await generateWoff2(ttf.data);
    const eot = await generateEot(ttf.data);
    const values = {svg, ttf, woff, woff2, eot};

    // 4. Write the files.
    await ensureDirectories(output);
    const outputValues = types.map(type => values[type]);
    const paths = [];
    for (const item of outputValues) {
        const filePath = path.join(output, `${fontName}.${item.ext}`);
        paths.push(filePath);
        await writeFile(filePath, item.data, item.type);
    }

    return paths;
};
