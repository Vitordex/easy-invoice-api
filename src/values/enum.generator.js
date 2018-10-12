class EnumGenerator {
    /**
     * Remove accents from string
     * 
     * @param  {String} string string with undesired accents
     * 
     * @return {String} string without accents
     */
    static removeAccents(string) {
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

    /**
     * @param {Array<String>} array An array to return the enum values
     * 
     * @returns {{ARRAY: Array<*>}}}
     */
    static toEnum(array) {
        const propertiesObject = {};

        /** @param {String} value */
        const iterable = (value) => {
            const key = this.removeAccents(value).toUpperCase();
            propertiesObject[key] = value;
        };
        array.forEach(iterable);

        return {
            ARRAY: array,
            ...propertiesObject
        };
    }
}

module.exports = EnumGenerator;