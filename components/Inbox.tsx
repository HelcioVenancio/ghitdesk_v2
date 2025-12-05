import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, Send, Paperclip, Sparkles, Mic, MoreVertical, Phone, User, Clock, Tag, MessageCircle, Mail as MailIcon, Calendar as CalendarIcon, Check, Lock, Zap, ChevronDown, AlignLeft, FileText, Loader2, ChevronRight } from 'lucide-react';
import { Message, ChannelType, TicketStatus, Priority, User as UserType, EventType } from '../types';
import { CHANNEL_ICONS, STATUS_COLORS } from '../constants';
import { generateSmartReply } from '../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import Modal from './Modal';
import CalendarWidget from './CalendarWidget';
import { useData } from '../contexts/DataContext';

const QUICK_REPLIES = [
    "Olá! Como posso ajudar você hoje?",
    "Poderia me confirmar o número do pedido?",
    "Vou verificar essa informação e já retorno.",
    "Obrigado pelo contato, tenha um ótimo dia!",
    "Sua solicitação foi encaminhada para o setor técnico."
];

const Inbox: React.FC = () => {
  const { tickets, updateTicket, users, currentUser, addEvent } = useData();
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  
  // New States for Features
  const [isInternalMode, setIsInternalMode] = useState(false);
  const [ticketFilter, setTicketFilter] = useState<'all' | 'unread' | 'high'>('all');
  const [ticketSearch, setTicketSearch] = useState('');
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  // Action Modals State
  const [activeModal, setActiveModal] = useState<'tag' | 'agent' | 'reminder' | 'calendar' | null>(null);
  const [newTag, setNewTag] = useState('');
  const [reminderDate, setReminderDate] = useState('');

  // Select first ticket on load if none selected
  useEffect(() => {
      if (!selectedTicketId && tickets.length > 0) {
          setSelectedTicketId(tickets[0].id);
      }
  }, [tickets, selectedTicketId]);

  const selectedTicket = tickets.find(t => t.id === selectedTicketId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedTicket?.messages, showDetails]);

  const handleSendMessage = () => {
    if (!replyText.trim() || !selectedTicket) return;
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      content: replyText,
      timestamp: new Date().toISOString(),
      isInternal: isInternalMode
    };
    
    // Update Global State
    const updatedMessages = [...selectedTicket.messages, newMessage];
    const newStatus = (selectedTicket.status === TicketStatus.RESOLVED && !isInternalMode) ? TicketStatus.OPEN : selectedTicket.status;
    
    updateTicket(selectedTicket.id, { 
        messages: updatedMessages,
        lastMessageAt: new Date().toISOString(),
        status: newStatus
    });
    
    setReplyText('');
    setIsInternalMode(false);
    setShowQuickReplies(false);
  };

  const handleAiSuggest = async () => {
    if (!selectedTicket) return;
    setIsGenerating(true);
    try {
      const suggestion = await generateSmartReply(selectedTicket, replyText);
      setReplyText(suggestion);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStatusChange = (status: TicketStatus) => {
      if(selectedTicket) {
          updateTicket(selectedTicket.id, { status });
          setShowStatusMenu(false);
      }
  };

  const handleDescriptionChange = (desc: string) => {
    if (selectedTicket) {
        updateTicket(selectedTicket.id, { description: desc });
    }
  };

  // Actions Handlers
  const handleAddTag = () => {
      if(selectedTicket && newTag.trim()) {
          updateTicket(selectedTicket.id, { tags: [...selectedTicket.tags, newTag.trim()] });
          setNewTag('');
          setActiveModal(null);
      }
  };

  const handleAssignAgent = (agent: UserType) => {
      if(selectedTicket) {
          updateTicket(selectedTicket.id, { assignee: agent });
          setActiveModal(null);
      }
  };

  const handleSetReminder = () => {
      if(selectedTicket && reminderDate) {
          alert(`Lembrete definido para ${new Date(reminderDate).toLocaleString()}`);
          setActiveModal(null);
      }
  }

  const handleScheduleMeeting = (date: Date, duration: number, type: 'video' | 'phone') => {
      if(!selectedTicket) return;

      const endDate = new Date(date.getTime() + duration * 60000);

      // 1. Create Event
      addEvent({
          id: `ev-${Date.now()}`,
          title: `Reunião com ${selectedTicket.customer.name}`,
          description: `Agendado via ticket ${selectedTicket.id}`,
          start: date.toISOString(),
          end: endDate.toISOString(),
          type: EventType.MEETING,
          attendees: [currentUser, selectedTicket.customer],
          status: 'scheduled',
          relatedTicketId: selectedTicket.id
      });

      // 2. Add system message to chat
      const newMessage: Message = {
          id: Date.now().toString(),
          senderId: currentUser.id,
          content: `📅 Reunião agendada para ${date.toLocaleDateString()} às ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} (${duration} min).`,
          timestamp: new Date().toISOString(),
          isInternal: false
      };

      updateTicket(selectedTicket.id, {
          messages: [...selectedTicket.messages, newMessage],
          lastMessageAt: new Date().toISOString()
      });

      setActiveModal(null);
  };

  // Filter Logic
  const filteredTickets = tickets.filter(t => {
      const matchesSearch = t.customer.name.toLowerCase().includes(ticketSearch.toLowerCase()) || 
                            t.subject.toLowerCase().includes(ticketSearch.toLowerCase());
      const matchesFilter = ticketFilter === 'all' ? true :
                            ticketFilter === 'unread' ? t.unreadCount > 0 :
                            ticketFilter === 'high' ? t.priority === Priority.HIGH || t.priority === Priority.URGENT : true;
      return matchesSearch && matchesFilter;
  });

  const groupMessagesByDate = (messages: Message[]) => {
      const groups: { [key: string]: Message[] } = {};
      messages.forEach(msg => {
          const date = new Date(msg.timestamp).toLocaleDateString();
          if (!groups[date]) groups[date] = [];
          groups[date].push(msg);
      });
      return groups;
  };

  // Filter only agents for assignment
  const agentsList = users.filter(u => u.role === 'agent' || u.role === 'admin');

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex h-full w-full bg-white dark:bg-slate-800 overflow-hidden transition-colors duration-300"
    >
      
      {/* Column 1: Channels */}
      <div className="w-64 border-r border-slate-200 dark:border-slate-700 flex flex-col h-full bg-slate-50 dark:bg-slate-900 flex-shrink-0 hidden lg:flex transition-colors">
        <div className="p-5">
           <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
               Inbox
           </h2>
            
            <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-100px)]">
                <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase mb-2 px-2 tracking-wider">Canais</h3>
                    <div className="space-y-1">
                        {[ 
                            { name: 'Todos', count: tickets.length, active: true }, 
                            { name: 'WhatsApp', count: tickets.filter(t => t.channel === ChannelType.WHATSAPP).length, icon: CHANNEL_ICONS[ChannelType.WHATSAPP] },
                            { name: 'E-mail', count: tickets.filter(t => t.channel === ChannelType.EMAIL).length, icon: CHANNEL_ICONS[ChannelType.EMAIL] },
                            { name: 'Chat Web', count: tickets.filter(t => t.channel === ChannelType.CHAT).length, icon: CHANNEL_ICONS[ChannelType.CHAT] },
                            { name: 'Instagram', count: tickets.filter(t => t.channel === ChannelType.INSTAGRAM).length, icon: CHANNEL_ICONS[ChannelType.INSTAGRAM] },
                            { name: 'Facebook', count: tickets.filter(t => t.channel === ChannelType.FACEBOOK).length, icon: CHANNEL_ICONS[ChannelType.FACEBOOK] },
                            { name: 'Telegram', count: tickets.filter(t => t.channel === ChannelType.TELEGRAM).length, icon: CHANNEL_ICONS[ChannelType.TELEGRAM] },
                            { name: 'Twitter', count: tickets.filter(t => t.channel === ChannelType.TWITTER).length, icon: CHANNEL_ICONS[ChannelType.TWITTER] },
                            { name: 'Threads', count: tickets.filter(t => t.channel === ChannelType.THREADS).length, icon: CHANNEL_ICONS[ChannelType.THREADS] },
                            { name: 'Pinterest', count: tickets.filter(t => t.channel === ChannelType.PINTEREST).length, icon: CHANNEL_ICONS[ChannelType.PINTEREST] },
                        ].map((item, idx) => (
                            <button 
                                key={idx}
                                className={clsx(
                                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors group",
                                    item.active ? "bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 font-medium shadow-sm ring-1 ring-slate-200 dark:ring-slate-700" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                )}
                            >
                                <div className="flex items-center gap-2.5">
                                    {item.icon || <AlignLeft size={16} className="text-slate-400" />}
                                    <span>{item.name}</span>
                                </div>
                                <span className={clsx(
                                    "text-xs px-2 py-0.5 rounded-full",
                                    item.active ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300" : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300 group-hover:bg-slate-200 dark:group-hover:bg-slate-600"
                                )}>{item.count}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase mb-2 px-2 tracking-wider">Filas</h3>
                    <div className="space-y-1">
                        {['Suporte', 'Vendas', 'Financeiro', 'Nível 2'].map((fila, i) => (
                            <button key={i} className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group">
                                <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-indigo-400"></span>
                                    {fila}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Column 2: Ticket List */}
      <div className="w-full md:w-80 lg:w-96 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col h-full flex-shrink-0 transition-colors">
        {/* Header with Search and Filter Tabs */}
        <div className="flex flex-col border-b border-slate-100 dark:border-slate-700">
            <div className="h-16 px-4 flex items-center justify-between flex-shrink-0">
                <h3 className="font-bold text-slate-800 dark:text-white">Conversas</h3>
                <div className="text-xs text-slate-400 font-medium">{filteredTickets.length} tickets</div>
            </div>
            
            <div className="px-4 pb-3">
                <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        type="text" 
                        value={ticketSearch}
                        onChange={(e) => setTicketSearch(e.target.value)}
                        placeholder="Buscar ticket..." 
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-800 transition-all text-slate-700 dark:text-slate-200"
                    />
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setTicketFilter('all')}
                        className={clsx("flex-1 py-1.5 text-xs font-medium rounded-md transition-colors", ticketFilter === 'all' ? "bg-slate-100 dark:bg-slate-600 text-slate-800 dark:text-white" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700")}
                    >Todos</button>
                    <button 
                        onClick={() => setTicketFilter('unread')}
                        className={clsx("flex-1 py-1.5 text-xs font-medium rounded-md transition-colors", ticketFilter === 'unread' ? "bg-slate-100 dark:bg-slate-600 text-slate-800 dark:text-white" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700")}
                    >Não lidos</button>
                    <button 
                        onClick={() => setTicketFilter('high')}
                        className={clsx("flex-1 py-1.5 text-xs font-medium rounded-md transition-colors", ticketFilter === 'high' ? "bg-slate-100 dark:bg-slate-600 text-slate-800 dark:text-white" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700")}
                    >Alta Prior.</button>
                </div>
            </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-slate-50/30 dark:bg-slate-900/30 scrollbar-hide">
          {filteredTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                  <Filter size={32} className="mb-2 opacity-20" />
                  <p className="text-sm">Nenhum ticket encontrado</p>
              </div>
          ) : filteredTickets.map(ticket => (
            <div 
              key={ticket.id}
              onClick={() => setSelectedTicketId(ticket.id)}
              className={clsx(
                  "p-3.5 rounded-xl cursor-pointer transition-all border relative group",
                  selectedTicketId === ticket.id 
                    ? "bg-white dark:bg-slate-700 border-indigo-200 dark:border-indigo-800 shadow-md shadow-indigo-100/50 dark:shadow-none z-10" 
                    : "bg-white dark:bg-slate-800 border-transparent hover:border-slate-200 dark:hover:border-slate-600 hover:shadow-sm border-b-slate-100 dark:border-b-slate-700"
              )}
            >
              {selectedTicketId === ticket.id && <div className="absolute left-0 top-4 bottom-4 w-1 bg-indigo-600 dark:bg-indigo-400 rounded-r-full"></div>}
              
              <div className="flex justify-between items-start mb-2 pl-2">
                <div className="flex items-center gap-3 w-full min-w-0">
                    <div className="relative flex-shrink-0">
                        <img src={ticket.customer.avatar || `https://ui-avatars.com/api/?name=${ticket.customer.name}`} alt={ticket.customer.name} className="w-10 h-10 rounded-full object-cover border border-slate-100 dark:border-slate-600" />
                        <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-700 rounded-full p-0.5 shadow-sm border border-slate-100 dark:border-slate-600">
                            {CHANNEL_ICONS[ticket.channel]}
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                            <h4 className={clsx("font-semibold text-sm truncate pr-2", selectedTicketId === ticket.id ? "text-indigo-900 dark:text-indigo-200" : "text-slate-800 dark:text-slate-200")}>{ticket.customer.name}</h4>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap flex-shrink-0">
                                {new Date(ticket.lastMessageAt).toLocaleDateString([], {day: '2-digit', month: '2-digit'})}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{ticket.subject}</p>
                    </div>
                </div>
              </div>
              
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 pl-2 leading-relaxed opacity-90">
                  {ticket.messages.length > 0 ? ticket.messages[ticket.messages.length-1].content : "Sem mensagens"}
              </p>

              <div className="flex items-center gap-2 pl-2 flex-wrap">
                 {ticket.tags.map(tag => {
                     let colorClass = "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300";
                     if (tag.includes('Alta')) colorClass = "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300 border border-red-100 dark:border-red-900/50";
                     if (tag.includes('SLA OK')) colorClass = "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-300 border border-green-100 dark:border-green-900/50";
                     if (tag.includes('Atenção')) colorClass = "bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300 border border-orange-100 dark:border-orange-900/50";

                     return (
                         <span key={tag} className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${colorClass}`}>
                             {tag}
                         </span>
                     )
                 })}
                 {ticket.unreadCount > 0 && (
                     <span className="ml-auto bg-indigo-600 dark:bg-indigo-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-sm shadow-indigo-200 dark:shadow-none">
                         {ticket.unreadCount}
                     </span>
                 )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Column 3: Chat Area */}
      <div className="flex-1 flex flex-col h-full relative bg-slate-50/50 dark:bg-slate-900/50 z-0 transition-colors">
        {selectedTicket ? (
          <>
            {/* Chat Header */}
            <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 flex-shrink-0 shadow-sm z-10 transition-colors">
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800 dark:text-white text-base">{selectedTicket.customer.name}</h3>
                    <div className="relative">
                        <button 
                            onClick={() => setShowStatusMenu(!showStatusMenu)}
                            className={clsx(
                                "flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border cursor-pointer hover:opacity-80 transition-opacity",
                                STATUS_COLORS[selectedTicket.status]
                            )}
                        >
                            {selectedTicket.status}
                            <ChevronDown size={10} />
                        </button>
                        
                        {showStatusMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowStatusMenu(false)}></div>
                                <div className="absolute top-full left-0 mt-1 w-40 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-100 dark:border-slate-700 z-50 py-1 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                    {Object.values(TicketStatus).map(status => (
                                        <button
                                            key={status}
                                            onClick={() => handleStatusChange(status)}
                                            className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-between dark:text-slate-200"
                                        >
                                            <span className={clsx(
                                                "px-2 py-0.5 rounded text-[10px] font-medium",
                                                STATUS_COLORS[status]
                                            )}>{status}</span>
                                            {selectedTicket.status === status && <Check size={12} className="text-indigo-600 dark:text-indigo-400" />}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">{CHANNEL_ICONS[selectedTicket.channel]} {selectedTicket.channel}</span>
                      <span>•</span>
                      <span>{selectedTicket.subject}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowDetails(!showDetails)}
                    className={clsx("p-2 rounded-lg transition-colors border border-transparent", showDetails ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900" : "hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-400")}
                    title="Detalhes do Cliente"
                  >
                      <User size={20} />
                  </button>
                  <button className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-slate-400 transition-colors">
                      <MoreVertical size={20} />
                  </button>
              </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-900/50">
                {Object.entries(groupMessagesByDate(selectedTicket.messages)).map(([date, msgs]) => (
                    <div key={date} className="space-y-6">
                        {/* Date Divider */}
                        <div className="flex items-center justify-center">
                            <div className="bg-slate-200/60 dark:bg-slate-700 px-3 py-1 rounded-full text-[10px] font-medium text-slate-500 dark:text-slate-300 shadow-sm border border-slate-200 dark:border-slate-600">
                                {new Date(date).toDateString() === new Date().toDateString() ? 'Hoje' : 
                                 new Date(date).toDateString() === new Date(Date.now() - 86400000).toDateString() ? 'Ontem' : date}
                            </div>
                        </div>

                        {msgs.map((msg, index) => {
                            const isMe = msg.senderId !== selectedTicket.customer.id;
                            const showAvatar = !isMe && (index === 0 || msgs[index-1].senderId !== msg.senderId);
                            const isInternal = msg.isInternal;

                            return (
                            <motion.div 
                                key={msg.id}
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                className={`flex gap-3 ${isMe ? 'justify-end' : 'justify-start'}`}
                            >
                                {!isMe && (
                                    <div className="w-8 flex-shrink-0 mt-1">
                                        {showAvatar && (
                                            <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-300 shadow-sm">
                                                {selectedTicket.customer.name.substring(0,2).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                                    {!isMe && showAvatar && <span className="text-[10px] text-slate-400 mb-1 ml-1">{selectedTicket.customer.name}</span>}
                                    
                                    <div className={clsx(
                                        "px-5 py-3 text-sm leading-relaxed shadow-sm relative group transition-all",
                                        isInternal 
                                            ? "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 text-amber-900 dark:text-amber-200 rounded-2xl"
                                            : isMe 
                                                ? "bg-indigo-600 dark:bg-indigo-600 text-white rounded-2xl rounded-br-sm" 
                                                : "bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-2xl rounded-bl-sm"
                                    )}>
                                        {isInternal && (
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 mb-1 opacity-80 uppercase tracking-wider">
                                                <Lock size={10} /> Nota Interna
                                            </div>
                                        )}
                                        {msg.content}
                                        <span className={clsx(
                                            "absolute -bottom-5 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap flex items-center gap-1",
                                            isMe ? "right-0 text-slate-400" : "left-0 text-slate-400"
                                        )}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            {isMe && <Check size={12} className="text-indigo-500 dark:text-indigo-400" />}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                            );
                        })}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className={clsx("p-5 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 transition-colors", isInternalMode ? "bg-amber-50/30 dark:bg-amber-900/10" : "")}>
                {/* Quick Replies / Mode Toggle */}
                <div className="flex items-center justify-between mb-2 px-1">
                     <div className="flex gap-2">
                         <div className="relative">
                             <button 
                                onClick={() => setShowQuickReplies(!showQuickReplies)}
                                className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-md transition-colors"
                             >
                                 <Zap size={14} className="text-amber-500" /> Respostas Rápidas
                             </button>
                             <AnimatePresence>
                             {showQuickReplies && (
                                 <>
                                 <div className="fixed inset-0 z-10" onClick={() => setShowQuickReplies(false)}></div>
                                 <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-20 py-2 overflow-hidden"
                                >
                                     {QUICK_REPLIES.map((reply, i) => (
                                         <button 
                                            key={i} 
                                            onClick={() => { setReplyText(reply); setShowQuickReplies(false); }}
                                            className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors block truncate"
                                         >
                                             {reply}
                                         </button>
                                     ))}
                                 </motion.div>
                                 </>
                             )}
                             </AnimatePresence>
                         </div>
                     </div>
                     
                     <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-lg p-0.5">
                         <button 
                            onClick={() => setIsInternalMode(false)}
                            className={clsx("px-3 py-1 text-xs font-medium rounded-md transition-all", !isInternalMode ? "bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200")}
                         >
                             Público
                         </button>
                         <button 
                            onClick={() => setIsInternalMode(true)}
                            className={clsx("px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1", isInternalMode ? "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200")}
                         >
                             <Lock size={10} /> Interno
                         </button>
                     </div>
                </div>

                <div className={clsx(
                    "flex flex-col gap-2 border rounded-2xl p-2 focus-within:ring-2 transition-all shadow-sm bg-white dark:bg-slate-800",
                    isInternalMode ? "border-amber-200 dark:border-amber-800 focus-within:ring-amber-100 dark:focus-within:ring-amber-900" : "border-slate-200 dark:border-slate-600 focus-within:ring-indigo-100 dark:focus:within:ring-indigo-900 focus-within:border-indigo-300 dark:focus-within:border-indigo-700"
                )}>
                    <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={isInternalMode ? "Adicionar nota interna (o cliente não verá isso)..." : "Digite sua mensagem..."}
                        className="w-full bg-transparent p-3 resize-none focus:outline-none text-slate-700 dark:text-slate-200 text-sm min-h-[48px]"
                        rows={1}
                        onKeyDown={(e) => {
                            if(e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                    />
                    <div className="flex justify-between items-center px-1 pb-1">
                        <div className="flex items-center gap-1 text-slate-400">
                            <button className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 hover:shadow-sm rounded-lg transition-all"><Paperclip size={18} /></button>
                            <button 
                                className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 hover:shadow-sm rounded-lg transition-all"
                                onClick={() => setActiveModal('calendar')}
                                title="Agendar Reunião"
                            >
                                <CalendarIcon size={18} />
                            </button>
                            <button className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 hover:shadow-sm rounded-lg transition-all"><Mic size={18} /></button>
                            {!isInternalMode && (
                                <>
                                    <div className="h-5 w-px bg-slate-200 dark:bg-slate-600 mx-2"></div>
                                    <button 
                                        onClick={handleAiSuggest}
                                        disabled={isGenerating}
                                        className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400 text-slate-500 dark:text-slate-400 rounded-lg transition-colors text-xs font-medium group"
                                    >
                                        {isGenerating ? (
                                            <Loader2 size={14} className="animate-spin text-purple-600" />
                                        ) : (
                                            <Sparkles size={14} className="text-purple-500 group-hover:text-purple-600 dark:group-hover:text-purple-400" />
                                        )}
                                        AI Assist
                                    </button>
                                </>
                            )}
                        </div>
                        <button 
                            onClick={handleSendMessage}
                            disabled={!replyText.trim()}
                            className={clsx(
                                "p-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center",
                                replyText.trim() 
                                    ? isInternalMode ? "bg-amber-500 text-white hover:bg-amber-600" : "bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105" 
                                    : "bg-slate-100 dark:bg-slate-700 text-slate-300 dark:text-slate-500"
                            )}
                        >
                            {isInternalMode ? <Lock size={18} /> : <Send size={18} />}
                        </button>
                    </div>
                </div>
                <div className="flex justify-between items-center mt-2 px-1">
                    <span className="text-[10px] text-slate-400">
                        {isInternalMode ? "Modo Nota Interna Ativo" : "Pressione Ctrl + Enter para enviar"}
                    </span>
                </div>
            </div>
          </>
        ) : (
            <div className="flex items-center justify-center h-full text-slate-400 flex-col gap-4 bg-slate-50/30 dark:bg-slate-900/30">
                <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-2">
                    <MessageCircle size={40} className="text-slate-300 dark:text-slate-600" />
                </div>
                <div className="text-center">
                    <h3 className="text-slate-700 dark:text-slate-300 font-semibold mb-1">Sua caixa de entrada</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">Selecione uma conversa da lista à esquerda para visualizar detalhes e responder.</p>
                </div>
            </div>
        )}
      </div>

      {/* Column 4: Details Panel */}
      <AnimatePresence>
      {showDetails && selectedTicket && (
        <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 h-full overflow-y-auto flex-shrink-0 hidden xl:block shadow-xl z-20 relative"
        >
             <div className="w-[320px]"> {/* Fixed width wrapper for content */}
                {/* Contact Info Card */}
                <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Contato</h4>
                        <button onClick={() => setShowDetails(false)} className="text-slate-400 hover:text-slate-600 lg:hidden"><ChevronRight size={16}/></button>
                    </div>
                    
                    <div className="flex flex-col items-center text-center mb-6">
                         <div className="w-20 h-20 rounded-full bg-white dark:bg-slate-700 border-4 border-white dark:border-slate-800 shadow-md mb-3 overflow-hidden">
                             <img src={selectedTicket.customer.avatar || `https://ui-avatars.com/api/?name=${selectedTicket.customer.name}`} alt={selectedTicket.customer.name} className="w-full h-full object-cover" />
                         </div>
                         <h3 className="font-bold text-slate-800 dark:text-white text-lg">{selectedTicket.customer.name}</h3>
                         <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-200/50 dark:bg-slate-700/50 px-2 py-0.5 rounded-full mt-1">Cliente VIP</span>
                    </div>

                    <div className="space-y-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-indigo-500 dark:text-indigo-400">
                                <MailIcon size={16} />
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="text-[10px] text-slate-400 font-semibold uppercase">Email</span>
                                <span className="text-sm text-slate-700 dark:text-slate-300 truncate w-48">{selectedTicket.customer.email}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-50 dark:bg-green-900/30 rounded-lg flex items-center justify-center text-green-500 dark:text-green-400">
                                <Phone size={16} />
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="text-[10px] text-slate-400 font-semibold uppercase">Telefone</span>
                                <span className="text-sm text-slate-700 dark:text-slate-300">+55 11 99999-1234</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Description Card */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-4">
                        <FileText size={16} className="text-slate-400" />
                        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Descrição</h4>
                    </div>
                    <textarea
                        className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg p-3 text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-800 outline-none resize-none min-h-[120px] transition-all"
                        placeholder="Adicionar descrição do ticket..."
                        value={selectedTicket.description || ""}
                        onChange={(e) => handleDescriptionChange(e.target.value)}
                    />
                </div>

                {/* Status Card */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider">Visão Geral</h4>
                    <div className="space-y-4">
                        <div className="flex justify-between text-sm items-center p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-600">
                            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2"><Tag size={14} /> Prioridade</span>
                            <span className={clsx(
                                "px-2.5 py-0.5 rounded-md text-xs font-medium border",
                                selectedTicket.priority === Priority.HIGH || selectedTicket.priority === Priority.URGENT 
                                ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800' 
                                : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'
                            )}>{selectedTicket.priority}</span>
                        </div>
                        <div className="flex justify-between text-sm items-center p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-600">
                            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2"><Clock size={14} /> SLA Status</span>
                            <span className="px-2.5 py-0.5 bg-orange-50 text-orange-600 border border-orange-100 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800 rounded-md text-xs font-medium">Atenção</span>
                        </div>
                         <div className="flex justify-between text-sm items-center p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-600">
                            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2"><User size={14} /> Responsável</span>
                            <span className="text-slate-700 dark:text-slate-300 font-medium text-xs">
                                {selectedTicket.assignee ? selectedTicket.assignee.name : 'Não atribuído'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-6">
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider">Ações</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => setActiveModal('tag')} className="flex flex-col items-center justify-center gap-2 p-4 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-700 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all group bg-white dark:bg-slate-800 shadow-sm hover:shadow-md">
                            <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900 transition-colors">
                                <Tag size={16} />
                            </div>
                            <span className="text-xs font-medium">Tag</span>
                        </button>
                        <button onClick={() => setActiveModal('agent')} className="flex flex-col items-center justify-center gap-2 p-4 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-700 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all group bg-white dark:bg-slate-800 shadow-sm hover:shadow-md">
                            <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900 transition-colors">
                                <User size={16} />
                            </div>
                            <span className="text-xs font-medium">Atribuir</span>
                        </button>
                         <button onClick={() => setActiveModal('reminder')} className="flex flex-col items-center justify-center gap-2 p-4 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-700 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all group bg-white dark:bg-slate-800 shadow-sm hover:shadow-md col-span-2">
                            <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900 transition-colors">
                                <Clock size={16} />
                            </div>
                            <span className="text-xs font-medium">Definir Lembrete</span>
                        </button>
                    </div>
                </div>
             </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Modals */}
      <Modal 
        isOpen={activeModal === 'tag'} 
        onClose={() => setActiveModal(null)} 
        title="Adicionar Nova Tag"
        maxWidth="max-w-md"
        footer={
             <button 
                onClick={handleAddTag}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
             >
                 Adicionar
             </button>
        }
      >
          <div className="space-y-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">Digite o nome da tag para categorizar este ticket.</p>
              <input 
                autoFocus
                type="text" 
                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-800 outline-none"
                placeholder="Ex: Urgente, VIP, Bug..."
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTag()}
              />
          </div>
      </Modal>

      <Modal
        isOpen={activeModal === 'agent'}
        onClose={() => setActiveModal(null)}
        title="Atribuir Agente"
        maxWidth="max-w-md"
      >
          <div className="space-y-2">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Selecione um agente para assumir este ticket.</p>
              {agentsList.map(agent => (
                  <button 
                    key={agent.id}
                    onClick={() => handleAssignAgent(agent)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left border border-transparent hover:border-slate-100 dark:hover:border-slate-600"
                  >
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                          {agent.name.substring(0,2).toUpperCase()}
                      </div>
                      <div>
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{agent.name}</p>
                          <p className="text-xs text-slate-400">{agent.role}</p>
                      </div>
                      {selectedTicket?.assignee?.id === agent.id && (
                          <Check size={16} className="ml-auto text-green-500" />
                      )}
                  </button>
              ))}
          </div>
      </Modal>

      <Modal
        isOpen={activeModal === 'reminder'}
        onClose={() => setActiveModal(null)}
        title="Definir Lembrete"
        maxWidth="max-w-md"
        footer={
            <button 
               onClick={handleSetReminder}
               className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
            >
                Definir
            </button>
       }
      >
          <div className="space-y-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">Quando você deseja ser lembrado sobre este ticket?</p>
              <input 
                type="datetime-local"
                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-800 outline-none"
                value={reminderDate}
                onChange={e => setReminderDate(e.target.value)}
              />
          </div>
      </Modal>

      <Modal
        isOpen={activeModal === 'calendar'}
        onClose={() => setActiveModal(null)}
        title=""
        maxWidth="max-w-5xl"
        noPadding
      >
        <CalendarWidget onSchedule={handleScheduleMeeting} />
      </Modal>

    </motion.div>
  );
};

export default Inbox;