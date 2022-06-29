module.exports.validate = options => {
    options = options || {};

    if (!options.input) {
        throw new Error('Input is a required parameter.');
    }

    if (!options.output) {
        throw new Error('Output is a required parameter.');
    }

    const types = validateTypes(options.types);

    return {...options, types};
};

function validateTypes(types) {
    const validTypes = ['svg', 'ttf', 'woff', 'woff2', 'eot'];
    const values = types && types.length > 0 ? types : validTypes;

    for (const item of values) {
        if (!validTypes.includes(item)) {
            throw new Error(`Provided a invalid type "${item}" in the types array. Valid options are: [${validTypes.toString()}]`);
        }
    }

    return values;
}
