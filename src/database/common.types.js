const mongoose = require('mongoose');

module.exports = {
    Model: mongoose.Model,
    Instances: {
        User: {
            active: false,
            name: '',
            email: '',
            password: '',
            phone: '',
            state: '',
            clients: [],
            invoice: [],
            salary: 0,
            workload: 0,
            document: '',
            address: '',
            registry: '',
            inss: '',
            fgts: '',
            thirteenth: '',
            vacation: '',
            income: [],
            issqn: '',
            rent: '',
            maintenance: '',
            supplies: [0],
            negocioation_margin: 0,
            bills: [0],
            save: () => Promise.resolve()
        }
    }
};