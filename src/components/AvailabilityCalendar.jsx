import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, Calendar as CalendarIcon, Clock, AlertTriangle } from 'lucide-react';
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
    isSameDay, 
    isToday, 
    parseISO, 
    isBefore,
    startOfDay
} from 'date-fns';

export default function AvailabilityCalendar({
    selectedCarId,
    carName,
    rentals = [],
    appointments = [],
    currentAppointmentId = null,
    selectedDate = '',
    onSelectDate,
    viewOnly = false,
    onAppointmentClick
}) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const today = startOfDay(new Date());

    // Helper to format date string to YYYY-MM-DD
    const formatDateKey = (date) => format(date, 'yyyy-MM-dd');

    // Determine availability of a specific date for selected car (or general)
    const getDateStatus = (day) => {
        const dayStr = formatDateKey(day);
        const dayDate = startOfDay(day);

        // Check if date is in the past
        const isPast = isBefore(dayDate, today);

        // Find active rentals overlapping with this date
        const matchingRental = rentals.find(r => {
            if (r.status !== 'Active') return false;
            if (selectedCarId && r.car_id !== selectedCarId) return false;
            
            const start = r.start_date;
            const end = r.end_date;
            return dayStr >= start && dayStr <= end;
        });

        // Find scheduled appointments on this date
        const matchingAppointment = appointments.find(a => {
            if (a.status !== 'Scheduled') return false;
            if (currentAppointmentId && a.id === currentAppointmentId) return false;
            if (selectedCarId && a.car_id !== selectedCarId) return false;
            
            return a.appointment_date === dayStr;
        });

        if (matchingRental) {
            return {
                isAvailable: false,
                reason: 'Rented',
                details: `Car rented from ${matchingRental.start_date} to ${matchingRental.end_date}`,
                type: 'rental',
                item: matchingRental
            };
        }

        if (matchingAppointment) {
            return {
                isAvailable: false,
                reason: 'Booked Appointment',
                details: `Appointment scheduled at ${matchingAppointment.appointment_time?.slice(0, 5) || ''}`,
                type: 'appointment',
                item: matchingAppointment
            };
        }

        return {
            isAvailable: !isPast, // past dates can be styled, but future dates are green available
            reason: isPast ? 'Past Date' : 'Available',
            details: isPast ? 'Date has passed' : 'Date is available for appointment',
            type: isPast ? 'past' : 'available'
        };
    };

    return (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md">
            {/* Header / Month Navigation */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400">
                        <CalendarIcon size={18} />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-base">
                            {format(currentMonth, 'MMMM yyyy')}
                        </h3>
                        {carName && (
                            <p className="text-xs text-slate-400 font-medium">
                                Schedule for: <span className="text-brand-400 font-semibold">{carName}</span>
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1">
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
                        title="Next Month"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            {/* Availability Legend */}
            <div className="flex flex-wrap items-center gap-4 mb-4 text-xs p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/80">
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
                    <span className="text-emerald-400 font-medium">Available (Green)</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-500/50"></span>
                    <span className="text-red-400 font-medium">Unavailable / Booked (Disabled)</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50"></span>
                    <span className="text-blue-400 font-medium">Selected Date</span>
                </div>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 mb-2 text-center">
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
                    const status = getDateStatus(day);
                    const isSelected = selectedDate === dayStr;
                    const isTodayDate = isToday(day);

                    // Styling logic
                    let cellBg = 'bg-slate-900/40 text-slate-600 border-slate-800/30';
                    let statusBadge = null;

                    if (isCurrentMonth) {
                        if (isSelected) {
                            cellBg = 'bg-blue-600 border-blue-400 text-white font-bold shadow-lg shadow-blue-600/30 scale-105 z-10';
                        } else if (!status.isAvailable) {
                            // RED UNAVAILABLE - DISABLED
                            cellBg = 'bg-red-950/40 border-red-500/30 text-red-400/80 cursor-not-allowed opacity-75';
                            if (status.type === 'rental') {
                                statusBadge = <span className="text-[9px] px-1 bg-red-500/20 text-red-300 rounded block truncate">Rented</span>;
                            } else if (status.type === 'appointment') {
                                statusBadge = <span className="text-[9px] px-1 bg-orange-500/20 text-orange-300 rounded block truncate">Booked</span>;
                            } else if (status.type === 'past') {
                                cellBg = 'bg-slate-900/30 border-slate-800/50 text-slate-600 cursor-not-allowed opacity-40';
                            }
                        } else {
                            // GREEN AVAILABLE - CLICKABLE
                            cellBg = 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 hover:border-emerald-400 hover:scale-105 transition-all cursor-pointer';
                            statusBadge = <span className="text-[9px] font-semibold text-emerald-400/90 block">Free</span>;
                        }
                    } else {
                        // Days outside current month
                        cellBg = 'bg-slate-950/20 border-transparent text-slate-700 opacity-30 cursor-not-allowed';
                    }

                    return (
                        <button
                            key={idx}
                            type="button"
                            disabled={!isCurrentMonth || (!status.isAvailable && !viewOnly)}
                            onClick={() => {
                                if (viewOnly && status.type === 'appointment' && onAppointmentClick) {
                                    onAppointmentClick(status.item);
                                } else if (status.isAvailable && onSelectDate) {
                                    onSelectDate(dayStr);
                                }
                            }}
                            className={`
                                relative min-h-[52px] p-1.5 rounded-xl border flex flex-col justify-between text-left transition-all duration-200
                                ${cellBg}
                                ${isTodayDate && !isSelected ? 'ring-1 ring-brand-400/80' : ''}
                            `}
                            title={`${dayStr}: ${status.details}`}
                        >
                            <div className="flex items-center justify-between w-full">
                                <span className={`text-xs ${isSelected ? 'font-black text-white' : 'font-semibold'}`}>
                                    {format(day, 'd')}
                                </span>
                                {isTodayDate && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse"></span>
                                )}
                            </div>

                            <div className="w-full mt-1">
                                {statusBadge}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Selected Date Indicator / Notice */}
            {selectedDate && (
                <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-400" />
                        <span className="text-xs text-emerald-300 font-medium">
                            Selected Date: <strong className="text-white">{selectedDate}</strong> (Available)
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
