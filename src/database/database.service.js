const mongoose = require('mongoose');
const ModelCreator = require('./creator/model.creator');

class DatabaseService {
    connect(hostUrl, options) {
        return new Promise((resolve, reject) => {
            mongoose.connect(hostUrl, {
                ...options,
                auth: {
                    authdb: 'admin'
                },
                useNewUrlParser: true
            }, (err) => {
                if (err) return reject(err);

                resolve(true);
            });
        });
    }

    disconnect(){
        return mongoose.disconnect();
    }

    get ModelCreator(){
        return ModelCreator;
    }
}

module.exports = DatabaseService;