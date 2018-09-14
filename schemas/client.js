const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
    name: { type: String, required: true, max: 255 },
    address: String,
    document: String
});