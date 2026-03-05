import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createLogger, format, transports } from 'winston';

const app = express();
const PORT = process.env.PORT || 3004;
const logger = createLogger({level:'info',format:format.combine(format.timestamp(),format.json()),transports:[new transports.Console({format:format.simple()})]});

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health',(req,res)=>res.json({status:'healthy',service:'alert-service',timestamp:new Date().toISOString()}));
app.get('/',(req,res)=>res.json({service:'alert-service',version:'1.0.0',status:'running'}));
app.get('/alerts/:userId',(req,res)=>res.json({alerts:[]}));
app.post('/alerts',(req,res)=>res.status(201).json({id:'alert-123',message:'Alert created'}));

app.listen(PORT,()=>logger.info(`Alert service started on port ${PORT}`));