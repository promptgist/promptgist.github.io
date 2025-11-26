'use client';

import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs, doc, updateDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Version {
    id: string;
    content: string;
    createdAt: any; // Firestore timestamp
    name?: string;
}

interface VersionControlProps {
    docId: string;
}

const VersionControl: React.FC<VersionControlProps> = ({ docId }) => {
    const [versions, setVersions] = useState<Version[]>([]);
    const [loading, setLoading] = useState(true);

    // Load versions with real-time listener to update when new commits are made
    useEffect(() => {
        const versionsRef = collection(db, 'documents', docId, 'versions');
        const q = query(versionsRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list: Version[] = [];
            snapshot.forEach((snap) => {
                const data = snap.data() as any;
                list.push({
                    id: snap.id,
                    content: data.content,
                    createdAt: data.createdAt,
                    name: data.name
                });
            });
            setVersions(list);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [docId]);

    const restoreVersion = async (version: Version) => {
        if (!confirm(`Are you sure you want to restore "${version.name || 'Untitled'}"? Current content will be overwritten.`)) return;

        const docRef = doc(db, 'documents', docId);
        await updateDoc(docRef, { content: version.content, updatedAt: new Date() });
    };

    return (
        <div className="h-full flex flex-col">
            <h3 className="font-semibold mb-4 text-gray-700">Version History</h3>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {loading && <p className="text-gray-500 text-sm">Loading...</p>}
                {!loading && versions.length === 0 && (
                    <p className="text-gray-500 text-sm italic">No versions saved yet.</p>
                )}
                {versions.map((version) => (
                    <div key={version.id} className="border rounded p-3 bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex justify-between items-start mb-1">
                            <span className="font-medium text-sm text-gray-800">{version.name || 'Untitled Version'}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                            <span className="text-xs text-gray-400">
                                {version.createdAt?.toDate ? version.createdAt.toDate().toLocaleString() : 'Unknown date'}
                            </span>
                            <button
                                onClick={() => restoreVersion(version)}
                                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                            >
                                Restore
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VersionControl;
