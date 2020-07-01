const {getFileNames} = require('./files');
const path = require('path');

module.exports.getIcons = async inputDirectory => {
    const fileNames = await getFileNames(inputDirectory);

    return fileNames
        .filter(fileName => fileName.endsWith('.svg'))
        .map(fileName => ({
            path: path.join(inputDirectory, fileName),
            name: fileName.replace('.svg', '')
        }));
};