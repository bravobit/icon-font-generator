const ttf2woff = require('ttf2woff');

module.exports.generateWoff = async ttf => {
    const woff = ttf2woff(new Uint8Array(ttf), {});
    const buffer = Buffer.from(woff);
    return {ext: 'woff', data: buffer, type: 'binary'};
};
