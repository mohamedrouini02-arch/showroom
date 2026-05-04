import React, { useEffect, useState } from 'react';
import { Plus, Phone, MessageCircle, MapPin, Trash2, Pencil, CreditCard, Eye } from 'lucide-react';
import Layout from '../components/Layout';
import { Button, Modal, Input } from '../components/ui';
import ImageUpload from '../components/ImageUpload';
import { supabase } from '../lib/supabase';

export default function Customers() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [viewingIdPhoto, setViewingIdPhoto] = useState(null);

    const initialState = { name: '', phone: '', email: '', address: '', national_id: '', id_photo_url: '' };
    const [formData, setFormData] = useState(initialState);

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

    const openAddModal = () => {
        setEditingCustomer(null);
        setFormData(initialState);
        setIsModalOpen(true);
    };

    const openEditModal = (customer) => {
        setEditingCustomer(customer);
        setFormData({
            name: customer.name || '',
            phone: customer.phone || '',
            email: customer.email || '',
            address: customer.address || '',
            national_id: customer.national_id || '',
            id_photo_url: customer.id_photo_url || ''
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCustomer) {
                const { error } = await supabase
                    .from('customers')
                    .update(formData)
                    .eq('id', editingCustomer.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('customers').insert([formData]);
                if (error) throw error;
            }
            setIsModalOpen(false);
            setFormData(initialState);
            setEditingCustomer(null);
            fetchCustomers();
        } catch (error) {
            console.error('Error saving customer:', error);
            alert('Failed to save customer.');
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
                    <Button onClick={openAddModal} icon={Plus}>Add Customer</Button>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 text-sm">
                            <tr>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Contact</th>
                                <th className="px-6 py-4">Details</th>
                                <th className="px-6 py-4">ID Photo</th>
                                <th className="px-6 py-4 text-right">Actions</th>
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
                                        <div className="text-xs mt-1 flex items-center"><CreditCard size={12} className="mr-1" /> {c.national_id}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {c.id_photo_url ? (
                                            <button
                                                onClick={() => setViewingIdPhoto(c.id_photo_url)}
                                                className="w-10 h-10 rounded-lg overflow-hidden border-2 border-slate-200 dark:border-slate-600 hover:border-blue-400 transition-colors cursor-pointer"
                                            >
                                                <img src={c.id_photo_url} alt="ID" className="w-full h-full object-cover" />
                                            </button>
                                        ) : (
                                            <span className="text-xs text-slate-400">—</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end space-x-2">
                                            <a href={`https://wa.me/213${c.phone.replace(/^0+/, '')}`} target="_blank" rel="noreferrer" className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 transition-colors"><MessageCircle size={18} /></a>
                                            <a href={`tel:${c.phone}`} className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors"><Phone size={18} /></a>
                                            <button onClick={() => openEditModal(c)} className="p-2 text-slate-400 hover:text-blue-500 transition-colors"><Pencil size={18} /></button>
                                            <button onClick={() => handleDelete(c.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {customers.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">No customers found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Add/Edit Customer Modal */}
                <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingCustomer(null); }} title={editingCustomer ? 'Edit Customer' : 'New Customer'}>
                    <form onSubmit={handleSubmit}>
                        <Input label="Full Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Phone (e.g. 0550...)" type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} required />
                            <Input label="Email" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <Input label="Address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="e.g. Jijel Center" />
                        <Input label="National ID / Driver License" value={formData.national_id} onChange={e => setFormData({ ...formData, national_id: e.target.value })} required />

                        <hr className="border-slate-200 dark:border-slate-700 my-4" />

                        <ImageUpload
                            bucket="customer-ids"
                            folder={editingCustomer?.id || 'new'}
                            multiple={false}
                            value={formData.id_photo_url}
                            onChange={(url) => setFormData({ ...formData, id_photo_url: url })}
                            label="ID / License Photo"
                        />

                        <div className="flex justify-end pt-4">
                            <Button type="submit">{editingCustomer ? 'Save Changes' : 'Save Customer'}</Button>
                        </div>
                    </form>
                </Modal>

                {/* ID Photo Viewer Modal */}
                <Modal isOpen={!!viewingIdPhoto} onClose={() => setViewingIdPhoto(null)} title="ID Photo">
                    {viewingIdPhoto && (
                        <div className="flex justify-center">
                            <img src={viewingIdPhoto} alt="Customer ID" className="max-w-full max-h-[70vh] rounded-lg shadow-lg" />
                        </div>
                    )}
                </Modal>
            </div>
        </Layout>
    );
}
