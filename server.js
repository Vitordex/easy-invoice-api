const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const auth = require('./routes/auth');
const user = require('./routes/user');
const invoice = require('./routes/invoice');
const app = express();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/orcamento-facil')
        .then(() => console.log('MongoDB Connected!'))
        .catch(err => console.error('Could not connect to MongoDB...', err));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/auth', auth);
app.use('/user', user);
app.use('/invoice', invoice);

const port = process.env.PORT || 80;
app.listen(port, () => { console.log(`Server started on port ${port}!`); });