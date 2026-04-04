import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Bell, User } from 'lucide-react';

export const MainLayout = () => {
    const navigate = useNavigate();

    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex print:bg-white print:block">
            <div className="print:hidden">
                <Sidebar />
            </div>
            <main className="flex-1 ml-64 flex flex-col print:ml-0 print:block">
                {/* Header */}
                <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-40 print:hidden">
                    <div className="flex items-center flex-1">
                        {/* Search bar removed per user request */}
                    </div>

                    <div className="flex items-center space-x-4">
                        <button className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors relative">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
                        </button>

                        <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>

                        <button
                            onClick={handleLogout}
                            className="flex items-center space-x-3 p-1.5 pr-3 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center text-slate-500 overflow-hidden border border-slate-300">
                                <User className="w-6 h-6" />
                            </div>
                            <div className="text-left hidden md:block">
                                <p className="text-sm font-bold text-slate-900 leading-tight">
                                    {userInfo.name || 'Ansari Admin'}
                                </p>
                                <p className="text-[11px] font-medium text-slate-500">Super Admin (Logout)</p>
                            </div>
                        </button>
                    </div>
                </header>

                {/* Content Area */}
                <div className="p-8 flex-1 print:p-0">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
