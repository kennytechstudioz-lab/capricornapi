"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const templateController_1 = require("../controllers/templateController");
const router = (0, express_1.Router)();
// Routes mapping for Notification Templates resource
router.post("/", templateController_1.createNotificationTemplate);
router.get("/", templateController_1.getNotificationTemplates);
router.patch("/:id", templateController_1.updateNotificationTemplate);
router.delete("/:id", templateController_1.deleteNotificationTemplate);
exports.default = router;
