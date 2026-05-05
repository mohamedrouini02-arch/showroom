import React, { useEffect, useState } from 'react';
import { UserPlus, Trash2, Pencil, Phone, Mail } from 'lucide-react';
import Layout from '../components/Layout';
import { Button, Modal, Input } from '../components/ui';
import { supabase } from '../lib/supabase';

export default function HR() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [stats, setStats] = useState({});
    const initialState = { name: '', role: 'Sales', email: '', phone: '' };
    const [formData, setFormData] = useState(initialState);

    useEffect(() => { fetchEmployeesAndStats(); }, []);

    const fetchEmployeesAndStats = async () => {
        setLoading(true);
        const { data: emps, error: empError } = await supabase.from('employees').select('*').order('joined_at', { ascending: false });
        if (!empError) setEmployees(emps || []);
        const { data: sales, error: salesError } = await supabase.from('sales').select('employee_id, commission_amount');
        if (!salesError && sales) {
            const newStats = {};
            sales.forEach(s => {
                if (!newStats[s.employee_id]) newStats[s.employee_id] = { count: 0, commission: 0 };
                newStats[s.employee_id].count += 1;
                newStats[s.employee_id].commission += (s.commission_amount || 0);
            });
            setStats(newStats);
        }
        setLoading(false);
    };

    const openAddModal = () => { setEditingEmployee(null); setFormData(initialState); setIsModalOpen(true); };
    const openEditModal = (emp) => {
        setEditingEmployee(emp);
        setFormData({ name: emp.name || '', role: emp.role || 'Sales', email: emp.email || '', phone: emp.phone || '' });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingEmployee) {
                const { error } = await supabase.from('employees').update(formData).eq('id', editingEmployee.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('employees').insert([formData]);
                if (error) throw error;
            }
            setIsModalOpen(false); setFormData(initialState); setEditingEmployee(null); fetchEmployeesAndStats();
        } catch (error) { console.error('Error:', error); alert('Failed to save employee.'); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this employee?')) return;
        const { error } = await supabase.from('employees').delete().eq('id', id);
        if (!error) fetchEmployeesAndStats();
    };

    const formatMoney = (amount) => `${Number(amount).toLocaleString()} DA`;

    const roleColors = {
        Sales: 'from-blue-500/20 to-blue-600/5 border-blue-500/10',
        Manager: 'from-purple-500/20 to-purple-600/5 border-purple-500/10',
        Mechanic: 'from-orange-500/20 to-orange-600/5 border-orange-500/10',
    };

    return (
        <Layout title="Human Resources">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">Staff & Commissions</h2>
                    <Button onClick={openAddModal} icon={UserPlus}>Add Staff</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {employees.map(emp => {
                        const empStats = stats[emp.id] || { count: 0, commission: 0 };
                        const gradient = roleColors[emp.role] || roleColors.Sales;
                        return (
                            <div key={emp.id} className={`stat-card bg-gradient-to-br ${gradient} backdrop-blur-sm p-6 relative group`}>
                                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openEditModal(emp)} className="p-1.5 text-slate-500 hover:text-brand-400 transition-colors rounded-lg hover:bg-slate-800/50"><Pencil size={14} /></button>
                                    <button onClick={() => handleDelete(emp.id)} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors rounded-lg hover:bg-slate-800/50"><Trash2 size={14} /></button>
                                </div>

                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-brand-500/20 rounded-xl flex items-center justify-center text-brand-400 font-bold text-lg uppercase">
                                        {emp.name[0]}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white">{emp.name}</h3>
                                        <p className="text-xs text-slate-500">{emp.role}</p>
                                    </div>
                                </div>

                                {(emp.phone || emp.email) && (
                                    <div className="text-xs text-slate-500 mb-4 space-y-1">
                                        {emp.phone && <div className="flex items-center gap-1.5"><Phone size={10} /> {emp.phone}</div>}
                                        {emp.email && <div className="flex items-center gap-1.5"><Mail size={10} /> {emp.email}</div>}
                                    </div>
                                )}

                                <div className="border-t border-slate-800/30 pt-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Sales</span>
                                        <span className="font-bold text-white">{empStats.count}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Commission</span>
                                        <span className="font-bold text-emerald-400">{formatMoney(empStats.commission)}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {employees.length === 0 && <p className="text-slate-600 col-span-full text-center py-20">No staff members found.</p>}
                </div>

                <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingEmployee(null); }} title={editingEmployee ? 'Edit Staff' : 'New Staff Member'}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input label="Full Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                        <Input label="Role" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} placeholder="Sales, Mechanic, Manager" />
                        <Input label="Email" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        <Input label="Phone" type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                        <div className="flex justify-end pt-2"><Button type="submit">{editingEmployee ? 'Save Changes' : 'Save Employee'}</Button></div>
                    </form>
                </Modal>
            </div>
        </Layout>
    );
}
