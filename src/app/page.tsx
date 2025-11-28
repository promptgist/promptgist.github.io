'use client';

import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';

const Editor = dynamic(() => import('@/components/Editor'), { ssr: false });
const VersionControl = dynamic(() => import('@/components/VersionControl'), { ssr: false });
// Comments component is no longer used in the sidebar
// const Comments = dynamic(() => import('@/components/Comments'), { ssr: false });
const DocumentHeader = dynamic(() => import('@/components/DocumentHeader'), { ssr: false });

function HomeContent() {
  const searchParams = useSearchParams();
  const docId = searchParams?.get('docId') ?? undefined;
  const [showHistory, setShowHistory] = useState(false);
  const { user } = useAuth();

  const handleAddComment = (text: string) => {
    console.log('Comment on:', text);
  };

  return (
    <div className="flex h-full relative">
      <div className="flex-1 flex flex-col bg-gray-50 transition-all duration-300">
        {docId && (
          <DocumentHeader
            docId={docId}
            onToggleHistory={() => setShowHistory(!showHistory)}
          />
        )}
        <div className="flex-1 overflow-auto flex justify-center">
          <div className="w-full max-w-4xl bg-white min-h-full shadow-sm my-4 mx-8">
            <Editor key={docId} docId={docId} currentUser={user} onAddComment={handleAddComment} />
          </div>
        </div>
      </div>

      {docId && (
        <div className={`border-l bg-white flex flex-col transition-all duration-300 ${showHistory ? 'w-80' : 'w-0 overflow-hidden'}`}>
          <div className="p-4 border-b flex justify-between items-center bg-gray-50">
            <h3 className="font-semibold text-gray-700">History</h3>
            <button onClick={() => setShowHistory(false)} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-hidden p-4 min-w-[20rem]">
            <VersionControl docId={docId} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
