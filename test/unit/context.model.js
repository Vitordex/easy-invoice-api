class ContextMock{
    constructor(request){
        this.status = 200;
        this.body = '';
        this.type = '';
        
        this.request = request;
    }

    throw(status, message){
        this.status = status;
        this.body = message;
    }
}

module.exports = ContextMock;