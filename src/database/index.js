const DatabaseService = require('./database.service');
const User = require('./user.model');
const Customer = require('./customer.model');
const Invoice = require('./invoice.model');
const Equipment = require('./equipment.model');
const Material = require('./material.model');
const ObjectId = require('./object.id');
const CommonTypes = require('./common.types');
const Creator = require('./creator/');

module.exports = {
    DatabaseService,
    User,
    Customer,
    Invoice,
    Equipment,
    Material,
    ObjectId,
    CommonTypes,
    Creator
};