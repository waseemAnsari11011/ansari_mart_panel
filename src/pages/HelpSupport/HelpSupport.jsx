import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import {
    Phone,
    Mail,
    Save,
    RotateCcw,
    Loader2,
    LifeBuoy
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export const HelpSupport = () => {
    const [helpData, setHelpData] = useState({
        mobile: '',
        email: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchHelpSupport = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/help-support');
            if (data) {
                setHelpData({
                    mobile: data.mobile || '',
                    email: data.email || ''
                });
            }
        } catch (error) {
            console.error('Error fetching help & support:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHelpSupport();
    }, []);

    const handleSave = async () => {
        if (!helpData.mobile || !helpData.email) {
            alert('Please provide both mobile number and email.');
            return;
        }

        setSaving(true);
        try {
            await api.post('/help-support/update', helpData);
            alert('Help & Support details updated successfully!');
        } catch (error) {
            console.error('Error updating help & support:', error);
            alert('Failed to update details.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-8 pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-slate-900">Help & Support</h2>
                    <p className="text-slate-500 font-medium text-sm">Manage contact details for customer support.</p>
                </div>
                <button 
                    onClick={fetchHelpSupport}
                    className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center"
                    title="Refresh"
                >
                    <RotateCcw className={cn("w-4 h-4", loading && "animate-spin")} />
                </button>
            </div>

            <div className="max-w-2xl">
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden text-slate-900 flex flex-col">
                    <div className="px-8 py-6 border-b border-slate-100 flex items-center space-x-3 bg-white">
                        <div className="p-2 bg-indigo-50 rounded-xl">
                            <LifeBuoy className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black tracking-tight">Support Information</h3>
                            <p className="text-slate-500 text-xs font-semibold">These details will be shown in the mobile app.</p>
                        </div>
                    </div>

                    <div className="p-8 space-y-6">
                        {loading ? (
                            <div className="py-12 flex flex-col items-center justify-center space-y-4">
                                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                                <p className="text-slate-500 font-bold text-sm">Loading details...</p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Support Mobile Number</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                            <Phone className="w-4 h-4" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="e.g. +91 9876543210"
                                            value={helpData.mobile}
                                            onChange={(e) => setHelpData({ ...helpData, mobile: e.target.value })}
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-sm focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Support Email Address</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <input
                                            type="email"
                                            placeholder="e.g. support@ansarimart.com"
                                            value={helpData.email}
                                            onChange={(e) => setHelpData({ ...helpData, email: e.target.value })}
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-sm focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <button 
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition-all flex items-center justify-center space-x-2 shadow-xl shadow-slate-900/10 active:scale-95 disabled:opacity-50"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    <span>{saving ? 'Saving...' : 'Update Details'}</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
