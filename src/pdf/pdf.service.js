const html2pdf = require('html-pdf');

class PdfService{
    constructor(pdfGenerationOptions){
        this.generateOptions = pdfGenerationOptions;
    }

    /**
     * Generate a pdf from an html
     * @param {String} input The html string input
     * 
     * @returns {Promise<ReadableStream>}
     */
    generateStream(input){
        const options = this.generateOptions;

        return new Promise((resolve, reject) => {
            html2pdf.create(input, options).toStream((err, stream) => {
                if(err) return reject(err);

                resolve(stream);
            });
        });
    }

    /**
     * Generate a pdf from an html
     * @param {String} input The html string input
     * 
     * @returns {Promise<ReadableStream>}
     */
    generateFile(input, path){
        const options = this.generateOptions;

        return new Promise((resolve, reject) => {
            html2pdf.create(input, options).toFile(path, (err, stream) => {
                if(err) return reject(err);

                resolve(stream);
            });
        });
    }
}

module.exports = PdfService;