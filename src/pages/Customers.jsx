import React, { useEffect, useState } from 'react';
import { Plus, Phone, MessageCircle, MapPin, Trash2, Pencil, CreditCard } from 'lucide-react';
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

    useEffect(() => { fetchCustomers(); }, []);

    const fetchCustomers = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
        if (error) console.error('Error:', error);
        else setCustomers(data || []);
        setLoading(false);
    };

    const openAddModal = () => { setEditingCustomer(null); setFormData(initialState); setIsModalOpen(true); };
    const openEditModal = (c) => {
        setEditingCustomer(c);
        setFormData({ name: c.name || '', phone: c.phone || '', email: c.email || '', address: c.address || '', national_id: c.national_id || '', id_photo_url: c.id_photo_url || '' });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCustomer) {
                const { error } = await supabase.from('customers').update(formData).eq('id', editingCustomer.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('customers').insert([formData]);
                if (error) throw error;
            }
            setIsModalOpen(false); setFormData(initialState); setEditingCustomer(null); fetchCustomers();
        } catch (error) { console.error('Error:', error); alert('Failed to save customer.'); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this customer?')) return;
        const { error } = await supabase.from('customers').delete().eq('id', id);
        if (!error) fetchCustomers();
    };

    return (
        <Layout title="Customers">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">Customer Database</h2>
                    <Button onClick={openAddModal} icon={Plus}>Add Customer</Button>
                </div>

                <div className="glass rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-800/50">
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Details</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">ID Photo</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/30">
                                {customers.map(c => (
                                    <tr key={c.id} className="hover:bg-slate-800/20 transition-colors">
                                        <td className="px-6 py-4 font-medium text-white text-sm">{c.name}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center text-sm text-slate-400 gap-1.5"><Phone size={12} /> {c.phone}</div>
                                            {c.email && <div className="text-xs text-slate-600 mt-0.5">{c.email}</div>}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            <div className="flex items-center gap-1"><MapPin size={12} /> {c.address || '—'}</div>
                                            <div className="text-xs mt-0.5 flex items-center gap-1"><CreditCard size={10} /> {c.national_id}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {c.id_photo_url ? (
                                                <button onClick={() => setViewingIdPhoto(c.id_photo_url)} className="w-10 h-10 rounded-lg overflow-hidden border border-slate-700 hover:border-brand-500 transition-colors">
                                                    <img src={c.id_photo_url} alt="ID" className="w-full h-full object-cover" />
                                                </button>
                                            ) : <span className="text-xs text-slate-700">—</span>}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-1">
                                                <a href={`https://wa.me/213${c.phone.replace(/^0+/, '')}`} target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"><MessageCircle size={16} /></a>
                                                <a href={`tel:${c.phone}`} className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"><Phone size={16} /></a>
                                                <button onClick={() => openEditModal(c)} className="p-2 text-slate-600 hover:text-brand-400 transition-colors"><Pencil size={16} /></button>
                                                <button onClick={() => handleDelete(c.id)} className="p-2 text-slate-600 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {customers.length === 0 && <tr><td colSpan="5" className="px-6 py-16 text-center text-slate-600">No customers found.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>

                <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingCustomer(null); }} title={editingCustomer ? 'Edit Customer' : 'New Customer'}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input label="Full Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Phone" type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} required placeholder="0550..." />
                            <Input label="Email" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <Input label="Address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="City, area" />
                        <Input label="National ID / License" value={formData.national_id} onChange={e => setFormData({ ...formData, national_id: e.target.value })} required />
                        <ImageUpload bucket="customer-ids" folder={editingCustomer?.id || 'new'} multiple={false} value={formData.id_photo_url} onChange={(url) => setFormData({ ...formData, id_photo_url: url })} label="ID / License Photo" />
                        <div className="flex justify-end pt-2"><Button type="submit">{editingCustomer ? 'Save Changes' : 'Save Customer'}</Button></div>
                    </form>
                </Modal>

                <Modal isOpen={!!viewingIdPhoto} onClose={() => setViewingIdPhoto(null)} title="ID Photo">
                    {viewingIdPhoto && <div className="flex justify-center"><img src={viewingIdPhoto} alt="Customer ID" className="max-w-full max-h-[70vh] rounded-xl" /></div>}
                </Modal>
            </div>
        </Layout>
    );
}
