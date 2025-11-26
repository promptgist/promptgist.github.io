import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

interface Comment {
    id: string;
    content: string;
    selectedText?: string;
    createdAt: any;
    authorName: string;
    resolved: boolean;
}

interface CommentsProps {
    docId: string;
}

const Comments: React.FC<CommentsProps> = ({ docId }) => {
    const { user } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');

    useEffect(() => {
        const commentsRef = collection(db, 'documents', docId, 'comments');
        const q = query(commentsRef, orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list: Comment[] = [];
            snapshot.forEach((snap) => {
                const data = snap.data() as any;
                list.push({
                    id: snap.id,
                    content: data.content,
                    selectedText: data.selectedText,
                    createdAt: data.createdAt,
                    authorName: data.authorName || 'Anonymous',
                    resolved: data.resolved || false,
                });
            });
            setComments(list);
        });
        return () => unsubscribe();
    }, [docId]);

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        await addDoc(collection(db, 'documents', docId, 'comments'), {
            content: newComment,
            createdAt: new Date(),
            authorName: user?.displayName || user?.email || 'Anonymous',
            resolved: false,
            // We'll add selectedText integration later via props if needed
        });
        setNewComment('');
    };

    const toggleResolve = async (commentId: string, currentStatus: boolean) => {
        const commentRef = doc(db, 'documents', docId, 'comments', commentId);
        await updateDoc(commentRef, { resolved: !currentStatus });
    };

    return (
        <div className="flex flex-col h-full">
            <h3 className="font-semibold text-lg mb-4">Comments</h3>

            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {comments.length === 0 && <p className="text-gray-500 text-sm">No comments yet.</p>}
                {comments.map((comment) => (
                    <div key={comment.id} className={`p-3 rounded border ${comment.resolved ? 'bg-gray-100 opacity-60' : 'bg-white border-gray-200 shadow-sm'}`}>
                        <div className="flex justify-between items-start mb-1">
                            <span className="font-medium text-sm">{comment.authorName}</span>
                            <span className="text-xs text-gray-500">{comment.createdAt?.toDate?.().toLocaleDateString()}</span>
                        </div>
                        {comment.selectedText && (
                            <div className="text-xs text-gray-500 border-l-2 border-blue-300 pl-2 mb-2 italic">
                                "{comment.selectedText}"
                            </div>
                        )}
                        <p className="text-sm text-gray-800 mb-2">{comment.content}</p>
                        <button
                            onClick={() => toggleResolve(comment.id, comment.resolved)}
                            className="text-xs text-blue-500 hover:underline"
                        >
                            {comment.resolved ? 'Unresolve' : 'Resolve'}
                        </button>
                    </div>
                ))}
            </div>

            <div className="mt-auto">
                <textarea
                    className="w-full border rounded p-2 text-sm mb-2"
                    placeholder="Write a comment..."
                    rows={3}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                />
                <button
                    onClick={handleAddComment}
                    className="w-full bg-blue-600 text-white py-1.5 rounded text-sm font-medium hover:bg-blue-700"
                >
                    Post Comment
                </button>
            </div>
        </div>
    );
};

export default Comments;
