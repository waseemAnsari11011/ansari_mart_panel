import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    X,
    Info,
    Save,
    Image as ImageIcon,
    Upload,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Plus,
    Trash2,
    IndianRupee
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import api, { resolveImageUrl } from '../../utils/api';
import { useGlobalState } from '../../context/GlobalContext';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export const AddProduct = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { settings, updateSettings } = useGlobalState();
    const isEdit = !!id;
    const availableUnits = settings?.units || [];

    const [name, setName] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [description, setDescription] = useState('');
    const [brand, setBrand] = useState('');
    const [retailStatus, setRetailStatus] = useState('Active');
    const [businessStatus, setBusinessStatus] = useState('Active');
    const [retailPricing, setRetailPricing] = useState([{ label: '', price: '', unit: '', stock: '' }]);
    const [businessPricing, setBusinessPricing] = useState([{ label: '', price: '', unit: '', stock: '' }]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchingCategories, setFetchingCategories] = useState(true);
    const [initialLoading, setInitialLoading] = useState(isEdit);
    const [error, setError] = useState('');

    // Each entry: { preview: string (URL or blob), file: File|null }
    const [images, setImages] = useState([]);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Settings if not available
                if (!settings) {
                    const settingsRes = await api.get('/settings');
                    updateSettings(settingsRes.data);
                }

                // Fetch Categories
                const catRes = await api.get('/categories');
                setCategories(catRes.data);

                // Fetch Product if editing
                if (isEdit) {
                    const prodRes = await api.get(`/products/${id}`);
                    const p = prodRes.data;
                    setName(p.name || '');
                    setCategoryId(p.category?._id || p.category || '');
                    setDescription(p.description || '');
                    setBrand(p.brand || '');
                    setRetailStatus(p.retailStatus || 'Active');
                    setBusinessStatus(p.businessStatus || 'Active');
                    setRetailPricing(p.retailPricing?.length > 0 ? p.retailPricing.map(tp => ({ ...tp, price: tp.price.toString(), stock: tp.stock.toString() })) : [{ label: '', price: '', unit: availableUnits[0] || '', stock: '' }]);
                    setBusinessPricing(p.businessPricing?.length > 0 ? p.businessPricing.map(tp => ({ ...tp, price: tp.price.toString(), stock: tp.stock.toString() })) : [{ label: '', price: '', unit: availableUnits[0] || '', stock: '' }]);
                    setImages((p.images || []).map(url => ({ preview: url, file: null })));
                } else {
                    // Initialize with first available unit if adding
                    const settingsRes = !settings ? await api.get('/settings') : null;
                    const activeUnits = settings?.units || settingsRes?.data?.units || [];
                    if (activeUnits.length > 0) {
                        setRetailPricing([{ label: '', price: '', unit: activeUnits[0], stock: '' }]);
                        setBusinessPricing([{ label: '', price: '', unit: activeUnits[0], stock: '' }]);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch data', err);
                setError('Failed to load product data');
            } finally {
                setFetchingCategories(false);
                setInitialLoading(false);
            }
        };
        fetchData();
    }, [id, isEdit]);

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            const newImages = files.map(file => ({ preview: URL.createObjectURL(file), file }));
            setImages(prev => [...prev, ...newImages]);
        }
    };

    const handleRemoveImage = (e, index) => {
        e.stopPropagation();
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const validatePricing = (pricingData, type) => {
        for (let i = 0; i < pricingData.length; i++) {
            const current = pricingData[i];

            if (isNaN(parseFloat(current.price)) || isNaN(parseFloat(current.stock))) {
                return `${type} Pricing Row ${i + 1}: Price and Stock must be numbers.`;
            }
        }
        return null;
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setError('');

        const retailError = validatePricing(retailPricing, 'Retail');
        if (retailError) return setError(retailError);

        const businessError = validatePricing(businessPricing, 'Business');
        if (businessError) return setError(businessError);

        setLoading(true);

        try {
            // Upload new image files, keep existing URLs
            let finalImages = [];
            for (const img of images) {
                if (img.file) {
                    const formData = new FormData();
                    formData.append('image', img.file);
                    const uploadRes = await api.post('/upload', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    finalImages.push(uploadRes.data.path);
                } else {
                    // Already a URL or relative path
                    finalImages.push(img.preview);
                }
            }

            const productData = {
                name,
                category: categoryId,
                description,
                stock: retailPricing.reduce((acc, curr) => acc + (parseInt(curr.stock) || 0), 0) + businessPricing.reduce((acc, curr) => acc + (parseInt(curr.stock) || 0), 0),
                images: finalImages.length > 0 ? finalImages : ['https://placehold.co/500x500?text=Product'],
                brand,
                retailStatus,
                businessStatus,
                retailPricing: retailPricing.map(p => ({ label: p.label, price: parseFloat(p.price), unit: p.unit || availableUnits[0] || '', stock: parseInt(p.stock) || 0 })),
                businessPricing: businessPricing.map(p => ({ label: p.label, price: parseFloat(p.price), unit: p.unit || availableUnits[0] || '', stock: parseInt(p.stock) || 0 }))
            };

            if (isEdit) {
                await api.put(`/products/${id}`, productData);
            } else {
                await api.post('/products', productData);
            }
            navigate('/products');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save product');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <div className="w-full flex flex-col items-center justify-center space-y-4 min-h-[60vh] animate-in fade-in duration-500">
                <Loader2 className="w-12 h-12 text-green-600 animate-spin" />
                <p className="font-bold text-slate-500 text-sm tracking-wide">Loading product details...</p>
            </div>
        );
    }

    return (
        <div className="w-full p-2">
            <div className="bg-white w-full mx-auto rounded-2xl shadow-sm flex flex-col border border-slate-100 animate-in fade-in zoom-in-95 duration-500">
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white rounded-t-3xl">
                    <div>
                        <h3 className="text-xl font-black text-slate-900">{isEdit ? 'Edit Product' : 'Add New Product'}</h3>
                        <p className="text-slate-500 font-medium text-sm">
                            {isEdit ? `Editing: ${name}` : 'Configure basic details and inventory.'}
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/products')}
                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-red-500"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSave} className="p-8 space-y-10">
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl font-bold text-sm">
                            {error}
                        </div>
                    )}

                    {/* Basic Information Section */}
                    <section className="space-y-6">
                        <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
                            <Info className="w-5 h-5 text-green-600" />
                            <h4 className="font-black text-slate-900 uppercase tracking-wider text-xs">Basic Information</h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Product Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Horlicks Classic Malt"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-medium text-sm"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Category</label>
                                <select
                                    value={categoryId}
                                    onChange={(e) => setCategoryId(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-medium text-sm appearance-none"
                                    required
                                >
                                    <option value="">
                                        {fetchingCategories ? 'Loading categories...' : 'Select Category'}
                                    </option>
                                    {categories.map(cat => (
                                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-bold text-slate-700">Description</label>
                                <textarea
                                    rows={3}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Provide details about the product..."
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-medium resize-none text-sm"
                                    required
                                ></textarea>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Brand</label>
                                <input
                                    type="text"
                                    value={brand}
                                    onChange={(e) => setBrand(e.target.value)}
                                    placeholder="e.g. Horlicks"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-medium text-sm"
                                />
                            </div>
                            </div>


                            <div className="space-y-4 text-slate-700">
                                <label className="text-sm font-bold">Visibility Status</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                    <div className="space-y-2">
                                        <p className="text-xs font-black text-slate-500 uppercase tracking-wider">Retail Users</p>
                                        <div className="flex items-center space-x-4">
                                            <label className="flex items-center space-x-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    checked={retailStatus === 'Active'}
                                                    onChange={() => setRetailStatus('Active')}
                                                    className="w-4 h-4 text-green-600 focus:ring-green-500"
                                                />
                                                <span className="text-sm font-semibold">Active</span>
                                            </label>
                                            <label className="flex items-center space-x-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    checked={retailStatus === 'Inactive'}
                                                    onChange={() => setRetailStatus('Inactive')}
                                                    className="w-4 h-4 text-red-600 focus:ring-red-500"
                                                />
                                                <span className="text-sm font-semibold">Inactive</span>
                                            </label>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-xs font-black text-slate-500 uppercase tracking-wider">Business Users</p>
                                        <div className="flex items-center space-x-4">
                                            <label className="flex items-center space-x-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    checked={businessStatus === 'Active'}
                                                    onChange={() => setBusinessStatus('Active')}
                                                    className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                                                />
                                                <span className="text-sm font-semibold">Active</span>
                                            </label>
                                            <label className="flex items-center space-x-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    checked={businessStatus === 'Inactive'}
                                                    onChange={() => setBusinessStatus('Inactive')}
                                                    className="w-4 h-4 text-red-600 focus:ring-red-500"
                                                />
                                                <span className="text-sm font-semibold">Inactive</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                    </section>
                    

                    {/* Pricing Tiers Side-by-Side */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-6">
                        {/* Retail Pricing Section */}
                        <section className="space-y-6">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                <div className="flex items-center space-x-2">
                                    <IndianRupee className="w-5 h-5 text-blue-600" />
                                    <h4 className="font-black text-slate-900 uppercase tracking-wider text-xs">Retail Pricing Tiers</h4>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setRetailPricing([...retailPricing, { label: '', price: '', unit: availableUnits[0] || '', stock: '' }])}
                                    className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg font-bold text-xs hover:bg-blue-100 transition-all"
                                >
                                    <Plus className="w-3 h-3" />
                                    <span>Add Tier</span>
                                </button>
                            </div>

                            <div className="space-y-4">
                                {retailPricing.map((tier, index) => (
                                    <div key={index} className="grid grid-cols-4 gap-3 items-end bg-slate-50/50 p-4 rounded-2xl border border-slate-100 relative group/tier">
                                        <div className="space-y-1 text-center">
                                            <label className="text-[10px] font-black text-slate-500 uppercase">Unit</label>
                                            <select
                                                value={tier.unit || availableUnits[0] || ''}
                                                onChange={(e) => {
                                                    const newPricing = [...retailPricing];
                                                    newPricing[index].unit = e.target.value;
                                                    setRetailPricing(newPricing);
                                                }}
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-semibold appearance-none cursor-pointer text-center"
                                                style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23475569%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right center', backgroundSize: '8px auto' }}
                                            >
                                                {availableUnits.map(u => (
                                                    <option key={u} value={u}>{u}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1 text-center">
                                            <label className="text-[10px] font-black text-slate-500 uppercase">Extra Info</label>
                                            <input
                                                type="text"
                                                value={tier.label}
                                                onChange={(e) => {
                                                    const newPricing = [...retailPricing];
                                                    newPricing[index].label = e.target.value;
                                                    setRetailPricing(newPricing);
                                                }}
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-semibold text-center"
                                                placeholder='10 Kg'
                                            />
                                        </div>
                                        <div className="space-y-1 text-center">
                                            <label className="text-[10px] font-black text-slate-500 uppercase">Price</label>
                                            <input
                                                type="number"
                                                value={tier.price}
                                                onChange={(e) => {
                                                    const newPricing = [...retailPricing];
                                                    newPricing[index].price = e.target.value;
                                                    setRetailPricing(newPricing);
                                                }}
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-semibold text-blue-600 text-center"
                                                placeholder="210"
                                            />
                                        </div>
                                        <div className="space-y-1 pr-6 text-center">
                                            <label className="text-[10px] font-black text-slate-500 uppercase">Stock</label>
                                            <input
                                                type="number"
                                                value={tier.stock}
                                                onChange={(e) => {
                                                    const newPricing = [...retailPricing];
                                                    newPricing[index].stock = e.target.value;
                                                    setRetailPricing(newPricing);
                                                }}
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-semibold text-center"
                                                placeholder="50"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setRetailPricing(retailPricing.filter((_, i) => i !== index))}
                                            disabled={retailPricing.length === 1}
                                            className="absolute -top-2 -right-2 bg-white border border-slate-200 p-1.5 text-slate-300 hover:text-red-500 disabled:hidden transition-all rounded-full shadow-sm hover:shadow-md opacity-0 group-hover/tier:opacity-100"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Business Pricing Section */}
                        <section className="space-y-6">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                <div className="flex items-center space-x-2">
                                    <IndianRupee className="w-5 h-5 text-orange-600" />
                                    <h4 className="font-black text-slate-900 uppercase tracking-wider text-xs">Business Pricing Tiers</h4>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setBusinessPricing([...businessPricing, { label: '', price: '', unit: availableUnits[0] || '', stock: '' }])}
                                    className="flex items-center space-x-1 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg font-bold text-xs hover:bg-orange-100 transition-all"
                                >
                                    <Plus className="w-3 h-3" />
                                    <span>Add Tier</span>
                                </button>
                            </div>

                            <div className="space-y-4">
                                {businessPricing.map((tier, index) => (
                                    <div key={index} className="grid grid-cols-4 gap-3 items-end bg-slate-50/50 p-4 rounded-2xl border border-slate-100 relative group/tier">
                                        <div className="space-y-1 text-center">
                                            <label className="text-[10px] font-black text-slate-500 uppercase">Unit</label>
                                            <select
                                                value={tier.unit || availableUnits[0] || ''}
                                                onChange={(e) => {
                                                    const newPricing = [...businessPricing];
                                                    newPricing[index].unit = e.target.value;
                                                    setBusinessPricing(newPricing);
                                                }}
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 outline-none text-sm font-semibold appearance-none cursor-pointer text-center"
                                                style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23475569%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right center', backgroundSize: '8px auto' }}
                                            >
                                                {availableUnits.map(u => (
                                                    <option key={u} value={u}>{u}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1 text-center">
                                            <label className="text-[10px] font-black text-slate-500 uppercase">Extra Info</label>
                                            <input
                                                type="text"
                                                value={tier.label}
                                                onChange={(e) => {
                                                    const newPricing = [...businessPricing];
                                                    newPricing[index].label = e.target.value;
                                                    setBusinessPricing(newPricing);
                                                }}
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 outline-none text-sm font-semibold text-center"
                                                placeholder='10 Kg'
                                            />
                                        </div>
                                        <div className="space-y-1 text-center">
                                            <label className="text-[10px] font-black text-slate-500 uppercase">Price</label>
                                            <input
                                                type="number"
                                                value={tier.price}
                                                onChange={(e) => {
                                                    const newPricing = [...businessPricing];
                                                    newPricing[index].price = e.target.value;
                                                    setBusinessPricing(newPricing);
                                                }}
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 outline-none text-sm font-semibold text-orange-600 text-center"
                                                placeholder="180"
                                            />
                                        </div>
                                        <div className="space-y-1 pr-6 text-center">
                                            <label className="text-[10px] font-black text-slate-500 uppercase">Stock</label>
                                            <input
                                                type="number"
                                                value={tier.stock}
                                                onChange={(e) => {
                                                    const newPricing = [...businessPricing];
                                                    newPricing[index].stock = e.target.value;
                                                    setBusinessPricing(newPricing);
                                                }}
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 outline-none text-sm font-semibold text-center"
                                                placeholder="50"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setBusinessPricing(businessPricing.filter((_, i) => i !== index))}
                                            disabled={businessPricing.length === 1}
                                            className="absolute -top-2 -right-2 bg-white border border-slate-200 p-1.5 text-slate-300 hover:text-red-500 disabled:hidden transition-all rounded-full shadow-sm hover:shadow-md opacity-0 group-hover/tier:opacity-100"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Image Upload Section */}
                    <section className="space-y-6">
                        <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
                            <ImageIcon className="w-5 h-5 text-green-600" />
                            <h4 className="font-black text-slate-900 uppercase tracking-wider text-xs">Product Media</h4>
                        </div>
                        <div className="flex items-start gap-4 overflow-x-auto pb-4 pt-2">
                            <div
                                onClick={handleImageClick}
                                className="flex-shrink-0 w-32 h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center group hover:border-green-500/50 hover:bg-green-50/30 transition-all cursor-pointer overflow-hidden p-4 relative"
                            >
                                <Upload className="w-8 h-8 text-slate-300 group-hover:text-green-500 mb-2" />
                                <span className="text-[10px] font-black text-slate-400 uppercase text-center">Add Photo</span>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageChange}
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                />
                            </div>

                            {images.map((img, index) => (
                                <div key={index} className="flex-shrink-0 w-32 h-32 relative group rounded-3xl overflow-hidden border border-slate-200">
                                    <img src={img.preview.startsWith('blob:') ? img.preview : resolveImageUrl(img.preview)} alt="Preview" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={(e) => handleRemoveImage(e, index)}
                                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-sm"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                </form>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end space-x-4">
                    <button
                        type="button"
                        onClick={() => navigate('/products')}
                        className="px-6 py-3 font-bold text-slate-600 hover:bg-slate-200/50 rounded-xl transition-all text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        onClick={handleSave}
                        className={cn(
                            "px-10 py-3 bg-green-600 text-white rounded-xl font-black text-sm shadow-lg shadow-green-600/20 hover:bg-green-700 transition-all active:scale-95 flex items-center space-x-2",
                            loading && "opacity-70 cursor-not-allowed"
                        )}
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>{loading ? (isEdit ? 'Updating...' : 'Saving...') : (isEdit ? 'Update Product' : 'Save Product')}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
