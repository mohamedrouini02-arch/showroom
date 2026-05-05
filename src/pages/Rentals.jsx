import React, { useEffect, useState } from 'react';
import { Plus, Key, CheckCircle, FileText, Pencil, Car, User, Calendar, Clock, Gauge } from 'lucide-react';
import Layout from '../components/Layout';
import { Button, Modal, Input, Select } from '../components/ui';
import { supabase } from '../lib/supabase';
import { printRentalAgreement } from '../components/RentalAgreement';

export default function Rentals() {
    const [rentals, setRentals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRentModalOpen, setIsRentModalOpen] = useState(false);
    const [editingRental, setEditingRental] = useState(null);

    // Data for dropdowns
    const [availableCars, setAvailableCars] = useState([]);

    // Form State - car selection
    const [selectedCarId, setSelectedCarId] = useState('');
    const [selectedCar, setSelectedCar] = useState(null);

    // Form State - inline customer
    const [customerData, setCustomerData] = useState({
        name: '', phone: '', address: '', national_id: ''
    });

    // Form State - rental details
    const [rentData, setRentData] = useState({
        startDate: '', endDate: '', dailyRate: '', mileageOut: '', pickupTime: ''
    });

    useEffect(() => {
        fetchRentals();
        fetchAvailableCars();
    }, []);

    const fetchRentals = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('rentals')
            .select('*, cars(make, model, year, color, vin, fuel, transmission, mileage), customers(name, phone, address, national_id)')
            .order('created_at', { ascending: false });

        if (error) console.error('Error fetching rentals:', error);
        else setRentals(data || []);
        setLoading(false);
    };

    const fetchAvailableCars = async () => {
        const { data: cars } = await supabase.from('cars').select('*').eq('status', 'Available');
        setAvailableCars(cars || []);
    };

    const handleCarSelect = (carId) => {
        const car = availableCars.find(c => c.id === carId);
        setSelectedCarId(carId);
        setSelectedCar(car);
        if (car) {
            setRentData(prev => ({
                ...prev,
                dailyRate: prev.dailyRate || Math.round(car.price / 100),
                mileageOut: car.mileage || ''
            }));
        }
    };

    const openNewRentalModal = () => {
        setEditingRental(null);
        setSelectedCarId('');
        setSelectedCar(null);
        setCustomerData({ name: '', phone: '', address: '', national_id: '' });
        setRentData({ startDate: '', endDate: '', dailyRate: '', mileageOut: '', pickupTime: '' });
        setIsRentModalOpen(true);
    };

    const openEditModal = (rental) => {
        setEditingRental(rental);
        setSelectedCarId(rental.car_id);
        setSelectedCar(rental.cars);
        setCustomerData({
            name: rental.customers?.name || '',
            phone: rental.customers?.phone || '',
            address: rental.customers?.address || '',
            national_id: rental.customers?.national_id || ''
        });
        setRentData({
            startDate: rental.start_date || '',
            endDate: rental.end_date || '',
            dailyRate: rental.daily_rate || '',
            mileageOut: rental.mileage_out || '',
            pickupTime: rental.pickup_time || ''
        });
        setIsRentModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const start = new Date(rentData.startDate);
            const end = new Date(rentData.endDate);
            const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24));
            const totalCost = diffDays * Number(rentData.dailyRate);

            if (editingRental) {
                // Update existing rental
                // Update customer info
                if (editingRental.customer_id) {
                    await supabase.from('customers').update({
                        name: customerData.name,
                        phone: customerData.phone,
                        address: customerData.address,
                        national_id: customerData.national_id
                    }).eq('id', editingRental.customer_id);
                }

                const { error } = await supabase.from('rentals').update({
                    start_date: rentData.startDate,
                    end_date: rentData.endDate,
                    pickup_time: rentData.pickupTime || null,
                    daily_rate: Number(rentData.dailyRate),
                    total_cost: totalCost,
                    mileage_out: rentData.mileageOut ? Number(rentData.mileageOut) : null,
                }).eq('id', editingRental.id);

                if (error) throw error;
            } else {
                // Create customer first
                const { data: newCustomer, error: custError } = await supabase
                    .from('customers')
                    .insert([{
                        name: customerData.name,
                        phone: customerData.phone,
                        address: customerData.address,
                        national_id: customerData.national_id
                    }])
                    .select()
                    .single();

                if (custError) throw custError;

                // Create rental
                const { error: rentError } = await supabase.from('rentals').insert([{
                    car_id: selectedCarId,
                    customer_id: newCustomer.id,
                    start_date: rentData.startDate,
                    end_date: rentData.endDate,
                    pickup_time: rentData.pickupTime || null,
                    daily_rate: Number(rentData.dailyRate),
                    total_cost: totalCost,
                    mileage_out: rentData.mileageOut ? Number(rentData.mileageOut) : null,
                    status: 'Active'
                }]);

                if (rentError) throw rentError;

                // Update car status
                await supabase.from('cars').update({ status: 'Rented' }).eq('id', selectedCarId);
            }

            setIsRentModalOpen(false);
            fetchRentals();
            fetchAvailableCars();
        } catch (error) {
            console.error('Error processing rental:', error);
            alert('Failed to process rental.');
        }
    };

    const handleReturn = async (rental) => {
        if (!confirm('Confirm return of vehicle?')) return;
        try {
            await supabase.from('rentals').update({ status: 'Returned', returned_at: new Date().toISOString() }).eq('id', rental.id);
            await supabase.from('cars').update({ status: 'Available' }).eq('id', rental.car_id);
            fetchRentals();
            fetchAvailableCars();
        } catch (error) {
            console.error('Error returning vehicle:', error);
            alert('Failed to return vehicle.');
        }
    };

    const handlePrintAgreement = (rental) => {
        printRentalAgreement(rental, rental.cars, rental.customers);
    };

    const formatMoney = (amount) => `${Number(amount).toLocaleString()} DA`;

    return (
        <Layout title="Rentals">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">Rental History</h2>
                    <Button onClick={openNewRentalModal} icon={Plus}>New Rental</Button>
                </div>

                {/* Rentals Table */}
                <div className="glass rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-800/50">
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Vehicle</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Dates</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Pickup</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Total</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/30">
                                {rentals.map(r => (
                                    <tr key={r.id} className="hover:bg-slate-800/20 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${r.status === 'Active'
                                                ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                                                : 'bg-slate-800 text-slate-500 border border-slate-700/50'}`}>
                                                {r.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-white text-sm">
                                            {r.cars?.year} {r.cars?.make} {r.cars?.model}
                                        </td>
                                        <td className="px-6 py-4 text-slate-400 text-sm">{r.customers?.name}</td>
                                        <td className="px-6 py-4 text-xs text-slate-500">
                                            {new Date(r.start_date).toLocaleDateString()} → {new Date(r.end_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-500">
                                            {r.pickup_time ? r.pickup_time.slice(0, 5) : '—'}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-emerald-400 text-sm">{formatMoney(r.total_cost)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button size="sm" variant="ghost" onClick={() => openEditModal(r)} icon={Pencil} />
                                                <Button size="sm" variant="ghost" onClick={() => handlePrintAgreement(r)} icon={FileText} />
                                                {r.status === 'Active' && (
                                                    <Button size="sm" variant="outline" onClick={() => handleReturn(r)} icon={CheckCircle}>Return</Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {rentals.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-16 text-center text-slate-600">No rental records found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* New/Edit Rental Modal */}
                <Modal isOpen={isRentModalOpen} onClose={() => setIsRentModalOpen(false)} title={editingRental ? 'Edit Rental' : 'New Rental'} size="lg">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Step 1: Select Car (only for new rentals) */}
                        {!editingRental && (
                            <div>
                                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                    <Car size={16} className="text-brand-400" /> Select Vehicle
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
                                    {availableCars.map(car => (
                                        <button
                                            key={car.id}
                                            type="button"
                                            onClick={() => handleCarSelect(car.id)}
                                            className={`text-left p-4 rounded-xl border transition-all ${
                                                selectedCarId === car.id
                                                    ? 'border-brand-500 bg-brand-500/10 ring-1 ring-brand-500/30'
                                                    : 'border-slate-800 bg-slate-800/30 hover:border-slate-700 hover:bg-slate-800/50'
                                            }`}
                                        >
                                            <div className="font-semibold text-white text-sm">{car.year} {car.make} {car.model}</div>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                    <Gauge size={10} /> {car.mileage?.toLocaleString() || 0} km
                                                </span>
                                                {car.color && (
                                                    <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md">{car.color}</span>
                                                )}
                                                <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md">{car.fuel}</span>
                                                <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md">{car.transmission}</span>
                                            </div>
                                        </button>
                                    ))}
                                    {availableCars.length === 0 && (
                                        <p className="col-span-2 text-center py-8 text-slate-600 text-sm">No available cars for rental.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {editingRental && (
                            <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Vehicle</p>
                                <p className="font-semibold text-white">{selectedCar?.year} {selectedCar?.make} {selectedCar?.model}</p>
                            </div>
                        )}

                        {/* Step 2: Customer Info */}
                        {(selectedCarId || editingRental) && (
                            <div>
                                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                    <User size={16} className="text-brand-400" /> Customer Info
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input label="Full Name" value={customerData.name} onChange={e => setCustomerData({ ...customerData, name: e.target.value })} required placeholder="Customer name" />
                                    <Input label="Phone" type="tel" value={customerData.phone} onChange={e => setCustomerData({ ...customerData, phone: e.target.value })} required placeholder="0550..." />
                                    <Input label="Address" value={customerData.address} onChange={e => setCustomerData({ ...customerData, address: e.target.value })} placeholder="City, area" />
                                    <Input label="National ID / License" value={customerData.national_id} onChange={e => setCustomerData({ ...customerData, national_id: e.target.value })} required />
                                </div>
                            </div>
                        )}

                        {/* Step 3: Rental Details */}
                        {(selectedCarId || editingRental) && (
                            <div>
                                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                    <Calendar size={16} className="text-brand-400" /> Rental Details
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <Input label="Start Date" type="date" value={rentData.startDate} onChange={e => setRentData({ ...rentData, startDate: e.target.value })} required />
                                    <Input label="End Date" type="date" value={rentData.endDate} onChange={e => setRentData({ ...rentData, endDate: e.target.value })} required />
                                    <Input label="Pickup Time" type="time" value={rentData.pickupTime} onChange={e => setRentData({ ...rentData, pickupTime: e.target.value })} />
                                    <Input label="Daily Rate (DA)" type="number" value={rentData.dailyRate} onChange={e => setRentData({ ...rentData, dailyRate: e.target.value })} required />
                                    <Input label="Mileage at Pickup" type="number" value={rentData.mileageOut} onChange={e => setRentData({ ...rentData, mileageOut: e.target.value })} />
                                </div>

                                {/* Cost Preview */}
                                {rentData.startDate && rentData.endDate && rentData.dailyRate && (
                                    <div className="mt-4 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-slate-400">
                                                {Math.ceil(Math.abs(new Date(rentData.endDate) - new Date(rentData.startDate)) / (1000 * 60 * 60 * 24))} days × {formatMoney(rentData.dailyRate)}
                                            </span>
                                            <span className="text-lg font-bold text-emerald-400">
                                                {formatMoney(Math.ceil(Math.abs(new Date(rentData.endDate) - new Date(rentData.startDate)) / (1000 * 60 * 60 * 24)) * Number(rentData.dailyRate))}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {(selectedCarId || editingRental) && (
                            <div className="flex justify-end pt-2">
                                <Button type="submit" size="lg">{editingRental ? 'Save Changes' : 'Create Rental'}</Button>
                            </div>
                        )}
                    </form>
                </Modal>
            </div>
        </Layout>
    );
}
