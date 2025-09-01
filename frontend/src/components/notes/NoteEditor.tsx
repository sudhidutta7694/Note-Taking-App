'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Save, Loader2 } from 'lucide-react';
import { Note } from '@/types';

// Dynamic import for Editor.js to avoid SSR issues
let EditorJS: unknown = null;
if (typeof window !== 'undefined') {
  import('@editorjs/editorjs').then((module) => {
    EditorJS = module.default;
  });
}

interface NoteEditorProps {
  note?: Note | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, content: any) => void;
  loading?: boolean;
}

export default function NoteEditor({ note, isOpen, onClose, onSave, loading = false }: NoteEditorProps) {
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const editorRef = useRef<any>(null);
  const editorInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
    } else {
      setTitle('');
    }
  }, [note]);

  useEffect(() => {
    if (isOpen && EditorJS && editorRef.current) {
      // Initialize Editor.js
      editorInstanceRef.current = new EditorJS({
        holder: editorRef.current,
        placeholder: 'Start writing your note...',
        data: note?.content ? JSON.parse(note.content) : undefined,
        tools: {
          header: {
            class: require('@editorjs/header'),
            config: {
              placeholder: 'Enter a header',
              levels: [2, 3, 4],
              defaultLevel: 3
            }
          },
          list: {
            class: require('@editorjs/list'),
            inlineToolbar: true,
          },
          quote: {
            class: require('@editorjs/quote'),
            inlineToolbar: true,
            shortcut: 'CMD+SHIFT+O',
            config: {
              quotePlaceholder: 'Enter a quote',
              captionPlaceholder: 'Quote\'s author',
            },
          }
        },
        minHeight: 200,
      });
    }

    return () => {
      if (editorInstanceRef.current && editorInstanceRef.current.destroy) {
        editorInstanceRef.current.destroy();
        editorInstanceRef.current = null;
      }
    };
  }, [isOpen, note]);

  const handleSave = async () => {
    if (!title.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      if (editorInstanceRef.current) {
        const outputData = await editorInstanceRef.current.save();
        onSave(title, JSON.stringify(outputData));
      }
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    if (editorInstanceRef.current && editorInstanceRef.current.destroy) {
      editorInstanceRef.current.destroy();
      editorInstanceRef.current = null;
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {note ? 'Edit Note' : 'Create New Note'}
          </h2>
          <Button
            onClick={handleClose}
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Title Input */}
          <Input
            placeholder="Enter note title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-medium text-gray-800 border-none px-0 mb-6 focus:ring-0 focus:outline-none placeholder:text-gray-400"
          />

          {/* Editor */}
          <div className="prose prose-sm max-w-none">
            <div
              ref={editorRef}
              className="min-h-[200px] text-gray-800 focus:outline-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <Button
            onClick={handleClose}
            variant="outline"
            className="text-gray-600"
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title.trim() || isSaving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {note ? 'Update Note' : 'Create Note'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
