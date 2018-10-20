class ContextMock{
    constructor(request, params = {}, state = {}){
        this.status = 200;
        this.body = '';
        this.type = '';
        this.header = {};
        
        this.request = request;
        this.params = params;
        this.state = state;
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