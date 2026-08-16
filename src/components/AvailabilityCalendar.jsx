import React, { useState, useEffect } from 'react';
import { 
    ChevronLeft, 
    ChevronRight, 
    CheckCircle2, 
    XCircle, 
    Calendar as CalendarIcon, 
    Car, 
    Info, 
    AlertCircle,
    User,
    Check,
    X
} from 'lucide-react';
import { 
    format, 
    addMonths, 
    subMonths, 
    startOfMonth, 
    endOfMonth, 
    startOfWeek, 
    endOfWeek, 
    eachDayOfInterval, 
    isSameMonth, 
    isToday, 
    isBefore,
    startOfDay,
    addDays
} from 'date-fns';
import { supabase } from '../lib/supabase';

export default function AvailabilityCalendar({
    cars = [],
    selectedCarId,
    carName,
    rentals = [],
    appointments = [],
    currentAppointmentId = null,
    startDate: selectedStartDate = '',
    endDate: selectedEndDate = '',
    onSelectRange,
    viewOnly = false,
    onAppointmentClick
}) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [fetchedCars, setFetchedCars] = useState([]);
    const [allFetchedRentals, setAllFetchedRentals] = useState([]);
    const [allFetchedAppointments, setAllFetchedAppointments] = useState([]);
    
    // Hover & Click Day detail breakdown state
    const [hoveredDay, setHoveredDay] = useState(null);
    const [pinnedDay, setPinnedDay] = useState(null);

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const calendarStartDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday start
    const calendarEndDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days = eachDayOfInterval({ start: calendarStartDate, end: calendarEndDate });
    const today = startOfDay(new Date());

    const formatDateKey = (date) => format(date, 'yyyy-MM-dd');

    // Fetch all cars, active rentals, and appointments if not provided by parent
    useEffect(() => {
        let isMounted = true;

        const loadCalendarData = async () => {
            if (!cars || cars.length === 0) {
                const { data } = await supabase.from('cars').select('*').order('make', { ascending: true });
                if (data && isMounted) setFetchedCars(data);
            }

            if (!rentals || rentals.length === 0) {
                const { data: rentalsData } = await supabase
                    .from('rentals')
                    .select('*, cars(make, model, year), customers(name, phone)')
                    .eq('status', 'Active');
                if (rentalsData && isMounted) setAllFetchedRentals(rentalsData);
            }

            if (!appointments || appointments.length === 0) {
                const { data: appointmentsData } = await supabase
                    .from('rental_appointments')
                    .select('*, cars(make, model, year), customers(name, phone)')
                    .eq('status', 'Scheduled');
                if (appointmentsData && isMounted) setAllFetchedAppointments(appointmentsData);
            }
        };

        loadCalendarData();
        return () => { isMounted = false; };
    }, [cars, rentals, appointments]);

    const activeCarsList = (cars && cars.length > 0) ? cars : fetchedCars;
    const activeRentalsList = (rentals && rentals.length > 0) ? rentals : allFetchedRentals;
    const activeAppointmentsList = (appointments && appointments.length > 0) ? appointments : allFetchedAppointments;

    /**
     * Get detailed fleet status for a specific day
     */
    const getDayFleetStatus = (day) => {
        const dayStr = formatDateKey(day);
        const dayDate = startOfDay(day);
        const isPast = isBefore(dayDate, today);

        // If filtering by a single specific car
        if (selectedCarId) {
            const carObj = activeCarsList.find(c => c.id === selectedCarId);
            
            const matchingRental = activeRentalsList.find(r => {
                if (r.status !== 'Active' || r.car_id !== selectedCarId) return false;
                return dayStr >= r.start_date && dayStr <= r.end_date;
            });

            const matchingAppointment = activeAppointmentsList.find(a => {
                if (a.status !== 'Scheduled' || a.car_id !== selectedCarId) return false;
                if (currentAppointmentId && a.id === currentAppointmentId) return false;
                const aptStart = a.appointment_date;
                const aptEnd = a.end_date || a.appointment_date;
                return dayStr >= aptStart && dayStr <= aptEnd;
            });

            const isBooked = Boolean(matchingRental || matchingAppointment);
            
            return {
                dayStr,
                isPast,
                selectedCarMode: true,
                color: isPast ? 'SLATE' : isBooked ? 'RED' : 'GREEN',
                isAvailable: !isBooked && !isPast,
                bookedCount: isBooked ? 1 : 0,
                freeCount: isBooked ? 0 : 1,
                totalCars: 1,
                carBreakdown: [{
                    car: carObj || { id: selectedCarId, make: carName || 'Selected Vehicle', model: '' },
                    isBooked,
                    bookingInfo: matchingRental ? { type: 'rental', item: matchingRental } : matchingAppointment ? { type: 'appointment', item: matchingAppointment } : null
                }]
            };
        }

        // Fleet overview mode (All Vehicles)
        const carBreakdown = activeCarsList.map(car => {
            const matchingRental = activeRentalsList.find(r => {
                if (r.status !== 'Active' || r.car_id !== car.id) return false;
                return dayStr >= r.start_date && dayStr <= r.end_date;
            });

            const matchingAppointment = activeAppointmentsList.find(a => {
                if (a.status !== 'Scheduled' || a.car_id !== car.id) return false;
                if (currentAppointmentId && a.id === currentAppointmentId) return false;
                const aptStart = a.appointment_date;
                const aptEnd = a.end_date || a.appointment_date;
                return dayStr >= aptStart && dayStr <= aptEnd;
            });

            const isBooked = Boolean(matchingRental || matchingAppointment);
            return {
                car,
                isBooked,
                bookingInfo: matchingRental ? { type: 'rental', item: matchingRental } : matchingAppointment ? { type: 'appointment', item: matchingAppointment } : null
            };
        });

        const totalCars = carBreakdown.length || 1;
        const bookedCount = carBreakdown.filter(c => c.isBooked).length;
        const freeCount = totalCars - bookedCount;

        let color = 'GREEN';
        if (isPast) {
            color = 'SLATE';
        } else if (totalCars > 0 && freeCount === 0) {
            color = 'RED'; // 🔴 All vehicles fully booked!
        } else if (bookedCount > 0 && freeCount > 0) {
            color = 'ORANGE'; // 🟠 1 or more vehicles available!
        } else {
            color = 'GREEN'; // 🟢 All vehicles available!
        }

        return {
            dayStr,
            isPast,
            selectedCarMode: false,
            color,
            isAvailable: freeCount > 0 && !isPast,
            bookedCount,
            freeCount,
            totalCars,
            carBreakdown
        };
    };

    // Range validity check
    const isRangeFullyAvailable = (startStr, endStr) => {
        let current = new Date(startStr);
        const end = new Date(endStr);

        while (current <= end) {
            const status = getDayFleetStatus(current);
            if (!status.isAvailable) return false;
            current = addDays(current, 1);
        }
        return true;
    };

    // Handle range selection click
    const handleDayClick = (day, dayStatus) => {
        setPinnedDay(dayStatus.dayStr === pinnedDay ? null : dayStatus.dayStr);

        if (!onSelectRange) return;

        const dayStr = dayStatus.dayStr;

        if (!selectedStartDate || (selectedStartDate && selectedEndDate && selectedStartDate !== selectedEndDate)) {
            onSelectRange(dayStr, dayStr);
            return;
        }

        if (dayStr >= selectedStartDate) {
            if (isRangeFullyAvailable(selectedStartDate, dayStr)) {
                onSelectRange(selectedStartDate, dayStr);
            } else {
                alert('⚠️ Selected date range contains fully booked days! Please select an available range.');
                onSelectRange(dayStr, dayStr);
            }
        } else {
            onSelectRange(dayStr, dayStr);
        }
    };

    const activeInspectDay = pinnedDay || hoveredDay;
    const activeDayInfo = activeInspectDay ? getDayFleetStatus(new Date(activeInspectDay)) : null;

    return (
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-2xl backdrop-blur-md relative">
            {/* Header / Month Navigation */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
                        <CalendarIcon size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-base tracking-tight">
                            {format(currentMonth, 'MMMM yyyy')}
                        </h3>
                        <p className="text-xs text-slate-400 font-medium">
                            {carName ? (
                                <>Schedule for: <span className="text-brand-400 font-semibold">{carName}</span></>
                            ) : (
                                <>Fleet Overview: <span className="text-emerald-400 font-semibold">{activeCarsList.length} Vehicles</span></>
                            )}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={prevMonth}
                        className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
                        title="Previous Month"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <button
                        type="button"
                        onClick={() => setCurrentMonth(new Date())}
                        className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
                    >
                        Today
                    </button>
                    <button
                        type="button"
                        onClick={nextMonth}
                        className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            {/* Availability Color Legend */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 text-xs p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-500/50"></span>
                        <span className="text-red-400 font-semibold">🔴 Fully Booked (0 Cars)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50"></span>
                        <span className="text-amber-400 font-semibold">🟠 1+ Vehicle Available</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
                        <span className="text-emerald-400 font-semibold">🟢 All Available</span>
                    </div>
                </div>

                <div className="text-[11px] text-slate-400">
                    💡 Hover or Click any day to see vehicle breakdown
                </div>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1.5 mb-2 text-center">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                    <div key={i} className="text-xs font-bold text-slate-500 uppercase tracking-wider py-1">
                        {d}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1.5">
                {days.map((day, idx) => {
                    const dayStr = formatDateKey(day);
                    const isCurrentMonth = isSameMonth(day, monthStart);
                    const status = getDayFleetStatus(day);
                    const isTodayDate = isToday(day);

                    const isStart = selectedStartDate === dayStr;
                    const isEnd = selectedEndDate === dayStr;
                    const isInRange = selectedStartDate && selectedEndDate && dayStr >= selectedStartDate && dayStr <= selectedEndDate;
                    const isPinned = pinnedDay === dayStr;

                    // Button Styling Logic
                    let cellBg = 'bg-slate-900/40 text-slate-600 border-slate-800/30';
                    let badge = null;

                    if (isCurrentMonth) {
                        if (isInRange) {
                            if (isStart || isEnd) {
                                cellBg = 'bg-blue-600 border-blue-400 text-white font-bold shadow-lg shadow-blue-600/40 scale-105 z-10';
                            } else {
                                cellBg = 'bg-blue-600/60 border-blue-500/50 text-white font-semibold z-0';
                            }
                            badge = <span className="text-[9px] font-bold text-blue-100 block">{isStart && isEnd ? 'Selected' : isStart ? 'Start' : isEnd ? 'End' : 'In Range'}</span>;
                        } else if (status.isPast) {
                            cellBg = 'bg-slate-950/40 border-slate-900 text-slate-600 opacity-40 cursor-not-allowed';
                            badge = <span className="text-[9px] text-slate-600 block">Past</span>;
                        } else if (status.color === 'RED') {
                            // 🔴 FULLY BOOKED
                            cellBg = 'bg-red-950/40 border-red-500/40 text-red-300 hover:border-red-400 cursor-pointer';
                            badge = <span className="text-[9px] px-1.5 py-0.5 bg-red-500/20 text-red-300 font-bold rounded block truncate">Fully Booked</span>;
                        } else if (status.color === 'ORANGE') {
                            // 🟠 PARTIALLY AVAILABLE
                            cellBg = 'bg-amber-950/40 border-amber-500/40 text-amber-300 hover:border-amber-400 hover:scale-[1.02] cursor-pointer';
                            badge = (
                                <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/20 text-amber-300 font-bold rounded block truncate">
                                    {status.freeCount}/{status.totalCars} Free
                                </span>
                            );
                        } else {
                            // 🟢 ALL AVAILABLE
                            cellBg = 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-400 hover:scale-[1.02] cursor-pointer';
                            badge = <span className="text-[9px] font-semibold text-emerald-400/90 block">All Free</span>;
                        }
                    } else {
                        cellBg = 'bg-slate-950/20 border-transparent text-slate-700 opacity-30 cursor-not-allowed';
                    }

                    return (
                        <button
                            key={idx}
                            type="button"
                            disabled={!isCurrentMonth}
                            onMouseEnter={() => setHoveredDay(dayStr)}
                            onMouseLeave={() => setHoveredDay(null)}
                            onClick={() => handleDayClick(day, status)}
                            className={`
                                relative min-h-[58px] p-2 rounded-xl border flex flex-col justify-between text-left transition-all duration-150
                                ${cellBg}
                                ${isTodayDate && !isInRange ? 'ring-2 ring-brand-400/80' : ''}
                                ${isPinned ? 'ring-2 ring-white scale-105 z-20' : ''}
                            `}
                        >
                            <div className="flex items-center justify-between w-full">
                                <span className={`text-xs ${isInRange ? 'font-black text-white' : 'font-bold'}`}>
                                    {format(day, 'd')}
                                </span>
                                {isTodayDate && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse"></span>
                                )}
                            </div>

                            <div className="w-full mt-1">
                                {badge}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Hover / Click Vehicle Fleet Status Breakdown Card */}
            {activeDayInfo && (
                <div className="mt-4 p-4 rounded-2xl bg-slate-950/90 border border-slate-800 shadow-2xl animate-fade-in">
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                            <Car size={18} className="text-brand-400" />
                            <span className="font-bold text-white text-sm">
                                Vehicle Availability Breakdown — {format(new Date(activeDayInfo.dayStr), 'EEEE, MMMM d, yyyy')}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                activeDayInfo.color === 'RED' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                activeDayInfo.color === 'ORANGE' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}>
                                {activeDayInfo.freeCount} of {activeDayInfo.totalCars} Vehicles Free
                            </span>

                            {pinnedDay && (
                                <button 
                                    type="button" 
                                    onClick={() => setPinnedDay(null)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
                        {activeDayInfo.carBreakdown.map(({ car, isBooked, bookingInfo }) => {
                            if (!car) return null;
                            const carTitle = `${car.year || ''} ${car.make || ''} ${car.model || ''}`;

                            return (
                                <div
                                    key={car.id}
                                    className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                                        isBooked
                                            ? 'bg-red-950/30 border-red-500/30 text-red-200'
                                            : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200 hover:bg-emerald-950/50'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="font-bold text-xs text-white truncate max-w-[170px]" title={carTitle}>
                                            {carTitle}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                            isBooked ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                                        }`}>
                                            {isBooked ? '🔴 BOOKED' : '🟢 AVAILABLE'}
                                        </span>
                                    </div>

                                    {isBooked && bookingInfo ? (
                                        <div className="text-[11px] text-red-300/90 space-y-0.5">
                                            <div className="flex items-center gap-1 font-semibold">
                                                <User size={12} className="text-red-400" />
                                                <span className="truncate">
                                                    {bookingInfo.item.customers?.name || bookingInfo.item.customer_name || 'Customer'}
                                                </span>
                                            </div>
                                            <div className="text-[10px] text-slate-400">
                                                {bookingInfo.type === 'rental' 
                                                    ? `Rental: ${bookingInfo.item.start_date} to ${bookingInfo.item.end_date}` 
                                                    : `Appt: ${bookingInfo.item.appointment_date} (${bookingInfo.item.appointment_time?.slice(0, 5) || ''})`}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-[11px] text-emerald-400/90 flex items-center justify-between mt-1">
                                            <span>Ready for rent</span>
                                            <span className="font-bold text-white">{car.daily_rate ? `${car.daily_rate} DA/day` : ''}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Selected Range Display Bar */}
            {selectedStartDate && (
                <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-400" />
                        <span className="text-xs text-emerald-300 font-medium">
                            Selected Range: <strong className="text-white">{selectedStartDate}</strong> {selectedEndDate && selectedEndDate !== selectedStartDate ? `to ${selectedEndDate}` : ''}
                        </span>
                    </div>
                    <span className="text-xs font-semibold text-emerald-400">🟢 Available Range</span>
                </div>
            )}
        </div>
    );
}
