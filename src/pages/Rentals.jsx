import React, { useEffect, useState } from 'react';
import { Plus, Key, CheckCircle, FileText } from 'lucide-react';
import Layout from '../components/Layout';
import { Button, Modal, Input, Select } from '../components/ui';
import { supabase } from '../lib/supabase';
import { printRentalAgreement } from '../components/RentalAgreement';

export default function Rentals() {
    const [rentals, setRentals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRentModalOpen, setIsRentModalOpen] = useState(false);

    // Data for dropdowns
    const [availableCars, setAvailableCars] = useState([]);
    const [customers, setCustomers] = useState([]);

    // Form State
    const [rentData, setRentData] = useState({
        carId: '', customerId: '', startDate: '', endDate: '', dailyRate: '', mileageOut: '', pickupTime: ''
    });
    const [selectedCar, setSelectedCar] = useState(null);

    useEffect(() => {
        fetchRentals();
        fetchDropdownData();
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

    const fetchDropdownData = async () => {
        const { data: cars } = await supabase.from('cars').select('*').eq('status', 'Available');
        const { data: custs } = await supabase.from('customers').select('*');

        setAvailableCars(cars || []);
        setCustomers(custs || []);
    };

    const handleCarSelect = (e) => {
        const carId = e.target.value;
        const car = availableCars.find(c => c.id === carId);
        // Default daily rate to 1% of price if not set, just a heuristic
        const defaultRate = car ? Math.round(car.price / 100) : '';
        const defaultMileage = car ? car.mileage || '' : '';
        setRentData({ ...rentData, carId, dailyRate: defaultRate, mileageOut: defaultMileage });
        setSelectedCar(car);
    };

    const handleRent = async (e) => {
        e.preventDefault();
        if (!selectedCar) return;

        try {
            const start = new Date(rentData.startDate);
            const end = new Date(rentData.endDate);
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const totalCost = diffDays * Number(rentData.dailyRate);

            const { error: rentError } = await supabase.from('rentals').insert([{
                car_id: rentData.carId,
                customer_id: rentData.customerId,
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
            const { error: carError } = await supabase
                .from('cars')
                .update({ status: 'Rented' })
                .eq('id', rentData.carId);

            if (carError) throw carError;

            setIsRentModalOpen(false);
            setRentData({ carId: '', customerId: '', startDate: '', endDate: '', dailyRate: '', mileageOut: '', pickupTime: '' });
            setSelectedCar(null);
            fetchRentals();
            fetchDropdownData();
        } catch (error) {
            console.error('Error processing rental:', error);
            alert('Failed to process rental.');
        }
    };

    const handleReturn = async (rental) => {
        if (!confirm('Confirm return of vehicle?')) return;
        try {
            // Update rental status
            const { error: rentError } = await supabase
                .from('rentals')
                .update({ status: 'Returned', returned_at: new Date().toISOString() })
                .eq('id', rental.id);

            if (rentError) throw rentError;

            // Make car available again
            const { error: carError } = await supabase
                .from('cars')
                .update({ status: 'Available' })
                .eq('id', rental.car_id);

            if (carError) throw carError;

            fetchRentals();
            fetchDropdownData();
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
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Rental History</h2>
                    <Button onClick={() => setIsRentModalOpen(true)} icon={Plus} variant="secondary">New Rental</Button>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 text-sm">
                            <tr>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Vehicle</th>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Dates</th>
                                <th className="px-6 py-4">Pickup</th>
                                <th className="px-6 py-4 text-right">Total Cost</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {rentals.map(r => (
                                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${r.status === 'Active' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {r.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                        {r.cars?.year} {r.cars?.make} {r.cars?.model}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{r.customers?.name}</td>
                                    <td className="px-6 py-4 text-sm text-slate-500">
                                        {new Date(r.start_date).toLocaleDateString()} - {new Date(r.end_date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">
                                        {r.pickup_time ? r.pickup_time.slice(0, 5) : '—'}
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium text-green-600">{formatMoney(r.total_cost)}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button size="sm" variant="outline" onClick={() => handlePrintAgreement(r)} icon={FileText}>عقد</Button>
                                            {r.status === 'Active' && (
                                                <Button size="sm" variant="outline" onClick={() => handleReturn(r)} icon={CheckCircle}>Return</Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {rentals.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center text-slate-500">No rental records found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Rent Modal */}
                <Modal isOpen={isRentModalOpen} onClose={() => setIsRentModalOpen(false)} title="Rent Vehicle">
                    <form onSubmit={handleRent}>
                        <Select
                            label="Select Vehicle"
                            value={rentData.carId}
                            onChange={handleCarSelect}
                            options={[{ label: 'Select Car', value: '' }, ...availableCars.map(c => ({ label: `${c.year} ${c.make} ${c.model}`, value: c.id }))]}
                            required
                        />

                        <Select label="Customer" value={rentData.customerId} onChange={e => setRentData({ ...rentData, customerId: e.target.value })} options={[{ label: 'Select Customer', value: '' }, ...customers.map(c => ({ label: c.name, value: c.id }))]} required />

                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Start Date" type="date" value={rentData.startDate} onChange={e => setRentData({ ...rentData, startDate: e.target.value })} required />
                            <Input label="End Date" type="date" value={rentData.endDate} onChange={e => setRentData({ ...rentData, endDate: e.target.value })} required />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <Input label="Daily Rate (DA)" type="number" value={rentData.dailyRate} onChange={e => setRentData({ ...rentData, dailyRate: e.target.value })} required />
                            <Input label="Mileage at Pickup (KM)" type="number" value={rentData.mileageOut} onChange={e => setRentData({ ...rentData, mileageOut: e.target.value })} placeholder="Current odometer" />
                            <Input label="Pickup Time" type="time" value={rentData.pickupTime} onChange={e => setRentData({ ...rentData, pickupTime: e.target.value })} />
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button type="submit">Create Rental Agreement</Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </Layout>
    );
}
