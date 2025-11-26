'use client';

import React, { useState } from 'react';
import DocumentList from './DocumentList';

const Sidebar = () => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className={`border-r bg-gray-50 flex flex-col transition-all duration-300 ${isOpen ? 'w-64' : 'w-12'}`}>
            <div className="p-4 border-b flex justify-between items-center">
                {isOpen && <h1 className="text-xl font-bold text-gray-800">PromptGist</h1>}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-1 hover:bg-gray-200 rounded text-gray-600 focus:outline-none"
                    title={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
                >
                    {isOpen ? '◀' : '▶'}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                {isOpen ? (
                    <DocumentList />
                ) : (
                    <div className="flex flex-col items-center gap-4 mt-2">
                        {/* Icons for collapsed state could go here */}
                        <span className="text-xs text-gray-400">📁</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Sidebar;
