"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Staff = void 0;
const mongoose_1 = require("mongoose");
const StaffSchema = new mongoose_1.Schema({
    name: { type: String, required: [true, "Name is required."], trim: true },
    position: { type: String, required: [true, "Position is required."], trim: true },
    description: { type: String, required: [true, "Description is required."], trim: true },
    picture: { type: String, default: "" },
}, { timestamps: true });
exports.Staff = (0, mongoose_1.model)("Staff", StaffSchema);
exports.default = exports.Staff;
