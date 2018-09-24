const config = require('config');

class ConfigService{
    static get(setting){
        return config.get(setting);
    }
}

module.exports = ConfigService;