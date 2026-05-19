"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settingController_1 = require("../controllers/settingController");
const router = (0, express_1.Router)();
// Routes mapping for System Settings resource
router.get("/", settingController_1.getSettings);
router.put("/", settingController_1.updateSettings);
exports.default = router;
