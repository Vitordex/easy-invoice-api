const mongoose = require('mongoose');

const { DATABASE } = require('../values');

module.exports = {
    Model: mongoose.Model,
    Instances: {
        User: {
            active: true,
            name: '',
            email: '',
            password: '',
            phone: '',
            customers: [''],
            invoices: [''],
            document: '',
            address: {
                street: '',
                number: 0,
                complement: '',
                neighborhood: '',
                zip_code: '',
                city: '',
                state: DATABASE.PROPS.STATES.ARRAY
            },
            registry: '',
            salary_intended: 0,
            workload_intended: 0,
            thirteenth_salary: true,
            vacation: true,
            negocioation_margin: 0,
            inss: 0,
            fgts: 0,
            issqn: 0,
            eati: 0,
            rent: 0,
            maintenance: 0,
            supplies: [0],
            deletedAt: '',
            save: () => Promise.resolve()
        },
        Customer: {
            name: '',
            address: {
                street: '',
                number: 0,
                complement: '',
                neighborhood: '',
                zip_code: '',
                city: '',
                state: DATABASE.PROPS.STATES.ARRAY
            },
            document: String,
            save: () => Promise.resolve()
        },
        Invoice: {
            customer: '',
            date_start: '',
            date_end: '',
            description: '',
            labor: [{
                name: '',
                description: '',
                time: '',
                price: 0
            }],
            equipment: [''],
            material: [''],
            addition: '',
            discount: '',
            value: 0,
            type: DATABASE.PROPS.RES_TYPE
        }
    }
};