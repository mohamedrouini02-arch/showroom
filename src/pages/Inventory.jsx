import React, { useEffect, useState } from 'react';
import {
    Plus,
    Trash2,
    DollarSign,
    Car,
    PenTool,
    AlertTriangle,
    XCircle
} from 'lucide-react';
import Layout from '../components/Layout';
import { Button, Modal, Input, Select } from '../components/ui';
import { supabase } from '../lib/supabase';

export default function Inventory() {
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddCarOpen, setIsAddCarOpen] = useState(false);

    // Form State
    const initialCarState = {
        make: '', model: '', year: new Date().getFullYear(),
        buying_price: '', price: '', status: 'Available', type: 'Sedan',
        mileage: '', color: '', transmission: 'Automatic', fuel: 'Petrol', vin: '',
        damages: []
    };
    const [newCar, setNewCar] = useState(initialCarState);
    const [tempDamage, setTempDamage] = useState({ area: 'Front Bumper', description: '' });

    useEffect(() => {
        fetchCars();
    }, []);

    const fetchCars = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('cars')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) console.error('Error fetching cars:', error);
        else setCars(data || []);
        setLoading(false);
    };

    const handleAddCar = async (e) => {
        e.preventDefault();
        try {
            const { error } = await supabase.from('cars').insert([{
                ...newCar,
                price: Number(newCar.price),
                buying_price: Number(newCar.buying_price),
                mileage: Number(newCar.mileage),
                year: Number(newCar.year),
                damages: newCar.damages // Supabase handles JSONB automatically
            }]);

            if (error) throw error;

            setIsAddCarOpen(false);
            setNewCar(initialCarState);
            fetchCars();
        } catch (error) {
            console.error('Error adding car:', error);
            alert('Failed to add car. See console for details.');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this vehicle?')) return;
        const { error } = await supabase.from('cars').delete().eq('id', id);
        if (error) console.error('Error deleting car:', error);
        else fetchCars();
    };

    const addDamage = () => {
        if (tempDamage.description) {
            setNewCar({ ...newCar, damages: [...newCar.damages, tempDamage] });
            setTempDamage({ ...tempDamage, description: '' });
        }
    };

    const removeDamage = (index) => {
        const updated = [...newCar.damages];
        updated.splice(index, 1);
        setNewCar({ ...newCar, damages: updated });
    };

    const formatMoney = (amount) => `${Number(amount).toLocaleString()} DA`;

    return (
        <Layout title="Inventory">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Vehicle Inventory</h2>
                    <Button onClick={() => setIsAddCarOpen(true)} icon={Plus}>Add Vehicle</Button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {cars.map(car => (
                            <div key={car.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                                <div className="p-5 flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{car.year} {car.make} {car.model}</h3>
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${car.status === 'Available' ? 'bg-green-100 text-green-700' :
                                                car.status === 'Sold' ? 'bg-red-100 text-red-700' :
                                                    'bg-orange-100 text-orange-700'
                                            }`}>{car.status}</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-y-2 text-sm text-slate-600 dark:text-slate-400 mb-4">
                                        <div className="flex items-center"><DollarSign size={14} className="mr-1" /> Buy: {formatMoney(car.buying_price)}</div>
                                        <div className="flex items-center"><DollarSign size={14} className="mr-1 text-green-500" /> Sell: {formatMoney(car.price)}</div>
                                        <div className="flex items-center"><Car size={14} className="mr-1" /> {car.mileage} km</div>
                                        <div className="flex items-center"><PenTool size={14} className="mr-1" /> {car.transmission}</div>
                                    </div>

                                    {car.damages && car.damages.length > 0 && (
                                        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg mb-4">
                                            <p className="text-xs font-bold text-red-600 mb-1 flex items-center"><AlertTriangle size={12} className="mr-1" /> Damage Report</p>
                                            <ul className="text-xs text-red-700 dark:text-red-300 list-disc list-inside">
                                                {car.damages.map((d, i) => <li key={i}>{d.area}: {d.description}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                                    {/* Actions like Sell/Rent will be handled in Sales/Rentals pages or via modals here later if needed */}
                                    <div className="text-xs text-slate-400">ID: {car.id.slice(0, 8)}...</div>
                                    <button onClick={() => handleDelete(car.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={18} /></button>
                                </div>
                            </div>
                        ))}
                        {cars.length === 0 && <p className="text-slate-500 col-span-full text-center py-10">No vehicles found. Add one to get started.</p>}
                    </div>
                )}

                {/* Add Car Modal */}
                <Modal isOpen={isAddCarOpen} onClose={() => setIsAddCarOpen(false)} title="Add Vehicle to Inventory" size="lg">
                    <form onSubmit={handleAddCar} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input label="Make" value={newCar.make} onChange={e => setNewCar({ ...newCar, make: e.target.value })} required placeholder="e.g. Toyota" />
                            <Input label="Model" value={newCar.model} onChange={e => setNewCar({ ...newCar, model: e.target.value })} required placeholder="e.g. Hilux" />
                            <Input label="Year" type="number" value={newCar.year} onChange={e => setNewCar({ ...newCar, year: e.target.value })} required />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Select label="Type" value={newCar.type} onChange={e => setNewCar({ ...newCar, type: e.target.value })} options={[
                                { label: 'Sedan', value: 'Sedan' }, { label: 'SUV', value: 'SUV' }, { label: 'Truck', value: 'Truck' }, { label: 'Hatchback', value: 'Hatchback' }
                            ]} />
                            <Select label="Transmission" value={newCar.transmission} onChange={e => setNewCar({ ...newCar, transmission: e.target.value })} options={[
                                { label: 'Automatic', value: 'Automatic' }, { label: 'Manual', value: 'Manual' }
                            ]} />
                            <Select label="Fuel" value={newCar.fuel} onChange={e => setNewCar({ ...newCar, fuel: e.target.value })} options={[
                                { label: 'Petrol', value: 'Petrol' }, { label: 'Diesel', value: 'Diesel' }, { label: 'Hybrid', value: 'Hybrid' }, { label: 'LPG', value: 'LPG' }
                            ]} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input label="Color" value={newCar.color} onChange={e => setNewCar({ ...newCar, color: e.target.value })} placeholder="e.g. White" />
                            <Input label="Mileage (km)" type="number" value={newCar.mileage} onChange={e => setNewCar({ ...newCar, mileage: e.target.value })} placeholder="e.g. 50000" />
                            <Input label="VIN" value={newCar.vin} onChange={e => setNewCar({ ...newCar, vin: e.target.value })} placeholder="Optional" />
                        </div>

                        <hr className="border-slate-200 dark:border-slate-700" />

                        <h3 className="font-semibold text-slate-800 dark:text-white flex items-center"><DollarSign size={18} className="mr-2" /> Financials</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Buying Price (DA)" type="number" value={newCar.buying_price} onChange={e => setNewCar({ ...newCar, buying_price: e.target.value })} required className="bg-red-50 dark:bg-red-900/10" placeholder="Cost to showroom" />
                            <Input label="Selling Price (DA)" type="number" value={newCar.price} onChange={e => setNewCar({ ...newCar, price: e.target.value })} required className="bg-green-50 dark:bg-green-900/10" placeholder="Listing price" />
                        </div>

                        <hr className="border-slate-200 dark:border-slate-700" />

                        <h3 className="font-semibold text-slate-800 dark:text-white flex items-center"><AlertTriangle size={18} className="mr-2" /> Condition & Damages</h3>
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                            <div className="flex gap-2 mb-2">
                                <Select label="Area" className="mb-0 flex-1" value={tempDamage.area} onChange={e => setTempDamage({ ...tempDamage, area: e.target.value })} options={[
                                    { label: 'Front Bumper', value: 'Front Bumper' }, { label: 'Rear Bumper', value: 'Rear Bumper' },
                                    { label: 'Left Doors', value: 'Left Doors' }, { label: 'Right Doors', value: 'Right Doors' },
                                    { label: 'Hood', value: 'Hood' }, { label: 'Roof', value: 'Roof' }, { label: 'Interior', value: 'Interior' },
                                    { label: 'Engine', value: 'Engine' }, { label: 'Wheels', value: 'Wheels' }
                                ]} />
                                <Input label="Description" className="mb-0 flex-[2]" value={tempDamage.description} onChange={e => setTempDamage({ ...tempDamage, description: e.target.value })} placeholder="e.g. Deep scratch" />
                                <div className="mt-6">
                                    <Button type="button" onClick={addDamage} size="sm" icon={Plus}>Add</Button>
                                </div>
                            </div>

                            {newCar.damages.length > 0 && (
                                <div className="mt-3 space-y-2">
                                    {newCar.damages.map((d, i) => (
                                        <div key={i} className="flex justify-between items-center bg-white dark:bg-slate-700 p-2 rounded border border-slate-200 dark:border-slate-600">
                                            <span className="text-sm font-medium">{d.area}: <span className="font-normal text-slate-500 dark:text-slate-300">{d.description}</span></span>
                                            <button type="button" onClick={() => removeDamage(i)} className="text-red-500"><XCircle size={16} /></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button type="submit" size="lg">Add Vehicle</Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </Layout>
    );
}
