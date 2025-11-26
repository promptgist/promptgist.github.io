'use client';

import React, { useEffect, useState } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface DocumentHeaderProps {
    docId: string;
}

const DocumentHeader: React.FC<DocumentHeaderProps> = ({ docId }) => {
    const [title, setTitle] = useState('Untitled');
    const [isPublic, setIsPublic] = useState(false);
    const [showShare, setShowShare] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const docRef = doc(db, 'documents', docId);
        const unsubscribe = onSnapshot(docRef, (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                setTitle(data.title || 'Untitled');
                setIsPublic(data.isPublic || false);
            }
        });
        return () => unsubscribe();
    }, [docId]);

    const handleTitleChange = async (newTitle: string) => {
        setTitle(newTitle);
        const docRef = doc(db, 'documents', docId);
        await updateDoc(docRef, { title: newTitle });
    };

    const toggleShare = async () => {
        const docRef = doc(db, 'documents', docId);
        await updateDoc(docRef, { isPublic: !isPublic });
    };

    const copyLink = () => {
        const url = `${window.location.origin}/?docId=${docId}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex justify-between items-center p-4 border-b bg-white">
            <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="text-xl font-bold focus:outline-none focus:border-b-2 border-blue-500 bg-transparent"
                placeholder="Untitled Document"
            />

            <div className="relative">
                <button
                    onClick={() => setShowShare(!showShare)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                    Share
                </button>

                {showShare && (
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border p-4 z-50">
                        <h3 className="font-semibold mb-2">Share Document</h3>

                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm text-gray-700">Public Access</span>
                            <button
                                onClick={toggleShare}
                                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${isPublic ? 'bg-green-500' : 'bg-gray-300'
                                    }`}
                            >
                                <div
                                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${isPublic ? 'translate-x-5' : ''
                                        }`}
                                />
                            </button>
                        </div>

                        {isPublic && (
                            <div className="flex gap-2">
                                <input
                                    readOnly
                                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/?docId=${docId}`}
                                    className="flex-1 text-xs border rounded p-2 bg-gray-50 text-gray-600"
                                />
                                <button
                                    onClick={copyLink}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-xs font-medium"
                                >
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                        )}

                        {!isPublic && (
                            <p className="text-xs text-gray-500">
                                Only you can view this document. Turn on Public Access to share.
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DocumentHeader;
