'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';

const UserProfile = () => {
    const { user, login, loginWithEmail, logout } = useAuth();

    if (!user) {
        return (
            <div className="p-4 border-t bg-gray-50">
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Authentication</p>
                <button
                    onClick={login}
                    className="w-full bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-md text-sm hover:bg-gray-100 transition-colors mb-2 flex items-center justify-center gap-2"
                >
                    <span className="text-lg">G</span> Sign in with Google
                </button>
                <button
                    onClick={() => loginWithEmail('admin@stanchen.ca', 'password')}
                    className="w-full bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
                >
                    Test Login (Admin)
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 border-t bg-gray-50">
            <div className="flex items-center gap-3 mb-3">
                {user.photoURL ? (
                    <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full" />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                        {user.email?.[0].toUpperCase()}
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.displayName || 'User'}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
            </div>
            <button
                onClick={logout}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded text-xs font-medium transition-colors"
            >
                Sign Out
            </button>
        </div>
    );
};

export default UserProfile;
