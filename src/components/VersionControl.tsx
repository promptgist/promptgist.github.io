import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs, addDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Version {
    id: string;
    content: string;
    createdAt: any; // Firestore timestamp
    createdBy: string;
}

interface VersionControlProps {
    docId: string;
}

const VersionControl: React.FC<VersionControlProps> = ({ docId }) => {
    const [versions, setVersions] = useState<Version[]>([]);
    const [loading, setLoading] = useState(true);

    // Load versions
    useEffect(() => {
        const fetchVersions = async () => {
            const versionsRef = collection(db, 'documents', docId, 'versions');
            const q = query(versionsRef, orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            const list: Version[] = [];
            snapshot.forEach((snap) => {
                const data = snap.data() as any;
                list.push({ id: snap.id, content: data.content, createdAt: data.createdAt, createdBy: data.createdBy });
            });
            setVersions(list);
            setLoading(false);
        };
        fetchVersions();
    }, [docId]);

    const saveVersion = async () => {
        const docRef = doc(db, 'documents', docId);
        const currentSnap = await getDoc(docRef);
        if (!currentSnap.exists()) return;
        const data = currentSnap.data() as any;
        const content = data.content || '';
        await addDoc(collection(db, 'documents', docId, 'versions'), {
            content,
            createdAt: new Date(),
            createdBy: data.ownerId || 'unknown',
        });
        // Refresh list
        setLoading(true);
        const q = query(collection(db, 'documents', docId, 'versions'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const list: Version[] = [];
        snapshot.forEach((snap) => {
            const d = snap.data() as any;
            list.push({ id: snap.id, content: d.content, createdAt: d.createdAt, createdBy: d.createdBy });
        });
        setVersions(list);
        setLoading(false);
    };

    const restoreVersion = async (versionId: string) => {
        const versionRef = doc(db, 'documents', docId, 'versions', versionId);
        const versionSnap = await getDoc(versionRef);
        if (!versionSnap.exists()) return;
        const data = versionSnap.data() as any;
        const docRef = doc(db, 'documents', docId);
        await updateDoc(docRef, { content: data.content, updatedAt: new Date() });
    };

    return (
        <div className="version-control">
            <button onClick={saveVersion} className="bg-blue-500 text-white px-2 py-1 rounded mb-2">
                Save Version
            </button>
            {loading ? (
                <p>Loading versions...</p>
            ) : (
                <ul className="space-y-1">
                    {versions.map((v) => (
                        <li key={v.id} className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                                {v.createdAt?.toDate?.().toLocaleString() || 'Unknown'}
                            </span>
                            <button
                                onClick={() => restoreVersion(v.id)}
                                className="bg-gray-200 text-sm px-2 py-0.5 rounded"
                            >
                                Restore
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default VersionControl;
