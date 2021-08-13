const ttf2eot = require('ttf2eot');

module.exports.generateEot = async ttf => {
    const woff = ttf2eot(new Uint8Array(ttf), {});
    const buffer = Buffer.from(woff);
    return {ext: 'eot', data: buffer, type: 'binary'};
};
