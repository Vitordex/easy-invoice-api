module.exports = {
    FUNCTIONS: {
        UPDATE_ONE_DATE: 'updateOneWithDates',
        UPDATE_MANY_DATE: 'updateManyWithDates',
        DATE_PROP: 'date_local',
        TO_JSON: 'toJSON'
    },
    MODELS: {
        USER: 'User',
        CUSTOMER: 'Customer',
        INVOICE: 'Invoice',
        MATERIAL: 'Material',
        EQUIPMENT: 'Equipment'
    },
    PROPS: {
        STATES: ['Acre', 'Alagoas', 'Amapá', 'Amazonas', 'Bahia', 'Ceará',
            'Espírito Santo', 'Goiás', 'Maranhão', 'Mato Grosso',
            'Mato Grosso do Sul', 'Minas Gerais', 'Pará', 'Paraíba',
            'Paraná', 'Pernambuco', 'Piauí', 'Rio de Janeiro',
            'Rio Grande do Norte', 'Rio Grande do Sul', 'Rondônia',
            'Roraima', 'Santa Catarina', 'São Paulo', 'Sergipe', 'Tocantins'],
        RES_TYPE: ['Apartamento', 'Casa', 'Comercial']
    },
    AUTH: {
        DB_NAME: 'admin'
    }
};