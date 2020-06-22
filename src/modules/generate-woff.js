const ttf2woff = require('ttf2woff');

module.exports.generateWoff = async function (ttf) {
    return new Promise((resolve, reject) => {
        try {
            const woff = ttf2woff(new Uint8Array(ttf), {});
            const buffer = Buffer.from(woff.buffer);
            return resolve({ext: 'woff', data: buffer, type: 'binary'});
        } catch (error) {
            return reject(error);
        }
    });
};