"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notificationController_1 = require("../controllers/notificationController");
const router = (0, express_1.Router)();
router.get("/", notificationController_1.getNotifications);
router.patch("/:id/read", notificationController_1.markAsRead);
router.patch("/read-all", notificationController_1.markAllAsRead);
exports.default = router;
