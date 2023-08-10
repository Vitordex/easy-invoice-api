class ServiceLog{
    constructor(method, input, output, service = ''){
        this.method = method; 
        this.input = input;
        this.output = output;
        this.service = service;
    }

    toObject(includeService = false){
        const baseObject = {
            method: this.method,
            input: this.input,
            output: this.output  
        };

        if(includeService)
            baseObject.service = this.service;

        return baseObject;
    }
}

module.exports = ServiceLog;