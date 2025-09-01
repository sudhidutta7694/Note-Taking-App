'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Edit2, Trash2, Clock, MoreVertical, CheckSquare, Square } from 'lucide-react';
import { Note } from '@/types';

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void;
}

export default function NoteCard({ note, onEdit, onDelete }: NoteCardProps) {
  const [showActions, setShowActions] = useState(false);

  // ✅ Fix: Remove window.confirm and let parent handle confirmation
  const handleDelete = () => {
    setShowActions(false);
    onDelete(note.id); // Just call onDelete, no confirmation here
  };

  // ✅ Parse Editor.js content and render checkboxes
  const renderContent = (content: string) => {
    try {
      const parsed = JSON.parse(content);
      if (parsed.blocks && parsed.blocks.length > 0) {
        return parsed.blocks.slice(0, 3).map((block: any, index: number) => {
          switch (block.type) {
            case 'paragraph':
              return (
                <p key={index} className="text-gray-600 text-sm mb-2">
                  {block.data.text?.replace(/<[^>]*>/g, '') || ''}
                </p>
              );
            case 'header':
              return (
                <h4 key={index} className="text-gray-800 font-medium text-sm mb-2">
                  {block.data.text?.replace(/<[^>]*>/g, '') || ''}
                </h4>
              );
            case 'checklist':
              return (
                <div key={index} className="mb-2">
                  {block.data.items?.slice(0, 3).map((item: any, itemIndex: number) => (
                    <div key={itemIndex} className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      {item.checked ? (
                        <CheckSquare className="h-3 w-3 text-green-500 flex-shrink-0" />
                      ) : (
                        <Square className="h-3 w-3 text-gray-400 flex-shrink-0" />
                      )}
                      <span className={item.checked ? 'line-through text-gray-400' : ''}>
                        {item.text?.replace(/<[^>]*>/g, '') || ''}
                      </span>
                    </div>
                  ))}
                </div>
              );
            case 'list':
              return (
                <ul key={index} className="text-gray-600 text-sm mb-2 ml-4">
                  {block.data.items?.slice(0, 2).map((item: string, itemIndex: number) => (
                    <li key={itemIndex} className="list-disc">
                      {item?.replace(/<[^>]*>/g, '') || ''}
                    </li>
                  ))}
                </ul>
              );
            default:
              return null;
          }
        });
      }
    } catch {
      // Fallback for plain text content
      return (
        <p className="text-gray-600 text-sm">
          {content?.substring(0, 150) || 'No content'}
        </p>
      );
    }
    return <p className="text-gray-600 text-sm">No content</p>;
  };

  // ✅ Better date formatting
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const noteDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const diffTime = today.getTime() - noteDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer border border-gray-200 bg-white">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800 line-clamp-2 flex-1 mr-2">
            {note.title || 'Untitled Note'}
          </h3>
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowActions(!showActions)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto text-gray-500 hover:text-gray-700"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
            
            {showActions && (
              <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onEdit(note);
                    setShowActions(false);
                  }}
                  className="w-full justify-start text-left p-3 text-gray-700 hover:bg-gray-50"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete} // ✅ No window.confirm here
                  className="w-full justify-start text-left p-3 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* ✅ Content Preview with proper rendering */}
        <div className="mb-4 min-h-[60px]">
          {renderContent(note.content || '')}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            <span>{formatDate(note.updatedAt)}</span>
          </div>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(note)}
              className="h-7 w-7 p-0 text-gray-500 hover:text-blue-600"
            >
              <Edit2 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete} // ✅ No window.confirm here either
              className="h-7 w-7 p-0 text-gray-500 hover:text-red-600"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
