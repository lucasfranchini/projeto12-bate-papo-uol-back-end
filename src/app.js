import express from "express";
import cors from "cors";
import dayjs from "dayjs";
import {stripHtml} from "string-strip-html";
import Joi from 'joi';
import fs from 'fs';

const app = express();
app.use(cors());
app.use(express.json());

let participants = fs.existsSync('./data/participants.json') ?  JSON.parse(fs.readFileSync('./data/participants.json')):[];
const messages = fs.existsSync('./data/messages.json') ?  JSON.parse(fs.readFileSync('./data/messages.json')):[];

setInterval(()=>{
    const now = Date.now();
    const newparticpants = [];
    participants.forEach(p=>{
        if(now-p.lastStatus<10000){
            newparticpants.push(p);
        }
        else{
            messages.push({
                from: p.name, 
                to: 'Todos', 
                text: 'sai da sala...', 
                type: 'status', 
                time: dayjs().format('HH:mm:ss')
            })
        }
    });
    fs.writeFileSync('./data/messages.json', JSON.stringify(messages));
    participants=newparticpants;
    fs.writeFileSync('./data/participants.json', JSON.stringify( participants));
},15000)

app.post('/participants',(req,res)=>{
    const participant = stripHtml(req.body.name).result.trim();
    const schema = Joi.object({
        name: Joi.string()
                 .required()
                 .custom((value)=>{
                    if(participants.find(p=>p.name===value)===undefined){
                        return value
                    }
                    else{
                        throw new Error('username alredy exists');
                    }
                 })
                          
    });
    if(schema.validate(req.body).error !==undefined){
        res.status(400).send(schema.validate(req.body).error.details[0].message);
        return
    }
    participants.push({name:participant,lastStatus:Date.now()});
    messages.push({
        from: participant,
        to:'Todos',
        text: 'entra na sala...',
        type: 'status',
        time: dayjs().format('HH:mm:ss') 
    });
    fs.writeFileSync('./data/participants.json', JSON.stringify( participants));
    fs.writeFileSync('./data/messages.json', JSON.stringify(messages));
    res.sendStatus(200);
});

app.get('/participants',(req,res)=>{
    res.send(participants);
});

app.post('/messages',(req,res)=>{
    
    const user = req.headers.user;
    const participantExist = participants.find(p=>user===p.name);
    const message = {
        to:stripHtml(req.body.to).result.trim(),
        text:stripHtml(req.body.text).result.trim(),
        type:stripHtml(req.body.type).result.trim(),
        time: dayjs().format('HH:mm:ss') ,
        from: participantExist && participantExist.name
    }
    const schema = Joi.object({
        from: Joi.string().required(),
        to: Joi.string().required().min(1),
        text:Joi.string().required().min(1),
        type:Joi.string().valid('message','private_message'),
        time: Joi.string()
    });
    
    if(schema.validate(message).error !== undefined){
        res.status(400).send(schema.validate(message).error.details[0].message)
        return
    }
    messages.push({
        from: stripHtml(message.from).result.trim(),
        to:stripHtml(message.to).result.trim(),
        text:stripHtml(message.text).result.trim(),
        type:stripHtml(message.type).result.trim(),
        time: dayjs().format('HH:mm:ss') 
    });
    fs.writeFileSync('./data/messages.json', JSON.stringify(messages));
    res.sendStatus(200);
});

app.get('/messages',(req,res)=>{
    if(req.query.limit===undefined){
        res.send(messages);
        return
    }
    const sentMessages=[];
    for(let i = (messages.length-1); sentMessages.length<req.query.limit && i>=0 ;i--){
        if( messages[i].to==='Todos'|| messages[i].to===req.headers.user || messages[i].from===req.headers.user || messages[i].type==='message'){
            sentMessages.push(messages[i]);
        }
    }
    sentMessages.reverse();
    res.send(sentMessages);
});

app.post('/status',(req,res)=>{
    const user = participants.findIndex(p=>req.headers.user===p.name)
    if(user===-1){
        res.sendStatus(400);
        return;
    }
    participants[user].lastStatus= Date.now();
    res.sendStatus(200);
})

app.listen(4000,()=>console.log("starting server"));
