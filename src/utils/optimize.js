const {readFile} = require('./files');
const {optimize} = require('svgo');

module.exports.execute = async icons => {
    for (let icon of icons) {
        // Read the string data of the file.
        const data = await readFile(icon.path);

        // Optimize the SVG data.
        const result = await optimize(data, {path: icon.path});

        // Set the icon data.
        icon.data = result.data;
    }

    return icons;
};