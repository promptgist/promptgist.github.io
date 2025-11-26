'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import BubbleMenuExtension from '@tiptap/extension-bubble-menu';
import './editor.css';
import { useEffect, useState } from 'react';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type EditorProps = {
  docId?: string;
  onAddComment?: (text: string) => void;
};

const Tiptap = ({ docId, onAddComment }: EditorProps) => {
  const [content, setContent] = useState<string>(`<h1>Welcome to PromptGist</h1><p>Start typing your markdown here...</p>`);

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
    ],
    content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none',
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

  const handleComment = () => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to);
    if (text && onAddComment) {
      editor.chain().focus().toggleHighlight().run();
      onAddComment(text);
    }
  };

  return (
    <div className="editor-container relative">
      {editor && (
        <BubbleMenu editor={editor}>
          <div className="bg-white shadow-lg border rounded-lg overflow-hidden flex">
            <button
              onClick={handleComment}
              className="px-3 py-1.5 text-sm font-medium hover:bg-gray-100 text-gray-700 flex items-center gap-1"
            >
              <span>💬</span> Comment
            </button>
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`px-3 py-1.5 text-sm font-medium hover:bg-gray-100 ${editor.isActive('bold') ? 'bg-gray-100 text-black' : 'text-gray-600'}`}
            >
              B
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`px-3 py-1.5 text-sm font-medium hover:bg-gray-100 ${editor.isActive('italic') ? 'bg-gray-100 text-black' : 'text-gray-600'}`}
            >
              I
            </button>
          </div>
        </BubbleMenu>
      )}
      <EditorContent editor={editor} className="editor-content" />
    </div>
  );
};

export default Tiptap;
