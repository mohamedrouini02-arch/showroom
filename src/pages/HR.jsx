import React, { useEffect, useState } from 'react';
import { UserPlus, Trash2, Pencil } from 'lucide-react';
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

    useEffect(() => {
        fetchEmployeesAndStats();
    }, []);

    const fetchEmployeesAndStats = async () => {
        setLoading(true);

        // Fetch Employees
        const { data: emps, error: empError } = await supabase.from('employees').select('*').order('joined_at', { ascending: false });
        if (empError) console.error('Error fetching employees:', empError);
        else setEmployees(emps || []);

        // Fetch Sales Stats for Commission Calculation
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

    const openAddModal = () => {
        setEditingEmployee(null);
        setFormData(initialState);
        setIsModalOpen(true);
    };

    const openEditModal = (emp) => {
        setEditingEmployee(emp);
        setFormData({
            name: emp.name || '',
            role: emp.role || 'Sales',
            email: emp.email || '',
            phone: emp.phone || ''
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingEmployee) {
                const { error } = await supabase
                    .from('employees')
                    .update(formData)
                    .eq('id', editingEmployee.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('employees').insert([formData]);
                if (error) throw error;
            }
            setIsModalOpen(false);
            setFormData(initialState);
            setEditingEmployee(null);
            fetchEmployeesAndStats();
        } catch (error) {
            console.error('Error saving employee:', error);
            alert('Failed to save employee.');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this employee?')) return;
        const { error } = await supabase.from('employees').delete().eq('id', id);
        if (error) console.error('Error deleting employee:', error);
        else fetchEmployeesAndStats();
    };

    const formatMoney = (amount) => `${Number(amount).toLocaleString()} DA`;

    return (
        <Layout title="Human Resources">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Staff & Commissions</h2>
                    <Button onClick={openAddModal} icon={UserPlus}>Add Staff</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {employees.map(emp => {
                        const empStats = stats[emp.id] || { count: 0, commission: 0 };
                        return (
                            <div key={emp.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 relative">
                                <div className="absolute top-4 right-4 flex gap-2">
                                    <button onClick={() => openEditModal(emp)} className="text-slate-300 hover:text-blue-500 transition-colors"><Pencil size={18} /></button>
                                    <button onClick={() => handleDelete(emp.id)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                                </div>
                                <div className="flex items-center mb-4">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg mr-3 uppercase">{emp.name[0]}</div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white">{emp.name}</h3>
                                        <p className="text-sm text-slate-500">{emp.role}</p>
                                    </div>
                                </div>
                                {(emp.phone || emp.email) && (
                                    <div className="text-xs text-slate-500 mb-3 space-y-1">
                                        {emp.phone && <div>📞 {emp.phone}</div>}
                                        {emp.email && <div>✉️ {emp.email}</div>}
                                    </div>
                                )}
                                <div className="border-t border-slate-100 dark:border-slate-700 pt-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Sales Count</span>
                                        <span className="font-medium text-slate-900 dark:text-white">{empStats.count}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Total Commission</span>
                                        <span className="font-medium text-green-600">{formatMoney(empStats.commission)}</span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                    {employees.length === 0 && <p className="text-slate-500 col-span-full text-center py-10">No staff members found.</p>}
                </div>

                {/* Add/Edit Employee Modal */}
                <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingEmployee(null); }} title={editingEmployee ? 'Edit Staff Member' : 'New Staff Member'}>
                    <form onSubmit={handleSubmit}>
                        <Input label="Full Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                        <Input label="Role" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} placeholder="Sales, Mechanic, Manager" />
                        <Input label="Email" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        <Input label="Phone" type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                        <div className="flex justify-end pt-4">
                            <Button type="submit">{editingEmployee ? 'Save Changes' : 'Save Employee'}</Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </Layout>
    );
}
