const ttf2woff2 = require('ttf2woff2');

module.exports.generateWoff2 = async function (ttf) {
    return new Promise((resolve, reject) => {
        try {
            const woff2 = ttf2woff2(new Uint8Array(ttf), {});
            const buffer = Buffer.from(woff2.buffer);
            return resolve({ext: 'woff2', data: buffer, type: 'binary'});
        } catch (error) {
            return reject(error);
        }
    });
}