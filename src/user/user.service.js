class UserService{
    constructor(userSchema, passwordService){
        this.userSchema = userSchema;
        this.passwordService = passwordService;
    }

    findUser(query){
        return this.userSchema.find(query);
    }

    hashPassword(password){
        return this.passwordService.createHash(password);
    }

    matchPassword(password, hash){
        return this.passwordService.compare(password, hash);
    }

    toJSON(userObject){
        return userObject.toJSON();
    }
}

module.exports = UserService;