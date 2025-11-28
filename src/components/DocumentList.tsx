'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, onSnapshot, orderBy, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

interface DocumentItem {
    id: string;
    title: string;
    updatedAt?: any;
}

const DocumentList: React.FC = () => {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [docs, setDocs] = useState<DocumentItem[]>([]);
    const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

    useEffect(() => {
        if (loading) return;
        if (!user) {
            setDocs([]);
            return;
        }

        const docsRef = collection(db, 'documents');
        const q = query(docsRef, where('ownerId', '==', user.uid), orderBy('updatedAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list: DocumentItem[] = [];
            snapshot.forEach((docSnap) => {
                const data = docSnap.data() as any;
                list.push({ id: docSnap.id, title: data.title || 'Untitled', updatedAt: data.updatedAt });
            });
            setDocs(list);
        });

        return () => unsubscribe();
    }, [user, loading]);

    const openDoc = (id: string) => {
        router.push(`/?docId=${id}`);
    };

    const createDoc = async () => {
        if (!user) return;

        // Generate ID locally for immediate UI update
        const newDocRef = doc(collection(db, 'documents'));
        const newDocId = newDocRef.id;
        const newDocData = {
            ownerId: user.uid,
            title: 'New Prompt',
            content: '<p></p>',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        // Optimistic UI update
        const newDocItem: DocumentItem = {
            id: newDocId,
            title: newDocData.title,
            updatedAt: newDocData.updatedAt
        };
        setDocs(prev => [newDocItem, ...prev]);

        // Navigate immediately
        router.push(`/?docId=${newDocId}`);

        // Persist in background
        setDoc(newDocRef, newDocData).catch(error => {
            console.error("Error creating document:", error);
        });
    };

    const confirmDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setDeletingDocId(id);
    };

    const handleDelete = async () => {
        if (!deletingDocId) return;
        try {
            await deleteDoc(doc(db, 'documents', deletingDocId));
            // If the deleted doc was active, redirect to home
            const currentDocId = new URLSearchParams(window.location.search).get('docId');
            if (currentDocId === deletingDocId) {
                router.push('/');
            }
        } catch (error) {
            console.error("Error deleting document:", error);
        } finally {
            setDeletingDocId(null);
        }
    };

    if (loading) return <div className="p-4 text-sm text-gray-500">Loading...</div>;
    if (!user) return <div className="p-4 text-sm text-gray-500">Sign in to view documents</div>;

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 pb-2 flex justify-between items-center">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">My Prompts</h2>
                <button
                    onClick={createDoc}
                    className="text-gray-500 hover:text-blue-600 transition-colors"
                    title="Create New Document"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
            <ul className="flex-1 overflow-y-auto px-2 space-y-0.5">
                {docs.map((doc) => (
                    <li
                        key={doc.id}
                        className="group cursor-pointer hover:bg-gray-200 px-3 py-2 rounded-md text-sm text-gray-700 transition-colors flex justify-between items-center"
                        onClick={() => openDoc(doc.id)}
                    >
                        <span className="truncate flex-1">{doc.title}</span>
                        <button
                            onClick={(e) => confirmDelete(e, doc.id)}
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1 rounded transition-all"
                            title="Delete"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </li>
                ))}
                {docs.length === 0 && (
                    <li className="px-3 py-2 text-sm text-gray-400 italic">No documents yet</li>
                )}
            </ul>


            {/* Delete Confirmation Modal */}
            {
                deletingDocId && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-80 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Document?</h3>
                            <p className="text-sm text-gray-500 mb-6">
                                Are you sure you want to delete this document? This action cannot be undone.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setDeletingDocId(null)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default DocumentList;
