"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveBufferToUploads = exports.deleteLocalFile = exports.deleteFromS3 = exports.uploadToS3 = exports.UPLOAD_DIR = void 0;
var s3Upload_1 = require("./s3Upload");
Object.defineProperty(exports, "UPLOAD_DIR", { enumerable: true, get: function () { return s3Upload_1.UPLOAD_DIR; } });
Object.defineProperty(exports, "uploadToS3", { enumerable: true, get: function () { return s3Upload_1.uploadToS3; } });
Object.defineProperty(exports, "deleteFromS3", { enumerable: true, get: function () { return s3Upload_1.deleteFromS3; } });
Object.defineProperty(exports, "deleteLocalFile", { enumerable: true, get: function () { return s3Upload_1.deleteLocalFile; } });
Object.defineProperty(exports, "saveBufferToUploads", { enumerable: true, get: function () { return s3Upload_1.saveBufferToUploads; } });
