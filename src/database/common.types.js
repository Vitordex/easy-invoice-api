const mongoose = require('mongoose');

const { DB } = require('../enums');

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
                state: DB.PROPS.STATES
            },
            registry: '',
            incomes: {
                salary_intended: 0,
                workload_intended: 0,
                thirteenth_salary: true,
                vacation: true
            },
            negocioation_margin: 0,
            bills: [{
                inss: 0,
                fgts: 0,
                issqn: 0,
                eati: 0,
                rent: 0,
                maintenance: 0,
                supplies: [0],
            }],
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
                state: DB.PROPS.STATES
            },
            document: String,
            save: () => Promise.resolve()
        }
    }
};