import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Video, Calendar as CalendarIcon, Phone, Mail, FileText, Plus, Clock, User, MoreHorizontal, Check, X, Trash2, MapPin, Users } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../contexts/DataContext';
import { EventType, CalendarEvent } from '../types';
import Modal from './Modal';

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const ActivityBoard: React.FC = () => {
    const { events, addEvent, updateEvent, deleteEvent, users } = useData();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewEvent, setViewEvent] = useState<CalendarEvent | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Form State
    const [newEventTitle, setNewEventTitle] = useState('');
    const [newEventType, setNewEventType] = useState<EventType>(EventType.MEETING);
    const [newEventDate, setNewEventDate] = useState('');
    const [newEventTime, setNewEventTime] = useState('10:00');
    const [newEventDesc, setNewEventDesc] = useState('');

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    const getEventsForDay = (day: number) => {
        return events.filter(e => {
            const d = new Date(e.start);
            return d.getDate() === day && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
        });
    };

    const handleCreateEvent = () => {
        if (!newEventTitle || !newEventDate) return;

        const start = new Date(`${newEventDate}T${newEventTime}`);
        const end = new Date(start.getTime() + 60 * 60 * 1000); // Default 1 hour

        const newEvent: CalendarEvent = {
            id: `ev-${Date.now()}`,
            title: newEventTitle,
            description: newEventDesc,
            start: start.toISOString(),
            end: end.toISOString(),
            type: newEventType,
            attendees: [],
            status: 'scheduled'
        };

        addEvent(newEvent);
        setIsCreateModalOpen(false);
        resetForm();
    };

    const handleDeleteEvent = () => {
        if (viewEvent) {
            deleteEvent(viewEvent.id);
            setViewEvent(null);
        }
    };

    const resetForm = () => {
        setNewEventTitle('');
        setNewEventType(EventType.MEETING);
        setNewEventDate('');
        setNewEventTime('10:00');
        setNewEventDesc('');
    };

    const getEventIcon = (type: EventType, size: number = 14) => {
        switch (type) {
            case EventType.MEETING: return <Video size={size} />;
            case EventType.CALL: return <Phone size={size} />;
            case EventType.EMAIL: return <Mail size={size} />;
            default: return <FileText size={size} />;
        }
    };

    const getEventColor = (type: EventType) => {
        switch (type) {
            case EventType.MEETING: return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
            case EventType.CALL: return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
            case EventType.EMAIL: return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800';
            default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600';
        }
    };

    // Sorted events for Timeline
    const sortedEvents = [...events].sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex h-full bg-slate-50 dark:bg-slate-900 overflow-hidden transition-colors duration-300"
        >
            {/* Left Sidebar: Timeline & History */}
            <div className="w-80 md:w-96 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col h-full flex-shrink-0 transition-colors">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-1">Cronograma</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Histórico de atividades</p>
                    
                    <button 
                        onClick={() => {
                            const today = new Date().toISOString().split('T')[0];
                            setNewEventDate(today);
                            setIsCreateModalOpen(true);
                        }}
                        className="mt-4 w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 dark:shadow-none"
                    >
                        <Plus size={18} /> Nova Atividade
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {sortedEvents.length === 0 ? (
                         <div className="text-center py-10 text-slate-400">
                             <CalendarIcon size={32} className="mx-auto mb-2 opacity-50" />
                             <p className="text-sm">Nenhuma atividade registrada.</p>
                         </div>
                    ) : sortedEvents.map(event => {
                        const isPast = new Date(event.start) < new Date();
                        return (
                            <div 
                                key={event.id} 
                                className="relative pl-6 pb-2 group cursor-pointer"
                                onClick={() => setViewEvent(event)}
                            >
                                {/* Vertical Line */}
                                <div className="absolute left-2.5 top-2 bottom-0 w-px bg-slate-200 dark:bg-slate-700 group-last:bottom-auto group-last:h-full"></div>
                                {/* Dot */}
                                <div className={clsx(
                                    "absolute left-1 top-2.5 w-3 h-3 rounded-full border-2",
                                    isPast ? "bg-slate-300 border-slate-200 dark:bg-slate-600 dark:border-slate-700" : "bg-white dark:bg-slate-800 border-indigo-500"
                                )}></div>

                                <div className={clsx(
                                    "p-4 rounded-xl border transition-all",
                                    isPast ? "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-75" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md"
                                )}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className={clsx("flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider", getEventColor(event.type))}>
                                            {getEventIcon(event.type)}
                                            {event.type}
                                        </div>
                                        <span className="text-[10px] text-slate-400">
                                            {new Date(event.start).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h4 className="font-semibold text-slate-800 dark:text-white text-sm mb-1">{event.title}</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">{event.description}</p>
                                    
                                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
                                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                            <Clock size={12} />
                                            {new Date(event.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </div>
                                        {event.attendees && event.attendees.length > 0 && (
                                            <div className="flex -space-x-1.5">
                                                {event.attendees.map((att, i) => (
                                                    <div key={i} className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-600 border border-white dark:border-slate-800 flex items-center justify-center text-[8px] font-bold text-slate-600 dark:text-slate-300" title={att.name}>
                                                        {att.name.charAt(0)}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Main Content: Calendar Grid */}
            <div className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-900 transition-colors">
                <div className="h-20 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-8 flex-shrink-0">
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Calendário</h1>
                    <div className="flex items-center gap-4">
                         <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-lg p-1 border border-slate-200 dark:border-slate-600">
                             <button onClick={prevMonth} className="p-1.5 hover:bg-white dark:hover:bg-slate-600 rounded-md text-slate-500 dark:text-slate-300 shadow-sm transition-all"><ChevronLeft size={18} /></button>
                             <span className="px-4 text-sm font-semibold text-slate-700 dark:text-slate-200 min-w-[120px] text-center">{MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
                             <button onClick={nextMonth} className="p-1.5 hover:bg-white dark:hover:bg-slate-600 rounded-md text-slate-500 dark:text-slate-300 shadow-sm transition-all"><ChevronRight size={18} /></button>
                         </div>
                         <button className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"><MoreHorizontal /></button>
                    </div>
                </div>

                <div className="flex-1 p-8 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden h-full flex flex-col">
                         {/* Weekday Headers */}
                         <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                             {DAYS.map(day => (
                                 <div key={day} className="py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                     {day}
                                 </div>
                             ))}
                         </div>
                         
                         {/* Calendar Cells */}
                         <div className="grid grid-cols-7 flex-1 auto-rows-fr divide-x divide-y divide-slate-200 dark:divide-slate-700">
                             {/* Empty slots for start of month */}
                             {Array.from({ length: firstDay }).map((_, i) => (
                                 <div key={`empty-${i}`} className="bg-slate-50/30 dark:bg-slate-900/30 min-h-[100px]"></div>
                             ))}
                             
                             {/* Days */}
                             {Array.from({ length: daysInMonth }).map((_, i) => {
                                 const day = i + 1;
                                 const dayEvents = getEventsForDay(day);
                                 const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();

                                 return (
                                     <div 
                                        key={day} 
                                        onClick={() => {
                                            const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                                            setNewEventDate(clickedDate.toISOString().split('T')[0]);
                                            setIsCreateModalOpen(true);
                                        }}
                                        className={clsx(
                                            "p-2 min-h-[100px] relative group hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer",
                                            isToday ? "bg-indigo-50/30 dark:bg-indigo-900/10" : ""
                                        )}
                                     >
                                         <div className="flex justify-between items-start mb-1">
                                             <span className={clsx(
                                                 "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                                                 isToday ? "bg-indigo-600 text-white shadow-sm" : "text-slate-700 dark:text-slate-300 group-hover:bg-slate-200 dark:group-hover:bg-slate-600"
                                             )}>{day}</span>
                                             {dayEvents.length > 0 && <span className="text-[10px] text-slate-400 font-medium">{dayEvents.length}</span>}
                                         </div>
                                         
                                         <div className="space-y-1">
                                             {dayEvents.map(ev => (
                                                 <div 
                                                    key={ev.id} 
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Prevent opening create modal
                                                        setViewEvent(ev);
                                                    }}
                                                    className={clsx(
                                                        "text-[10px] px-1.5 py-1 rounded border truncate font-medium cursor-pointer hover:opacity-80",
                                                        getEventColor(ev.type)
                                                    )}
                                                 >
                                                     {ev.title}
                                                 </div>
                                             ))}
                                         </div>

                                         <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                             <Plus size={14} className="text-slate-400" />
                                         </div>
                                     </div>
                                 )
                             })}
                         </div>
                    </div>
                </div>
            </div>

            {/* Create Event Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Nova Atividade"
                footer={
                    <button onClick={handleCreateEvent} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                        Criar Atividade
                    </button>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Título</label>
                        <input type="text" className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Ex: Reunião com Cliente" value={newEventTitle} onChange={e => setNewEventTitle(e.target.value)} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo</label>
                            <select 
                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={newEventType}
                                onChange={e => setNewEventType(e.target.value as EventType)}
                            >
                                {Object.values(EventType).map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data</label>
                            <input type="date" className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={newEventDate} onChange={e => setNewEventDate(e.target.value)} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Horário</label>
                        <input type="time" className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={newEventTime} onChange={e => setNewEventTime(e.target.value)} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição</label>
                        <textarea className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 dark:text-white rounded-lg text-sm h-24 resize-none focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Detalhes da atividade..." value={newEventDesc} onChange={e => setNewEventDesc(e.target.value)}></textarea>
                    </div>
                </div>
            </Modal>

            {/* View Event Modal */}
            <Modal
                isOpen={!!viewEvent}
                onClose={() => setViewEvent(null)}
                title="Detalhes do Evento"
                footer={
                    <div className="flex justify-between w-full">
                        <button 
                            onClick={handleDeleteEvent}
                            className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/40 flex items-center gap-2"
                        >
                            <Trash2 size={16} /> Excluir
                        </button>
                        <button 
                            onClick={() => setViewEvent(null)}
                            className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600"
                        >
                            Fechar
                        </button>
                    </div>
                }
            >
                {viewEvent && (
                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <div className={clsx("p-3 rounded-xl flex items-center justify-center border", getEventColor(viewEvent.type))}>
                                {getEventIcon(viewEvent.type, 24)}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white">{viewEvent.title}</h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={clsx("text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider", getEventColor(viewEvent.type))}>
                                        {viewEvent.type}
                                    </span>
                                    <span className={clsx(
                                        "text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider", 
                                        viewEvent.status === 'completed' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : 
                                        viewEvent.status === 'cancelled' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" :
                                        "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                                    )}>
                                        {viewEvent.status === 'completed' ? 'Realizada' : viewEvent.status === 'cancelled' ? 'Cancelada' : 'Agendada'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                                <span className="text-xs font-medium text-slate-400 uppercase mb-1 block">Data</span>
                                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold">
                                    <CalendarIcon size={16} className="text-indigo-500" />
                                    {new Date(viewEvent.start).toLocaleDateString()}
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                                <span className="text-xs font-medium text-slate-400 uppercase mb-1 block">Horário</span>
                                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold">
                                    <Clock size={16} className="text-indigo-500" />
                                    {new Date(viewEvent.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(viewEvent.end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                <FileText size={16} className="text-slate-400" /> Descrição
                            </h4>
                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                                {viewEvent.description || "Sem descrição."}
                            </p>
                        </div>

                        {viewEvent.attendees && viewEvent.attendees.length > 0 && (
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                    <Users size={16} className="text-slate-400" /> Participantes
                                </h4>
                                <div className="space-y-2">
                                    {viewEvent.attendees.map((attendee, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors">
                                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                                                {attendee.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{attendee.name}</div>
                                                <div className="text-xs text-slate-400">{attendee.email || "Sem email"}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {viewEvent.relatedTicketId && (
                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-500">Ticket Relacionado:</span>
                                    <span className="text-xs font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300">{viewEvent.relatedTicketId}</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </motion.div>
    );
};

export default ActivityBoard;