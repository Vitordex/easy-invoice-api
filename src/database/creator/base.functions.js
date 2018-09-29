const timeService = require('../../services/time.service');

const enums = require('../../enums');

async function updateOneWithDates(newStructure) {
    const user = this;
    const lastUpdated = timeService(user.updated_local[Object.keys(newStructure)[0]]);
    const updateTime = timeService(newStructure.date_local);

    if (lastUpdated > updateTime) return Promise.resolve();

    Object.keys(newStructure).map((key) => {
        if(key === enums.DB.FUNCTIONS.DATE_PROP) return;

        user[key] = newStructure[key];
        user.updated_local[key] = updateTime.toISOString();
    });

    return user.save();
}

async function updateManyWithDates(query, newStructure) {
    const documents = await this.find(query);

    const saves = documents.reduce((array, document) => {
        const lastUpdated = timeService(document.updated_local[Object.keys(newStructure)[0]]);
        const updateTime = timeService(newStructure.date_local);
        if (lastUpdated > updateTime) return array;

        Object.keys(newStructure).map((key) =>{
            if(key === enums.DB.FUNCTIONS.DATE_PROP) return;
        
            document[key] = newStructure[key];
            document.updated_local[key] = updateTime.toISOString();
        });

        return document.save();
    }, []);

    return Promise.all(saves);
}

module.exports = {
    updateManyWithDates,
    updateOneWithDates
};