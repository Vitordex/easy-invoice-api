/* eslint-disable no-unused-vars */
const MaterialService = require('./material.service');
const ControllerError = require('../log/controller.error.model');
/* eslint-enable no-unused-vars */

const controllerName = 'material';
const timeService = require('../services/time.service');

const {
    API: {
        STATUS
    },
    DB: {
        PROPS: {
            DATE_HEADER
        }
    }
} = require('../enums');

class MaterialController {
    /**
     * @param {MaterialService} params.materialService
     * @param {ControllerError} params.apiErrorModel
     */
    constructor({
        materialService,
        apiErrorModel
    }) {
        this.materialService = materialService;

        this.ControllerError = apiErrorModel;
    }

    async getMaterial(context, next) {
        const functionName = 'getMaterial';

        const { materialId } = context.input.params;

        let material;

        try {
            material = await this.materialService.findMaterial({ _id: materialId });
        } catch (error) {
            const controllerError = new ControllerError(
                STATUS.NOT_FOUND,
                'Invalid material id',
                controllerName,
                functionName,
                context.input,
                error
            );
            context.throw(STATUS.NOT_FOUND,  controllerError);

            return next();
        }

        if (!material) {
            const controllerError = new ControllerError(
                STATUS.NOT_FOUND,
                'Invalid material id',
                controllerName,
                functionName,
                context.input,
                'Invalid material id'
            );
            context.throw(STATUS.NOT_FOUND,  controllerError);

            return next();
        }

        context.body = material.toJSON();
        context.type = 'json';
        return next();
    }

    async postMaterial(context, next) {
        const functionName = 'postMaterial';
        const { body } = context.input;
        body.userId = context.state.user._id;

        const material = await this.materialService.create(body);

        const { user } = context.state;

        user.materials.push(material._id);

        try {
            await Promise.all([
                user.save(),
                material.save()
            ]);
        } catch (error) {
            const controllerError = new ControllerError(
                STATUS.INTERNAL_ERROR,
                'Error saving the material',
                controllerName,
                functionName,
                context.input,
                error
            );
            context.throw(STATUS.INTERNAL_ERROR,  controllerError);

            return next();
        }

        context.status = STATUS.OK;
        context.body = { materialId: material._id };
        return next();
    }

    async patchMaterial(context, next) {
        const functionName = 'patchMaterial';
        const {
            input: {
                body,
                headers,
                params
            }
        } = context;

        const { user } = context.state;

        if (!user.materials.find((id) => id.toString() === params.materialId)) {
            const controllerError = new ControllerError(
                STATUS.FORBIDDEN,
                'User does not have rights',
                controllerName,
                functionName,
                context.input,
                'User does not have rights'
            );
            context.throw(STATUS.FORBIDDEN, controllerError);

            return next();
        }

        let material;

        try {
            material = await this.materialService.findMaterial({ _id: params.materialId });
        } catch (error) {
            const controllerError = new ControllerError(
                STATUS.NOT_FOUND,
                'Invalid material id',
                controllerName,
                functionName,
                context.input,
                error
            );
            context.throw(STATUS.NOT_FOUND,  controllerError);

            return next();
        }

        if (!material) {
            const controllerError = new ControllerError(
                STATUS.NOT_FOUND,
                'Invalid material id',
                controllerName,
                functionName,
                context.input,
                'Invalid material id'
            );
            context.throw(STATUS.NOT_FOUND, controllerError);

            return next();
        }

        const updateLocal = headers[DATE_HEADER];

        try {
            await material.updateWithDates(body, updateLocal);
        } catch (error) {
            const controllerError = new ControllerError(
                STATUS.INTERNAL_ERROR,
                'Error saving the material',
                controllerName,
                functionName,
                context.input,
                error
            );
            context.throw(STATUS.INTERNAL_ERROR,  controllerError);

            return next();
        }

        context.status = STATUS.OK;
        return next();
    }

    async deleteMaterial(context, next) {
        const functionName = 'deleteMaterial';
        const {
            input: {
                params
            }
        } = context;

        const { user } = context.state;

        if (!user.materials.find((id) => id.toString() === params.materialId)) {
            const controllerError = new ControllerError(
                STATUS.FORBIDDEN,
                'User does not have rights',
                controllerName,
                functionName,
                context.input,
                'User does not have rights'
            );
            context.throw(STATUS.FORBIDDEN, controllerError);

            return next();
        }

        let material;

        try {
            material = await this.materialService.findMaterial({ _id: params.materialId });
        } catch (error) {
            const controllerError = new ControllerError(
                STATUS.NOT_FOUND,
                'Invalid material id',
                controllerName,
                functionName,
                context.input,
                error
            );
            context.throw(STATUS.NOT_FOUND,  controllerError);

            return next();
        }

        if (!material) {
            const controllerError = new ControllerError(
                STATUS.NOT_FOUND,
                'Invalid material id',
                controllerName,
                functionName,
                context.input,
                'Invalid material id'
            );
            context.throw(STATUS.NOT_FOUND, controllerError);

            return next();
        }

        material.deletedAt = timeService().toISOString();
        user.materials = user.materials.reduce((materials, item) => {
            if (item.toString() === material.id.toString()) return materials;

            return materials.concat([item]);
        }, []);

        try {
            await Promise.all([
                user.save(),
                material.save()
            ]);
        } catch (error) {
            const controllerError = new ControllerError(
                STATUS.INTERNAL_ERROR,
                'Error saving the material',
                controllerName,
                functionName,
                context.input,
                error
            );
            context.throw(STATUS.INTERNAL_ERROR,  controllerError);

            return next();
        }

        context.status = STATUS.OK;
        return next();
    }

    async listMaterials(context, next) {
        const functionName = 'listMaterials';

        const { user } = context.state;
        let materials = user.materials;

        try {
            if (materials.length > 0) {
                const query = {
                    '_id': {
                        $in: user.materials
                    }
                };
                materials = await this.materialService.findMaterials(query);
            }
        } catch (error) {
            const controllerError = new ControllerError(
                STATUS.INTERNAL_ERROR,
                'Invalid user',
                controllerName,
                functionName,
                context.input,
                error
            );
            context.throw(STATUS.INTERNAL_ERROR,  controllerError);

            return next();
        }

        context.body = materials.map((material) => material.toJSON());
        context.status = 200;

        return next();
    }
}

module.exports = MaterialController;