'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import './editor.css';

const Tiptap = () => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
    ],
    content: `
      <h1>Welcome to PromptGist</h1>
      <p>Start typing your markdown here...</p>
      <h2>Features</h2>
      <ul>
        <li>Beautiful distraction-free editing</li>
        <li>Beautiful Typora-style editing</li>
        <li>WYSIWYG markdown rendering</li>
      </ul>
    `,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none',
      },
    },
  });

  return (
    <div className="editor-container">
      <EditorContent editor={editor} className="editor-content" />
    </div>
  );
};

export default Tiptap;
