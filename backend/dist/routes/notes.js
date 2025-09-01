"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notesController_1 = require("../controllers/notesController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateJWT);
router.use((req, res, next) => {
    console.log('🔍 Notes route - User:', req.user?.id);
    next();
});
router.get('/', notesController_1.getNotes);
router.post('/', validation_1.noteValidation, notesController_1.createNote);
router.put('/:id', validation_1.noteValidation, notesController_1.updateNote);
router.delete('/:id', notesController_1.deleteNote);
exports.default = router;
