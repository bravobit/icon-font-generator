import IconFontBuildr from 'icon-font-buildr';
import rimraf from 'rimraf';
import fse from 'fs-extra';
import SVGO from 'svgo';
import path from 'path';
import arg from 'arg';
import fs from 'fs';

export async function cli(args) {
    const {input, output, name} = parseArgumentsIntoOptions(args);

    if (!input || !output) {
        throw new Error('Input and output are required.');
    }

    const inputDirectory = path.join(process.cwd(), input);
    const outputDirectory = path.join(process.cwd(), output);
    const temporaryDirectory = path.join(process.cwd(), 'tmp');

    try {
        // Get the file paths.
        const fileNames = await getFileNames(inputDirectory);

        // Optimize the vector images in a temp folder.
        await optimizeVectorImages(fileNames, inputDirectory, temporaryDirectory);

        // Create the font.
        await createFont(name || 'font', fileNames, inputDirectory, outputDirectory);

        // Remove the temporary folder.
        await cleanup(temporaryDirectory);
    } catch (error) {
        console.log(error);
        // Remove the temporary folder.
        await cleanup(temporaryDirectory);
    }
}

async function createFont(fontName, fileNames, inputDirectory, outputDirectory) {
    // Make sure the output directory is there.
    await fse.ensureDir(outputDirectory);

    // Get all the icon names.
    const icons = fileNames.map(file => file.replace('.svg', ''));

    const builder = new IconFontBuildr({
        sources: [path.join(inputDirectory, '[icon].svg')],
        icons: icons,
        output: {
            fonts: outputDirectory,
            fontName: fontName
        }
    });
    return await builder.build();
}

async function optimizeVectorImages(fileNames, inputDirectory, temporaryDirectory) {
    // Create the SVGO object.
    const svgo = getSvgoObject();

    // Create the temporary directory.
    await fse.ensureDir(temporaryDirectory);

    for (let fileName of fileNames) {
        // Get the file path.
        const filePath = path.join(inputDirectory, fileName);

        // Read the string data of the file.
        const data = await readFile(filePath);

        // Optimize the SVG data.
        const result = await svgo.optimize(data, {path: filePath});

        // Write the file back.
        const temporaryFilePath = path.join(temporaryDirectory, fileName);
        await writeFile(temporaryFilePath, result.data);
    }
}

async function cleanup(path) {
    return rimraf.sync(path);
}

async function writeFile(filePath, data) {
    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, data, 'utf8', error => {
            if (error) {
                return reject(error);
            }

            return resolve();
        });
    });
}

async function readFile(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (error, data) => {
            if (error) {
                return reject(error);
            }

            return resolve(data);
        });
    });
}

async function getFileNames(inputDirectory) {
    // Read the files of the input directory.
    return new Promise((resolve, reject) => {
        fs.readdir(inputDirectory, (error, files) => {
            if (error) {
                return reject(error);
            }

            return resolve(files);
        });
    });
}


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

function parseArgumentsIntoOptions(rawArgs) {
    const args = arg({
        '--name': String,
        '--input': String,
        '--output': String,
        '-n': '--name',
        '-i': '--input',
        '-o': '--output'
    }, {
        argv: rawArgs.slice(2)
    });

    return {
        name: args['--name'] || null,
        input: args['--input'] || null,
        output: args['--output'] || null
    };
}
