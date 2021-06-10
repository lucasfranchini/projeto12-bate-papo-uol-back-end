import express from "express";
import cors from "cors";
import dayjs from "dayjs";

const app = express();
app.use(cors());
app.use(express.json());

const participants = [];
const messages = [];

app.post('/participants',(req,res)=>{
    const participant = req.body.name;
    if(participant === ""){
        res.sendStatus(400);
        return
    }
    participants.push({name:participant,lastStatus:Date.now()});
    messages.push({
        from: participant,
        to:'todos',
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
        if( messages[i].to==='todos'|| messages[i].to===req.headers.user || messages[i].from===req.headers.user){
            sentMessages.push(messages[i]);
        }
    }
    sentMessages.reverse();
    res.send(sentMessages);
});

app.listen(4000,()=>console.log("starting server"));
