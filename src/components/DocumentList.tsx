'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, orderBy, addDoc } from 'firebase/firestore';
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

    useEffect(() => {
        if (loading) return;
        if (!user) {
            setDocs([]);
            return;
        }
        const fetchDocs = async () => {
            const docsRef = collection(db, 'documents');
            const q = query(docsRef, where('ownerId', '==', user.uid), orderBy('updatedAt', 'desc'));
            const snapshot = await getDocs(q);
            const list: DocumentItem[] = [];
            snapshot.forEach((docSnap) => {
                const data = docSnap.data() as any;
                list.push({ id: docSnap.id, title: data.title || 'Untitled', updatedAt: data.updatedAt });
            });
            setDocs(list);
        };
        fetchDocs();
    }, [user, loading]);

    const openDoc = (id: string) => {
        router.push(`/?docId=${id}`);
    };

    const createDoc = async () => {
        if (!user) return;
        const newDocRef = collection(db, 'documents');
        const docRef = await addDoc(newDocRef, {
            ownerId: user.uid,
            title: 'New Prompt',
            content: '<p></p>',
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        // Force hard navigation to ensure state resets and header loads
        window.location.href = `/?docId=${docRef.id}`;
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
                        className="cursor-pointer hover:bg-gray-200 px-3 py-2 rounded-md text-sm text-gray-700 truncate transition-colors"
                        onClick={() => openDoc(doc.id)}
                    >
                        {doc.title}
                    </li>
                ))}
                {docs.length === 0 && (
                    <li className="px-3 py-2 text-sm text-gray-400 italic">No documents yet</li>
                )}
            </ul>
        </div>
    );
};

export default DocumentList;
