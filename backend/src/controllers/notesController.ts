import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';

interface NoteData {
  title: string;
  content: string;
}

// Get all notes for authenticated user
export const getNotes = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    
    console.log('🔍 getNotes - req.user:', req.user);
    console.log('🔍 getNotes - userId:', userId);
    
    if (!userId) {
      console.error('❌ getNotes - No userId found in req.user');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const notes = await prisma.note.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    console.log('✅ getNotes - Found notes:', notes.length);
    res.json(notes);
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
};

// Create new note
export const createNote = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { title, content }: NoteData = req.body;
    
    console.log('🔍 createNote - User ID:', userId);
    console.log('🔍 createNote - Data:', { title, content });
    
    if (!userId) {
      console.error('❌ createNote - No userId found in req.user');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const note = await prisma.note.create({
      data: {
        title: title.trim(),
        content: content || '',
        userId,
      },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    console.log('✅ createNote - Note created:', note.id);
    res.status(201).json(note);
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
};

// Update note
export const updateNote = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { id } = req.params;
    const { title, content }: NoteData = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Verify note belongs to user
    const existingNote = await prisma.note.findFirst({
      where: { id, userId }
    });

    if (!existingNote) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const note = await prisma.note.update({
      where: { id },
      data: { 
        title: title.trim(), 
        content: content || '' 
      },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    res.json(note);
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
};

// Delete note
export const deleteNote = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { id } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Verify note belongs to user
    const existingNote = await prisma.note.findFirst({
      where: { id, userId }
    });

    if (!existingNote) {
      return res.status(404).json({ error: 'Note not found' });
    }

    await prisma.note.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
};
