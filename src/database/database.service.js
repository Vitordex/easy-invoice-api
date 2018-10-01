const mongoose = require('mongoose');
const ModelCreator = require('./creator/model.creator');

const { DB } = require('../enums');

class DatabaseService {
    connect(options) {
        return new Promise((resolve, reject) => {
            mongoose.connect(`${
                options.driver
            }://${options.user}:${options.pass}@${options.host}/${options.dbName}`, {
                auth: {
                    authdb: DB.AUTH.DB_NAME
                },
                useNewUrlParser: true
            }, (err) => {
                if (err) return reject(err);

                resolve(true);
            });
        });
    }

    disconnect() {
        return mongoose.disconnect();
    }

    get ModelCreator() {
        return ModelCreator;
    }
}

module.exports = DatabaseService;