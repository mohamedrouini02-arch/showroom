import React, { useEffect, useState } from 'react';
import {
    Car,
    DollarSign,
    TrendingUp,
    Key,
    ArrowUpRight,
    Clock
} from 'lucide-react';
import Layout from '../components/Layout';
import { Card } from '../components/ui';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalProfit: 0,
        activeRentals: 0,
        inventoryCount: 0
    });
    const [recentSales, setRecentSales] = useState([]);
    const [activeRentalsList, setActiveRentalsList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            const { data: salesData, error: salesError } = await supabase
                .from('sales')
                .select('price, profit, car_id, created_at, cars(make, model, year), customers(name), employees(name)')
                .order('created_at', { ascending: false });

            if (salesError) throw salesError;

            const { data: allRentalsData, error: rentalsError } = await supabase
                .from('rentals')
                .select('*, cars(make, model, year), customers(name)')
                .order('end_date', { ascending: true });

            if (rentalsError) throw rentalsError;

            const rentalRevenue = allRentalsData?.reduce((acc, r) => acc + (Number(r.total_cost) || 0), 0) || 0;

            const totalRevenue = (salesData?.reduce((acc, s) => acc + (Number(s.price) || 0), 0) || 0) + rentalRevenue;
            const totalProfit = (salesData?.reduce((acc, s) => acc + (Number(s.profit) || 0), 0) || 0) + rentalRevenue;

            const activeRentals = allRentalsData?.filter(r => r.status === 'Active') || [];

            const { count: inventoryCount, error: inventoryError } = await supabase
                .from('cars')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'Available');

            if (inventoryError) throw inventoryError;

            setStats({
                totalRevenue,
                totalProfit,
                activeRentals: activeRentals.length,
                inventoryCount: inventoryCount || 0
            });
            setRecentSales(salesData?.slice(0, 5) || []);
            setActiveRentalsList(activeRentals);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatMoney = (amount) => `${Number(amount).toLocaleString()} DA`;

    if (loading) {
        return (
            <Layout title="Dashboard">
                <div className="flex items-center justify-center h-[60vh]">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-brand-500/20 flex items-center justify-center animate-pulse-soft">
                            <Car className="text-brand-400" size={24} />
                        </div>
                        <p className="text-sm text-slate-500">Loading dashboard...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Dashboard">
            <div className="space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    <Card title="Total Sales" value={formatMoney(stats.totalRevenue)} icon={DollarSign} color="green" subtext="Gross Revenue" />
                    <Card title="Net Profit" value={formatMoney(stats.totalProfit)} icon={TrendingUp} color="blue" subtext="After Buying Costs" />
                    <Card title="Active Rentals" value={stats.activeRentals} icon={Key} color="orange" subtext="Cars currently out" />
                    <Card title="Inventory" value={stats.inventoryCount} icon={Car} color="purple" subtext="Available Vehicles" />
                </div>

                {/* Data panels */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Sales */}
                    <div className="glass rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <DollarSign size={18} className="text-emerald-400" />
                                Recent Sales
                            </h3>
                            <span className="text-xs text-slate-500 bg-slate-800/50 px-2 py-1 rounded-lg">{recentSales.length} sales</span>
                        </div>
                        <div className="space-y-1">
                            {recentSales.map(s => (
                                <div key={s.id} className="flex justify-between items-center py-3 px-3 rounded-xl hover:bg-slate-800/30 transition-colors group">
                                    <div>
                                        <div className="font-medium text-white text-sm">
                                            {s.cars?.year} {s.cars?.make} {s.cars?.model}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-0.5">{s.customers?.name} • {s.employees?.name}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-emerald-400 text-sm">{formatMoney(s.price)}</div>
                                        <div className="text-xs text-slate-600">+{formatMoney(s.profit)}</div>
                                    </div>
                                </div>
                            ))}
                            {recentSales.length === 0 && <p className="text-slate-600 text-sm py-8 text-center">No sales yet.</p>}
                        </div>
                    </div>

                    {/* Active Rentals */}
                    <div className="glass rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <Key size={18} className="text-orange-400" />
                                Active Rentals
                            </h3>
                            <span className="text-xs text-slate-500 bg-slate-800/50 px-2 py-1 rounded-lg">{activeRentalsList.length} active</span>
                        </div>
                        <div className="space-y-1">
                            {activeRentalsList.map(r => (
                                <div key={r.id} className="flex justify-between items-center py-3 px-3 rounded-xl hover:bg-slate-800/30 transition-colors">
                                    <div>
                                        <div className="font-medium text-white text-sm">
                                            {r.cars?.year} {r.cars?.make} {r.cars?.model}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-0.5">{r.customers?.name}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-1 text-orange-400 text-xs font-medium">
                                            <Clock size={12} />
                                            {new Date(r.end_date).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {activeRentalsList.length === 0 && <p className="text-slate-600 text-sm py-8 text-center">No active rentals.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
