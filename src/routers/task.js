const express = require('express');
const router = new express.Router();
const auth = require('../middleware/auth');

const Task = require('../models/tasks');

router.post('/tasks',auth, async (req,res) => {
    const tasks = new Task({
        ...req.body,
        owner : req.user._id
    })

    try{
        await tasks.save();
        res.status(201).send(tasks);
    }
    catch(e){
        res.status(400).send();
    }
    
})

router.get('/tasks', auth, async (req,res) => {
    const match = {};
    const sort = {};
    if(req.query.completed){
        match.completed = req.query.completed === 'true';
    }
    if(req.query.sortBy){
        parts = req.query.sortBy.split(':');
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
        console.log(sort);
    }
    try{
        //const tasks = await Task.find({});
        await req.user.populate({
            path : 'tasks',
            match,
            options : {
                limit : parseInt(req.query.limit),
                skip : parseInt(req.query.skip),
                sort
            }
        }).execPopulate();
        //console.log(tasks);
        res.send(req.user.tasks);
    }catch(e){
        res.send(500).send();
    }
});

router.get('/tasks/:id', auth, async (req,res) => {
    const _id = req.params.id;
    try{    
        const task = await Task.findOne({_id,owner : req.user._id})
        if(!task){
            res.status(404).send();
        }
        res.send(task);
    }catch(e){
        res.status(500).send();
    }
})

router.patch('/tasks/:id', auth, async (req,res) => {
    const allowedUpdates = ['description', 'completed'];
    const updates = Object.keys(req.body);
    const isValidOperation = updates.every((update) => {
        return allowedUpdates.includes(update);
    })
    if(!isValidOperation){
        return res.status(400).send({error: 'Invalid Request!'});
    }
    try{
        const task = await Task.findOne({_id:req.params.id, owner : req.user._id});
        if(!task){
            return res.status(404).send();
        }
        updates.forEach((update) => {
            task[update] = req.body[update];
        });
        await task.save(); 
        
        return res.send(task);
    }catch(e){
        res.status(500).send();
    }
    

})

router.delete('/tasks/:id', auth, async (req,res) => {
    try{
        const task = await Task.findOneAndDelete({_id : req.params.id, owner : req.user._id});
        if(!task){
            return res.status(404).send();
        }
        res.send(task);
    }catch(e){
        res.status(500).send();
    }
})

module.exports = router;