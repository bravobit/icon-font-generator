const ttf2woff2 = require('ttf2woff2');

module.exports.generateWoff2 = async ttf => {
    const woff2 = ttf2woff2(new Uint8Array(ttf), {});
    const buffer = Buffer.from(woff2.buffer);
    return {ext: 'woff2', data: buffer, type: 'binary'};
};