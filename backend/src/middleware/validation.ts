import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation error',
      details: errors.array(),
    });
  }
  next();
};

export const registerValidation = [
  body('email').isEmail().withMessage('Invalid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('name').notEmpty().withMessage('Name is required'),
  handleValidationErrors,
];

export const loginValidation = [
  body('email').isEmail().withMessage('Invalid email address'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors,
];

export const otpValidation = [
  body('email').isEmail().withMessage('Invalid email address'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  handleValidationErrors,
];

export const noteValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required'),
  handleValidationErrors,
];
