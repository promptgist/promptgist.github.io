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
        setIsSaving(true);
        try {
            const docRef = doc(db, 'documents', docId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                await addDoc(collection(db, 'documents', docId, 'versions'), {
                    content: data.content,
                    createdAt: new Date(),
                    name: commitMessage.trim() || 'Untitled Version'
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

            <div className="flex gap-3 relative">
                <button
                    onClick={onToggleHistory}
                    className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition-all duration-200"
                    title="Version History"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </button>

                <div className="relative">
                    <button
                        onClick={() => setShowCommit(!showCommit)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm flex items-center gap-2 ${showCommit ? 'bg-green-700 text-white ring-2 ring-green-200' : 'bg-green-600 text-white hover:bg-green-700 hover:shadow'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        <span>Save Version</span>
                    </button>

                    {showCommit && (
                        <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 p-5 z-50 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-bold text-gray-800">Commit Version</h3>
                                <button onClick={() => setShowCommit(false)} className="text-gray-400 hover:text-gray-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mb-4">Create a named checkpoint for your document.</p>

                            <textarea
                                value={commitMessage}
                                onChange={(e) => setCommitMessage(e.target.value)}
                                placeholder="What changed? (Optional)"
                                className="w-full border border-gray-200 rounded-lg p-3 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all resize-none bg-gray-50 focus:bg-white"
                                rows={3}
                                autoFocus
                            />

                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setShowCommit(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCommit}
                                    disabled={isSaving}
                                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? 'Saving...' : 'Save Checkpoint'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="relative">
                    <button
                        onClick={() => setShowShare(!showShare)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm flex items-center gap-2 ${showShare ? 'bg-blue-700 text-white ring-2 ring-blue-200' : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        <span>Share</span>
                    </button>

                    {showShare && (
                        <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 p-5 z-50 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-gray-800">Share Document</h3>
                                <button onClick={() => setShowShare(false)} className="text-gray-400 hover:text-gray-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700">Public Access</span>
                                    <button
                                        onClick={toggleShare}
                                        className={`w-12 h-6 flex items-center rounded-full p-1 transition-all duration-300 ${isPublic ? 'bg-green-500' : 'bg-gray-300'}`}
                                    >
                                        <div
                                            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${isPublic ? 'translate-x-6' : ''}`}
                                        />
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    {isPublic
                                        ? "Anyone with the link can view this document."
                                        : "Only you can access this document."}
                                </p>
                            </div>

                            {isPublic && (
                                <div className="flex gap-2">
                                    <div className="flex-1 relative">
                                        <input
                                            readOnly
                                            value={`${typeof window !== 'undefined' ? window.location.origin : ''}/?docId=${docId}`}
                                            className="w-full text-xs border border-gray-200 rounded-lg py-2.5 pl-3 pr-8 bg-white text-gray-600 focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    <button
                                        onClick={copyLink}
                                        className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${copied ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                    >
                                        {copied ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DocumentHeader;
