'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import BubbleMenuExtension from '@tiptap/extension-bubble-menu';
import { Mark, mergeAttributes } from '@tiptap/core';
import './editor.css';
import { useEffect, useState } from 'react';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from 'firebase/auth';

interface CommentMessage {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  timestamp: number;
}

// Custom Comment Mark Extension
const CommentMark = Mark.create({
  name: 'comment',
  keepOnSplit: false,

  addAttributes() {
    return {
      conversation: {
        default: '[]',
        parseHTML: (element) => element.getAttribute('data-conversation'),
        renderHTML: (attributes) => {
          return {
            'data-conversation': attributes.conversation,
          }
        },
      },
      // Keep old attributes for backward compatibility if needed, but we'll focus on conversation
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-conversation]',
      },
      // Fallback for old comments
      {
        tag: 'span[data-comment]',
        getAttrs: (node) => {
          const text = (node as HTMLElement).getAttribute('data-comment');
          const timestamp = (node as HTMLElement).getAttribute('data-timestamp');
          if (text) {
            const msg: CommentMessage = {
              id: Date.now().toString(),
              text,
              authorId: 'unknown',
              authorName: 'Anonymous',
              timestamp: Number(timestamp) || Date.now()
            };
            return { conversation: JSON.stringify([msg]) };
          }
          return null;
        }
      }
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, {
      class: 'comment-mark border-b-2 border-yellow-500 bg-yellow-100 cursor-pointer hover:bg-yellow-200 transition-colors'
    }), 0]
  },
});

type EditorProps = {
  docId?: string;
  currentUser?: User | null;
  onAddComment?: (text: string) => void;
};

