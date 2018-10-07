module.exports = {
    PROPS: {
        DATE_PROP: 'date_local',
        DATE_HEADER: 'x-update-local'
    },
    FUNCTIONS: {
        UPDATE_ONE_DATE: 'updateWithDates',
        UPDATE_MANY_DATE: 'updateManyWithDates',
        TO_JSON: 'toJSON'
    },
    MODELS: {
        USER: 'User',
        CUSTOMER: 'Customer',
        INVOICE: 'Invoice',
        MATERIAL: 'Material',
        EQUIPMENT: 'Equipment'
    },
    AUTH: {
        DB_NAME: 'admin'
    }
};