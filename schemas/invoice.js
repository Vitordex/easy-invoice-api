const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
    client: Client,
    date: Date,
    description: String,
    labor: [{ 
        name: String,
        description: String,
        time: String,
        price: Number 
    }],
    equipment: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Equipment' }],
    material: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Material' }],
    addition: String,
    discount: String,
    value: Number,
    type: { type: String, enum: ['Apartamento', 'Casa', 'Comercial'] }
});