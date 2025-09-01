"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOTPEmail = exports.generateOTP = void 0;
const otp_generator_1 = __importDefault(require("otp-generator"));
const email_1 = require("./email");
Object.defineProperty(exports, "sendOTPEmail", { enumerable: true, get: function () { return email_1.sendOTPEmail; } });
const generateOTP = () => {
    return otp_generator_1.default.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
    });
};
exports.generateOTP = generateOTP;
