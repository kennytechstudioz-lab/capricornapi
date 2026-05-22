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
const staffRoutes_1 = __importDefault(require("./routes/staffRoutes"));
const faqRoutes_1 = __importDefault(require("./routes/faqRoutes"));
const blogRoutes_1 = __importDefault(require("./routes/blogRoutes"));
const termRoutes_1 = __importDefault(require("./routes/termRoutes"));
const contactRoutes_1 = __importDefault(require("./routes/contactRoutes"));
const scheduler_1 = require("./utils/scheduler");
const seedData_1 = require("./utils/seedData");
// Load configuration variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5002;
// Set up server middlewares
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: "10mb" }));
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
app.use("/api/staff", staffRoutes_1.default);
app.use("/api/faqs", faqRoutes_1.default);
app.use("/api/blogs", blogRoutes_1.default);
app.use("/api/terms", termRoutes_1.default);
app.use("/api/contact", contactRoutes_1.default);
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
    console.log(` Capricorn Energy Ltd Backend API initialized!`);
    console.log(` Status: ACTIVE`);
    console.log(` Port: ${PORT}`);
    console.log(` Environment: development`);
    console.log(` Health Gateway: http://localhost:${PORT}/api/health`);
    console.log(`========================================`);
    // Start the Active Deposit scheduler after database and server are live
    (0, scheduler_1.startActiveDepositScheduler)();
    // Seed default notification templates and terms/policy content
    (0, seedData_1.seedNotificationTemplates)().catch((e) => console.error("[Seed] Notification templates error:", e));
    (0, seedData_1.seedTermsAndPolicy)().catch((e) => console.error("[Seed] Terms & Policy error:", e));
    (0, seedData_1.seedEmailTemplates)().catch((e) => console.error("[Seed] Email templates error:", e));
    (0, seedData_1.seedProjectBlogs)().catch((e) => console.error("[Seed] Project blogs error:", e));
    (0, seedData_1.seedReviews)().catch((e) => console.error("[Seed] Reviews error:", e));
    (0, seedData_1.seedExecutiveStaff)().catch((e) => console.error("[Seed] Executive staff error:", e));
});
