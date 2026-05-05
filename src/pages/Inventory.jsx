import React, { useEffect, useState } from 'react';
import {
    Plus,
    Trash2,
    DollarSign,
    Car,
    PenTool,
    AlertTriangle,
    XCircle,
    Pencil,
    ChevronLeft,
    ChevronRight,
    Gauge,
    Fuel
} from 'lucide-react';
import Layout from '../components/Layout';
import { Button, Modal, Input, Select } from '../components/ui';
import ImageUpload from '../components/ImageUpload';
import { supabase } from '../lib/supabase';

export default function Inventory() {
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCar, setEditingCar] = useState(null);

    const initialCarState = {
        make: '', model: '', year: new Date().getFullYear(),
        buying_price: '', price: '', status: 'Available', type: 'Sedan',
        mileage: '', color: '', transmission: 'Automatic', fuel: 'Petrol', vin: '',
        damages: [], photos: []
    };
    const [formData, setFormData] = useState(initialCarState);
    const [tempDamage, setTempDamage] = useState({ area: 'Front Bumper', description: '' });

    useEffect(() => { fetchCars(); }, []);

    const fetchCars = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('cars').select('*, rentals(total_cost)').order('created_at', { ascending: false });
        if (error) console.error('Error fetching cars:', error);
        else setCars(data || []);
        setLoading(false);
    };

    const openAddModal = () => { setEditingCar(null); setFormData(initialCarState); setIsModalOpen(true); };

    const openEditModal = (car) => {
        setEditingCar(car);
        setFormData({
            make: car.make || '', model: car.model || '', year: car.year || new Date().getFullYear(),
            buying_price: car.buying_price || '', price: car.price || '', status: car.status || 'Available',
            type: car.type || 'Sedan', mileage: car.mileage || '', color: car.color || '',
            transmission: car.transmission || 'Automatic', fuel: car.fuel || 'Petrol',
            vin: car.vin || '', damages: car.damages || [], photos: car.photos || []
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                make: formData.make, model: formData.model, year: Number(formData.year),
                buying_price: Number(formData.buying_price), price: Number(formData.price),
                status: formData.status, type: formData.type, mileage: Number(formData.mileage) || 0,
                color: formData.color, transmission: formData.transmission, fuel: formData.fuel,
                vin: formData.vin, damages: formData.damages, photos: formData.photos
            };
            if (editingCar) {
                const { error } = await supabase.from('cars').update(payload).eq('id', editingCar.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('cars').insert([payload]);
                if (error) throw error;
            }
            setIsModalOpen(false); setFormData(initialCarState); setEditingCar(null); fetchCars();
        } catch (error) { console.error('Error saving car:', error); alert('Failed to save car.'); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this vehicle?')) return;
        const { error } = await supabase.from('cars').delete().eq('id', id);
        if (!error) fetchCars();
    };

    const addDamage = () => {
        if (tempDamage.description) {
            setFormData({ ...formData, damages: [...formData.damages, tempDamage] });
            setTempDamage({ ...tempDamage, description: '' });
        }
    };

    const removeDamage = (i) => {
        const updated = [...formData.damages]; updated.splice(i, 1);
        setFormData({ ...formData, damages: updated });
    };

    const formatMoney = (amount) => `${Number(amount).toLocaleString()} DA`;
    const statusColors = {
        Available: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        Sold: 'bg-red-500/10 text-red-400 border-red-500/20',
        Rented: 'bg-orange-500/10 text-orange-400 border-orange-500/20'
    };

    return (
        <Layout title="Inventory">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">Vehicle Inventory</h2>
                    <Button onClick={openAddModal} icon={Plus}>Add Vehicle</Button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center animate-pulse-soft">
                            <Car className="text-brand-400" size={20} />
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {cars.map(car => {
                            const rentalEarnings = car.rentals?.reduce((sum, r) => sum + (Number(r.total_cost) || 0), 0) || 0;
                            return (
                            <div key={car.id} className="glass rounded-2xl overflow-hidden group hover:border-slate-700/50 transition-all">
                                {car.photos && car.photos.length > 0 && <CarPhotoCarousel photos={car.photos} />}

                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="font-bold text-white">{car.year} {car.make} {car.model}</h3>
                                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${statusColors[car.status] || statusColors.Available}`}>
                                            {car.status}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mb-4">
                                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                            <DollarSign size={12} className="text-red-400" /> {formatMoney(car.buying_price)}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                            <DollarSign size={12} className="text-emerald-400" /> {formatMoney(car.price)}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                            <Gauge size={12} /> {car.mileage?.toLocaleString() || 0} km
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                            <Fuel size={12} /> {car.fuel} · {car.transmission}
                                        </div>
                                    </div>

                                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl mb-4 flex justify-between items-center">
                                        <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                                            <DollarSign size={14} /> Rental Earnings
                                        </span>
                                        <span className="text-sm font-bold text-emerald-400">{formatMoney(rentalEarnings)}</span>
                                    </div>

                                    {car.damages?.length > 0 && (
                                        <div className="bg-red-500/5 border border-red-500/10 p-3 rounded-xl mb-4">
                                            <p className="text-xs font-bold text-red-400 mb-1 flex items-center gap-1"><AlertTriangle size={12} /> Damages</p>
                                            <ul className="text-xs text-red-300/70 list-disc list-inside">
                                                {car.damages.map((d, i) => <li key={i}>{d.area}: {d.description}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                <div className="px-5 py-3 border-t border-slate-800/30 flex justify-between items-center">
                                    <span className="text-xs text-slate-600 font-mono">{car.id.slice(0, 8)}</span>
                                    <div className="flex gap-1">
                                        <button onClick={() => openEditModal(car)} className="p-2 text-slate-600 hover:text-brand-400 transition-colors rounded-lg hover:bg-slate-800/50"><Pencil size={16} /></button>
                                        <button onClick={() => handleDelete(car.id)} className="p-2 text-slate-600 hover:text-red-400 transition-colors rounded-lg hover:bg-slate-800/50"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            </div>
                            );
                        })}
                        {cars.length === 0 && <p className="text-slate-600 col-span-full text-center py-20">No vehicles found. Add one to get started.</p>}
                    </div>
                )}

                <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingCar(null); }} title={editingCar ? 'Edit Vehicle' : 'Add Vehicle'} size="lg">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input label="Make" value={formData.make} onChange={e => setFormData({ ...formData, make: e.target.value })} required placeholder="e.g. Toyota" />
                            <Input label="Model" value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} required placeholder="e.g. Hilux" />
                            <Input label="Year" type="number" value={formData.year} onChange={e => setFormData({ ...formData, year: e.target.value })} required />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Select label="Type" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} options={[{ label: 'Sedan', value: 'Sedan' }, { label: 'SUV', value: 'SUV' }, { label: 'Truck', value: 'Truck' }, { label: 'Hatchback', value: 'Hatchback' }]} />
                            <Select label="Transmission" value={formData.transmission} onChange={e => setFormData({ ...formData, transmission: e.target.value })} options={[{ label: 'Automatic', value: 'Automatic' }, { label: 'Manual', value: 'Manual' }]} />
                            <Select label="Fuel" value={formData.fuel} onChange={e => setFormData({ ...formData, fuel: e.target.value })} options={[{ label: 'Petrol', value: 'Petrol' }, { label: 'Diesel', value: 'Diesel' }, { label: 'Hybrid', value: 'Hybrid' }, { label: 'LPG', value: 'LPG' }]} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input label="Color" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} placeholder="e.g. White" />
                            <Input label="Mileage (km)" type="number" value={formData.mileage} onChange={e => setFormData({ ...formData, mileage: e.target.value })} />
                            <Input label="VIN" value={formData.vin} onChange={e => setFormData({ ...formData, vin: e.target.value })} placeholder="Optional" />
                        </div>
                        {editingCar && (
                            <Select label="Status" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} options={[{ label: 'Available', value: 'Available' }, { label: 'Sold', value: 'Sold' }, { label: 'Rented', value: 'Rented' }]} />
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Buying Price (DA)" type="number" value={formData.buying_price} onChange={e => setFormData({ ...formData, buying_price: e.target.value })} required placeholder="Cost" />
                            <Input label="Selling Price (DA)" type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} required placeholder="Listing" />
                        </div>

                        <ImageUpload bucket="vehicle-photos" folder={editingCar?.id || 'new'} multiple={true} value={formData.photos} onChange={(photos) => setFormData({ ...formData, photos })} label="Vehicle Photos" />

                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><AlertTriangle size={14} /> Damages</h3>
                            <div className="flex gap-2 mb-3">
                                <Select label="" className="mb-0 flex-1" value={tempDamage.area} onChange={e => setTempDamage({ ...tempDamage, area: e.target.value })} options={[
                                    { label: 'Front Bumper', value: 'Front Bumper' }, { label: 'Rear Bumper', value: 'Rear Bumper' },
                                    { label: 'Left Doors', value: 'Left Doors' }, { label: 'Right Doors', value: 'Right Doors' },
                                    { label: 'Hood', value: 'Hood' }, { label: 'Roof', value: 'Roof' }, { label: 'Interior', value: 'Interior' },
                                    { label: 'Engine', value: 'Engine' }, { label: 'Wheels', value: 'Wheels' }
                                ]} />
                                <Input label="" className="mb-0 flex-[2]" value={tempDamage.description} onChange={e => setTempDamage({ ...tempDamage, description: e.target.value })} placeholder="Description" />
                                <Button type="button" onClick={addDamage} size="sm" icon={Plus}>Add</Button>
                            </div>
                            {formData.damages.map((d, i) => (
                                <div key={i} className="flex justify-between items-center bg-slate-800/30 p-2.5 rounded-xl mb-2 border border-slate-700/20">
                                    <span className="text-sm text-slate-300">{d.area}: <span className="text-slate-500">{d.description}</span></span>
                                    <button type="button" onClick={() => removeDamage(i)} className="text-red-400 hover:text-red-300"><XCircle size={16} /></button>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end pt-2">
                            <Button type="submit" size="lg">{editingCar ? 'Save Changes' : 'Add Vehicle'}</Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </Layout>
    );
}

function CarPhotoCarousel({ photos }) {
    const [current, setCurrent] = useState(0);
    if (!photos?.length) return null;
    return (
        <div className="relative h-48 bg-slate-900">
            <img src={photos[current]} alt={`Vehicle ${current + 1}`} className="w-full h-full object-cover" />
            {photos.length > 1 && (
                <>
                    <button onClick={() => setCurrent((current - 1 + photos.length) % photos.length)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80"><ChevronLeft size={14} /></button>
                    <button onClick={() => setCurrent((current + 1) % photos.length)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80"><ChevronRight size={14} /></button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                        {photos.map((_, i) => <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === current ? 'bg-white' : 'bg-white/30'}`} />)}
                    </div>
                </>
            )}
        </div>
    );
}
