'use client';

import React, { useEffect, useState } from 'react';
import { doc, onSnapshot, updateDoc, collection, addDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface DocumentHeaderProps {
    docId: string;
    onToggleHistory: () => void;
}

const DocumentHeader: React.FC<DocumentHeaderProps> = ({ docId, onToggleHistory }) => {
    const [title, setTitle] = useState('Untitled');
    const [isPublic, setIsPublic] = useState(false);
    const [showShare, setShowShare] = useState(false);
    const [showCommit, setShowCommit] = useState(false);
    const [commitMessage, setCommitMessage] = useState('');
    const [copied, setCopied] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    useEffect(() => {
        const docRef = doc(db, 'documents', docId);
        const unsubscribe = onSnapshot(docRef, (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                setTitle(data.title || 'Untitled');
                setIsPublic(data.isPublic || false);
                if (data.updatedAt) {
                    setLastSaved(data.updatedAt.toDate());
                }
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

    const handleCommit = async () => {
        if (!commitMessage.trim()) return;
        setIsSaving(true);
        try {
            const docRef = doc(db, 'documents', docId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                await addDoc(collection(db, 'documents', docId, 'versions'), {
                    content: data.content,
                    createdAt: new Date(),
                    name: commitMessage
                });
                setCommitMessage('');
                setShowCommit(false);
            }
        } catch (error) {
            console.error("Error committing version:", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex justify-between items-center p-4 border-b bg-white">
            <div className="flex items-center gap-4">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="text-xl font-bold focus:outline-none focus:border-b-2 border-blue-500 bg-transparent"
                    placeholder="Untitled Document"
                />
                <span className="text-xs text-gray-400">
                    {lastSaved ? 'Saved' : 'Unsaved'}
                </span>
            </div>

            <div className="flex gap-2 relative">
                <button
                    onClick={onToggleHistory}
                    className="text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
                    title="Version History"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </button>

                <div className="relative">
                    <button
                        onClick={() => setShowCommit(!showCommit)}
                        className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-1"
                    >
                        <span>Commit</span>
                    </button>

                    {showCommit && (
                        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border p-4 z-50">
                            <h3 className="font-semibold mb-2">Commit Version</h3>
                            <p className="text-xs text-gray-500 mb-3">Save current state as a version.</p>
                            <input
                                type="text"
                                value={commitMessage}
                                onChange={(e) => setCommitMessage(e.target.value)}
                                placeholder="Commit message (e.g., 'Initial draft')"
                                className="w-full border rounded p-2 text-sm mb-3 focus:outline-none focus:border-blue-500"
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setShowCommit(false)}
                                    className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCommit}
                                    disabled={!commitMessage.trim() || isSaving}
                                    className={`px-3 py-1 text-sm text-white rounded ${!commitMessage.trim() || isSaving ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700'}`}
                                >
                                    {isSaving ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

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
        </div>
    );
};

export default DocumentHeader;
