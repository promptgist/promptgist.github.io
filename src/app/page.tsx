'use client';

import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

const Editor = dynamic(() => import('@/components/Editor'), { ssr: false });
const VersionControl = dynamic(() => import('@/components/VersionControl'), { ssr: false });
const Comments = dynamic(() => import('@/components/Comments'), { ssr: false });
const DocumentHeader = dynamic(() => import('@/components/DocumentHeader'), { ssr: false });

export default function Home() {
  const searchParams = useSearchParams();
  const docId = searchParams?.get('docId') ?? undefined;
  const [activeTab, setActiveTab] = useState<'comments' | 'history'>('comments');
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);

  const handleAddComment = (text: string) => {
    setActiveTab('comments');
    setIsRightSidebarOpen(true);
    // In a real app, we'd pass this text to the Comments component to pre-fill
    // For now, just opening the tab is a good start
    console.log('Comment on:', text);
  };

  return (
    <div className="flex h-full relative">
      <div className="flex-1 flex flex-col bg-gray-50 transition-all duration-300">
        {docId && <DocumentHeader docId={docId} />}
        <div className="flex-1 overflow-auto flex justify-center">
          <div className="w-full max-w-4xl bg-white min-h-full shadow-sm my-4 mx-8">
            <Editor docId={docId} onAddComment={handleAddComment} />
          </div>
        </div>
      </div>

      {docId && (
        <>
          <button
            onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
            className={`absolute right-0 top-20 bg-white border border-r-0 p-1 rounded-l shadow-md z-10 transition-transform duration-300 ${isRightSidebarOpen ? 'mr-80' : 'mr-0'}`}
            title={isRightSidebarOpen ? "Collapse Panel" : "Expand Panel"}
            style={{ right: isRightSidebarOpen ? '320px' : '0' }}
          >
            {isRightSidebarOpen ? '▶' : '◀'}
          </button>

          <div className={`border-l bg-white flex flex-col transition-all duration-300 ${isRightSidebarOpen ? 'w-80' : 'w-0 overflow-hidden'}`}>
            <div className="flex border-b min-w-[20rem]">
              <button
                className={`flex-1 py-3 text-sm font-medium ${activeTab === 'comments' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('comments')}
              >
                Comments
              </button>
              <button
                className={`flex-1 py-3 text-sm font-medium ${activeTab === 'history' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('history')}
              >
                History
              </button>
            </div>

            <div className="flex-1 overflow-hidden p-4 min-w-[20rem]">
              {activeTab === 'comments' ? (
                <Comments docId={docId} />
              ) : (
                <VersionControl docId={docId} />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
