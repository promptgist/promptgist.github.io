'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import BubbleMenuExtension from '@tiptap/extension-bubble-menu';
import { Mark, mergeAttributes } from '@tiptap/core';
import './editor.css';
import { useEffect, useState, useCallback } from 'react';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Custom Comment Mark Extension
const CommentMark = Mark.create({
  name: 'comment',
  keepOnSplit: false,

  addAttributes() {
    return {
      text: {
        default: null,
      },
      timestamp: {
        default: null,
      }
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-comment]',
        getAttrs: (node) => ({
          text: (node as HTMLElement).getAttribute('data-comment'),
          timestamp: (node as HTMLElement).getAttribute('data-timestamp'),
        }),
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, {
      'data-comment': HTMLAttributes.text,
      'data-timestamp': HTMLAttributes.timestamp,
      class: 'comment-mark border-b-2 border-yellow-500 bg-yellow-100 cursor-pointer hover:bg-yellow-200 transition-colors'
    }), 0]
  },
});

type EditorProps = {
  docId?: string;
  onAddComment?: (text: string) => void;
};

const Tiptap = ({ docId, onAddComment }: EditorProps) => {
  const [content, setContent] = useState<string>(`<h1>Welcome to PromptGist</h1><p>Start typing your markdown here...</p>`);
  const [activeComment, setActiveComment] = useState<{ text: string, x: number, y: number } | null>(null);

  // Real-time sync with onSnapshot
  useEffect(() => {
    if (!docId) return;
    const docRef = doc(db, 'documents', docId);
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as any;
        if (data.content && data.content !== content) {
          setContent(data.content);
        }
      }
    });
    return () => unsubscribe();
  }, [docId]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight.configure({ multicolor: true }),
      BubbleMenuExtension,
      CommentMark,
    ],
    content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[500px]',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (docId) {
        const docRef = doc(db, 'documents', docId);
        updateDoc(docRef, { content: html, updatedAt: new Date() });
      }
    },
  });

  // Sync external content changes to editor
  useEffect(() => {
    if (editor && content && editor.getHTML() !== content) {
      const currentSelection = editor.state.selection;
      editor.commands.setContent(content);
      editor.commands.setTextSelection(currentSelection);
    }
  }, [content, editor]);

  // Handle clicks on comments to show tooltip
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('comment-mark')) {
        const text = target.getAttribute('data-comment');
        if (text) {
          const rect = target.getBoundingClientRect();
          setActiveComment({
            text,
            x: rect.left + window.scrollX,
            y: rect.bottom + window.scrollY + 5
          });
          return; // Don't clear if we clicked a comment
        }
      }
      // Clear if clicked elsewhere
      setActiveComment(null);
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleComment = () => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    if (from === to) return; // No selection

    const text = prompt("Enter your comment:");
    if (text) {
      editor.chain().focus().setMark('comment', { text, timestamp: Date.now() }).run();
      // We don't need onAddComment anymore as it's inline
    }
  };

  return (
    <div className="editor-container relative">
      {editor && (
        <BubbleMenu editor={editor}>
          <div className="bg-gray-800 text-white shadow-xl border border-gray-700 rounded-full px-3 py-1.5 flex items-center gap-1 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-1.5 rounded-full hover:bg-gray-700 transition-colors ${editor.isActive('bold') ? 'bg-gray-700 text-blue-400' : 'text-gray-200'}`}
              title="Bold"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8" /></svg>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-1.5 rounded-full hover:bg-gray-700 transition-colors ${editor.isActive('italic') ? 'bg-gray-700 text-blue-400' : 'text-gray-200'}`}
              title="Italic"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="4" x2="10" y2="4" /><line x1="14" y1="20" x2="5" y2="20" /><line x1="15" y1="4" x2="9" y2="20" /></svg>
            </button>

            <div className="w-px h-4 bg-gray-600 mx-1"></div>

            <button
              onClick={handleComment}
              className="flex items-center gap-1.5 px-2 py-1 rounded-full hover:bg-gray-700 transition-colors text-xs font-medium text-gray-200"
              title="Add Comment"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
              <span>Comment</span>
            </button>
          </div>
        </BubbleMenu>
      )}

      <EditorContent editor={editor} className="editor-content" />

      {/* Inline Comment Tooltip */}
      {activeComment && (
        <div
          className="fixed z-50 bg-white border border-gray-200 shadow-xl rounded-lg p-3 max-w-xs animate-in fade-in zoom-in-95 duration-200"
          style={{ left: activeComment.x, top: activeComment.y }}
        >
          <div className="text-sm text-gray-800">{activeComment.text}</div>
          <div className="text-xs text-gray-400 mt-1">Just now</div>
        </div>
      )}
    </div>
  );
};

export default Tiptap;
