import React, { useEffect, useState } from 'react';
import { Plus, Key, CheckCircle, FileText, Pencil, Car, User, Calendar as CalendarIcon, Clock, Gauge, AlertCircle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Button, Modal, Input, Select } from '../components/ui';
import { supabase } from '../lib/supabase';
import { printRentalAgreement } from '../components/RentalAgreement';
import AvailabilityCalendar from '../components/AvailabilityCalendar';

export default function Rentals() {
    const [rentals, setRentals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRentModalOpen, setIsRentModalOpen] = useState(false);
    const [editingRental, setEditingRental] = useState(null);
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    const [rentalToReturn, setRentalToReturn] = useState(null);
    const [returnMileage, setReturnMileage] = useState('');
    const [linkedAppointmentId, setLinkedAppointmentId] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();

    // Data for dropdowns
    const [availableCars, setAvailableCars] = useState([]);
    const [existingCustomers, setExistingCustomers] = useState([]);
    const [carSchedule, setCarSchedule] = useState({ rentals: [], appointments: [] });

    // Form State - car selection
    const [selectedCarId, setSelectedCarId] = useState('');
    const [selectedCar, setSelectedCar] = useState(null);

    // Form State - inline customer
    const [selectedCustomerId, setSelectedCustomerId] = useState('new');
    const [customerData, setCustomerData] = useState({
        name: '', phone: '', address: '', national_id: ''
    });

    // Form State - rental details
    const [rentData, setRentData] = useState({
        startDate: '', endDate: '', dailyRate: '', mileageOut: '', pickupTime: '10:00'
    });

    useEffect(() => {
        fetchRentals();
        fetchAvailableCars();
        fetchExistingCustomers();
    }, []);

    useEffect(() => {
        if (location.state?.createRentalFromAppointment) {
            const apt = location.state.createRentalFromAppointment;
            
            setEditingRental(null);
            setSelectedCustomerId(apt.customer_id);
            setCustomerData({
                name: apt.customers?.name || '',
                phone: apt.customers?.phone || '',
                address: '',
                national_id: ''
            });
            
            setRentData({
                startDate: apt.appointment_date || '',
                endDate: apt.end_date || apt.appointment_date || '',
                dailyRate: 7000,
                mileageOut: '',
                pickupTime: apt.appointment_time || '10:00'
            });

            if (apt.car_id) {
                handleCarSelect(apt.car_id);
            } else {
                setSelectedCarId('');
                setSelectedCar(null);
            }
            
            setLinkedAppointmentId(apt.id);
            setIsRentModalOpen(true);
            
            // Clear state so it doesn't trigger on reload
            navigate('/rentals', { replace: true, state: {} });
        }
    }, [location.state, navigate]);

    const fetchExistingCustomers = async () => {
        const { data } = await supabase.from('customers').select('*').order('name', { ascending: true });
        setExistingCustomers(data || []);
    };

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

    const handleCarSelect = async (carId) => {
        const car = availableCars.find(c => c.id === carId);
        setSelectedCarId(carId);
        setSelectedCar(car);
        if (car) {
            setRentData(prev => ({
                ...prev,
                dailyRate: prev.dailyRate || 7000,
                mileageOut: car.mileage || ''
            }));
        }

        if (carId) {
            // Fetch active rentals for car
            const { data: rentalsData } = await supabase
                .from('rentals')
                .select('id, car_id, start_date, end_date, status, cars(make, model)')
                .eq('car_id', carId)
                .eq('status', 'Active');

            // Fetch scheduled appointments for car
            const { data: appointmentsData } = await supabase
                .from('rental_appointments')
                .select('*, customers(name)')
                .eq('car_id', carId)
                .eq('status', 'Scheduled');

            setCarSchedule({
                rentals: rentalsData || [],
                appointments: appointmentsData || []
            });
        } else {
            setCarSchedule({ rentals: [], appointments: [] });
        }
    };

    const handleCustomerSelect = (e) => {
        const val = e.target.value;
        setSelectedCustomerId(val);
        if (val && val !== 'new') {
            const cust = existingCustomers.find(c => c.id === val);
            if (cust) {
                setCustomerData({
                    name: cust.name || '',
                    phone: cust.phone || '',
                    address: cust.address || '',
                    national_id: cust.national_id || ''
                });
            }
        } else {
            setCustomerData({ name: '', phone: '', address: '', national_id: '' });
        }
    };

    const openNewRentalModal = () => {
        const todayStr = new Date().toISOString().split('T')[0];
        setEditingRental(null);
        setSelectedCarId('');
        setSelectedCar(null);
        setSelectedCustomerId('new');
        setCustomerData({ name: '', phone: '', address: '', national_id: '' });
        setRentData({ startDate: todayStr, endDate: todayStr, dailyRate: '7000', mileageOut: '', pickupTime: '10:00' });
        setLinkedAppointmentId(null);
        setCarSchedule({ rentals: [], appointments: [] });
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
            pickupTime: rental.pickup_time || '10:00'
        });

        if (rental.car_id) {
            handleCarSelect(rental.car_id);
        }
        setIsRentModalOpen(true);
    };

    // Helper to check range overlap
    const isRangeUnavailable = (startDateStr, endDateStr, carId) => {
        if (!startDateStr || !carId) return false;
        const endStr = endDateStr || startDateStr;

        // Check active rentals (ignoring current rental if editing)
        const isRented = carSchedule.rentals.some(r => {
            if (r.status !== 'Active') return false;
            if (editingRental && r.id === editingRental.id) return false;
            return startDateStr <= r.end_date && endStr >= r.start_date;
        });

        return isRented;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (rentData.endDate < rentData.startDate) {
            alert('⚠️ End date cannot be before start date!');
            return;
        }

        if (selectedCarId && isRangeUnavailable(rentData.startDate, rentData.endDate, selectedCarId)) {
            alert('⚠️ Selected date range overlaps with an existing rental! Please select clear green dates on the calendar.');
            return;
        }

        try {
            const start = new Date(rentData.startDate);
            const end = new Date(rentData.endDate);
            const diffDays = Math.max(1, Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)));
            const totalCost = diffDays * Number(rentData.dailyRate);

            let finalCustomerId = null;

            if (editingRental) {
                // Update existing rental
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
                if (selectedCustomerId && selectedCustomerId !== 'new') {
                    await supabase.from('customers').update({
                        name: customerData.name,
                        phone: customerData.phone,
                        address: customerData.address,
                        national_id: customerData.national_id
                    }).eq('id', selectedCustomerId);
                    finalCustomerId = selectedCustomerId;
                } else {
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
                    finalCustomerId = newCustomer.id;
                }

                // Create rental
                const { error: rentError } = await supabase.from('rentals').insert([{
                    car_id: selectedCarId,
                    customer_id: finalCustomerId,
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
                
                if (linkedAppointmentId) {
                    await supabase.from('rental_appointments').update({ status: 'Completed' }).eq('id', linkedAppointmentId);
                    setLinkedAppointmentId(null);
                }
            }

            setIsRentModalOpen(false);
            fetchRentals();
            fetchAvailableCars();
            fetchExistingCustomers();
        } catch (error) {
            console.error('Error processing rental:', error);
            alert('Failed to process rental.');
        }
    };

    const openReturnModal = (rental) => {
        setRentalToReturn(rental);
        setReturnMileage(rental.mileage_out || rental.cars?.mileage || '');
        setIsReturnModalOpen(true);
    };

    const calculateExtraCost = () => {
        if (!rentalToReturn || !returnMileage) return { driven: 0, allowed: 0, excess: 0, cost: 0 };
        
        const start = new Date(rentalToReturn.start_date);
        const end = new Date(rentalToReturn.end_date);
        const days = Math.max(1, Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)));
        const allowedKM = days * 400; // 400 KM per day limit
        
        const startKM = Number(rentalToReturn.mileage_out || rentalToReturn.cars?.mileage || 0);
        const endKM = Number(returnMileage);
        const driven = Math.max(0, endKM - startKM);
        const excess = Math.max(0, driven - allowedKM);
        const cost = excess * 15; // 15 DA per extra KM

        return { driven, allowed: allowedKM, excess, cost };
    };

    const handleConfirmReturn = async () => {
        if (!rentalToReturn) return;

        try {
            const { error: rentError } = await supabase
                .from('rentals')
                .update({ status: 'Returned', returned_at: new Date().toISOString() })
                .eq('id', rentalToReturn.id);

            if (rentError) throw rentError;

            // Update car status & mileage
            const newCarMileage = Math.max(Number(rentalToReturn.cars?.mileage || 0), Number(returnMileage));
            const { error: carError } = await supabase
                .from('cars')
                .update({ status: 'Available', mileage: newCarMileage })
                .eq('id', rentalToReturn.car_id);

            if (carError) throw carError;

            setIsReturnModalOpen(false);
            setRentalToReturn(null);
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

    const formatMoney = (amount) => `${Number(amount || 0).toLocaleString()} DA`;

    // Calculate live cost calculation
    const calcDays = rentData.startDate && rentData.endDate 
        ? Math.max(1, Math.ceil(Math.abs(new Date(rentData.endDate) - new Date(rentData.startDate)) / (1000 * 60 * 60 * 24)))
        : 0;
    const calcTotal = calcDays * Number(rentData.dailyRate || 0);

    return (
        <Layout title="Rentals">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Rental Agreements</h2>
                        <p className="text-xs text-slate-400 mt-1">Manage car rentals, contracts, and returns</p>
                    </div>
                    <Button onClick={openNewRentalModal} icon={Plus}>New Rental Contract</Button>
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
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date Range</th>
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
                                        <td className="px-6 py-4 text-slate-300 text-sm">{r.customers?.name}</td>
                                        <td className="px-6 py-4 text-xs text-slate-400 font-medium">
                                            {new Date(r.start_date).toLocaleDateString()} → {new Date(r.end_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-400">
                                            {r.pickup_time ? r.pickup_time.slice(0, 5) : '10:00'}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-emerald-400 text-sm">{formatMoney(r.total_cost)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button size="sm" variant="ghost" onClick={() => openEditModal(r)} icon={Pencil} />
                                                <Button size="sm" variant="ghost" onClick={() => handlePrintAgreement(r)} icon={FileText} className="text-blue-400 hover:bg-blue-400/10">عقد 📄</Button>
                                                {r.status === 'Active' && (
                                                    <Button size="sm" variant="outline" onClick={() => openReturnModal(r)} icon={CheckCircle}>Return</Button>
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

                {/* NEW / EDIT RENTAL MODAL WITH AVAILABILITY CALENDAR */}
                <Modal isOpen={isRentModalOpen} onClose={() => setIsRentModalOpen(false)} title={editingRental ? 'Edit Rental Contract' : 'New Rental Contract'} size="lg">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            
                            {/* Left Column: Vehicle, Customer & Contract Details */}
                            <div className="lg:col-span-6 space-y-5">
                                
                                {/* Vehicle Selection */}
                                {!editingRental && (
                                    <div>
                                        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                            <Car size={16} className="text-brand-400" /> 1. Select Vehicle
                                        </h3>
                                        <div className="grid grid-cols-1 gap-2.5 max-h-52 overflow-y-auto pr-1">
                                            {availableCars.map(car => (
                                                <button
                                                    key={car.id}
                                                    type="button"
                                                    onClick={() => handleCarSelect(car.id)}
                                                    className={`text-left p-3 rounded-xl border transition-all ${
                                                        selectedCarId === car.id
                                                            ? 'border-brand-500 bg-brand-500/10 ring-1 ring-brand-500/30'
                                                            : 'border-slate-800 bg-slate-800/30 hover:border-slate-700 hover:bg-slate-800/50'
                                                    }`}
                                                >
                                                    <div className="font-semibold text-white text-sm">{car.year} {car.make} {car.model}</div>
                                                    <div className="flex flex-wrap gap-2 mt-1">
                                                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                                            <Gauge size={10} /> {car.mileage?.toLocaleString() || 0} km
                                                        </span>
                                                        {car.color && <span className="text-[11px] text-slate-400">• {car.color}</span>}
                                                        {car.fuel && <span className="text-[11px] text-slate-400">• {car.fuel}</span>}
                                                    </div>
                                                </button>
                                            ))}
                                            {availableCars.length === 0 && (
                                                <p className="text-center py-6 text-slate-600 text-xs">No available cars found.</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {editingRental && (
                                    <div className="bg-slate-800/30 rounded-xl p-3 border border-slate-700/30">
                                        <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Vehicle</span>
                                        <span className="font-semibold text-white">{selectedCar?.year} {selectedCar?.make} {selectedCar?.model}</span>
                                    </div>
                                )}

                                {/* Customer Section */}
                                {(selectedCarId || editingRental) && (
                                    <div>
                                        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                            <User size={16} className="text-brand-400" /> 2. Customer Info
                                        </h3>
                                        
                                        {!editingRental && (
                                            <div className="mb-3">
                                                <Select 
                                                    label="Select Customer" 
                                                    value={selectedCustomerId} 
                                                    onChange={handleCustomerSelect}
                                                    options={[
                                                        { label: '+ Create New Customer', value: 'new' },
                                                        ...existingCustomers.map(c => ({ label: `${c.name} (${c.phone})`, value: c.id }))
                                                    ]} 
                                                />
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-3">
                                            <Input label="Full Name" value={customerData.name} onChange={e => setCustomerData({ ...customerData, name: e.target.value })} required placeholder="Name" />
                                            <Input label="Phone" type="tel" value={customerData.phone} onChange={e => setCustomerData({ ...customerData, phone: e.target.value })} required placeholder="Phone" />
                                            <Input label="Address" value={customerData.address} onChange={e => setCustomerData({ ...customerData, address: e.target.value })} placeholder="City" />
                                            <Input label="National ID / License" value={customerData.national_id} onChange={e => setCustomerData({ ...customerData, national_id: e.target.value })} required placeholder="License #" />
                                        </div>
                                    </div>
                                )}

                                {/* Rental Rates & Pickup Details */}
                                {(selectedCarId || editingRental) && (
                                    <div>
                                        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                            <Key size={16} className="text-brand-400" /> 3. Rental Details
                                        </h3>

                                        <div className="grid grid-cols-2 gap-3 mb-3">
                                            <Input 
                                                label="Start Date" 
                                                type="date" 
                                                value={rentData.startDate} 
                                                onChange={e => setRentData(prev => ({ ...prev, startDate: e.target.value }))} 
                                                required 
                                            />
                                            <Input 
                                                label="End Date" 
                                                type="date" 
                                                value={rentData.endDate} 
                                                onChange={e => setRentData(prev => ({ ...prev, endDate: e.target.value }))} 
                                                required 
                                            />
                                        </div>

                                        <div className="grid grid-cols-3 gap-3">
                                            <Input label="Daily Rate (DA)" type="number" value={rentData.dailyRate} onChange={e => setRentData({ ...rentData, dailyRate: e.target.value })} required />
                                            <Input label="Pickup Time" type="time" value={rentData.pickupTime} onChange={e => setRentData({ ...rentData, pickupTime: e.target.value })} />
                                            <Input label="Odometer (KM)" type="number" value={rentData.mileageOut} onChange={e => setRentData({ ...rentData, mileageOut: e.target.value })} placeholder="KM" />
                                        </div>

                                        {/* Cost Summary Preview */}
                                        {calcDays > 0 && (
                                            <div className="mt-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                                                <div>
                                                    <div className="text-xs text-slate-300 font-semibold">{calcDays} Rental Days × {formatMoney(rentData.dailyRate)} / day</div>
                                                    <div className="text-[11px] text-slate-400">Includes 400 KM per day limit</div>
                                                </div>
                                                <div className="text-lg font-black text-emerald-400">
                                                    {formatMoney(calcTotal)}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                            </div>

                            {/* Right Column: Availability Calendar */}
                            <div className="lg:col-span-6 space-y-4">
                                <div>
                                    <h3 className="text-sm font-bold text-white mb-2 flex items-center justify-between">
                                        <span className="flex items-center gap-2">
                                            <CalendarIcon size={16} className="text-emerald-400" /> Availability Calendar
                                        </span>
                                        <span className="text-[11px] text-emerald-400 font-normal">Select rental date range</span>
                                    </h3>
                                    <p className="text-xs text-slate-400 mb-3">
                                        Click a <strong className="text-emerald-400">Green</strong> date for Start Date, then a second Green date for End Date. Rented dates are <strong className="text-red-400">Red & disabled</strong>.
                                    </p>
                                </div>

                                <AvailabilityCalendar
                                    selectedCarId={selectedCarId}
                                    carName={selectedCar ? `${selectedCar.year} ${selectedCar.make} ${selectedCar.model}` : ''}
                                    rentals={carSchedule.rentals}
                                    appointments={carSchedule.appointments}
                                    startDate={rentData.startDate}
                                    endDate={rentData.endDate}
                                    onSelectRange={(startStr, endStr) => {
                                        setRentData(prev => ({
                                            ...prev,
                                            startDate: startStr,
                                            endDate: endStr
                                        }));
                                    }}
                                />
                            </div>

                        </div>

                        <div className="flex justify-end pt-4 border-t border-slate-800/50">
                            <Button type="submit" size="lg" disabled={!selectedCarId && !editingRental}>
                                {editingRental ? 'Save Changes' : 'Create Rental Contract'}
                            </Button>
                        </div>
                    </form>
                </Modal>

                {/* Return Vehicle Modal */}
                <Modal isOpen={isReturnModalOpen} onClose={() => setIsReturnModalOpen(false)} title="Return Vehicle" size="md">
                    {rentalToReturn && (
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/40">
                                <div className="font-bold text-white text-base mb-1">
                                    {rentalToReturn.cars?.year} {rentalToReturn.cars?.make} {rentalToReturn.cars?.model}
                                </div>
                                <div className="text-xs text-slate-400">
                                    Customer: <strong className="text-white">{rentalToReturn.customers?.name}</strong>
                                </div>
                                <div className="text-xs text-slate-400 mt-1">
                                    Pickup Odometer: <strong className="text-brand-400">{rentalToReturn.mileage_out || rentalToReturn.cars?.mileage || 0} KM</strong>
                                </div>
                            </div>

                            <Input 
                                label="Return Odometer Reading (KM)" 
                                type="number" 
                                value={returnMileage} 
                                onChange={e => setReturnMileage(e.target.value)}
                                placeholder="Enter current odometer reading" 
                                required 
                            />

                            {/* Excess Mileage Calculation */}
                            {returnMileage && Number(returnMileage) > 0 && (
                                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                                    {(() => {
                                        const calc = calculateExtraCost();
                                        return (
                                            <>
                                                <div className="flex justify-between text-slate-400">
                                                    <span>Total Distance Driven:</span>
                                                    <span className="font-semibold text-white">{calc.driven.toLocaleString()} KM</span>
                                                </div>
                                                <div className="flex justify-between text-slate-400">
                                                    <span>Allowed Distance (400 KM/day):</span>
                                                    <span className="font-semibold text-white">{calc.allowed.toLocaleString()} KM</span>
                                                </div>
                                                {calc.excess > 0 ? (
                                                    <div className="pt-2 border-t border-slate-800 flex justify-between text-red-400 font-bold">
                                                        <span>Excess Distance ({calc.excess} KM × 15 DA):</span>
                                                        <span>+ {formatMoney(calc.cost)}</span>
                                                    </div>
                                                ) : (
                                                    <div className="pt-2 border-t border-slate-800 text-emerald-400 font-semibold">
                                                        ✓ Distance driven is within the 400 KM/day limit (No extra charge).
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                                <Button variant="secondary" onClick={() => setIsReturnModalOpen(false)}>Cancel</Button>
                                <Button onClick={handleConfirmReturn} icon={CheckCircle}>Confirm Return</Button>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </Layout>
    );
}
