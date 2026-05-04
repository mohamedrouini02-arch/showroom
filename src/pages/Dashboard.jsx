import React, { useEffect, useState } from 'react';
import {
    Car,
    DollarSign,
    TrendingUp,
    Key
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

            // Fetch Sales for Revenue and Profit
            const { data: salesData, error: salesError } = await supabase
                .from('sales')
                .select('price, profit, car_id, created_at, cars(make, model, year), customers(name), employees(name)')
                .order('created_at', { ascending: false });

            if (salesError) throw salesError;

            const totalRevenue = salesData?.reduce((acc, s) => acc + (Number(s.price) || 0), 0) || 0;
            const totalProfit = salesData?.reduce((acc, s) => acc + (Number(s.profit) || 0), 0) || 0;

            // Fetch Active Rentals
            const { data: rentalsData, error: rentalsError } = await supabase
                .from('rentals')
                .select('*, cars(make, model, year), customers(name)')
                .eq('status', 'Active')
                .order('end_date', { ascending: true });

            if (rentalsError) throw rentalsError;

            // Fetch Inventory Count
            const { count: inventoryCount, error: inventoryError } = await supabase
                .from('cars')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'Available');

            if (inventoryError) throw inventoryError;

            setStats({
                totalRevenue,
                totalProfit,
                activeRentals: rentalsData?.length || 0,
                inventoryCount: inventoryCount || 0
            });
            setRecentSales(salesData?.slice(0, 5) || []);
            setActiveRentalsList(rentalsData || []);

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
                <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Dashboard">
            <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card title="Total Sales" value={formatMoney(stats.totalRevenue)} icon={DollarSign} color="green" subtext="Gross Revenue" />
                    <Card title="Net Profit" value={formatMoney(stats.totalProfit)} icon={TrendingUp} color="blue" subtext="After Buying Costs" />
                    <Card title="Active Rentals" value={stats.activeRentals} icon={Key} color="orange" subtext="Cars currently out" />
                    <Card title="Inventory" value={stats.inventoryCount} icon={Car} color="purple" subtext="Available Vehicles" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Sales */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-slate-200 dark:border-slate-700">
                        <h3 className="font-semibold mb-4 text-slate-800 dark:text-white">Recent Sales</h3>
                        {recentSales.map(s => (
                            <div key={s.id} className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-slate-700 last:border-0">
                                <div>
                                    <div className="font-medium text-slate-900 dark:text-white">
                                        {s.cars?.year} {s.cars?.make} {s.cars?.model}
                                    </div>
                                    <div className="text-xs text-slate-500">{s.customers?.name} • {s.employees?.name}</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-green-600">{formatMoney(s.price)}</div>
                                    <div className="text-xs text-slate-400">Profit: {formatMoney(s.profit)}</div>
                                </div>
                            </div>
                        ))}
                        {recentSales.length === 0 && <p className="text-slate-500 text-sm">No sales yet.</p>}
                    </div>

                    {/* Active Rentals */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-slate-200 dark:border-slate-700">
                        <h3 className="font-semibold mb-4 text-slate-800 dark:text-white">Active Rentals</h3>
                        {activeRentalsList.map(r => (
                            <div key={r.id} className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-slate-700 last:border-0">
                                <div>
                                    <div className="font-medium text-slate-900 dark:text-white">
                                        {r.cars?.year} {r.cars?.make} {r.cars?.model}
                                    </div>
                                    <div className="text-xs text-slate-500">{r.customers?.name}</div>
                                    <div className="text-xs text-blue-500">Returns: {new Date(r.end_date).toLocaleDateString()}</div>
                                </div>
                                {/* Return button logic would go here, linking to Rentals page or opening modal */}
                            </div>
                        ))}
                        {activeRentalsList.length === 0 && <p className="text-slate-500 text-sm">No active rentals.</p>}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
