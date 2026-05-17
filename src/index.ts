import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDatabase } from "./config/db";
import userRoutes from "./routes/userRoutes";

// Load configuration variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;

// Set up server middlewares
app.use(cors());
app.use(express.json());

// Register API Routes
app.use("/api/users", userRoutes);

// Premium request logger middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// Database connection initialization
connectDatabase();

// API Health Check Endpoint
app.get("/api/health", (req, res) => {
  const dbState = mongoose.connection.readyState;
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
