const DatabaseService = require('./database.service'); // eslint-disable-line

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

        const User = creator.create(creator.names.User, {
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
                unique: true,
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
                enum: ['Acre', 'Alagoas', 'Amapá', 'Amazonas', 'Bahia', 'Ceará',
                    'Espírito Santo', 'Goiás', 'Maranhão', 'Mato Grosso',
                    'Mato Grosso do Sul', 'Minas Gerais', 'Pará', 'Paraíba',
                    'Paraná', 'Pernambuco', 'Piauí', 'Rio de Janeiro',
                    'Rio Grande do Norte', 'Rio Grande do Sul', 'Rondônia',
                    'Roraima', 'Santa Catarina', 'São Paulo', 'Sergipe', 'Tocantins'],
                required: true
            },
            clients: [{ type: creator.types.ObjectId, ref: creator.names.Customer }],
            invoice: [{ type: creator.types.ObjectId, ref: creator.names.Invoice }],
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