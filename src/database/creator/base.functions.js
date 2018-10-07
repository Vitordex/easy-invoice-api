const timeService = require('../../services/time.service');

async function updateWithDates(newStructure, dateLocal = timeService().valueOf()) {
    const document = this;
    const lastUpdated = timeService(document.updated_local[Object.keys(newStructure)[0]]);
    const updateTime = timeService(parseInt(dateLocal));

    if (lastUpdated > updateTime) return Promise.resolve();

    Object.keys(newStructure).forEach((key) => {
        document[key] = newStructure[key];
        document.updated_local[key] = updateTime.toISOString();
    });

    return document.save();
}

async function updateManyWithDates(query, newStructure, dateLocal = timeService().milliseconds()) {
    const documents = await this.find(query);

    const saves = documents.reduce((array, document) => {
        const lastUpdated = timeService(document.updated_local[Object.keys(newStructure)[0]]);
        const updateTime = timeService(parseInt(dateLocal));
        if (lastUpdated > updateTime) return array;

        Object.keys(newStructure).forEach((key) =>{
            document[key] = newStructure[key];
            document.updated_local[key] = updateTime.toISOString();
        });

        return document.save();
    }, []);

    return Promise.all(saves);
}

module.exports = {
    updateManyWithDates,
    updateWithDates
};