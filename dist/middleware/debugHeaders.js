"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.debugHeaders = void 0;
const debugHeaders = (req, res, next) => {
    console.log('🔍 Request Headers Debug:');
    console.log('Authorization:', req.headers.authorization);
    console.log('All headers:', JSON.stringify(req.headers, null, 2));
    next();
};
exports.debugHeaders = debugHeaders;
