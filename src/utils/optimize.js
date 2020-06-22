const {readFile} = require('./files');
const SVGO = require('svgo');

module.exports.execute = async function (icons) {
    // Create the SVGO object.
    const svgo = getSvgoObject();

    for (let icon of icons) {
        // Read the string data of the file.
        const data = await readFile(icon.path);

        // Optimize the SVG data.
        const result = await svgo.optimize(data, {path: icon.path});

        // Set the icon data.
        icon.data = result.data;
    }

    return icons;
};

function getSvgoObject() {
    return new SVGO({
        plugins: [
            {cleanupAttrs: true},
            {removeDoctype: true},
            {removeXMLProcInst: true},
            {removeComments: true},
            {removeMetadata: true},
            {removeTitle: true},
            {removeDesc: true},
            {removeUselessDefs: true},
            {removeEditorsNSData: true},
            {removeEmptyAttrs: true},
            {removeHiddenElems: true},
            {removeEmptyText: true},
            {removeEmptyContainers: true},
            {removeViewBox: false},
            {cleanupEnableBackground: true},
            {convertStyleToAttrs: true},
            {convertColors: true},
            {convertPathData: true},
            {convertTransform: true},
            {removeUnknownsAndDefaults: true},
            {removeNonInheritableGroupAttrs: true},
            {removeUselessStrokeAndFill: true},
            {removeUnusedNS: true},
            {cleanupIDs: true},
            {cleanupNumericValues: true},
            {moveElemsAttrsToGroup: true},
            {moveGroupAttrsToElems: true},
            {collapseGroups: true},
            {removeRasterImages: false},
            {mergePaths: true},
            {convertShapeToPath: true},
            {removeDimensions: true},
            {minifyStyles: true}
        ]
    });
}