/*globals describe, it, after*/
const assert = require('assert');
const timeService = require('../../src/services/time.service');

const config = require('../../src/services/config.service');

const DatabaseService = require('../../src/database/database.service');
const UserModel = require('../../src/database/user.model');
const CustomerModel = require('../../src/database/customer.model');
const InvoiceModel = require('../../src/database/invoice.model');

const dbConfigs = config.get('database');
const databaseService = new DatabaseService();
const ObjectId = require('../../src/database/object.id');

const {
    DATABASE: {
        PROPS: {
            STATES
        } 
    } 
} = require('../../src/values');

let createdUser;
let User;

let createdCustomer;
let Customer;

let createdInvoice;
let Invoice;

describe('Database', () => {
    describe('service', () => {
        it('Should connect', async () => {
            await databaseService.connect(dbConfigs.auth);

            User = new UserModel(databaseService); // eslint-disable-line
            Customer = new CustomerModel(databaseService); // eslint-disable-line
            Invoice = new InvoiceModel(databaseService); // eslint-disable-line
        });
    });

    describe('user collection', () => {
        it('should create a user', async () => {
            createdUser = new User({
                _id: new ObjectId().toHex(),
                email: 'test@test.com',
                password: 'asd',
                id: 1,
                name: 'Teste ci',
                phone: '11955555555',
                address: {
                    state: STATES.ACRE
                }
            });

            await createdUser.save();
        });

        it('should find created user', async () => {
            const user = await User.find({ _id: createdUser._id });

            assert(user !== undefined && user !== null);
        });

        it('should update created user', async () => {
            createdUser.email = 'testing';
            await createdUser.save();

            const user = await User.findById(createdUser._id);

            assert(user.email === 'testing');
        });

        it('should update user when updated date is after last updated', async () => {
            const newDate = timeService();

            const update = {
                email: 'teste@teste.com'
            };
            await createdUser.updateWithDates(update, newDate.valueOf());

            const user = await User.findById(createdUser._id);

            assert(user.email === 'teste@teste.com' &&
                user.updated_local.email.toISOString() === newDate.toISOString());
        });

        it('should not update user when updated date is before last updated', async () => {
            const update = {
                email: 'test@test.com'
            };

            await createdUser.updateWithDates(update, new Date(Date.now() - 1000 * 60 * 60).getTime());

            const user = await User.findById(createdUser._id);

            assert(user.email === 'teste@teste.com');
        });

        it('should list all users', async () => {
            const users = await User.find({});

            assert(users.find((user) => user._id.toString() === createdUser._id.toString()));
        });

        it('should delete created user', async () => {
            await createdUser.remove();

            const user = await User.findById(createdUser._id);

            assert(!user);
        });
    });

    describe('customer collection', () => {
        it('should create a customer', async () => {
            createdCustomer = new Customer({
                _id: new ObjectId().toHex(),
                name: 'Teste ci',
                phone: '11955555555',
                address: {
                    state: STATES.ACRE
                }
            });

            await createdCustomer.save();
        });

        it('should find created customer', async () => {
            const customer = await Customer.find({ _id: createdCustomer._id });

            assert(!!customer);
        });

        it('should update created customer', async () => {
            createdCustomer.name = 'testing';
            await createdCustomer.save();

            const customer = await Customer.findById(createdCustomer._id);

            assert(customer.name === 'testing');
        });

        it('should update customer when updated date is after last updated', async () => {
            const newDate = timeService();

            const update = {
                name: 'teste@teste.com'
            };
            await createdCustomer.updateWithDates(update, newDate.valueOf());

            const customer = await Customer.findById(createdCustomer._id);

            assert(customer.name === 'teste@teste.com' &&
                customer.updated_local.name.toISOString() === newDate.toISOString());
        });

        it('should not update customer when updated date is before last updated', async () => {
            const update = {
                name: 'test@test.com'
            };

            await createdCustomer.updateWithDates(update, new Date(Date.now() - 1000 * 60 * 60).getTime());

            const customer = await Customer.findById(createdCustomer._id);

            assert(customer.name === 'teste@teste.com');
        });

        it('should list all customers', async () => {
            const customers = await Customer.find({});

            assert(customers.find((customer) => customer._id.toString() === createdCustomer._id.toString()));
        });

        it('should delete created customer', async () => {
            await createdCustomer.remove();

            const customer = await Customer.findById(createdCustomer._id);

            assert(!customer);
        });
    });

    describe('invoice collection', () => {
        it('should create a invoice', async () => {
            createdInvoice = new Invoice({
                _id: new ObjectId().toHex(),
                description: 'Teste ci'
            });

            await createdInvoice.save();
        });

        it('should find created invoice', async () => {
            const invoice = await Invoice.find({ _id: createdInvoice._id });

            assert(!!invoice);
        });

        it('should update created invoice', async () => {
            createdInvoice.description = 'testing';
            await createdInvoice.save();

            const invoice = await Invoice.findById(createdInvoice._id);

            assert(invoice.description === 'testing');
        });

        it('should update invoice when updated date is after last updated', async () => {
            const newDate = timeService();

            const update = {
                description: 'teste@teste.com'
            };
            await createdInvoice.updateWithDates(update, newDate.valueOf());

            const invoice = await Invoice.findById(createdInvoice._id);

            assert(invoice.description === 'teste@teste.com' &&
                invoice.updated_local.description.toISOString() === newDate.toISOString());
        });

        it('should not update invoice when updated date is before last updated', async () => {
            const update = {
                description: 'test@test.com'
            };

            await createdInvoice.updateWithDates(update, new Date(Date.now() - 1000 * 60 * 60).getTime());

            const invoice = await Invoice.findById(createdInvoice._id);

            assert(invoice.description === 'teste@teste.com');
        });

        it('should list all invoices', async () => {
            const invoices = await Invoice.find({});

            assert(invoices.find((invoice) => invoice._id.toString() === createdInvoice._id.toString()));
        });

        it('should delete created invoice', async () => {
            await createdInvoice.remove();

            const invoice = await Invoice.findById(createdInvoice._id);

            assert(!invoice);
        });
    });

    after(async () => {
        await databaseService.disconnect();
    });
});