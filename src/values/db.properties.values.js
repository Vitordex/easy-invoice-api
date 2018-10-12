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

const EnumGenerator = require('./enum.generator');

module.exports = {
    ACTIVE: EnumGenerator.toEnum(activesArray),
    STATES: EnumGenerator.toEnum(statesArray),
    RES_TYPE: EnumGenerator.toEnum(residenceTypesArray)
};