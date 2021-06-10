import express from "express";
import cors from "cors";
import dayjs from "dayjs";

const app = express();
app.use(cors());
app.use(express.json());

let participants = [];
const messages = [];

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
                time: now
            })
        }
    });
    participants=newparticpants;
},15000)

app.post('/participants',(req,res)=>{
    const participant = req.body.name;
    if(participant === ""){
        res.sendStatus(400);
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
    res.sendStatus(200);
});

app.get('/participants',(req,res)=>{
    res.send(participants);
});

app.post('/messages',(req,res)=>{
    const {to,text,type} = req.body;
    const user = req.headers.user;
    const participantExist = participants.find(p=>user===p.name);
    if(to==="" || text==="" || ( type !== 'message' && type !== 'private_message') || participantExist === undefined){
        res.sendStatus(400);
        return
    }
    messages.push({
        from: user,
        to,text,type,
        time: dayjs().format('HH:mm:ss') 
    });
    res.sendStatus(200);
});

app.get('/messages',(req,res)=>{
    if(req.query.limit===undefined){
        res.send(messages);
        return
    }
    const sentMessages=[];
    for(let i = (messages.length-1);sentMessages.length<req.query.limit&&i>=0;i--){
        if( messages[i].to==='Todos'|| messages[i].to===req.headers.user || messages[i].from===req.headers.user){
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
