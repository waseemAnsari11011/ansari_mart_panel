import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, DrawingManager, Polygon, Autocomplete } from '@react-google-maps/api';
import { 
    Plus, 
    Edit2, 
    Trash2, 
    Map as MapIcon, 
    Loader2, 
    AlertCircle, 
    Search,
    X,
    CheckCircle2,
    Clock,
    ChevronLeft,
    Save,
    RotateCcw
} from 'lucide-react';
import api from '../../utils/api';

const libraries = ['drawing', 'places'];
const mapContainerStyle = {
    height: '600px',
    width: '100%',
};

const defaultCenter = {
    lat: 34.0837,
    lng: 74.7973,
};

export const DeliveryZones = () => {
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        libraries,
    });

    const [zones, setZones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // View Switching State
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingZone, setEditingZone] = useState(null); // null means adding new
    const [zoneName, setZoneName] = useState('');
    const [polygonPath, setPolygonPath] = useState([]);
    const [saving, setSaving] = useState(false);

    // Map Refs
    const [map, setMap] = useState(null);
    const [autocomplete, setAutocomplete] = useState(null);
    const drawingManagerRef = useRef(null);
    const currentPolygonRef = useRef(null);

    useEffect(() => {
        fetchZones();
    }, []);

    const fetchZones = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await api.get('/delivery-zones');
            setZones(data || []);
        } catch (err) {
            console.error('Failed to fetch zones', err);
            setError('Failed to load delivery zones.');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActive = async (zone) => {
        try {
            const { data } = await api.put(`/delivery-zones/${zone._id}`, {
                isActive: !zone.isActive
            });
            setZones(zones.map(z => z._id === data._id ? data : z));
        } catch (err) {
            console.error('Failed to toggle status', err);
            alert('Failed to update status.');
        }
    };

    const handleDeleteZone = async (id) => {
        if (!window.confirm('Are you sure you want to delete this delivery zone?')) return;
        try {
            await api.delete(`/delivery-zones/${id}`);
            setZones(zones.filter(z => z._id !== id));
        } catch (err) {
            console.error('Failed to delete zone', err);
            alert('Failed to delete zone.');
        }
    };

    const openEditor = (zone = null) => {
        if (zone) {
            setEditingZone(zone);
            setZoneName(zone.name);
            const path = zone.area.coordinates[0].map(coord => ({
                lng: coord[0],
                lat: coord[1],
            }));
            if (path.length > 1 && path[0].lat === path[path.length - 1].lat && path[0].lng === path[path.length - 1].lng) {
                path.pop();
            }
            setPolygonPath(path);
        } else {
            setEditingZone(null);
            setZoneName('');
            setPolygonPath([]);
        }
        setIsEditorOpen(true);
    };

    const closeEditor = () => {
        setIsEditorOpen(false);
        setEditingZone(null);
        setZoneName('');
        setPolygonPath([]);
        if (currentPolygonRef.current) {
            currentPolygonRef.current.setMap(null);
            currentPolygonRef.current = null;
        }
    };

    const onPolygonComplete = useCallback((polygon) => {
        if (currentPolygonRef.current) {
            currentPolygonRef.current.setMap(null);
        }
        currentPolygonRef.current = polygon;
        const path = polygon.getPath().getArray().map(p => ({
            lat: p.lat(),
            lng: p.lng(),
        }));
        setPolygonPath(path);
        if (drawingManagerRef.current) {
            drawingManagerRef.current.setDrawingMode(null);
        }
    }, []);

    const onPolygonEdit = useCallback(() => {
        if (currentPolygonRef.current) {
            const path = currentPolygonRef.current.getPath().getArray().map(p => ({
                lat: p.lat(),
                lng: p.lng(),
            }));
            setPolygonPath(path);
        }
    }, []);

    const handleSaveZone = async () => {
        if (!zoneName.trim()) return alert('Please enter a zone name.');
        if (polygonPath.length < 3) return alert('Please draw a valid area on the map.');

        const coordinates = [polygonPath.map(p => [p.lng, p.lat])];
        coordinates[0].push(coordinates[0][0]); // Close polygon

        setSaving(true);
        try {
            if (editingZone) {
                await api.put(`/delivery-zones/${editingZone._id}`, {
                    name: zoneName,
                    coordinates
                });
            } else {
                await api.post('/delivery-zones', {
                    name: zoneName,
                    coordinates
                });
            }
            alert('Zone saved successfully!');
            fetchZones();
            closeEditor();
        } catch (err) {
            console.error('Save failed', err);
            alert('Failed to save zone.');
        } finally {
            setSaving(false);
        }
    };

    // Google Map Helpers
    const onMapLoad = useCallback((mapInstance) => {
        setMap(mapInstance);
        if (polygonPath.length > 0) {
            const bounds = new google.maps.LatLngBounds();
            polygonPath.forEach(p => bounds.extend(p));
            mapInstance.fitBounds(bounds);
        }
    }, [polygonPath]);

    const onPlaceChanged = () => {
        if (autocomplete) {
            const place = autocomplete.getPlace();
            if (place.geometry && place.geometry.location) {
                map.panTo(place.geometry.location);
                map.setZoom(15);
            }
        }
    };

    if (loadError) return <div className="p-10 text-red-600">Map Error: {loadError.message}</div>;

    if (!isEditorOpen) {
        return (
            <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
                {/* List Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                            <MapIcon className="w-8 h-8 text-green-600" />
                            Delivery Zones
                        </h1>
                        <p className="text-slate-500 font-medium mt-1">Manage multiple named delivery areas and restrictions.</p>
                    </div>
                    <button 
                        onClick={() => openEditor()}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-2xl shadow-lg shadow-green-600/20 transition-all font-bold group"
                    >
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                        <span>Add New Zone</span>
                    </button>
                </div>

                {loading && !zones.length ? (
                    <div className="flex h-64 items-center justify-center">
                        <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Zone Name</th>
                                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {zones.length === 0 ? (
                                        <tr>
                                            <td colSpan="3" className="px-6 py-12 text-center">
                                                <div className="flex flex-col items-center">
                                                    <div className="p-4 bg-slate-50 rounded-full mb-3">
                                                        <MapIcon className="w-8 h-8 text-slate-300" />
                                                    </div>
                                                    <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No zones defined yet</p>
                                                    <p className="text-slate-400 text-sm mt-1">All orders are currently being allowed.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        zones.map((zone) => (
                                            <tr key={zone._id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-2 h-2 rounded-full ${zone.isActive ? 'bg-green-500' : 'bg-slate-300'}`} />
                                                        <span className="font-bold text-slate-700">{zone.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <button 
                                                        onClick={() => handleToggleActive(zone)}
                                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                                            zone.isActive 
                                                                ? 'bg-green-100 text-green-700 border border-green-200 cursor-pointer hover:bg-green-200' 
                                                                : 'bg-slate-100 text-slate-600 border border-slate-200 cursor-pointer hover:bg-slate-200'
                                                        }`}
                                                    >
                                                        {zone.isActive ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                                        {zone.isActive ? 'Active' : 'Inactive'}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-5 text-right space-x-2">
                                                    <button 
                                                        onClick={() => openEditor(zone)}
                                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                        title="Edit Zone"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteZone(zone._id)}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Delete Zone"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // In-Place Editor View
    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Editor Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={closeEditor}
                        className="p-3 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 transition-all shadow-sm"
                        title="Back to List"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900">
                            {editingZone ? 'Edit Zone' : 'New Zone'}
                        </h1>
                        <p className="text-slate-500 font-medium">Define the serviceable boundary on the map.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={closeEditor}
                        className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 transition-all font-bold"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSaveZone}
                        disabled={saving}
                        className="flex items-center justify-center gap-2 px-10 py-3 bg-green-600 hover:bg-green-700 text-white rounded-2xl shadow-xl shadow-green-600/20 transition-all font-black disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        <span>{editingZone ? 'Update Zone' : 'Create Zone'}</span>
                    </button>
                </div>
            </div>

            {/* Editor Form & Map Card */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm p-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-wide">Zone Name</label>
                            <input 
                                type="text" 
                                value={zoneName}
                                onChange={(e) => setZoneName(e.target.value)}
                                placeholder="e.g. Hajipur Branch"
                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-green-600/10 focus:border-green-600 outline-none transition-all font-bold"
                            />
                        </div>
                        
                        <div className="bg-green-50/50 border border-green-100 p-5 rounded-3xl">
                            <h4 className="text-sm font-black text-green-900 flex items-center gap-2 mb-3">
                                <AlertCircle className="w-4 h-4" />
                                Drawing Guide
                            </h4>
                            <ul className="text-xs text-green-800 space-y-2 font-medium leading-relaxed">
                                <li className="flex gap-2"><span>1.</span><span>Select the **Polygon Tool** at the top center of the map.</span></li>
                                <li className="flex gap-2"><span>2.</span><span>Click on the map to start creating points for your boundary.</span></li>
                                <li className="flex gap-2"><span>3.</span><span>Click back on the first point or double-click to close.</span></li>
                                <li className="flex gap-2"><span>4.</span><span>You can drag the white points to refine the boundary perfectly.</span></li>
                            </ul>
                            <button 
                                onClick={setPolygonPath.bind(null, [])}
                                className="mt-4 flex items-center gap-2 text-xs font-black text-red-600 hover:text-red-700 uppercase tracking-widest"
                            >
                                <RotateCcw className="w-3 h-3" />
                                Clear Drawing
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-sm font-black text-slate-700 uppercase tracking-wide">Search & Jump to Location</label>
                        <Autocomplete
                            onLoad={setAutocomplete}
                            onPlaceChanged={onPlaceChanged}
                        >
                            <div className="relative">
                                <input 
                                    type="text" 
                                    placeholder="Search city, area or landmark..."
                                    className="w-full pl-12 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 outline-none transition-all font-bold"
                                />
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            </div>
                        </Autocomplete>
                    </div>
                </div>

                <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
                    {isLoaded && (
                        <GoogleMap
                            mapContainerStyle={mapContainerStyle}
                            center={defaultCenter}
                            zoom={12}
                            onLoad={onMapLoad}
                            options={{
                                disableDefaultUI: false,
                                mapTypeControl: false,
                                streetViewControl: false,
                                fullscreenControl: false,
                            }}
                        >
                            <DrawingManager
                                onLoad={dm => (drawingManagerRef.current = dm)}
                                onPolygonComplete={onPolygonComplete}
                                drawingMode={polygonPath.length === 0 ? 'polygon' : null}
                                options={{
                                    drawingControl: true,
                                    drawingControlOptions: {
                                        position: google.maps.ControlPosition.TOP_CENTER,
                                        drawingModes: ['polygon'],
                                    },
                                    polygonOptions: {
                                        fillColor: '#16a34a',
                                        fillOpacity: 0.3,
                                        strokeWeight: 3,
                                        clickable: true,
                                        editable: true,
                                        zIndex: 1,
                                        strokeColor: '#16a34a',
                                    },
                                }}
                            />
                            {polygonPath.length > 0 && (
                                <Polygon
                                    path={polygonPath}
                                    onLoad={p => (currentPolygonRef.current = p)}
                                    onMouseUp={onPolygonEdit}
                                    onDragEnd={onPolygonEdit}
                                    options={{
                                        fillColor: '#16a34a',
                                        fillOpacity: 0.3,
                                        strokeWeight: 3,
                                        strokeColor: '#16a34a',
                                        editable: true,
                                    }}
                                />
                            )}
                        </GoogleMap>
                    )}
                </div>
            </div>
        </div>
    );
};
