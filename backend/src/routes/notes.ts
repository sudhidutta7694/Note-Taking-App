import { Router } from 'express';
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
} from '../controllers/notesController';
import { authenticateJWT } from '../middleware/auth';
import { noteValidation } from '../middleware/validation';
import { AuthRequest } from '../types';

const router = Router();


router.use(authenticateJWT);

router.use((req: AuthRequest, res, next) => {
  console.log('🔍 Notes route - User:', req.user?.id);
  next();
});


router.get('/', getNotes);
router.post('/', noteValidation, createNote);
router.put('/:id', noteValidation, updateNote);
router.delete('/:id', deleteNote);

export default router;
