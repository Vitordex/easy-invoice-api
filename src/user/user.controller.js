/* eslint-disable no-unused-vars */
const UserService = require('./user.service');
const ControllerError = require('../log/controller.error.model');
/* eslint-enable no-unused-vars */

const {
    DB: {
        PROPS: {
            DATE_HEADER
        }
    },
    API: {
        STATUS
    }
} = require('../enums');

const controllerName = 'user';

class UserController {
    /**
     * 
     * @param {Object} params 
     * @param {UserService} params.userService
     * @param {ControllerError} params.apiErrorModel
     */
    constructor({
        userService,
        apiErrorModel
    }) {
        this.userService = userService;

        this.ControllerError = apiErrorModel;
    }
    
    async patchUser(context, next) {
        const functionName = 'patchUser';
        const { body } = context.input;
        const { headers } = context.input;
        const { password } = body;

        if (password)
            body.password = await this.userService.hashPassword(password);

        const { user } = context.state;
        try {
            await user.updateWithDates(body, headers[DATE_HEADER]);
        } catch (error) {
            const controllerError = new ControllerError(
                STATUS.INTERNAL_ERROR,
                'Error saving the user',
                controllerName,
                functionName,
                context.input,
                error
            );
            context.throw(STATUS.INTERNAL_ERROR, controllerError);

            return next();
        }

        context.status = STATUS.OK;
        return next();
    }
}

module.exports = UserController;