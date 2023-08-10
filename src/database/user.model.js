const DatabaseService = require('./database.service'); // eslint-disable-line

const { DATABASE: dbValues } = require('../values');
const { DB } = require('../enums');
const dbModels = DB.MODELS;

class User {
    /**
     * Create User model
     * @param {DatabaseService} service 
     */
    constructor(service) {
        const ModelCreator = service.ModelCreator;
        const creator = new ModelCreator();

        const model = {
            active: {
                type: String,
                required: true,
                default: dbValues.PROPS.ACTIVE.INACTIVE,
                enum: dbValues.PROPS.ACTIVE.ARRAY
            },
            name: {
                type: String,
                required: true,
                max: 255
            },
            email: {
                type: String,
                required: true,
                min: 5,
                max: 255,
                trim: true
            },
            password: {
                type: String,
                required: true,
                min: 10,
                max: 1024
            },
            phone: {
                type: String,
                required: true,
                max: 20
            },
            customers: [String],
            invoices: [String],
            document: String,
            registry: String,
            salary_intended: Number,
            workload_intended: Number,
            thirteenth_salary: Boolean,
            vacation: Boolean,
            negocioation_margin: Number,
            inss: Number,
            fgts: Number,
            issqn: Number,
            eati: Number,
            rent: Number,
            maintenance: Number,
            supplies: Number,
            address: {
                street: String,
                number: Number,
                complement: String,
                neighborhood: String,
                zip_code: String,
                city: String,
                state: {
                    type: String,
                    enum: dbValues.PROPS.STATES.ARRAY,
                    required: true
                }
            },
            deletedAt: Date
        };

        const removeProperties = ['password'];
        const User = creator.create(
            dbModels.USER,
            model,
            {},
            Object.keys(model).filter((key) => !removeProperties.includes(key))
        );

        return User;
    }
}

module.exports = User;