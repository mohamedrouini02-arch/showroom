import React, { useEffect, useState } from 'react';
import { Plus, Calendar, Pencil, CheckCircle, XCircle, Car, User, Clock, FileText } from 'lucide-react';
import Layout from '../components/Layout';
import { Button, Modal, Input, Select } from '../components/ui';
import { supabase } from '../lib/supabase';

export default function Appointments() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState(null);

    // Form Data
    const [existingCustomers, setExistingCustomers] = useState([]);
    const [allCars, setAllCars] = useState([]);
    const [carSchedule, setCarSchedule] = useState({ rentals: [], appointments: [] });
    const [loadingSchedule, setLoadingSchedule] = useState(false);
    const [selectedCustomerId, setSelectedCustomerId] = useState('new');
    const [customerData, setCustomerData] = useState({ name: '', phone: '', address: '', national_id: '' });
    const [appointmentData, setAppointmentData] = useState({
        carId: '',
        date: '',
        time: '',
        status: 'Scheduled',
        notes: ''
    });

    useEffect(() => {
        fetchAppointments();
        fetchDropdownData();
    }, []);

    const fetchDropdownData = async () => {
        const { data: cars } = await supabase.from('cars').select('*').order('make', { ascending: true });
        setAllCars(cars || []);
        
        const { data: customers } = await supabase.from('customers').select('*').order('name', { ascending: true });
        setExistingCustomers(customers || []);
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
        setAppointmentData({ ...appointmentData, carId });
        
        if (!carId) {
            setCarSchedule({ rentals: [], appointments: [] });
            return;
        }

        setLoadingSchedule(true);
        // Fetch active/future rentals
        const { data: rentals } = await supabase
            .from('rentals')
            .select('start_date, end_date, status')
            .eq('car_id', carId)
            .gte('end_date', new Date().toISOString().split('T')[0])
            .order('start_date', { ascending: true });

        // Fetch future appointments
        const { data: appointments } = await supabase
            .from('rental_appointments')
            .select('appointment_date, appointment_time, status')
            .eq('car_id', carId)
            .in('status', ['Scheduled'])
            .gte('appointment_date', new Date().toISOString().split('T')[0])
            .order('appointment_date', { ascending: true });

        setCarSchedule({
            rentals: rentals || [],
            appointments: appointments || []
        });
        setLoadingSchedule(false);
    };

    const openNewModal = () => {
        setEditingAppointment(null);
        setSelectedCustomerId('new');
        setCustomerData({ name: '', phone: '', address: '', national_id: '' });
        setAppointmentData({
            carId: '',
            date: new Date().toISOString().split('T')[0],
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
            date: apt.appointment_date,
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

    const handleSubmit = async (e) => {
        e.preventDefault();
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

            const payload = {
                customer_id: finalCustomerId,
                car_id: appointmentData.carId || null,
                appointment_date: appointmentData.date,
                appointment_time: appointmentData.time,
                status: appointmentData.status,
                notes: appointmentData.notes
            };

            if (editingAppointment) {
                const { error } = await supabase.from('rental_appointments').update(payload).eq('id', editingAppointment.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('rental_appointments').insert([payload]);
                if (error) throw error;
            }

            setIsModalOpen(false);
            fetchAppointments();
            fetchDropdownData();
        } catch (error) {
            console.error('Error saving appointment:', error);
            alert('Failed to save appointment.');
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

    return (
        <Layout title="Appointments">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">Rental Appointments</h2>
                    <Button onClick={openNewModal} icon={Plus}>New Appointment</Button>
                </div>

                <div className="glass rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-800/50">
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date & Time</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Requested Vehicle</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/30">
                                {appointments.map(apt => (
                                    <tr key={apt.id} className="hover:bg-slate-800/20 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-white text-sm">{new Date(apt.appointment_date).toLocaleDateString()}</div>
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
                                                        <Button size="sm" variant="ghost" onClick={() => updateStatus(apt.id, 'Completed')} icon={CheckCircle} className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10" />
                                                        <Button size="sm" variant="ghost" onClick={() => updateStatus(apt.id, 'No Show')} icon={XCircle} className="text-orange-400 hover:text-orange-300 hover:bg-orange-400/10" />
                                                    </>
                                                )}
                                                <Button size="sm" variant="ghost" onClick={() => openEditModal(apt)} icon={Pencil} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {appointments.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-16 text-center text-slate-600">No appointments scheduled.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingAppointment ? 'Edit Appointment' : 'New Appointment'} size="md">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        
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
                                <div className="grid grid-cols-1 gap-4 bg-slate-800/20 p-4 rounded-xl border border-slate-700/50">
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
                                <Calendar size={16} className="text-brand-400" /> Appointment Details
                            </h3>
                            
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <Input label="Date" type="date" value={appointmentData.date} onChange={e => setAppointmentData({ ...appointmentData, date: e.target.value })} required />
                                <Input label="Time" type="time" value={appointmentData.time} onChange={e => setAppointmentData({ ...appointmentData, time: e.target.value })} required />
                            </div>

                            <div className="mb-4">
                                <Select 
                                    label="Requested Vehicle (Optional)" 
                                    value={appointmentData.carId} 
                                    onChange={handleCarSelect}
                                    options={[
                                        { label: 'Not decided yet', value: '' },
                                        ...allCars.map(c => ({ label: `${c.year} ${c.make} ${c.model} (${c.status})`, value: c.id }))
                                    ]} 
                                />
                            </div>

                            {appointmentData.carId && (
                                <div className="mb-4 p-4 rounded-xl bg-slate-800/20 border border-slate-700/50">
                                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Vehicle Schedule</h4>
                                    {loadingSchedule ? (
                                        <div className="text-xs text-slate-500">Loading schedule...</div>
                                    ) : (
                                        <div className="space-y-2">
                                            {carSchedule.rentals.length === 0 && carSchedule.appointments.length === 0 && (
                                                <div className="text-xs text-emerald-400">Currently no upcoming rentals or appointments.</div>
                                            )}
                                            {carSchedule.rentals.map((r, i) => (
                                                <div key={`r-${i}`} className="text-xs flex items-center justify-between p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
                                                    <span className="text-orange-400 font-medium">Rental ({r.status})</span>
                                                    <span className="text-slate-400">{new Date(r.start_date).toLocaleDateString()} - {new Date(r.end_date).toLocaleDateString()}</span>
                                                </div>
                                            ))}
                                            {carSchedule.appointments.map((a, i) => (
                                                <div key={`a-${i}`} className="text-xs flex items-center justify-between p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                                    <span className="text-blue-400 font-medium">Appointment</span>
                                                    <span className="text-slate-400">{new Date(a.appointment_date).toLocaleDateString()} at {a.appointment_time.slice(0, 5)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

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
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all placeholder-slate-500 resize-none h-24"
                                    placeholder="Any special requests or details..."
                                    value={appointmentData.notes}
                                    onChange={e => setAppointmentData({ ...appointmentData, notes: e.target.value })}
                                ></textarea>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-slate-800/50">
                            <Button type="submit" size="lg">{editingAppointment ? 'Save Changes' : 'Schedule Appointment'}</Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </Layout>
    );
}
