const { AUTH } = require('../../src/enums');

class ContextMock {
    constructor(request, params = {}, state = {}) {
        this.status = 200;
        this.body = '';
        this.type = '';
        this.header = {};
        this.input = {
            params,
            body: request.body,
            headers: request.headers,
            query: request.query
        };

        this.headersPreset = { 
            [AUTH.TOKEN_HEADER]: '' 
        };

        this.request = request;
        this.params = params;
        this.state = state;
    }

    throw(status, message) {
        this.status = status;
        this.body = message;
    }

    set(headerName, headerValue) {
        this.header[headerName] = headerValue; // eslint-disable-line
    }
}

module.exports = ContextMock;