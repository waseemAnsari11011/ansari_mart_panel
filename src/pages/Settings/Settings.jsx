import React, { useState, useEffect } from 'react';
import api, { resolveImageUrl } from '../../utils/api';
import {
    Truck,
    Trash2,
    Plus,
    Save,
    Layout,
    Upload,
    X,
    RotateCcw,
    Loader2,
    Package
} from 'lucide-react';
import { useGlobalState } from '../../context/GlobalContext';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export const Settings = () => {
    const { settings, updateSettings, lastFetched } = useGlobalState();
    const [banners, setBanners] = useState(settings?.banners || []);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newBanner, setNewBanner] = useState({ title: '', image: '', imageFile: null });
    const [units, setUnits] = useState(settings?.units || []);
    const [newUnit, setNewUnit] = useState('');
    const [loading, setLoading] = useState(!settings);
    const [uploading, setUploading] = useState(false);

    const [logisticsTab, setLogisticsTab] = useState('Retail');
    const [deliveryCharges, setDeliveryCharges] = useState({
        Retail: {
            mov: settings?.logistics?.Retail?.mov?.toString() || '',
            deliveryCharge: settings?.logistics?.Retail?.deliveryCharge?.toString() || ''
        },
        Business: {
            mov: settings?.logistics?.Business?.mov?.toString() || '',
            deliveryCharge: settings?.logistics?.Business?.deliveryCharge?.toString() || ''
        }
    });

    useEffect(() => {
        const fetchSettings = async () => {
            if (!settings) setLoading(true);
            try {
                const { data } = await api.get('/settings');
                if (data) {
                    updateSettings(data);
                    setBanners(data.banners || []);
                    if (data.logistics) {
                        setDeliveryCharges({
                            Retail: {
                                mov: data.logistics.Retail?.mov?.toString() || '',
                                deliveryCharge: data.logistics.Retail?.deliveryCharge?.toString() || ''
                            },
                            Business: {
                                mov: data.logistics.Business?.mov?.toString() || '',
                                deliveryCharge: data.logistics.Business?.deliveryCharge?.toString() || ''
                            }
                        });
                    }
                    setUnits(data.units || []);
                }
            } catch (error) {
                console.error('Error fetching settings:', error);
            } finally {
                setLoading(false);
            }
        };

        const shouldFetch = !settings || (Date.now() - lastFetched.settings > 10 * 60 * 1000);
        if (shouldFetch) {
            fetchSettings();
        } else {
            setLoading(false);
        }
    }, [settings, updateSettings, lastFetched.settings]);

    const handleRefresh = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/settings');
            if (data) {
                updateSettings(data);
                setBanners(data.banners || []);
                if (data.logistics) {
                    setDeliveryCharges({
                        Retail: {
                            mov: data.logistics.Retail?.mov?.toString() || '',
                            deliveryCharge: data.logistics.Retail?.deliveryCharge?.toString() || ''
                        },
                        Business: {
                            mov: data.logistics.Business?.mov?.toString() || '',
                            deliveryCharge: data.logistics.Business?.deliveryCharge?.toString() || ''
                        }
                    });
                }
                setUnits(data.units || []);
            }
        } catch (error) {
            console.error('Error refreshing settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const removeBanner = async (id) => {
        try {
            const updatedBanners = banners.filter(b => b._id !== id);
            const { data } = await api.put('/settings/banners', { banners: updatedBanners });
            updateSettings(data.settings);
            setBanners(data.settings.banners);
        } catch (error) {
            console.error('Error removing banner:', error);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            // Only for preview in UI
            const previewUrl = URL.createObjectURL(file);
            setNewBanner({ ...newBanner, image: previewUrl, imageFile: file });
        }
    };

    const handleAddBanner = async () => {
        if (!newBanner.title || !newBanner.image) return;

        try {
            setUploading(true);
            let imageUrl = newBanner.image;

            // Upload the file if a new one was selected
            if (newBanner.imageFile) {
                const formData = new FormData();
                formData.append('image', newBanner.imageFile);
                const uploadRes = await api.post('/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                imageUrl = uploadRes.data.path;
            }

            const banner = {
                image: imageUrl,
                title: newBanner.title,
                status: 'ACTIVE'
            };

            const updatedBanners = [...banners, banner];
            const { data } = await api.put('/settings/banners', { banners: updatedBanners });
            updateSettings(data.settings);
            setBanners(data.settings.banners);
            setNewBanner({ title: '', image: '', imageFile: null });
            setIsAddModalOpen(false);
        } catch (error) {
            console.error('Error adding banner:', error);
        } finally {
            setUploading(false);
        }
    };

    const handleSaveLogistics = async () => {
        try {
            const { data } = await api.put('/settings/logistics', {
                logistics: {
                    Retail: {
                        mov: Number(deliveryCharges.Retail.mov),
                        deliveryCharge: Number(deliveryCharges.Retail.deliveryCharge)
                    },
                    Business: {
                        mov: Number(deliveryCharges.Business.mov),
                        deliveryCharge: Number(deliveryCharges.Business.deliveryCharge)
                    }
                }
            });
            updateSettings(data.settings);
            alert('Logistics settings saved successfully!');
        } catch (error) {
            console.error('Error saving logistics:', error);
            alert('Failed to save logistics settings.');
        }
    };

    const handleAddUnit = () => {
        if (!newUnit.trim()) return;
        if (units.includes(newUnit.trim())) {
            alert('Unit already exists');
            return;
        }
        setUnits([...units, newUnit.trim()]);
        setNewUnit('');
    };

    const handleRemoveUnit = (unitToRemove) => {
        setUnits(units.filter(u => u !== unitToRemove));
    };

    const handleSaveUnits = async () => {
        try {
            const { data } = await api.put('/settings/units', { units });
            updateSettings(data.settings);
            alert('Units updated successfully!');
        } catch (error) {
            console.error('Error saving units:', error);
            alert('Failed to save units.');
        }
    };

    return (
        <div className="space-y-8 pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-slate-900">General Settings</h2>
                    <p className="text-slate-500 font-medium text-sm">Manage banners, delivery fees, and platform configurations.</p>
                </div>
                <button 
                    onClick={handleRefresh}
                    className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center"
                    title="Refresh Settings"
                >
                    <RotateCcw className={cn("w-4 h-4", loading && "animate-spin")} />
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Banner Management */}
                <div className="xl:col-span-2 flex flex-col">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden text-slate-900 h-full flex flex-col">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-blue-50 rounded-xl">
                                    <Layout className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black tracking-tight">Promotional Banners</h3>
                                    <p className="text-slate-500 text-xs font-semibold">Banners displayed on the customer app home screen.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-xl font-bold text-xs hover:bg-green-700 transition-all shadow-lg shadow-green-600/10 active:scale-95"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Add Banner</span>
                            </button>
                        </div>

                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                            {loading && !settings ? (
                                <div className="col-span-full py-12 text-center text-slate-400 font-bold">Loading banners...</div>
                            ) : banners.length === 0 ? (
                                <div className="col-span-full py-12 text-center text-slate-400 font-bold">No promotional banners added yet.</div>
                            ) : (
                                banners.map((banner) => (
                                    <div key={banner._id} className="group relative rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-all h-fit">
                                        <div className="aspect-[21/9] w-full bg-slate-100">
                                            <img src={resolveImageUrl(banner.image)} alt={banner.title} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-white text-xs font-black mb-0.5">{banner.title}</p>
                                                    <span className="text-[10px] text-green-400 font-black uppercase tracking-widest">{banner.status}</span>
                                                </div>
                                                <button
                                                    onClick={() => removeBanner(banner._id)}
                                                    className="p-2 bg-white/10 hover:bg-red-500 text-white rounded-lg backdrop-blur-md transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-8 flex flex-col">
                    {/* Delivery & Logistics */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden text-slate-900 flex flex-col">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center space-x-3 bg-white text-slate-900">
                            <div className="p-2 bg-green-50 rounded-xl">
                                <Truck className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black tracking-tight">Logistics Settings</h3>
                                <p className="text-slate-500 text-xs font-semibold">Configure delivery fees and rules.</p>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-slate-100">
                            <button
                                onClick={() => setLogisticsTab('Retail')}
                                className={cn(
                                    'flex-1 py-3.5 text-xs font-black uppercase tracking-widest transition-all',
                                    logisticsTab === 'Retail'
                                        ? 'text-green-600 border-b-2 border-green-600 bg-green-50/40'
                                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                                )}
                            >
                                🛒 Retail
                            </button>
                            <button
                                onClick={() => setLogisticsTab('Business')}
                                className={cn(
                                    'flex-1 py-3.5 text-xs font-black uppercase tracking-widest transition-all',
                                    logisticsTab === 'Business'
                                        ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50/40'
                                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                                )}
                            >
                                🏢 Business
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            {/* MOV Field */}
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                                    MOV – Maximum Order Value
                                </label>
                                <p className="text-[10px] text-slate-400 font-bold leading-relaxed italic">
                                    Orders below this amount will be charged delivery fee.
                                </p>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₹</span>
                                    <input
                                        type="number"
                                        value={deliveryCharges[logisticsTab].mov}
                                        onChange={(e) => setDeliveryCharges(prev => ({
                                            ...prev,
                                            [logisticsTab]: { ...prev[logisticsTab], mov: e.target.value }
                                        }))}
                                        className={cn(
                                            'w-full pl-8 pr-4 py-3 bg-slate-50 border rounded-xl font-black text-sm outline-none transition-all',
                                            logisticsTab === 'Retail'
                                                ? 'border-slate-200 focus:ring-2 focus:ring-green-500/10 focus:border-green-500'
                                                : 'border-slate-200 focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500'
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Delivery Charge Field */}
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                                    Delivery Charge
                                </label>
                                <p className="text-[10px] text-slate-400 font-bold leading-relaxed italic">
                                    Fee charged if order is below MOV.
                                </p>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₹</span>
                                    <input
                                        type="number"
                                        value={deliveryCharges[logisticsTab].deliveryCharge}
                                        onChange={(e) => setDeliveryCharges(prev => ({
                                            ...prev,
                                            [logisticsTab]: { ...prev[logisticsTab], deliveryCharge: e.target.value }
                                        }))}
                                        className={cn(
                                            'w-full pl-8 pr-4 py-3 bg-slate-50 border rounded-xl font-black text-sm outline-none transition-all',
                                            logisticsTab === 'Retail'
                                                ? 'border-slate-200 focus:ring-2 focus:ring-green-500/10 focus:border-green-500'
                                                : 'border-slate-200 focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500'
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Summary Card */}
                            <div className={cn(
                                'rounded-2xl p-4 border text-xs font-bold',
                                logisticsTab === 'Retail'
                                    ? 'bg-green-50/60 border-green-100 text-green-800'
                                    : 'bg-orange-50/60 border-orange-100 text-orange-800'
                            )}>
                                <p className="font-black uppercase tracking-widest text-[10px] mb-1 opacity-60">Preview Rule</p>
                                <p>
                                    Orders below <span className="font-black">₹{deliveryCharges[logisticsTab].mov || '0'}</span> → Delivery fee: <span className="font-black">₹{deliveryCharges[logisticsTab].deliveryCharge || '0'}</span>
                                </p>
                                <p className="mt-0.5 opacity-70">
                                    Orders ₹{deliveryCharges[logisticsTab].mov || '0'} or above → <span className="font-black">FREE delivery</span>
                                </p>
                            </div>

                            <button 
                                onClick={handleSaveLogistics}
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition-all flex items-center justify-center space-x-2 shadow-xl shadow-slate-900/10 active:scale-95"
                            >
                                <Save className="w-4 h-4" />
                                <span>Save Logistics</span>
                            </button>
                        </div>
                    </div>

                    {/* Unit Type Management */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden text-slate-900 flex flex-col">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center space-x-3 bg-white text-slate-900">
                            <div className="p-2 bg-orange-50 rounded-xl">
                                <Package className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black tracking-tight">Unit Management</h3>
                                <p className="text-slate-500 text-xs font-semibold">Manage product unit types.</p>
                            </div>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Add new unit (e.g. Kg)"
                                    value={newUnit}
                                    onChange={(e) => setNewUnit(e.target.value)}
                                    className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all"
                                />
                                <button
                                    onClick={handleAddUnit}
                                    className="p-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-all active:scale-95"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {units.map((unit) => (
                                    <div key={unit} className="flex items-center space-x-2 px-3 py-1.5 bg-slate-100 rounded-lg group">
                                        <span className="text-xs font-black text-slate-700">{unit}</span>
                                        <button 
                                            onClick={() => handleRemoveUnit(unit)}
                                            className="text-slate-400 hover:text-red-600 transition-colors"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <button 
                                onClick={handleSaveUnits}
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition-all flex items-center justify-center space-x-2 shadow-xl shadow-slate-900/10 active:scale-95"
                            >
                                <Save className="w-4 h-4" />
                                <span>Save Unit Types</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Banner Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Add New Banner</h3>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Banner Title</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Summer Fresh Sale"
                                    value={newBanner.title}
                                    onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-sm focus:ring-2 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Banner Image</label>
                                <div className="relative group">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                        id="banner-upload"
                                    />
                                    <label
                                        htmlFor="banner-upload"
                                        className="block cursor-pointer"
                                    >
                                        {newBanner.image ? (
                                            <div className="relative rounded-2xl overflow-hidden aspect-[21/9] border border-slate-200">
                                                <img src={newBanner.image.startsWith('blob:') ? newBanner.image : resolveImageUrl(newBanner.image)} className="w-full h-full object-cover" alt="Preview" />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="text-white text-xs font-black uppercase tracking-widest">Change Image</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="border-2 border-dashed border-slate-200 rounded-2xl aspect-[21/9] flex flex-col items-center justify-center space-y-2 hover:border-green-500 hover:bg-green-50/30 transition-all bg-slate-50/50">
                                                <div className="p-3 bg-white rounded-full shadow-sm">
                                                    <Upload className="w-5 h-5 text-slate-400" />
                                                </div>
                                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Select Image</span>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>

                            <div className="flex space-x-3 pt-2">
                                <button
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs hover:bg-slate-200 transition-all uppercase tracking-widest"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddBanner}
                                    disabled={!newBanner.title || !newBanner.image || uploading}
                                    className="flex-1 py-3.5 bg-green-600 text-white rounded-2xl font-black text-xs hover:bg-green-700 transition-all shadow-lg shadow-green-600/20 uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                                >
                                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                    <span>{uploading ? 'Uploading...' : 'Save Banner'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
