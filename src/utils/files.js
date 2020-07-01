const fse = require('fs-extra');
const fs = require('fs');

module.exports.ensureDirectories = async paths => {
    const values = Array.isArray(paths) ? paths : [paths];

    for (let value of values) {
        await fse.ensureDir(value);
    }
};

module.exports.writeFile = async (filePath, data, type) => {
    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, data, type || 'utf8', error => {
            if (error) {
                return reject(error);
            }

            return resolve();
        });
    });
};

module.exports.readFile = async filePath => {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (error, data) => {
            if (error) {
                return reject(error);
            }

            return resolve(data);
        });
    });
};

module.exports.getFileNames = async inputDirectory => {
    // Read the files of the input directory.
    return new Promise((resolve, reject) => {
        fs.readdir(inputDirectory, (error, files) => {
            if (error) {
                return reject(error);
            }

            return resolve(files || []);
        });
    });
};