class ContextMock{
    constructor(request){
        this.status = 200;
        this.body = '';
        this.type = '';
        this.header = {};
        
        this.request = request;
    }

    throw(status, message){
        this.status = status;
        this.body = message;
    }

    set(headerName, headerValue){
        this.header[headerName] = headerValue;
    }
}

module.exports = ContextMock;