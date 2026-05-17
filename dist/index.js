"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const db_1 = require("./config/db");
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
// Load configuration variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5002;
// Set up server middlewares
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Register API Routes
app.use("/api/users", userRoutes_1.default);
// Premium request logger middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
    next();
});
// Database connection initialization
(0, db_1.connectDatabase)();
// API Health Check Endpoint
app.get("/api/health", (req, res) => {
    const dbState = mongoose_1.default.connection.readyState;
    let dbStatusStr = "unknown";
    switch (dbState) {
        case 0:
            dbStatusStr = "disconnected";
            break;
        case 1:
            dbStatusStr = "connected";
            break;
        case 2:
            dbStatusStr = "connecting";
            break;
        case 3:
            dbStatusStr = "disconnecting";
            break;
    }
    res.status(200).json({
        status: "healthy",
        uptime: process.uptime(),
        database: {
            state: dbState,
            status: dbStatusStr,
        },
        timestamp: new Date().toISOString(),
    });
});
// App Listener
app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(` Oeelco Backend API initialized!`);
    console.log(` Status: ACTIVE`);
    console.log(` Port: ${PORT}`);
    console.log(` Environment: development`);
    console.log(` Health Gateway: http://localhost:${PORT}/api/health`);
    console.log(`========================================`);
});
