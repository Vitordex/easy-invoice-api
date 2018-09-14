const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const secret = "orcamento-facil";

const userSchema =  new mongoose.Schema({
    active: { type: Boolean, required: true, default: false },
    name: { type: String, required: true, max: 255 },
    email: { type: String, unique: true, required: true, min: 5, max: 255, trim: true },
    password: { type: String, required: true, min: 10, max: 1024 },
    phone : { type: String, required: true, max: 20 },
    state: {
        type: String,
        enum: ['Acre', 'Alagoas', 'Amapá', 'Amazonas', 'Bahia', 'Ceará',
                'Espírito Santo', 'Goiás', 'Maranhão', 'Mato Grosso',
                'Mato Grosso do Sul', 'Minas Gerais', 'Pará', 'Paraíba',
                'Paraná', 'Pernambuco', 'Piauí', 'Rio de Janeiro',
                'Rio Grande do Norte', 'Rio Grande do Sul', 'Rondônia',
                'Roraima', 'Santa Catarina', 'São Paulo', 'Sergipe', 'Tocantins'],
        required: true
    },
    clients: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
    salary: { type: Number, min: 0 },
    workload: { type: Number, min: 0 },
    document: { type: String },
    address: { type: String },
    registry: { type: String },
    inss: { type: String },
    fgts: { type: String },
    thirteenth: { type: Boolean },
    vacation: { type: Boolean },
    income: [],
    issqn: { type: String },
    rent: { type: Number },
    maintenance: { type: Number },
    supplies: [{ type: Number }],
    negocioation_margin: { type: Number },
    bills: [{ type: Number }]
});
userSchema.methods.generateToken = function() { return jwt.sign({_id: this._id}, process.env.SECRET || secret); }
userSchema.methods.isValid = function() { return this.active; }
userSchema.methods.activate = async function(active) { 
    await User.findByIdAndUpdate(this._id, { active: active }, { fields: '-password -__v', new: true });
}
const User = mongoose.model('user', userSchema);

const verifyToken = (token) => { return jwt.verify(token, process.env.SECRET || secret); }
const authenticate = async (userData) => { 
    const hash = await User.findOne({ email: userData.email });
    return await bcrypt.compare(userData.password, hash.password);
}

const findById = (userData) => { return User.findById(userData._id).select('-__v -password'); }
const findByEmail = (userData) => { return User.findOne({ email: userData.email }).select('-__v -password'); }

const register = async (userData) => {
    userData.password = await bcrypt.hash(userData.password, await bcrypt.genSalt(10));
    return User.create(userData);
};
const remove = async (id) => { return await User.findByIdAndRemove(id); }
const update = async (id, userData) => {
    return await User.findByIdAndUpdate(id, userData, { fields: '-password -__v', new: true });
};

const validateEmail = (email) => { return email.match(/[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/); }
const validatePhone = (phone) => { return phone.match(/(^|(\d{2})|\(\d{2}\))\s(9?\d{4})(\s|-)?(\d{4})($|\n)/); };
const validatePassword = (password) => { return password.match(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@!%_\-*?&])[A-Za-z\d$@!%_\-*?&]{8,40}/); }
const validateDocument = (document) => { return document.match(/^\d{2}.\d{3}.\d{3}\/\d{4}\-\d{2}($|\n)|^\d{3}.\d{3}.\d{3}-\d{2}($|\n)/); }

const validateLogin = (userData) => {
    return validateEmail(userData.email) && validatePassword(userData.password);
}

const validateRegister = (userData) => {
    return validateEmail(userData.email) && validatePassword(userData.password) && validatePhone(userData.phone);
}

module.exports.verifyToken = verifyToken;
module.exports.authenticate = authenticate;
module.exports.register = register;
module.exports.remove = remove;

module.exports.find = {};
module.exports.find.byID = findById;
module.exports.find.byEmail = findByEmail;

module.exports.validate = {};
module.exports.validate.email = validateEmail;
module.exports.validate.password = validatePassword;
module.exports.validate.phone = validatePhone;
module.exports.validate.login = validateLogin;
module.exports.validate.register = validateRegister;