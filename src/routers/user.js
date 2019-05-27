const express = require('express');
const multer = require('multer');
const User = require('../models/user');
const auth = require('../middleware/auth');
const {sendWelcomeEmail , sendCancellationEmail} = require('../emails/account');

const router = new express.Router();

const upload = multer({
    limits : {
        fileSize : 1000000
    },
    fileFilter(req,file,cb) {
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
            return cb(new Error('Please upload an image file'));
        }
        cb(undefined, true);
    }
})

router.post('/users', async (req,res) => {
    const user = new User(req.body);

    try{
        await user.save();
        sendWelcomeEmail(user.email,user.name);
        const token = await user.generateAuthToken();
        res.status(201).send({user,token});
    }catch(e){
        res.status(400).send();
    }
   
})

router.post('/users/login', async (req,res) => {
    try{
        const user = await User.findByCredentials(req.body.email,req.body.password);    
        const token = await user.generateAuthToken(); 
        console.log('token',token);
        res.send({user,token});
    }catch(e){
        res.status(400).send();
    }
})

router.post('/users/logout', auth, async (req,res) => {
    try{
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token!=req.token;
        })
        await req.user.save();

        res.send();
    }catch(e){
        res.status(500).send();
    }
})

router.post('/users/logoutAll', auth,async (req,res) =>{
    try{
        req.user.tokens = [];
        await req.user.save();
        res.send();
    }catch(e){
        res.status(500).send();
    }
})

router.get('/users/me', auth , async (req,res) => {

    res.send(req.user); 
    
})

router.post('/users/me/avatar', auth, upload.single('avatar'),async (req,res) =>{

    req.user.avatar = req.file.buffer;
    console.log('Hi there');
    await req.user.save();
    res.send();
},(error,req,res,next) => {
    res.status(400).send({error : error.message})
})

router.delete('/users/me/avatar', auth, async (req,res) => {
    req.user.avatar = undefined;
    await req.user.save();
    res.send();
},(error) => {
    res.status(400).send({error:error.message});
})

router.get('/users/:id/avatar',async (req,res) => {
    try{
        const user =  await User.findById(req.params.id);
        if(!user || !user.avatar){
            throw new Error();
        }
        res.set('Content-Type','image/jpg');
        res.send(user.avatar);
    }catch(e){
        res.status(404).send();
    }
})

router.patch('/users/me',auth, async (req,res) => {
    const allowedUpdates = ['name', 'email', 'age', 'password'];
    const updates = Object.keys(req.body);
    const isValidateOperation = updates.every((update) => {
        return allowedUpdates.includes(update);
    })
    if(!isValidateOperation){
        res.status(400).send({error: 'Invalid Updates!'});
    }
    const _id = req.params.id;
    try{
        //const user = await User.findById(req.params.id);

        updates.forEach((update) => {
            req.user[update] = req.body[update];
        })

        await req.user.save();

        //const user = await User.findByIdAndUpdate(_id,req.body,{new : true, runValidators : true});
        // if(!user){
        //     return res.status(404).send();

        // }
        res.send(req.user);
    }catch(e){
        res.status(400).send();
    }
})

router.delete('/users/me',auth , async (req,res) => {
    try{
        // const user = await User.findByIdAndDelete(req.user._id);
        // if(!user){
        //     return res.status(404).send();
        // }
        const email = req.user.email;
        const name = req.user.name;
        await req.user.remove();
        res.send(req.user);
        sendCancellationEmail(email,name);

    }catch(e){
        res.status(500).send();
    }
})

module.exports = router;