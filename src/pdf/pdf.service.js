const Logger = require('bunyan'); // eslint-disable-line
const ServiceLog = require('../log/service.log.model');

const html2pdf = require('html-pdf');

class PdfService {
    /**
     * @param {Object} pdfGenerationOptions 
     * @param {Logger} logger
     */
    constructor(pdfGenerationOptions, logger) {
        this.generateOptions = pdfGenerationOptions;

        this.logger = logger.child({ service: 'pdf.service' });
    }

    /**
     * Generate a pdf from an html
     * @param {String} input The html string input
     * 
     * @returns {Promise<ReadableStream>}
     */
    generateStream(input) {
        const options = this.generateOptions;
        const functionName = 'generateStream';
        const params = { input };

        return new Promise((resolve, reject) => {
            html2pdf.create(input, options).toStream((err, stream) => {
                if (err) return reject(err);

                resolve(stream);
            });
        }).then((result) => {
            const log = new ServiceLog(functionName, params, result).toObject();
            this.logger.info(log);

            return result;
        }).catch((err) => {
            const log = new ServiceLog(functionName, params, err).toObject();
            this.logger.info(log);

            return Promise.reject(err);
        });
    }

    /**
     * Generate a pdf from an html
     * @param {String} input The html string input
     * 
     * @returns {Promise<ReadableStream>}
     */
    generateFile(input, path) {
        const options = this.generateOptions;
        const functionName = 'generateFile';
        const params = { input, path };

        return new Promise((resolve, reject) => {
            html2pdf.create(input, options).toFile(path, (err, stream) => {
                if (err) return reject(err);

                resolve(stream);
            });
        }).then((result) => {
            const log = new ServiceLog(functionName, params, result).toObject();
            this.logger.info(log);

            return result;
        }).catch((err) => {
            const log = new ServiceLog(functionName, params, err).toObject();
            this.logger.info(log);

            return Promise.reject(err);
        });
    }
}

module.exports = PdfService;