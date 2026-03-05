import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createLogger, format, transports } from 'winston';

const app = express();
const PORT = process.env.PORT || 3002;
const logger = createLogger({level:'info',format:format.combine(format.timestamp(),format.json()),transports:[new transports.Console({format:format.simple()})]});

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health',(req,res)=>res.json({status:'healthy',service:'sensor-data-service',timestamp:new Date().toISOString()}));
app.get('/',(req,res)=>res.json({service:'sensor-data-service',version:'1.0.0',status:'running'}));
app.post('/sensor-data',(req,res)=>res.status(201).json({message:'Data received'}));
app.get('/sensor-data/:vehicleId',(req,res)=>res.json({data:[]}));

app.listen(PORT,()=>logger.info(`Sensor data service started on port ${PORT}`));