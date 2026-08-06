import React, { useEffect, useState } from 'react';
import { Plus, Calendar as CalendarIcon, Pencil, CheckCircle, XCircle, Car, User, Clock, FileText, ArrowRight, List, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Button, Modal, Input, Select } from '../components/ui';
import { supabase } from '../lib/supabase';
import AvailabilityCalendar from '../components/AvailabilityCalendar';

export default function Appointments() {
    const [appointments, setAppointments] = useState([]);
    const [allRentals, setAllRentals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState(null);
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'
    const [filterCarId, setFilterCarId] = useState('');
    const navigate = useNavigate();

    // Form Data
    const [existingCustomers, setExistingCustomers] = useState([]);
    const [allCars, setAllCars] = useState([]);
    const [carSchedule, setCarSchedule] = useState({ rentals: [], appointments: [] });
    const [loadingSchedule, setLoadingSchedule] = useState(false);
    const [selectedCustomerId, setSelectedCustomerId] = useState('new');
    const [customerData, setCustomerData] = useState({ name: '', phone: '', address: '', national_id: '' });
    const [appointmentData, setAppointmentData] = useState({
        carId: '',
        startDate: '',
        endDate: '',
        time: '',
        status: 'Scheduled',
        notes: ''
    });

    useEffect(() => {
        fetchAppointments();
        fetchRentals();
        fetchDropdownData();
    }, []);

    const fetchDropdownData = async () => {
        const { data: cars } = await supabase.from('cars').select('*').order('make', { ascending: true });
        setAllCars(cars || []);
        
        const { data: customers } = await supabase.from('customers').select('*').order('name', { ascending: true });
        setExistingCustomers(customers || []);
    };

    const fetchRentals = async () => {
        const { data, error } = await supabase
            .from('rentals')
            .select('*, cars(make, model, year)')
            .eq('status', 'Active');
        if (!error) setAllRentals(data || []);
    };

    const fetchAppointments = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('rental_appointments')
            .select('*, customers(name, phone), cars(make, model, year)')
            .order('appointment_date', { ascending: true })
            .order('appointment_time', { ascending: true });

        if (error) console.error('Error fetching appointments:', error);
        else setAppointments(data || []);
        setLoading(false);
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

    const handleCarSelect = async (e) => {
        const carId = e.target.value;
        setAppointmentData(prev => ({ ...prev, carId }));
        
        if (!carId) {
            setCarSchedule({ rentals: [], appointments: [] });
            return;
        }

        setLoadingSchedule(true);
        // Fetch active rentals for car
        const { data: rentals } = await supabase
            .from('rentals')
            .select('*, cars(make, model)')
            .eq('car_id', carId)
            .eq('status', 'Active')
            .order('start_date', { ascending: true });

        // Fetch scheduled appointments for car (using select '*' to avoid 400 if end_date is missing)
        const { data: appointments } = await supabase
            .from('rental_appointments')
            .select('*, customers(name)')
            .eq('car_id', carId)
            .eq('status', 'Scheduled')
            .order('appointment_date', { ascending: true });

        setCarSchedule({
            rentals: rentals || [],
            appointments: appointments || []
        });
        setLoadingSchedule(false);
    };

    const openNewModal = () => {
        const todayStr = new Date().toISOString().split('T')[0];
        setEditingAppointment(null);
        setSelectedCustomerId('new');
        setCustomerData({ name: '', phone: '', address: '', national_id: '' });
        setAppointmentData({
            carId: '',
            startDate: todayStr,
            endDate: todayStr,
            time: '10:00',
            status: 'Scheduled',
            notes: ''
        });
        setCarSchedule({ rentals: [], appointments: [] });
        setIsModalOpen(true);
    };

    const openEditModal = (apt) => {
        setEditingAppointment(apt);
        setSelectedCustomerId(apt.customer_id);
        setCustomerData({
            name: apt.customers?.name || '',
            phone: apt.customers?.phone || '',
            address: '',
            national_id: ''
        });
        setAppointmentData({
            carId: apt.car_id || '',
            startDate: apt.appointment_date,
            endDate: apt.end_date || apt.appointment_date,
            time: apt.appointment_time,
            status: apt.status,
            notes: apt.notes || ''
        });
        
        if (apt.car_id) {
            handleCarSelect({ target: { value: apt.car_id } });
        } else {
            setCarSchedule({ rentals: [], appointments: [] });
        }
        
        setIsModalOpen(true);
    };

    const updateStatus = async (id, newStatus) => {
        const { error } = await supabase.from('rental_appointments').update({ status: newStatus }).eq('id', id);
        if (!error) {
            fetchAppointments();
        }
    };

    const convertToRental = (apt) => {
        navigate('/rentals', { state: { createRentalFromAppointment: apt } });
    };

    // Validation helper to check if a chosen date range overlaps with existing rentals or appointments
    const isRangeUnavailable = (startDateStr, endDateStr, carId) => {
        if (!startDateStr || !carId) return false;
        const endStr = endDateStr || startDateStr;

        // Check active rentals
        const isRented = carSchedule.rentals.some(r => {
            if (r.status !== 'Active') return false;
            return startDateStr <= r.end_date && endStr >= r.start_date;
        });

        // Check scheduled appointments
        const isBooked = carSchedule.appointments.some(a => {
            if (a.status !== 'Scheduled') return false;
            if (editingAppointment && a.id === editingAppointment.id) return false;
            
            const aStart = a.appointment_date;
            const aEnd = a.end_date || a.appointment_date;
            return startDateStr <= aEnd && endStr >= aStart;
        });

        return isRented || isBooked;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const startDate = appointmentData.startDate;
        const endDate = appointmentData.endDate || startDate;

        if (endDate < startDate) {
            alert('⚠️ End date cannot be before start date!');
            return;
        }

        // Validate date range availability if car is selected
        if (appointmentData.carId && isRangeUnavailable(startDate, endDate, appointmentData.carId)) {
            alert('⚠️ The selected date range is unavailable for this vehicle! Please select available (Green) dates on the calendar.');
            return;
        }

        try {
            let finalCustomerId = selectedCustomerId;

            if (selectedCustomerId === 'new' && !editingAppointment) {
                // Create customer
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

            const fullPayload = {
                customer_id: finalCustomerId,
                car_id: appointmentData.carId || null,
                appointment_date: startDate,
                end_date: endDate,
                appointment_time: appointmentData.time,
                status: appointmentData.status,
                notes: appointmentData.notes
            };

            // Attempt save with end_date
            let res = editingAppointment 
                ? await supabase.from('rental_appointments').update(fullPayload).eq('id', editingAppointment.id)
                : await supabase.from('rental_appointments').insert([fullPayload]);

            // If database table doesn't have end_date column yet (causes 400 error), fallback without end_date
            if (res.error) {
                console.warn('Retrying save without end_date column:', res.error);
                const fallbackPayload = { ...fullPayload };
                delete fallbackPayload.end_date;

                res = editingAppointment 
                    ? await supabase.from('rental_appointments').update(fallbackPayload).eq('id', editingAppointment.id)
                    : await supabase.from('rental_appointments').insert([fallbackPayload]);

                if (res.error) throw res.error;
            }

            setIsModalOpen(false);
            fetchAppointments();
            fetchRentals();
            fetchDropdownData();
        } catch (error) {
            console.error('Error saving appointment:', error);
            alert('Failed to save appointment. ' + (error.message || 'Please check database permissions.'));
        }
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'Scheduled': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
            case 'Completed': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
            case 'Cancelled': return 'bg-red-500/10 text-red-400 border border-red-500/20';
            case 'No Show': return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
            default: return 'bg-slate-800 text-slate-400 border border-slate-700';
        }
    };

    const selectedCarObject = allCars.find(c => c.id === appointmentData.carId);
    const selectedCarName = selectedCarObject ? `${selectedCarObject.year} ${selectedCarObject.make} ${selectedCarObject.model}` : '';

    return (
        <Layout title="Appointments">
            <div className="space-y-6">
                {/* Header Actions & View Toggle */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Rental Appointments</h2>
                        <p className="text-xs text-slate-400 mt-1">Manage viewings, test drives, and multi-day vehicle bookings</p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* View Switcher */}
                        <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                    viewMode === 'list' 
                                        ? 'bg-brand-500 text-white shadow-md' 
                                        : 'text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                <List size={14} /> List View
                            </button>
                            <button
                                onClick={() => setViewMode('calendar')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                    viewMode === 'calendar' 
                                        ? 'bg-brand-500 text-white shadow-md' 
                                        : 'text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                <CalendarIcon size={14} /> Calendar View
                            </button>
                        </div>

                        <Button onClick={openNewModal} icon={Plus}>New Appointment</Button>
                    </div>
                </div>

                {/* CALENDAR VIEW MODE */}
                {viewMode === 'calendar' && (
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl glass border border-slate-800">
                            <div className="flex items-center gap-3 min-w-[240px]">
                                <label className="text-xs font-semibold text-slate-400 whitespace-nowrap">Filter Vehicle:</label>
                                <select
                                    value={filterCarId}
                                    onChange={e => setFilterCarId(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                                >
                                    <option value="">All Vehicles</option>
                                    {allCars.map(c => (
                                        <option key={c.id} value={c.id}>{c.year} {c.make} {c.model}</option>
                                    ))}
                                </select>
                            </div>

                            <p className="text-xs text-slate-400">
                                🟢 <strong className="text-emerald-400">Green</strong> = Available &nbsp;|&nbsp; 
                                🔴 <strong className="text-red-400">Red</strong> = Rented / Booked Range (Disabled)
                            </p>
                        </div>

                        <AvailabilityCalendar
                            selectedCarId={filterCarId}
                            carName={allCars.find(c => c.id === filterCarId) ? `${allCars.find(c => c.id === filterCarId).year} ${allCars.find(c => c.id === filterCarId).make} ${allCars.find(c => c.id === filterCarId).model}` : 'All Cars'}
                            rentals={allRentals}
                            appointments={appointments}
                            viewOnly={true}
                            onAppointmentClick={(apt) => openEditModal(apt)}
                        />
                    </div>
                )}

                {/* LIST VIEW MODE */}
                {viewMode === 'list' && (
                    <div className="glass rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-800/50">
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date Range & Time</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Requested Vehicle</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/30">
                                    {appointments.map(apt => {
                                        const startDateFormatted = new Date(apt.appointment_date).toLocaleDateString();
                                        const endDateFormatted = apt.end_date && apt.end_date !== apt.appointment_date 
                                            ? new Date(apt.end_date).toLocaleDateString() 
                                            : null;

                                        return (
                                            <tr key={apt.id} className="hover:bg-slate-800/20 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-white text-sm">
                                                        {startDateFormatted} {endDateFormatted ? ` → ${endDateFormatted}` : ''}
                                                    </div>
                                                    <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                                        <Clock size={12} /> {apt.appointment_time.slice(0, 5)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-white text-sm">{apt.customers?.name}</div>
                                                    <div className="text-xs text-slate-400">{apt.customers?.phone}</div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-300">
                                                    {apt.car_id ? `${apt.cars?.year} ${apt.cars?.make} ${apt.cars?.model}` : <span className="text-slate-500 italic">Not decided</span>}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${getStatusStyles(apt.status)}`}>
                                                        {apt.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {apt.status === 'Scheduled' && (
                                                            <>
                                                                <Button size="sm" variant="ghost" onClick={() => convertToRental(apt)} icon={ArrowRight} className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10">Convert to Rental</Button>
                                                                <Button size="sm" variant="ghost" onClick={() => updateStatus(apt.id, 'No Show')} icon={XCircle} className="text-orange-400 hover:text-orange-300 hover:bg-orange-400/10" />
                                                            </>
                                                        )}
                                                        <Button size="sm" variant="ghost" onClick={() => openEditModal(apt)} icon={Pencil} />
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {appointments.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-16 text-center text-slate-600">No appointments scheduled.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* MODAL FOR NEW / EDIT APPOINTMENT */}
                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingAppointment ? 'Edit Appointment' : 'New Appointment'} size="lg">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            
                            {/* Left Column: Form Controls */}
                            <div className="lg:col-span-6 space-y-5">
                                {/* Customer Section */}
                                <div>
                                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                        <User size={16} className="text-brand-400" /> Customer Info
                                    </h3>
                                    
                                    {!editingAppointment && (
                                        <div className="mb-4">
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

                                    {selectedCustomerId === 'new' && (
                                        <div className="grid grid-cols-1 gap-3 bg-slate-800/20 p-4 rounded-xl border border-slate-700/50">
                                            <Input label="Full Name" value={customerData.name} onChange={e => setCustomerData({ ...customerData, name: e.target.value })} required />
                                            <Input label="Phone" type="tel" value={customerData.phone} onChange={e => setCustomerData({ ...customerData, phone: e.target.value })} required />
                                            <Input label="Address" value={customerData.address} onChange={e => setCustomerData({ ...customerData, address: e.target.value })} />
                                            <Input label="National ID / License" value={customerData.national_id} onChange={e => setCustomerData({ ...customerData, national_id: e.target.value })} />
                                        </div>
                                    )}
                                    
                                    {editingAppointment && (
                                        <div className="bg-slate-800/30 rounded-xl p-3 border border-slate-700/30 mb-2 text-sm">
                                            <span className="text-slate-400 block mb-1">Editing appointment for:</span>
                                            <span className="font-semibold text-white">{customerData.name}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Appointment Details */}
                                <div>
                                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                        <CalendarIcon size={16} className="text-brand-400" /> Appointment Date Range & Time
                                    </h3>

                                    <div className="mb-4">
                                        <Select 
                                            label="Requested Vehicle (Select to check calendar)" 
                                            value={appointmentData.carId} 
                                            onChange={handleCarSelect}
                                            options={[
                                                { label: 'Not decided yet', value: '' },
                                                ...allCars.map(c => {
                                                    const extraInfo = [c.color, c.vin ? `VIN: ${c.vin.slice(-6)}` : null, `${c.mileage?.toLocaleString() || 0} km`].filter(Boolean).join(' • ');
                                                    return { label: `${c.year} ${c.make} ${c.model} - ${extraInfo} (${c.status})`, value: c.id };
                                                })
                                            ]} 
                                        />
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <Input 
                                                label="Start Date" 
                                                type="date" 
                                                value={appointmentData.startDate} 
                                                onChange={e => {
                                                    const newStart = e.target.value;
                                                    setAppointmentData(prev => ({
                                                        ...prev,
                                                        startDate: newStart,
                                                        endDate: prev.endDate < newStart ? newStart : prev.endDate
                                                    }));
                                                }} 
                                                required 
                                            />
                                        </div>

                                        <div>
                                            <Input 
                                                label="End Date" 
                                                type="date" 
                                                value={appointmentData.endDate || appointmentData.startDate} 
                                                onChange={e => setAppointmentData(prev => ({ ...prev, endDate: e.target.value }))} 
                                                required 
                                            />
                                        </div>
                                    </div>

                                    {appointmentData.carId && isRangeUnavailable(appointmentData.startDate, appointmentData.endDate, appointmentData.carId) && (
                                        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-xs text-red-400 font-semibold">
                                            <AlertCircle size={14} /> Selected date range is unavailable! Select clear green dates.
                                        </div>
                                    )}

                                    <div className="mb-4">
                                        <Input label="Pickup / Appointment Time" type="time" value={appointmentData.time} onChange={e => setAppointmentData({ ...appointmentData, time: e.target.value })} required />
                                    </div>

                                    {editingAppointment && (
                                        <div className="mb-4">
                                            <Select 
                                                label="Status" 
                                                value={appointmentData.status} 
                                                onChange={e => setAppointmentData({ ...appointmentData, status: e.target.value })}
                                                options={[
                                                    { label: 'Scheduled', value: 'Scheduled' },
                                                    { label: 'Completed', value: 'Completed' },
                                                    { label: 'Cancelled', value: 'Cancelled' },
                                                    { label: 'No Show', value: 'No Show' }
                                                ]} 
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Notes</label>
                                        <textarea 
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all placeholder-slate-500 resize-none h-20"
                                            placeholder="Any special requests or details..."
                                            value={appointmentData.notes}
                                            onChange={e => setAppointmentData({ ...appointmentData, notes: e.target.value })}
                                        ></textarea>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Interactive Availability Calendar Picker */}
                            <div className="lg:col-span-6 space-y-4">
                                <div>
                                    <h3 className="text-sm font-bold text-white mb-2 flex items-center justify-between">
                                        <span className="flex items-center gap-2">
                                            <CalendarIcon size={16} className="text-emerald-400" /> Interactive Date Range Calendar
                                        </span>
                                        <span className="text-[11px] text-emerald-400 font-normal">Click Start & End date</span>
                                    </h3>
                                    <p className="text-xs text-slate-400 mb-3">
                                        Dates highlighted in <strong className="text-emerald-400">Green</strong> are available. Dates in <strong className="text-red-400">Red</strong> are rented or booked and <span className="underline">cannot be clicked</span>.
                                    </p>
                                </div>

                                <AvailabilityCalendar
                                    selectedCarId={appointmentData.carId}
                                    carName={selectedCarName}
                                    rentals={carSchedule.rentals}
                                    appointments={carSchedule.appointments}
                                    currentAppointmentId={editingAppointment?.id}
                                    startDate={appointmentData.startDate}
                                    endDate={appointmentData.endDate}
                                    onSelectRange={(startStr, endStr) => {
                                        setAppointmentData(prev => ({
                                            ...prev,
                                            startDate: startStr,
                                            endDate: endStr
                                        }));
                                    }}
                                />
                            </div>

                        </div>

                        <div className="flex justify-end pt-4 border-t border-slate-800/50">
                            <Button type="submit" size="lg">
                                {editingAppointment ? 'Save Changes' : 'Schedule Appointment'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </Layout>
    );
}
