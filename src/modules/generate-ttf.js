const svg2ttf = require('svg2ttf');

module.exports.generateTtf = async function (svg) {
    return new Promise((resolve, reject) => {
        try {
            const ttf = svg2ttf(svg, {});
            const buffer = Buffer.from(ttf.buffer);
            return resolve({ext: 'ttf', data: buffer, type: 'binary'});
        } catch (error) {
            return reject(error);
        }
    });
};