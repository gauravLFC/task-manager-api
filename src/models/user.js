const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('./tasks');

const userSchema = new mongoose.Schema({
    name : {
        type : String,
        required : true
    },
    age : {
        type : Number,
        default : 0,
        validate(value) {
            if(value < 0){
                throw new Error('Age must be a positive number')
            }
        }
    },
    email : {
        type : String,
        required : true,
        unique : true,
        validate(value) {
            if(!validator.isEmail(value)){
                throw new Error('Email is invalid');
            }
        }
    },
    password : {
        type : String,
        required : true,
        trim : true,
        minlength : 7,
        validate(value){
            if(value.includes('password')){
                throw new Error('Password should not contain the term password');
            }
        }
    },
    tokens : [{
        token : {
            type : String,
            required : true
        }
    }], 
    avatar : {
        type : Buffer
    }
}, {
    timestamps : true
})

userSchema.virtual('tasks', {
    ref : 'tasks',
    localField : '_id',
    foreignField : 'owner'
})

userSchema.methods.generateAuthToken = async function(){
    const user = this;
    const token = jwt.sign({_id : user.id.toString()}, process.env.JWT_SECRET_KEY);

    user.tokens = user.tokens.concat({token:token});
    await user.save();

    return token;
}

userSchema.methods.toJSON = function(){
    const user = this;
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.tokens;
    delete userObj.avatar;
    return userObj;
}

userSchema.statics.findByCredentials = async (email,password) => {
    const user = await User.findOne({email : email});
    if(!user){
        throw new Error('Unable to login');
    }
    const isMatch = await bcrypt.compare(password, user.password);

    if(!isMatch){
        throw new Error('Unable to login');
    }

    return user;
}

userSchema.pre('save',async function (next){
    const user = this;

    if(user.isModified('password')){
        user.password = await bcrypt.hash(user.password,8);
    }

    next();
})

userSchema.pre('remove', async function(next){
    const user = this;

    await Task.deleteMany({owner : user._id})

    next();
})

const User = mongoose.model('User',userSchema);

module.exports =  User;