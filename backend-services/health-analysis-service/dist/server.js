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
const PORT = process.env.PORT || 3003;
const logger = (0, winston_1.createLogger)({ level: 'info', format: winston_1.format.combine(winston_1.format.timestamp(), winston_1.format.json()), transports: [new winston_1.transports.Console({ format: winston_1.format.simple() })] });
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'health-analysis-service', timestamp: new Date().toISOString() }));
app.get('/', (req, res) => res.json({ service: 'health-analysis-service', version: '1.0.0', status: 'running' }));
app.get('/health-score/:vehicleId', (req, res) => res.json({ score: 85, status: 'good' }));
app.post('/analyze', (req, res) => res.json({ analysis: 'completed', anomalies: [] }));
app.listen(PORT, () => logger.info(`Health analysis service started on port ${PORT}`));
//# sourceMappingURL=server.js.map