import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Video, Globe, Calendar as CalendarIcon, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface CalendarWidgetProps {
    onSchedule?: (date: Date, duration: number, type: 'video' | 'phone') => void;
}

const CalendarWidget: React.FC<CalendarWidgetProps> = ({ onSchedule }) => {
  // Initialize to current date
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [selectedDate, setSelectedDate] = useState<number | null>(currentDate.getDate());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [duration, setDuration] = useState<15 | 30 | 60>(15);
  const [format12h, setFormat12h] = useState(true);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const generateTimeSlots = () => {
    const slots = [];
    const startHour = 8; // 8 AM
    const endHour = 18; // 6 PM
    
    for (let hour = startHour; hour < endHour; hour++) {
        for (let min = 0; min < 60; min += 30) {
            if (format12h) {
                const suffix = hour >= 12 ? 'pm' : 'am';
                const h = hour % 12 || 12;
                const m = min === 0 ? '00' : min;
                slots.push(`${h}:${m} ${suffix}`);
            } else {
                const h = hour.toString().padStart(2, '0');
                const m = min.toString().padStart(2, '0');
                slots.push(`${h}:${m}`);
            }
        }
    }
    return slots;
  };

  const handleConfirm = () => {
      if (selectedDate && selectedTime && onSchedule) {
          // Construct the Date object
          const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDate);
          
          // Parse time
          let hours = 0;
          let minutes = 0;
          
          if (format12h) {
              const [timePart, modifier] = selectedTime.split(' ');
              const [h, m] = timePart.split(':');
              hours = parseInt(h);
              minutes = parseInt(m);
              if (modifier === 'pm' && hours < 12) hours += 12;
              if (modifier === 'am' && hours === 12) hours = 0;
          } else {
              const [h, m] = selectedTime.split(':');
              hours = parseInt(h);
              minutes = parseInt(m);
          }
          
          newDate.setHours(hours, minutes);
          onSchedule(newDate, duration, 'video');
      }
  };

  return (
    <div className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-3xl shadow-lg overflow-hidden flex flex-col md:flex-row w-full max-w-5xl mx-auto border border-slate-200 dark:border-slate-700 font-sans transition-colors duration-300 h-[600px]">
      {/* Sidebar Info */}
      <div className="w-full md:w-[300px] p-8 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-colors">
        <div className="flex flex-col gap-4 mb-8">
             <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                 <Video size={24} />
             </div>
             <div>
                 <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1 uppercase tracking-wider">Agendar Reunião</p>
                 <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Demo do Produto</h2>
             </div>
        </div>
        
        <p className="text-slate-600 dark:text-slate-400 text-sm mb-8 leading-relaxed">
            Selecione uma data e horário para agendar uma demonstração ou reunião de suporte com o cliente.
        </p>

        <div className="space-y-4 mb-auto">
            <div className="flex items-center gap-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                <Clock size={16} className="text-slate-400 dark:text-slate-500" />
                <span className="text-slate-700 dark:text-slate-200">{duration} min</span>
            </div>
            <div className="flex items-center gap-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                <Video size={16} className="text-slate-400 dark:text-slate-500" />
                <span className="text-slate-700 dark:text-slate-200">Google Meet</span>
            </div>
            <div className="flex items-center gap-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                <Globe size={16} className="text-slate-400 dark:text-slate-500" />
                <span className="text-slate-700 dark:text-slate-200">Horário de Brasília</span>
            </div>
        </div>

        <div className="mt-8">
             <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 block">Duração</span>
             <div className="bg-white dark:bg-slate-800 rounded-lg p-1 inline-flex w-full border border-slate-200 dark:border-slate-700 shadow-sm">
                {[15, 30, 60].map(dur => (
                     <button 
                        key={dur}
                        onClick={() => setDuration(dur as any)}
                        className={clsx("flex-1 py-1.5 text-xs font-medium rounded-md transition-all", duration === dur ? "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-bold" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200")}
                     >
                         {dur}m
                     </button>
                ))}
             </div>
         </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 p-8 bg-white dark:bg-slate-800 transition-colors flex flex-col">
         <div className="flex items-center justify-between mb-6 px-2">
             <button onClick={prevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"><ChevronLeft size={16} /></button>
             <h3 className="text-base font-bold text-slate-900 dark:text-white">{MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>
             <button onClick={nextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"><ChevronRight size={16} /></button>
         </div>

         <div className="grid grid-cols-7 mb-2">
             {DAYS.map(day => (
                 <div key={day} className="text-center text-xs font-medium text-slate-400 dark:text-slate-500 py-2 uppercase tracking-wide">
                     {day}
                 </div>
             ))}
         </div>

         <div className="grid grid-cols-7 gap-y-2 gap-x-2 flex-1">
             {Array.from({ length: firstDay }).map((_, i) => (
                 <div key={`empty-${i}`} className="aspect-square"></div>
             ))}
             {Array.from({ length: daysInMonth }).map((_, i) => {
                 const day = i + 1;
                 const isSelected = selectedDate === day;
                 const today = new Date();
                 const isToday = day === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
                 
                 return (
                     <div key={day} className="flex justify-center items-center">
                        <button
                            onClick={() => setSelectedDate(day)}
                            className={clsx(
                                "w-10 h-10 rounded-full flex items-center justify-center text-sm transition-all relative",
                                isSelected 
                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 font-bold" 
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium",
                                isToday && !isSelected ? "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white font-bold border border-slate-200 dark:border-slate-600" : ""
                            )}
                        >
                            {day}
                        </button>
                     </div>
                 )
             })}
         </div>
      </div>

      {/* Time Slots & Action */}
      <div className="w-full md:w-[280px] bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 p-6 flex flex-col transition-colors">
          <div className="flex items-center justify-between mb-6">
               <div className="text-sm font-bold text-slate-900 dark:text-white">
                   {DAYS[new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDate || 1).getDay()]} <span className="text-slate-500 font-normal">{selectedDate}</span>
               </div>
               <div className="flex bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700 shadow-sm">
                   <button onClick={() => setFormat12h(true)} className={clsx("px-2 py-0.5 text-[10px] rounded transition-colors font-medium", format12h ? "bg-slate-200 dark:bg-slate-600 text-slate-900 dark:text-white" : "text-slate-400")}>12h</button>
                   <button onClick={() => setFormat12h(false)} className={clsx("px-2 py-0.5 text-[10px] rounded transition-colors font-medium", !format12h ? "bg-slate-200 dark:bg-slate-600 text-slate-900 dark:text-white" : "text-slate-400")}>24h</button>
               </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2 mb-4">
              {generateTimeSlots().map((time, idx) => (
                  <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={clsx(
                        "w-full py-2.5 rounded-lg border text-sm font-medium transition-all flex items-center justify-center relative overflow-hidden",
                        selectedTime === time 
                            ? "bg-white dark:bg-slate-800 border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-md ring-1 ring-indigo-500" 
                            : "bg-white dark:bg-slate-800 border-transparent text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm"
                    )}
                  >
                      {time}
                  </motion.button>
              ))}
          </div>

          <button 
            disabled={!selectedDate || !selectedTime}
            onClick={handleConfirm}
            className="w-full py-3 bg-indigo-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 dark:shadow-none disabled:shadow-none hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
          >
              <Check size={18} />
              Confirmar
          </button>
      </div>
    </div>
  );
};

export default CalendarWidget;