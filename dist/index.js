"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const http_1 = require("http");
const socket_1 = require("./utils/socket");
const db_1 = require("./config/db");
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const planRoutes_1 = __importDefault(require("./routes/planRoutes"));
const uploadRoutes_1 = __importDefault(require("./routes/uploadRoutes"));
const currencyRoutes_1 = __importDefault(require("./routes/currencyRoutes"));
const settingRoutes_1 = __importDefault(require("./routes/settingRoutes"));
const reviewRoutes_1 = __importDefault(require("./routes/reviewRoutes"));
const adminNotificationTemplateRoutes_1 = __importDefault(require("./routes/adminNotificationTemplateRoutes"));
const adminEmailTemplateRoutes_1 = __importDefault(require("./routes/adminEmailTemplateRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
// Load configuration variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5002;
// Set up server middlewares
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Premium request logger middleware (Registered first to capture all paths)
app.use((req, res, next) => {
    const timestamp = new Date().toLocaleString();
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl || req.url}`);
    next();
});
// Register API Routes
app.use("/api/users", userRoutes_1.default);
app.use("/api/plans", planRoutes_1.default);
app.use("/api/upload", uploadRoutes_1.default);
app.use("/api/currencies", currencyRoutes_1.default);
app.use("/api/settings", settingRoutes_1.default);
app.use("/api/reviews", reviewRoutes_1.default);
app.use("/api/admin/notification-templates", adminNotificationTemplateRoutes_1.default);
app.use("/api/admin/email-templates", adminEmailTemplateRoutes_1.default);
app.use("/api/notifications", notificationRoutes_1.default);
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
// Create standard Node HTTP Server
const server = (0, http_1.createServer)(app);
// Initialize Socket.io Singleton
(0, socket_1.initSocket)(server);
// App Listener
server.listen(PORT, () => {
    console.log(`========================================`);
    console.log(` Oeelco Backend API initialized!`);
    console.log(` Status: ACTIVE`);
    console.log(` Port: ${PORT}`);
    console.log(` Environment: development`);
    console.log(` Health Gateway: http://localhost:${PORT}/api/health`);
    console.log(`========================================`);
});
