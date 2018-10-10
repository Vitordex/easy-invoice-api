const DatabaseService = require('./database.service'); // eslint-disable-line

const {DATABASE: dbValues} = require('../values');
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

        const User = creator.create(dbModels.USER, {
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
            customers: [{ type: creator.types.ObjectId, ref: dbModels.CUSTOMER }],
            invoices: [{ type: creator.types.ObjectId, ref: dbModels.INVOICE }],
            document: String,
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
            registry: String,
            incomes: {
                salary_intended: Number,
                workload_intended: Number,
                thirteenth_salary: Boolean,
                vacation: Boolean
            },
            negocioation_margin: Number,
            bills: {
                inss: Number,
                fgts: Number,
                issqn: Number,
                eati: Number,
                rent: Number,
                maintenance: Number,
                supplies: Number
            },
            deletedAt: Date
        }, {}, function () {
            return {
                active: this.active,
                name: this.name,
                email: this.email,
                phone: this.phone,
                state: this.state,
                customers: this.customers,
                invoice: this.invoice,
                salary: this.salary,
                workload: this.workload,
                document: this.document,
                address: this.address,
                registry: this.registry,
                incomes: this.incomes,
                bills: this.bills,
                negocioation_margin: this.negocioation_margin
            };
        });

        return User;
    }
}

module.exports = User;