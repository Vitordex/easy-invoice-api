const DatabaseService = require('./database.service'); // eslint-disable-line

const enums = require('../enums');
const dbModels = enums.DB.MODELS;

class User {
    /**
     * Create User model
     * @param {DatabaseService} service 
     * 
     * @returns {Object} User database model
     */
    constructor(service) {
        const ModelCreator = service.ModelCreator;
        const creator = new ModelCreator();

        const User = creator.create(dbModels.USER, {
            active: {
                type: Boolean,
                required: true,
                default: false
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
            state: {
                type: String,
                enum: enums.DB.PROPS.STATES,
                required: true
            },
            clients: [{ type: creator.types.ObjectId, ref: dbModels.CUSTOMER }],
            invoice: [{ type: creator.types.ObjectId, ref: dbModels.INVOICE }],
            salary: { type: Number, min: 0 },
            workload: { type: Number, min: 0 },
            document: { type: String },
            address: { type: String },
            registry: { type: String },
            inss: { type: String },
            fgts: { type: String },
            thirteenth: { type: Boolean },
            vacation: { type: Boolean },
            income: [],
            issqn: { type: String },
            rent: { type: Number },
            maintenance: { type: Number },
            supplies: [{ type: Number }],
            negocioation_margin: { type: Number },
            bills: [{ type: Number }]
        });

        return User;
    }
}

module.exports = User;