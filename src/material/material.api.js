const Router = require('koa-router');

/* eslint-disable no-unused-vars */
const AuthService = require('../user/auth.service');
const MaterialController = require('./material.controller');
const MaterialSchema = require('./material.schema');
const ValidationMiddleware = require('../middleware/validation.middleware');
/* eslint-enable no-unused-vars */

class MaterialApi {
    /**
     * @param {Object} params
     * @param {AuthService} params.authService The authentication service for the protexted routes
     * @param {MaterialController} params.materialController The controller with all the methods for user routes
     * @param {MaterialSchema} params.materialSchema The input validation for user routes
     * @param {ValidationMiddleware} params.validationMiddleware The middleware for validating route input
     */
    constructor({
        authService,
        materialController,
        materialSchema,
        validationMiddleware
    }) {
        this.router = new Router({
            prefix: '/materials'
        });
        this.authService = authService;
        this.validationMiddleware = validationMiddleware;

        this.materialController = materialController;
        this.materialSchema = materialSchema;
    }

    buildRoutes() {
        this.router.get(
            '/:materialId',
            this.validationMiddleware.validate(this.materialSchema.schemas.getMaterial),
            this.authService.authenticate(),
            async (context, next) => {
                await this.materialController.getMaterial(context, next);
            }
        );

        this.router.post(
            '/',
            this.validationMiddleware.validate(this.materialSchema.schemas.postMaterial),
            this.authService.authenticate(),
            async (context, next) => {
                await this.materialController.postMaterial(context, next);
            }
        );

        this.router.patch(
            '/:materialId',
            this.validationMiddleware.validate(this.materialSchema.schemas.patchMaterial),
            this.authService.authenticate(),
            async (context, next) => {
                await this.materialController.patchMaterial(context, next);
            }
        );

        this.router.delete(
            '/:materialId',
            this.validationMiddleware.validate(this.materialSchema.schemas.deleteMaterial),
            this.authService.authenticate(),
            async (context, next) => {
                await this.materialController.deleteMaterial(context, next);
            }
        );

        this.router.get(
            '/',
            this.validationMiddleware.validate(this.materialSchema.schemas.listMaterials),
            this.authService.authenticate(),
            async (context, next) => {
                await this.materialController.listMaterials(context, next);
            }
        );
    }
}

module.exports = MaterialApi;