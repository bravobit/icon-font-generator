const svg2ttf = require('svg2ttf');

module.exports.generateTtf = async svg => {
    const ttf = svg2ttf(svg, {});
    const buffer = Buffer.from(ttf.buffer);
    return {ext: 'ttf', data: buffer, type: 'binary'};
};