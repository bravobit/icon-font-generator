const ttf2eot = require('ttf2eot');

module.exports.generateEot = async function (ttf) {
    return new Promise((resolve, reject) => {
        try {
            const woff = ttf2eot(new Uint8Array(ttf), {});
            const buffer = Buffer.from(woff.buffer);
            return resolve({ext: 'eot', data: buffer, type: 'binary'});
        } catch (error) {
            return reject(error);
        }
    });
};