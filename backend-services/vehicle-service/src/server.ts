import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createLogger, format, transports } from 'winston';

const app = express();
const PORT = process.env.PORT || 3001;
const logger = createLogger({level:'info',format:format.combine(format.timestamp(),format.json()),transports:[new transports.Console({format:format.simple()})]});

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health',(req,res)=>res.json({status:'healthy',service:'vehicle-service',timestamp:new Date().toISOString()}));
app.get('/',(req,res)=>res.json({service:'vehicle-service',version:'1.0.0',status:'running'}));
app.get('/vehicles',(req,res)=>res.json({vehicles:[]}));
app.post('/vehicles',(req,res)=>res.status(201).json({id:'123',message:'Vehicle registered'}));

app.listen(PORT,()=>logger.info(`Vehicle service started on port ${PORT}`));