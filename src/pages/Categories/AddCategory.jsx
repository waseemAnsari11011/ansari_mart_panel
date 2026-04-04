import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    X,
    Info,
    Save,
    Image as ImageIcon,
    Upload,
    Loader2
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import api, { resolveImageUrl } from '../../utils/api';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export const AddCategory = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('Active');
    const [image, setImage] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const isEdit = !!id;

    useEffect(() => {
        if (isEdit) {
            fetchCategory();
        }
    }, [id]);

    const fetchCategory = async () => {
        setFetching(true);
        try {
            const { data } = await api.get(`/categories/${id}`);
            setName(data.name);
            setDescription(data.description);
            setStatus(data.status || 'Active');
            setImage(data.image); // This will now be a relative path like /uploads/xyz.jpg
        } catch (err) {
            setError('Failed to fetch category details');
        } finally {
            setFetching(false);
        }
    };

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            // Only for preview in UI
            const previewUrl = URL.createObjectURL(file);
            setImage(previewUrl);
        }
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError('');

        try {
            let imageUrl = image || 'https://placehold.co/500x500?text=Category';

            // If a new file was selected, upload it first
            if (imageFile) {
                const formData = new FormData();
                formData.append('image', imageFile);
                const uploadRes = await api.post('/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                imageUrl = uploadRes.data.path;
            }

            const categoryData = { 
                name, 
                description, 
                image: imageUrl,
                status
            };

            if (isEdit) {
                await api.put(`/categories/${id}`, categoryData);
            } else {
                await api.post('/categories', categoryData);
            }
            navigate('/categories');
        } catch (err) {
            setError(err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} category`);
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="min-h-[calc(100vh-120px)] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
                <p className="font-bold text-slate-500">Fetching category details...</p>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-120px)] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-100 animate-in fade-in zoom-in-95 duration-500">
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white">
                    <div>
                        <h3 className="text-xl font-black text-slate-900">{isEdit ? 'Edit Category' : 'Add New Category'}</h3>
                        <p className="text-slate-500 font-medium text-sm">Configure basic details and visibility.</p>
                    </div>
                    <button
                        onClick={() => navigate('/categories')}
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
                    
                    {/* Basic Details Section */}
                    <section className="space-y-6">
                        <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
                            <Info className="w-5 h-5 text-green-600" />
                            <h4 className="font-black text-slate-900 uppercase tracking-wider text-xs">Basic Information</h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Category Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Fresh Vegetables"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-medium text-sm"
                                    required
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-bold text-slate-700">Description</label>
                                <textarea
                                    rows={3}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Provide details about the category..."
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-medium resize-none text-sm"
                                ></textarea>
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-bold text-slate-700 block mb-2">Category Image</label>
                                <div className="flex items-center space-x-6">
                                    <div 
                                        onClick={handleImageClick}
                                        className="w-24 h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center group hover:border-green-500/50 hover:bg-green-50/30 transition-all cursor-pointer overflow-hidden relative"
                                    >
                                        {image ? (
                                            <img src={image.startsWith('blob:') ? image : resolveImageUrl(image)} className="w-full h-full object-cover" alt="Preview" />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center p-4 text-center">
                                                <Upload className="w-6 h-6 text-slate-300 group-hover:text-green-500 mb-1" />
                                                <span className="text-[10px] font-black text-slate-400 uppercase">Upload</span>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleImageChange}
                                            accept="image/*"
                                            className="hidden"
                                        />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className="text-xs font-bold text-slate-900">Recommended: 500x500px</p>
                                        <p className="text-[11px] font-medium text-slate-500">JPG or PNG. Max size 2MB.</p>
                                        {image && (
                                            <button 
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setImage(null);
                                                }}
                                                className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:text-red-600 mt-2 block"
                                            >
                                                Remove Image
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 block mb-2">Status</label>
                                <div className="flex p-1 bg-slate-100 rounded-xl w-fit">
                                    <button
                                        type="button"
                                        onClick={() => setStatus('Active')}
                                        className={cn(
                                            "px-6 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                                            status === 'Active' ? "bg-white text-green-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                        )}
                                    >
                                        Active
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStatus('Inactive')}
                                        className={cn(
                                            "px-6 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                                            status === 'Inactive' ? "bg-white text-slate-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                        )}
                                    >
                                        Inactive
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>
                </form>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end space-x-4">
                    <button
                        type="button"
                        onClick={() => navigate('/categories')}
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
                        <span>{loading ? 'Saving...' : 'Save Category'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
