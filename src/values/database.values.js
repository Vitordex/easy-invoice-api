const activesArray = ['ACTIVE', 'INACTIVE', 'DISABLED', 'STATIC'];
const residenceTypesArray = ['Apartamento', 'Casa', 'Comercial'];
const statesArray = [
    'Acre', 'Alagoas', 'Amapá', 'Amazonas', 'Bahia', 'Ceará',
    'Espírito Santo', 'Goiás', 'Maranhão', 'Mato Grosso',
    'Mato Grosso do Sul', 'Minas Gerais', 'Pará', 'Paraíba',
    'Paraná', 'Pernambuco', 'Piauí', 'Rio de Janeiro',
    'Rio Grande do Norte', 'Rio Grande do Sul', 'Rondônia',
    'Roraima', 'Santa Catarina', 'São Paulo', 'Sergipe', 'Tocantins'
];

/**
 * @param {Array<String>} array An array to return the enum values
 * 
 * @returns {{ARRAY: Array<*>}}}
 */
function toEnum(array) {
    const propertiesObject = {};

    /** @param {String} value */
    const iterable = (value) => {
        const key = value;
        propertiesObject[key] = removeAccents(value).toUpperCase();
    };
    array.forEach(iterable);

    return {
        ARRAY: array,
        ...propertiesObject
    };
}

/**
 * Remove accents from string
 * 
 * @param  {String} string string with undesired accents
 * 
 * @return {String} string without accents
 */
function removeAccents(string) {
    const hexAccentMap = {
        a: /[\xE0-\xE6]/g,
        e: /[\xE8-\xEB]/g,
        i: /[\xEC-\xEF]/g,
        o: /[\xF2-\xF6]/g,
        u: /[\xF9-\xFC]/g,
        c: /\xE7/g,
        n: /\xF1/g
    };

    Object.keys(hexAccentMap).forEach((letter) => {
        const regexp = hexAccentMap[letter];
        string = string.replace(regexp, letter);
    });

    return string;
}

module.exports = {
    PROPS: {
        ACTIVE: toEnum(activesArray),
        STATES: toEnum(statesArray),
        RES_TYPE: toEnum(residenceTypesArray)
    }
};