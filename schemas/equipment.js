const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
    name: String,
    description: String,
    price: Number,
    count: Number
});