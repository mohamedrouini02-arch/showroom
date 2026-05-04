import React, { useEffect, useState } from 'react';
import { Plus, Phone, MessageCircle, MapPin, Trash2 } from 'lucide-react';
import Layout from '../components/Layout';
import { Button, Modal, Input } from '../components/ui';
import { supabase } from '../lib/supabase';

export default function Customers() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
    const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', address: '', national_id: '' });

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
        if (error) console.error('Error fetching customers:', error);
        else setCustomers(data || []);
        setLoading(false);
    };

    const handleAddCustomer = async (e) => {
        e.preventDefault();
        try {
            const { error } = await supabase.from('customers').insert([newCustomer]);
            if (error) throw error;
            setIsAddCustomerOpen(false);
            setNewCustomer({ name: '', phone: '', email: '', address: '', national_id: '' });
            fetchCustomers();
        } catch (error) {
            console.error('Error adding customer:', error);
            alert('Failed to add customer.');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this customer?')) return;
        const { error } = await supabase.from('customers').delete().eq('id', id);
        if (error) console.error('Error deleting customer:', error);
        else fetchCustomers();
    };

    return (
        <Layout title="Customers">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Customer Database</h2>
                    <Button onClick={() => setIsAddCustomerOpen(true)} icon={Plus}>Add Customer</Button>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 text-sm">
                            <tr>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Contact</th>
                                <th className="px-6 py-4">Details</th>
                                <th className="px-6 py-4 text-right">Connect</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {customers.map(c => (
                                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{c.name}</td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                        <div className="flex items-center text-sm mb-1"><Phone size={14} className="mr-2" /> {c.phone}</div>
                                        <div className="text-xs text-slate-500">{c.email}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                        <div className="flex items-center"><MapPin size={14} className="mr-1" /> {c.address}</div>
                                        <div className="text-xs mt-1">ID: {c.national_id}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end space-x-2">
                                        <a href={`https://wa.me/213${c.phone.replace(/^0+/, '')}`} target="_blank" rel="noreferrer" className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 transition-colors"><MessageCircle size={18} /></a>
                                        <a href={`tel:${c.phone}`} className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors"><Phone size={18} /></a>
                                        <button onClick={() => handleDelete(c.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                            {customers.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-slate-500">No customers found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Add Customer Modal */}
                <Modal isOpen={isAddCustomerOpen} onClose={() => setIsAddCustomerOpen(false)} title="New Customer">
                    <form onSubmit={handleAddCustomer}>
                        <Input label="Full Name" value={newCustomer.name} onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} required />
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Phone (e.g. 0550...)" type="tel" value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} required />
                            <Input label="Email" type="email" value={newCustomer.email} onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })} />
                        </div>
                        <Input label="Address" value={newCustomer.address} onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })} placeholder="e.g. Jijel Center" />
                        <Input label="National ID / Driver License" value={newCustomer.national_id} onChange={e => setNewCustomer({ ...newCustomer, national_id: e.target.value })} required />
                        <div className="flex justify-end pt-4">
                            <Button type="submit">Save Customer</Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </Layout>
    );
}
