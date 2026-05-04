import React, { useEffect, useState } from 'react';
import { UserPlus, Trash2 } from 'lucide-react';
import Layout from '../components/Layout';
import { Button, Modal, Input } from '../components/ui';
import { supabase } from '../lib/supabase';

export default function HR() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
    const [newEmployee, setNewEmployee] = useState({ name: '', role: 'Sales', email: '', phone: '' });
    const [stats, setStats] = useState({});

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

    const handleAddEmployee = async (e) => {
        e.preventDefault();
        try {
            const { error } = await supabase.from('employees').insert([newEmployee]);
            if (error) throw error;
            setIsAddEmployeeOpen(false);
            setNewEmployee({ name: '', role: 'Sales', email: '', phone: '' });
            fetchEmployeesAndStats();
        } catch (error) {
            console.error('Error adding employee:', error);
            alert('Failed to add employee.');
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
                    <Button onClick={() => setIsAddEmployeeOpen(true)} icon={UserPlus}>Add Staff</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {employees.map(emp => {
                        const empStats = stats[emp.id] || { count: 0, commission: 0 };
                        return (
                            <div key={emp.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 relative">
                                <button onClick={() => handleDelete(emp.id)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                                <div className="flex items-center mb-4">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg mr-3 uppercase">{emp.name[0]}</div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white">{emp.name}</h3>
                                        <p className="text-sm text-slate-500">{emp.role}</p>
                                    </div>
                                </div>
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

                {/* Add Employee Modal */}
                <Modal isOpen={isAddEmployeeOpen} onClose={() => setIsAddEmployeeOpen(false)} title="New Staff Member">
                    <form onSubmit={handleAddEmployee}>
                        <Input label="Full Name" value={newEmployee.name} onChange={e => setNewEmployee({ ...newEmployee, name: e.target.value })} required />
                        <Input label="Role" value={newEmployee.role} onChange={e => setNewEmployee({ ...newEmployee, role: e.target.value })} placeholder="Sales, Mechanic, Manager" />
                        <Input label="Email" type="email" value={newEmployee.email} onChange={e => setNewEmployee({ ...newEmployee, email: e.target.value })} />
                        <Input label="Phone" type="tel" value={newEmployee.phone} onChange={e => setNewEmployee({ ...newEmployee, phone: e.target.value })} />
                        <div className="flex justify-end pt-4">
                            <Button type="submit">Save Employee</Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </Layout>
    );
}
