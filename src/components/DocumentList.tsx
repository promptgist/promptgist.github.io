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
    const { user, loading, login, loginWithEmail, logout } = useAuth();
    const router = useRouter();
    const [docs, setDocs] = useState<DocumentItem[]>([]);

    useEffect(() => {
        if (loading) return;
        if (!user) return;
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
        router.push(`/?docId=${docRef.id}`);
    };

    if (loading) return <p>Loading…</p>;

    if (!user) {
        return (
            <div className="p-2 space-y-2">
                <p className="text-sm font-medium">Please sign in</p>
                <button onClick={login} className="w-full bg-white border border-gray-300 text-gray-700 px-2 py-1 rounded text-sm hover:bg-gray-50">
                    Sign in with Google
                </button>
                <div className="border-t pt-2 mt-2">
                    <p className="text-xs text-gray-500 mb-1">Test Login</p>
                    <button
                        onClick={() => loginWithEmail('admin@stanchen.ca', 'password')}
                        className="w-full bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600"
                    >
                        Login as Admin
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">My Prompts</h2>
                <div className="flex gap-1">
                    <button onClick={createDoc} className="bg-blue-500 text-white px-2 py-1 rounded text-sm">
                        New
                    </button>
                    <button onClick={logout} className="bg-gray-200 text-gray-600 px-2 py-1 rounded text-sm">
                        Logout
                    </button>
                </div>
            </div>
            <ul className="space-y-2">
                {docs.map((doc) => (
                    <li key={doc.id} className="cursor-pointer hover:bg-gray-100 p-1 rounded" onClick={() => openDoc(doc.id)}>
                        {doc.title}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default DocumentList;
