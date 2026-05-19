"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const templateController_1 = require("../controllers/templateController");
const router = (0, express_1.Router)();
// Routes mapping for Email Templates resource
router.post("/", templateController_1.createEmailTemplate);
router.get("/", templateController_1.getEmailTemplates);
router.patch("/:id", templateController_1.updateEmailTemplate);
router.delete("/:id", templateController_1.deleteEmailTemplate);
exports.default = router;
