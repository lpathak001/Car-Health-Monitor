import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createLogger, format, transports } from 'winston';

const app = express();
const PORT = process.env.PORT || 3003;
const logger = createLogger({level:'info',format:format.combine(format.timestamp(),format.json()),transports:[new transports.Console({format:format.simple()})]});

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health',(req,res)=>res.json({status:'healthy',service:'health-analysis-service',timestamp:new Date().toISOString()}));
app.get('/',(req,res)=>res.json({service:'health-analysis-service',version:'1.0.0',status:'running'}));
app.get('/health-score/:vehicleId',(req,res)=>res.json({score:85,status:'good'}));
app.post('/analyze',(req,res)=>res.json({analysis:'completed',anomalies:[]}));

app.listen(PORT,()=>logger.info(`Health analysis service started on port ${PORT}`));