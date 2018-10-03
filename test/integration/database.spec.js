/*globals describe, it, after*/
const assert = require('assert');
const timeService = require('../../src/services/time.service');

const config = require('../../src/services/config.service');

const DatabaseService = require('../../src/database/database.service');
const UserModel = require('../../src/database/user.model');

const dbConfigs = config.get('database');
const databaseService = new DatabaseService();

let createdUser;
let User;

describe('Database', () => {
    describe('service', () => {
        it('Should connect', async () => {
            await databaseService.connect(dbConfigs.auth);

            User = new UserModel(databaseService); // eslint-disable-line
        });
    });

    describe('user collection', () => {
        it('should create a user', async () => {
            createdUser = new User({
                email: 'test@test.com',
                password: 'asd',
                id: 1,
                name: 'Teste ci',
                phone: '11955555555'
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
            const newDate = timeService().toISOString();

            const update = {
                email: 'teste@teste.com',
                date_local: newDate
            };
            await createdUser.updateWithDates(update);

            const user = await User.findById(createdUser._id);

            assert(user.email === 'teste@teste.com' && 
                user.updated_local.email.toISOString() === newDate);
        });

        it('should not update user when updated date is before last updated', async () => {
            const update = {
                email: 'test@test.com',
                date_local: new Date(Date.now() - 1000 * 60 * 60).toISOString()
            };
            await createdUser.updateWithDates(update);

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

    after(async () => {
        await databaseService.disconnect();
    });
});