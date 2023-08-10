class ServiceError extends Error{
    /**
     * @param {Number} status The status generated by the route
     * @param {String} service The controller file name
     * @param {String} method The method name that threw the exception
     * @param {Object} input The input for the request
     * @param {Object} output If any the output for the request
     */
    constructor(message, service, method, input, output = {}){
        super(message);
        
        this.message = message;

        this.service = `${service}.service`;
        this.method = method;
        this.input = input;
        this.output = output;
    }

    toJson(){
        return {
            source: this.controller,
            method: this.method,
            input: this.input,
            output: this.output
        };
    }
}

module.exports = ServiceError;