const Tiptap = ({ docId, currentUser, onAddComment }: EditorProps) => {
  const [content, setContent] = useState<string>(
    docId ? '' : `<h1>Welcome to PromptGist</h1><p>Start typing your markdown here...</p>`
  );
  const [activeComment, setActiveComment] = useState<{ conversation: CommentMessage[], x: number, y: number } | null>(null);
  const [isCommenting, setIsCommenting] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyText, setReplyText] = useState('');

  // Real-time sync with onSnapshot
  useEffect(() => {
    if (!docId) return;
    const docRef = doc(db, 'documents', docId);
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as any;
        // Check if content exists (even if empty string) and is different
        if (data.content !== undefined && data.content !== content) {
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
    if (editor && editor.getHTML() !== content) {
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
        const conversationJson = target.getAttribute('data-conversation');
        if (conversationJson) {
          try {
            const conversation = JSON.parse(conversationJson);
            const rect = target.getBoundingClientRect();
            setActiveComment({
              conversation,
              x: rect.left + window.scrollX,
              y: rect.bottom + window.scrollY + 5
            });
            return;
          } catch (e) {
            console.error("Failed to parse comment conversation", e);
          }
        }
      }
      // Clear if clicked elsewhere
      setActiveComment(null);
      setReplyText('');
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleCommentClick = () => {
    setIsCommenting(true);
  };

  const submitComment = () => {
    if (!editor) return;
    if (commentText.trim()) {
      const newMessage: CommentMessage = {
        id: Date.now().toString(),
        text: commentText,
        authorId: currentUser?.uid || 'anonymous',
        authorName: currentUser?.displayName || 'Anonymous',
        timestamp: Date.now()
      };
      const conversation = [newMessage];
      editor.chain().focus().setMark('comment', { conversation: JSON.stringify(conversation) }).run();
    }
    setIsCommenting(false);
    setCommentText('');
  };

  const cancelComment = () => {
    setIsCommenting(false);
    setCommentText('');
  };

  const submitReply = () => {
    if (!editor || !activeComment || !replyText.trim()) return;

    const newMessage: CommentMessage = {
      id: Date.now().toString(),
      text: replyText,
      authorId: currentUser?.uid || 'anonymous',
      authorName: currentUser?.displayName || 'Anonymous',
      timestamp: Date.now()
    };

    const updatedConversation = [...activeComment.conversation, newMessage];
    const json = JSON.stringify(updatedConversation);

    // Update the mark attributes
    // We need to find the mark at the current selection or where the click happened.
    // Since we don't have the exact pos from the click easily, we rely on the fact that the user likely clicked the mark.
    // However, Tiptap commands work on selection.
    // Ideally, we should select the mark range.
    // For now, let's assume the user clicked the mark, so we might need to set selection to it?
    // Actually, updateAttributes works on selection.
    // A simple hack: The user clicked the mark, so the caret might be inside it?
    // If not, we can't easily update it without pos.
    // BUT, since we are in a popover, we can assume the user might have selected the text or clicked it.
    // If they just clicked, the selection is collapsed inside the mark.

    // Let's try to update attributes at the current selection.
    editor.chain().focus().extendMarkRange('comment').updateAttributes('comment', { conversation: json }).run();

    // Update local state to show new message immediately
    setActiveComment({ ...activeComment, conversation: updatedConversation });
    setReplyText('');
  };

  const deleteConversation = () => {
    editor?.chain().focus().unsetMark('comment').run();
    setActiveComment(null);
  };

  return (
    <div className="editor-container relative">
      {editor && (
        <BubbleMenu editor={editor}>
          <div className="bg-gray-800 text-white shadow-xl border border-gray-700 rounded-2xl px-3 py-1.5 flex items-center gap-1 animate-in fade-in zoom-in-95 duration-200">
            {!isCommenting ? (
              <>
                <button
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  className={`p-1.5 rounded-xl hover:bg-gray-700 transition-colors ${editor.isActive('bold') ? 'bg-gray-700 text-blue-400' : 'text-gray-200'}`}
                  title="Bold"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8" /></svg>
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  className={`p-1.5 rounded-xl hover:bg-gray-700 transition-colors ${editor.isActive('italic') ? 'bg-gray-700 text-blue-400' : 'text-gray-200'}`}
                  title="Italic"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="4" x2="10" y2="4" /><line x1="14" y1="20" x2="5" y2="20" /><line x1="15" y1="4" x2="9" y2="20" /></svg>
                </button>

                <div className="w-px h-4 bg-gray-600 mx-1"></div>

                <button
                  onClick={handleCommentClick}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-xl hover:bg-gray-700 transition-colors text-xs font-medium text-gray-200"
                  title="Add Comment"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                  <span>Comment</span>
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 p-2 bg-gray-800 rounded-2xl min-w-[250px]">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Type your comment..."
                  className="bg-gray-700 text-white text-sm rounded-xl p-2 outline-none border border-gray-600 focus:border-blue-500 w-full resize-none"
                  rows={3}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      submitComment();
                    }
                    if (e.key === 'Escape') cancelComment();
                  }}
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={cancelComment}
                    className="px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitComment}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg transition-colors font-medium"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>
        </BubbleMenu>
      )}

      <EditorContent editor={editor} className="editor-content" />

      {/* Interactive Comment Popover */}
      {activeComment && (
        <div
          className="fixed z-50 bg-white border border-gray-200 shadow-xl rounded-lg p-4 max-w-sm w-80 animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-3"
          style={{ left: activeComment.x, top: activeComment.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="max-h-60 overflow-y-auto flex flex-col gap-3">
            {activeComment.conversation.map((msg) => (
              <div key={msg.id} className="flex flex-col gap-1">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-semibold text-gray-700">{msg.authorName}</span>
                  <span className="text-[10px] text-gray-400">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed bg-gray-50 p-2 rounded-md border border-gray-100">
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Reply..."
              className="text-sm border border-gray-300 rounded-md p-2 w-full resize-none focus:outline-none focus:border-blue-500"
              rows={2}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submitReply();
                }
              }}
            />
            <div className="flex justify-between items-center">
              <button
                onClick={deleteConversation}
                className="text-red-500 hover:text-red-600 text-xs flex items-center gap-1 transition-colors"
                title="Delete Thread"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                Delete
              </button>
              <button
                onClick={submitReply}
                disabled={!replyText.trim()}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs rounded-md transition-colors font-medium"
              >
                Reply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tiptap;
