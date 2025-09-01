'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Plus, Search, Menu, X } from 'lucide-react';
import api from '@/lib/api';
import { Note } from '@/types';
import Image from 'next/image';

// Note components
import NoteEditor from '@/components/notes/NoteEditor';
import NotesGrid from '@/components/notes/NotesGrid';

// Custom Confirmation Dialog Component
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  loading = false
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {title}
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            {message}
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="px-4"
            >
              {cancelText}
            </Button>
            <Button
              onClick={onConfirm}
              disabled={loading}
              className="px-4 bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? 'Deleting...' : confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, logout, isLoading, isAuthenticated } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const router = useRouter();

  const fetchNotes = useCallback(async () => {
    try {
      const response = await api.get('/api/notes');
      const notesResponse = response as Note[];

      if (Array.isArray(notesResponse)) {
        setNotes(notesResponse.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
      } else {
        setNotes([]);
      }
    } catch (error: unknown) {
      console.error('Fetch notes error:', error);
      toast.error("Failed to fetch notes");
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (isAuthenticated) {
      fetchNotes();
    }
  }, [isLoading, isAuthenticated, router, fetchNotes]);

  const handleCreateNote = () => {
    setEditingNote(null);
    setShowEditor(true);
    setMobileMenuOpen(false);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setShowEditor(true);
  };

  const handleSaveNote = async (title: string, content: string) => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    setSaving(true);
    try {
      if (editingNote) {
        const response = await api.put(`/api/notes/${editingNote.id}`, {
          title,
          content,
        });
        const updatedNote = response as Note;
        setNotes(notes.map(note =>
          note.id === editingNote.id ? updatedNote : note
        ));
        toast.success("Note updated successfully");
      } else {
        const response = await api.post('/api/notes', {
          title,
          content,
        });
        const newNote = response as Note;
        setNotes([newNote, ...notes]);
        toast.success("Note created successfully");
      }

      setShowEditor(false);
      setEditingNote(null);
    } catch (error: unknown) {
      console.error('Save note error:', error);
      toast.error("Failed to save note");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    setDeleteNoteId(noteId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteNoteId) return;

    setDeleting(true);
    try {
      await api.delete(`/api/notes/${deleteNoteId}`);

      setNotes(prevNotes => prevNotes.filter(note => note.id !== deleteNoteId));
      toast.success("Note deleted successfully");

      setShowDeleteConfirm(false);
      setDeleteNoteId(null);

    } catch (error: unknown) {
      console.error('Delete note error:', error);

      if (error instanceof Error) {
        const errorMessage = error.message;

        if (errorMessage.includes('404')) {
          toast.error("Note not found - it may have already been deleted");
          setNotes(prevNotes => prevNotes.filter(note => note.id !== deleteNoteId));
        } else if (errorMessage.includes('401')) {
          toast.error("You don't have permission to delete this note");
        } else {
          toast.error("Failed to delete note");
        }
      } else {
        toast.error("Failed to delete note");
      }

      setShowDeleteConfirm(false);
      setDeleteNoteId(null);
    } finally {
      setDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteNoteId(null);
  };

  const handleCloseEditor = () => {
    setShowEditor(false);
    setEditingNote(null);
  };

  const handleSignOut = async () => {
    try {
      logout();
      toast.success("Signed out successfully");
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/auth/login');
    }
  };

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (note.content && note.content.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Loading notes...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ✅ Fixed Layout Structure with proper sticky positioning */}
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header - Sticky at top */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40 flex-shrink-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Mobile Header */}
            <div className="flex items-center justify-between h-16 sm:hidden">
              <div className="flex items-center gap-3">
                <Image
                  src="/logo-small.png"
                  alt="HD Logo"
                  width={32}
                  height={32}
                  className="rounded-lg"
                />
                <div>
                  <h1 className="text-lg font-bold text-gray-800">Dashboard</h1>
                  <p className="text-xs text-gray-600 truncate max-w-32">Hi, {user?.name?.split(' ')[0]}</p>
                </div>
              </div>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-gray-600 hover:text-gray-800"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>

            {/* Desktop Header */}
            <div className="hidden sm:flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <Image
                    src="/logo-small.png"
                    alt="HD Logo"
                    width={40}
                    height={40}
                    className="rounded-lg"
                  />
                  <div>
                    <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
                    <p className="text-sm text-gray-600">Welcome back, {user?.name}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={handleCreateNote}
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Note
                </Button>
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Sign Out
                </Button>
              </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
              <div className="sm:hidden border-t border-gray-200 py-4 space-y-3">
                <Button
                  onClick={handleCreateNote}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm justify-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Note
                </Button>
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 justify-center"
                >
                  Sign Out
                </Button>
              </div>
            )}
          </div>
        </header>

        {/* ✅ Search Section - Sticky below header */}
        <div className="bg-white border-b border-gray-100 sticky top-16 sm:top-16 z-30 flex-shrink-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-4 max-w-full sm:max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 text-base sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ✅ "Your Notes" Header - Sticky below search */}
        <div className="bg-gray-50 border-b border-gray-200 sticky top-32 sm:top-28 z-20 flex-shrink-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
              {searchTerm ? `Search Results (${filteredNotes.length})` : `Your Notes`}
            </h2>
          </div>
        </div>

        {/* ✅ Scrollable Content Area - Only this scrolls */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 overflow-auto">
          {/* ✅ Single Empty State - Removed duplicate */}
          {filteredNotes.length === 0 && !loading ? (
            <div className="text-center py-12 px-4">
              <div className="max-w-sm mx-auto">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  {searchTerm ? 'No notes found' : 'No notes yet'}
                </h3>
                <p className="text-gray-600 mb-6 text-sm">
                  {searchTerm
                    ? 'Try adjusting your search terms'
                    : 'Create your first note to get started'
                  }
                </p>
                {!searchTerm && (
                  <Button
                    onClick={handleCreateNote}
                    className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Note
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <NotesGrid
                notes={filteredNotes}
                onEdit={handleEditNote}
                onDelete={handleDeleteNote}
                loading={false}
              />

              {/* Bottom padding for mobile FAB */}
              <div className="h-20 sm:h-0"></div>
            </div>
          )}
        </main>

        {/* Floating Action Button - Mobile Only */}
        <div className="sm:hidden fixed bottom-6 right-4 z-50">
          <Button
            onClick={handleCreateNote}
            className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white shadow-lg rounded-full p-0 flex items-center justify-center"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Note Editor Modal */}
      <NoteEditor
        note={editingNote}
        isOpen={showEditor}
        onClose={handleCloseEditor}
        onSave={handleSaveNote}
        loading={saving}
      />

      {/* Custom Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Note"
        message="Are you sure you want to delete this note? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        loading={deleting}
      />
    </>
  );
}
