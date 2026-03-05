"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const winston_1 = require("winston");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3002;
const logger = (0, winston_1.createLogger)({ level: 'info', format: winston_1.format.combine(winston_1.format.timestamp(), winston_1.format.json()), transports: [new winston_1.transports.Console({ format: winston_1.format.simple() })] });
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'sensor-data-service', timestamp: new Date().toISOString() }));
app.get('/', (req, res) => res.json({ service: 'sensor-data-service', version: '1.0.0', status: 'running' }));
app.post('/sensor-data', (req, res) => res.status(201).json({ message: 'Data received' }));
app.get('/sensor-data/:vehicleId', (req, res) => res.json({ data: [] }));
app.listen(PORT, () => logger.info(`Sensor data service started on port ${PORT}`));
//# sourceMappingURL=server.js.map