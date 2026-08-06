import React, { useEffect, useState } from 'react';
import { Plus, DollarSign, TrendingUp } from 'lucide-react';
import Layout from '../components/Layout';
import { Button, Modal, Input, Select } from '../components/ui';
import { supabase } from '../lib/supabase';

export default function Sales() {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSellModalOpen, setIsSellModalOpen] = useState(false);
    const [availableCars, setAvailableCars] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [saleData, setSaleData] = useState({ carId: '', customerId: '', employeeId: '', finalPrice: '', commissionRate: 0 });
    const [selectedCar, setSelectedCar] = useState(null);

    useEffect(() => { fetchSales(); fetchDropdownData(); }, []);

    const fetchSales = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('sales').select('*, cars(make, model, year), customers(name), employees(name)').order('created_at', { ascending: false });
        if (error) console.error('Error:', error);
        else setSales(data || []);
        setLoading(false);
    };

    const fetchDropdownData = async () => {
        const { data: cars } = await supabase.from('cars').select('*').eq('status', 'Available');
        const { data: custs } = await supabase.from('customers').select('*');
        const { data: emps } = await supabase.from('employees').select('*');
        setAvailableCars(cars || []); setCustomers(custs || []); setEmployees(emps || []);
    };

    const handleCarSelect = (e) => {
        const carId = e.target.value;
        const car = availableCars.find(c => c.id === carId);
        setSaleData({ ...saleData, carId, finalPrice: car ? car.price : '' });
        setSelectedCar(car);
    };

    const handleSell = async (e) => {
        e.preventDefault();
        if (!selectedCar) return;
        try {
            const profit = Number(saleData.finalPrice) - (selectedCar.buying_price || 0);
            const commissionAmount = profit * (Number(saleData.commissionRate) / 100);
            const { error: saleError } = await supabase.from('sales').insert([{
                car_id: saleData.carId, customer_id: saleData.customerId, employee_id: saleData.employeeId,
                buying_price: selectedCar.buying_price || 0, price: Number(saleData.finalPrice),
                commission_rate: Number(saleData.commissionRate), commission_amount: commissionAmount
            }]);
            if (saleError) throw saleError;
            await supabase.from('cars').update({ status: 'Sold' }).eq('id', saleData.carId);
            setIsSellModalOpen(false);
            setSaleData({ carId: '', customerId: '', employeeId: '', finalPrice: '', commissionRate: 0 });
            setSelectedCar(null); fetchSales(); fetchDropdownData();
        } catch (error) { console.error('Error:', error); alert('Failed to process sale.'); }
    };

    const formatMoney = (amount) => `${Number(amount).toLocaleString()} DA`;

    return (
        <Layout title="Sales">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">Sales History</h2>
                    <Button onClick={() => setIsSellModalOpen(true)} icon={Plus} variant="success">New Sale</Button>
                </div>

                <div className="glass rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-800/50">
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Vehicle</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sales Rep</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Price</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Profit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/30">
                                {sales.map(s => (
                                    <tr key={s.id} className="hover:bg-slate-800/20 transition-colors">
                                        <td className="px-6 py-4 text-sm text-slate-500">{new Date(s.created_at).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 font-medium text-white text-sm">{s.cars?.year} {s.cars?.make} {s.cars?.model}</td>
                                        <td className="px-6 py-4 text-slate-400 text-sm">{s.customers?.name}</td>
                                        <td className="px-6 py-4 text-slate-400 text-sm">{s.employees?.name}</td>
                                        <td className="px-6 py-4 text-right font-bold text-emerald-400 text-sm">{formatMoney(s.price)}</td>
                                        <td className="px-6 py-4 text-right text-sm text-slate-500">{formatMoney(s.profit)}</td>
                                    </tr>
                                ))}
                                {sales.length === 0 && <tr><td colSpan="6" className="px-6 py-16 text-center text-slate-600">No sales records found.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>

                <Modal isOpen={isSellModalOpen} onClose={() => setIsSellModalOpen(false)} title="Finalize Sale">
                    <form onSubmit={handleSell} className="space-y-4">
                        <Select label="Select Vehicle" value={saleData.carId} onChange={handleCarSelect}
                            options={[{ label: 'Select Car', value: '' }, ...availableCars.map(c => {
                                const extraInfo = [c.color, c.vin ? `VIN: ${c.vin.slice(-6)}` : null, `${c.mileage?.toLocaleString() || 0} km`].filter(Boolean).join(' • ');
                                return { label: `${c.year} ${c.make} ${c.model} - ${extraInfo} — ${formatMoney(c.price)}`, value: c.id };
                            })]} required />

                        {selectedCar && (
                            <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/20 text-sm">
                                <div className="flex justify-between text-slate-400"><span>Buying Price:</span> <span>{formatMoney(selectedCar.buying_price)}</span></div>
                                <div className="flex justify-between font-bold text-white mt-1"><span>Target Price:</span> <span>{formatMoney(selectedCar.price)}</span></div>
                            </div>
                        )}

                        <Select label="Customer" value={saleData.customerId} onChange={e => setSaleData({ ...saleData, customerId: e.target.value })}
                            options={[{ label: 'Select Customer', value: '' }, ...customers.map(c => ({ label: c.name, value: c.id }))]} required />
                        <Select label="Sales Rep" value={saleData.employeeId} onChange={e => setSaleData({ ...saleData, employeeId: e.target.value })}
                            options={[{ label: 'Select Employee', value: '' }, ...employees.map(e => ({ label: e.name, value: e.id }))]} required />

                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Final Price (DA)" type="number" value={saleData.finalPrice} onChange={e => setSaleData({ ...saleData, finalPrice: e.target.value })} required />
                            <Input label="Commission %" type="number" value={saleData.commissionRate} onChange={e => setSaleData({ ...saleData, commissionRate: e.target.value })} />
                        </div>

                        {saleData.finalPrice && selectedCar && (
                            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                                <div className="flex justify-between text-sm"><span className="text-slate-400">Gross Profit:</span><span className="font-bold text-emerald-400">{formatMoney(Number(saleData.finalPrice) - (selectedCar.buying_price || 0))}</span></div>
                                <div className="flex justify-between text-sm mt-1"><span className="text-slate-500">Commission ({saleData.commissionRate}%):</span><span className="text-slate-400">{formatMoney((Number(saleData.finalPrice) - (selectedCar.buying_price || 0)) * (Number(saleData.commissionRate) / 100))}</span></div>
                            </div>
                        )}

                        <div className="flex justify-end pt-2">
                            <Button type="submit" variant="success" size="lg">Confirm Sale</Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </Layout>
    );
}
