const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
    name: String,
    description: String,
    icon: String,
    modifier: [String],
    price: Number,
    count: Number
});