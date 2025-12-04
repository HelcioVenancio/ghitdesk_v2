import React, { useState } from 'react';
import { Search, Plus, MoreHorizontal, MessageCircle, AlertCircle, Clock, Globe, X, Calendar, User, Tag, CheckCircle, ChevronDown, Send, Paperclip, Mail, Instagram, Edit2, Trash2, Check, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TicketStatus, Priority, Ticket, ChannelType } from '../types';
import { CHANNEL_ICONS } from '../constants';
import Modal from './Modal';
import { clsx } from 'clsx';
import { useData } from '../contexts/DataContext';

const COLUMNS = [
  { id: TicketStatus.OPEN, label: 'Aberto', color: 'bg-orange-100 text-orange-700', count: 2 },
  { id: TicketStatus.PENDING, label: 'Em andamento', color: 'bg-blue-100 text-blue-700', count: 2 },
  { id: TicketStatus.WAITING, label: 'Aguardando cliente', color: 'bg-yellow-100 text-yellow-700', count: 2 },
  { id: TicketStatus.RESOLVED, label: 'Resolvido', color: 'bg-green-100 text-green-700', count: 1 },
];

const TicketBoard: React.FC = () => {
  const { tickets, updateTicket, addTicket, users, currentUser } = useData();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewTicket, setViewTicket] = useState<Ticket | null>(null);
  const [draggedTicketId, setDraggedTicketId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TicketStatus | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'messages'>('details');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State for new Ticket
  const [newSubject, setNewSubject] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>(Priority.MEDIUM);
  const [newChannel, setNewChannel] = useState<ChannelType>(ChannelType.EMAIL);
  const [newDesc, setNewDesc] = useState('');

  // Local helper to update currently viewed ticket seamlessly
  const handleUpdateTicket = (id: string, updates: Partial<Ticket>) => {
    updateTicket(id, updates);
    if (viewTicket && viewTicket.id === id) {
        setViewTicket(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const handleAddTag = (tag: string) => {
      if(viewTicket && tag) {
          const updatedTags = [...viewTicket.tags, tag];
          handleUpdateTicket(viewTicket.id, { tags: updatedTags });
      }
  };

  const handleRemoveTag = (tag: string) => {
      if(viewTicket) {
          const updatedTags = viewTicket.tags.filter(t => t !== tag);
          handleUpdateTicket(viewTicket.id, { tags: updatedTags });
      }
  };

  const handleCreateTicket = () => {
      if(!newSubject || !newCustomerName) return;

      const newTicket: Ticket = {
          id: `T-${Math.floor(Math.random() * 10000)}`,
          subject: newSubject,
          description: newDesc,
          customer: { id: `c-${Date.now()}`, name: newCustomerName, avatar: '', role: 'customer' },
          assignee: undefined,
          priority: newPriority,
          slaStatus: 'ok',
          tags: ['novo'],
          status: TicketStatus.OPEN,
          channel: newChannel,
          messages: [],
          lastMessageAt: new Date().toISOString(),
          unreadCount: 0
      };

      addTicket(newTicket);
      setIsCreateModalOpen(false);
      setNewSubject('');
      setNewCustomerName('');
      setNewDesc('');
  };

  const handleAssignAgent = (userId: string) => {
      if (!viewTicket) return;
      if (!userId) {
          handleUpdateTicket(viewTicket.id, { assignee: undefined });
          return;
      }
      const agent = users.find(u => u.id === userId);
      if (agent) {
          handleUpdateTicket(viewTicket.id, { assignee: agent });
      }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, ticketId: string) => {
    setDraggedTicketId(ticketId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, status: TicketStatus) => {
    e.preventDefault();
    setDragOverColumn(status);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, status: TicketStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    if (!draggedTicketId) return;

    updateTicket(draggedTicketId, { status });
    setDraggedTicketId(null);
  };
  
  const filteredTickets = tickets.filter(t => 
    t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const agentsList = users.filter(u => u.role === 'agent' || u.role === 'admin');

  return (
    <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-hidden transition-colors duration-300"
    >
      {/* Header */}
      <div className="h-20 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-8 flex-shrink-0">
        <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Tickets</h1>
            <div className="relative w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar conversas, tickets ou contatos..." 
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-700/50 border-none rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 transition-all text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
                />
            </div>
        </div>
        <div className="flex items-center gap-3">
             <button className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full" title="Mais opções"><MoreHorizontal /></button>
             <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 dark:shadow-none"
                title="Criar novo ticket"
             >
                 <Plus size={18} /> Novo Ticket
             </button>
        </div>
      </div>

      {/* Filters - Simplified */}
      <div className="p-4 flex gap-8 overflow-x-auto bg-white/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
          <div className="w-64 space-y-4">
             <div onClick={() => setIsCreateModalOpen(true)} className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-medium px-4 py-2 rounded-lg flex justify-between items-center cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
                 <span>+ Novo Ticket</span>
             </div>
             <div className="space-y-1">
                 <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase px-2 mb-2">Prioridade</h3>
                 {['Todas', 'Alta', 'Média', 'Baixa'].map((p, i) => (
                     <div key={p} className={`px-4 py-2 rounded-lg text-sm cursor-pointer flex justify-between ${i === 0 ? 'bg-slate-100 dark:bg-slate-700 font-medium text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                         {p}
                         <span className="bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 text-[10px] px-1.5 py-0.5 rounded-full">{i === 0 ? 7 : Math.floor(Math.random() * 4)}</span>
                     </div>
                 ))}
             </div>
          </div>

          {/* Kanban Columns */}
          <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
              {COLUMNS.map(col => (
                  <div 
                    key={col.id} 
                    className={clsx(
                        "min-w-[320px] flex flex-col rounded-xl transition-colors duration-200 p-2",
                        dragOverColumn === col.id ? "bg-slate-100/80 dark:bg-slate-800/80 ring-2 ring-indigo-200 dark:ring-indigo-800" : ""
                    )}
                    onDragOver={(e) => handleDragOver(e, col.id)}
                    onDrop={(e) => handleDrop(e, col.id)}
                  >
                      <div className="flex items-center justify-between mb-4 px-2">
                          <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-700 dark:text-slate-200">{col.label}</span>
                              <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs px-2 py-0.5 rounded-full font-bold">{filteredTickets.filter(t => t.status === col.id).length}</span>
                          </div>
                          <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" title="Adicionar ticket rápido"><Plus size={18} /></button>
                      </div>
                      
                      <div className="flex-1 space-y-3 min-h-[200px]">
                          {filteredTickets.filter(t => t.status === col.id).map(ticket => (
                              <motion.div 
                                layoutId={ticket.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent<HTMLDivElement>, ticket.id)}
                                whileHover={{ y: -2, boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                                whileDrag={{ scale: 1.05, cursor: "grabbing" }}
                                key={ticket.id} 
                                onClick={() => setViewTicket(ticket)}
                                className={clsx(
                                    "bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm cursor-grab active:cursor-grabbing transition-all relative group",
                                    draggedTicketId === ticket.id ? "opacity-50" : "opacity-100"
                                )}
                              >
                                  {/* Header: ID, Channel */}
                                  <div className="flex justify-between items-center mb-3">
                                      <div className="flex items-center gap-2">
                                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 px-1.5 py-0.5 rounded bg-slate-50 dark:bg-slate-700/30 font-mono tracking-tight">{ticket.id}</span>
                                          <div className="text-slate-400 dark:text-slate-500" title={ticket.channel}>
                                              {CHANNEL_ICONS[ticket.channel]}
                                          </div>
                                      </div>
                                      
                                      {/* SLA Status in Header */}
                                       <div className={clsx(
                                            "flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide border",
                                            ticket.slaStatus === 'overdue' 
                                                ? "bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30" 
                                                : "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30"
                                        )}>
                                            {ticket.slaStatus === 'overdue' ? <AlertCircle size={8} /> : <CheckCircle size={8} />}
                                            {ticket.slaStatus || 'OK'}
                                      </div>
                                  </div>
                                  
                                  <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm mb-3 leading-snug line-clamp-2 pr-2">{ticket.subject}</h4>
                                  
                                  {/* Middle Row: Priority & Tags */}
                                  <div className="flex flex-wrap gap-2 mb-4 items-center">
                                      <span className={clsx(
                                          "text-[10px] px-2 py-0.5 rounded font-medium border",
                                          ticket.priority === Priority.HIGH ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30' : 
                                          ticket.priority === Priority.MEDIUM ? 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-900/30' : 
                                          'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30'
                                      )}>
                                          {ticket.priority}
                                      </span>

                                      {ticket.tags.slice(0, 2).map(tag => (
                                           <span key={tag} className="text-[9px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-600 truncate max-w-[60px]">
                                               {tag}
                                           </span>
                                       ))}
                                  </div>

                                  {/* Footer: Customer & Assignee */}
                                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700 mt-auto">
                                      <div className="flex items-center gap-2" title={`Cliente: ${ticket.customer.name}`}>
                                           <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center text-[9px] font-bold border border-slate-200 dark:border-slate-600">
                                                {ticket.customer.name.substring(0,2).toUpperCase()}
                                           </div>
                                           <div className="flex flex-col">
                                               <span className="text-[10px] text-slate-400 leading-none mb-0.5">Cliente</span>
                                               <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate max-w-[80px]">{ticket.customer.name.split(' ')[0]}</span>
                                           </div>
                                      </div>

                                      <div className="relative group/assignee text-right" title={`Responsável: ${ticket.assignee ? ticket.assignee.name : 'Não atribuído'}`}>
                                          {ticket.assignee ? (
                                              <div className="flex items-center gap-2">
                                                   <div className="flex flex-col items-end">
                                                        <span className="text-[10px] text-slate-400 leading-none mb-0.5">Responsável</span>
                                                        <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300 max-w-[80px] truncate">{ticket.assignee.name.split(' ')[0]}</span>
                                                   </div>
                                                   <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center text-[9px] font-bold border border-indigo-200 dark:border-indigo-700">
                                                        {ticket.assignee.name.substring(0,1).toUpperCase()}
                                                   </div>
                                              </div>
                                          ) : (
                                              <button 
                                                className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 pl-2 pr-1 py-1 rounded-full border border-dashed border-slate-300 dark:border-slate-600 hover:border-indigo-300 text-slate-400 hover:text-indigo-600 transition-colors"
                                                title="Atribuir ticket"
                                              >
                                                  <span className="text-[10px] font-medium">Atribuir</span>
                                                  <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[10px]">
                                                      <Plus size={10} />
                                                  </div>
                                              </button>
                                          )}
                                      </div>
                                  </div>
                              </motion.div>
                          ))}
                      </div>
                  </div>
              ))}
          </div>
      </div>

      {/* Create Ticket Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Criar Novo Ticket"
        footer={
            <button onClick={handleCreateTicket} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                Criar Ticket
            </button>
        }
      >
          <div className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Assunto</label>
                  <input type="text" className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400" value={newSubject} onChange={e => setNewSubject(e.target.value)} placeholder="Ex: Erro no pagamento" />
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cliente</label>
                  <input type="text" className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400" value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} placeholder="Nome do cliente" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Canal</label>
                      <div className="relative">
                        <select className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none" value={newChannel} onChange={e => setNewChannel(e.target.value as ChannelType)}>
                            {Object.values(ChannelType).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Prioridade</label>
                      <div className="relative">
                        <select className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none" value={newPriority} onChange={e => setNewPriority(e.target.value as Priority)}>
                            {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                  </div>
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição</label>
                  <textarea className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all h-24 placeholder:text-slate-400" value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Detalhes do ticket..."></textarea>
              </div>
          </div>
      </Modal>

      {/* Rich Ticket Details Modal (Editable) */}
      <Modal
        isOpen={!!viewTicket}
        onClose={() => setViewTicket(null)}
        title=""
        maxWidth="max-w-6xl"
        noPadding
      >
          {viewTicket && (
              <div className="flex flex-col md:flex-row h-[80vh] md:h-[650px]">
                  {/* Left Column: Content */}
                  <div className="flex-1 flex flex-col border-r border-slate-100 dark:border-slate-700">
                        <div className="p-6 md:p-8 flex-1 overflow-y-auto">
                             {/* Header */}
                             <div className="flex items-center gap-3 text-xs text-slate-400 mb-4">
                                <span className="px-1.5 py-0.5 border border-slate-200 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-800 font-mono text-slate-500 dark:text-slate-400">{viewTicket.id}</span>
                                <span className="text-slate-300">/</span>
                                <span className="flex items-center gap-1">{CHANNEL_ICONS[viewTicket.channel]} {viewTicket.channel}</span>
                             </div>

                             <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white mb-6 leading-tight flex items-start gap-2 group">
                                {viewTicket.subject}
                                <span title="Editar assunto" className="mt-2 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:text-indigo-600">
                                    <Edit2 size={16} />
                                </span>
                             </h2>

                             {/* Quick Status Bar (Editable) */}
                             <div className="flex flex-wrap gap-4 mb-8 pb-6 border-b border-slate-100 dark:border-slate-700">
                                 {/* Status Select */}
                                 <div className="flex flex-col gap-1 w-full sm:w-auto">
                                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</span>
                                     <div className="group relative">
                                        <select 
                                            value={viewTicket.status}
                                            onChange={(e) => handleUpdateTicket(viewTicket.id, { status: e.target.value as TicketStatus })}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            title="Alterar status"
                                        >
                                            {Object.values(TicketStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                        <div className={clsx(
                                            "flex items-center gap-2 px-3 py-2 rounded-lg border font-medium text-sm transition-colors",
                                            viewTicket.status === TicketStatus.OPEN ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800" :
                                            viewTicket.status === TicketStatus.PENDING ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800" :
                                            viewTicket.status === TicketStatus.WAITING ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800" :
                                            "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
                                        )}>
                                            <div className={clsx("w-2 h-2 rounded-full flex-shrink-0", 
                                                viewTicket.status === TicketStatus.OPEN ? "bg-red-500" : 
                                                viewTicket.status === TicketStatus.PENDING ? "bg-blue-500" :
                                                viewTicket.status === TicketStatus.WAITING ? "bg-yellow-500" : "bg-green-500"
                                            )}></div>
                                            <span>{viewTicket.status}</span>
                                            <ChevronDown size={14} className="ml-2 opacity-50" />
                                        </div>
                                     </div>
                                 </div>

                                 {/* Priority Select */}
                                 <div className="flex flex-col gap-1 w-full sm:w-auto">
                                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Prioridade</span>
                                     <div className="group relative">
                                        <select
                                             value={viewTicket.priority}
                                             onChange={(e) => handleUpdateTicket(viewTicket.id, { priority: e.target.value as Priority })}
                                             className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                             title="Alterar prioridade"
                                         >
                                             {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                                         </select>
                                         <div className={clsx(
                                             "flex items-center gap-2 px-3 py-2 rounded-lg border font-medium text-sm transition-colors",
                                             viewTicket.priority === Priority.HIGH ? "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800" :
                                             viewTicket.priority === Priority.MEDIUM ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800" :
                                             "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600"
                                         )}>
                                             <AlertCircle size={14} className={clsx(
                                                 viewTicket.priority === Priority.HIGH ? "text-orange-500" : "text-current opacity-70"
                                             )} />
                                             <span>{viewTicket.priority}</span>
                                             <ChevronDown size={14} className="ml-2 opacity-50" />
                                         </div>
                                     </div>
                                 </div>

                                 {/* Assignee Select */}
                                 <div className="flex flex-col gap-1 w-full sm:w-auto">
                                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Responsável</span>
                                     <div className="group relative">
                                         <select
                                             value={viewTicket.assignee?.id || ''}
                                             onChange={(e) => handleAssignAgent(e.target.value)}
                                             className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                             title="Atribuir responsável"
                                         >
                                             <option value="">Não atribuído</option>
                                             {agentsList.map(agent => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
                                         </select>
                                         <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 font-medium text-sm text-slate-700 dark:text-slate-300 transition-colors">
                                             {viewTicket.assignee ? (
                                                 <>
                                                     <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center text-[9px] font-bold">
                                                         {viewTicket.assignee.name.substring(0,1)}
                                                     </div>
                                                     <span>{viewTicket.assignee.name}</span>
                                                 </>
                                             ) : (
                                                 <>
                                                     <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[10px]">
                                                         <User size={12} className="text-slate-400" />
                                                     </div>
                                                     <span className="text-slate-500">Não atribuído</span>
                                                 </>
                                             )}
                                             <ChevronDown size={14} className="ml-2 opacity-50" />
                                         </div>
                                     </div>
                                 </div>
                             </div>

                             {/* Tabs */}
                             <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6">
                                <button 
                                    onClick={() => setActiveTab('details')}
                                    className={clsx("px-4 py-2 text-sm font-medium border-b-2 transition-colors", activeTab === 'details' ? "border-indigo-600 text-indigo-600 dark:text-indigo-400" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}
                                >
                                    Detalhes
                                </button>
                                <button 
                                    onClick={() => setActiveTab('messages')}
                                    className={clsx("px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2", activeTab === 'messages' ? "border-indigo-600 text-indigo-600 dark:text-indigo-400" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}
                                >
                                    Mensagens <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] px-1.5 rounded-full">{viewTicket.messages.length}</span>
                                </button>
                             </div>

                             {activeTab === 'details' && (
                                 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                     <div>
                                         <div className="flex items-center justify-between mb-2">
                                            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Descrição do Problema</h4>
                                            <span className="text-[10px] text-slate-400">Clique para editar</span>
                                         </div>
                                         <textarea
                                             className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 focus:border-indigo-400 outline-none transition-all resize-y min-h-[140px] shadow-sm"
                                             value={viewTicket.description || ""}
                                             onChange={(e) => handleUpdateTicket(viewTicket.id, { description: e.target.value })}
                                             title="Editar descrição"
                                             placeholder="Descreva o problema detalhadamente..."
                                         />
                                     </div>
                                     
                                     <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Anexos</h4>
                                            <button className="text-indigo-600 dark:text-indigo-400 text-xs font-medium hover:underline flex items-center gap-1" title="Adicionar anexo"><Paperclip size={12}/> Adicionar</button>
                                        </div>
                                        <div className="text-sm text-slate-400 italic py-4 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-lg">Nenhum anexo disponível.</div>
                                     </div>
                                 </div>
                             )}

                             {activeTab === 'messages' && (
                                 <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                     {viewTicket.messages.length === 0 ? <p className="text-center text-slate-400 text-sm">Sem mensagens</p> : viewTicket.messages.map(msg => (
                                         <div key={msg.id} className={clsx("flex gap-3", msg.senderId !== viewTicket.customer.id ? "justify-end" : "")}>
                                             {msg.senderId === viewTicket.customer.id && (
                                                 <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0 flex items-center justify-center font-bold text-xs text-slate-500 dark:text-slate-300">
                                                     {viewTicket.customer.name.substring(0,2).toUpperCase()}
                                                 </div>
                                             )}
                                             <div className={clsx("max-w-[80%] p-3 rounded-2xl text-sm", msg.senderId !== viewTicket.customer.id ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-900 dark:text-indigo-100 rounded-br-none" : "bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-bl-none")}>
                                                 <div className="text-xs opacity-70 mb-1 flex justify-between gap-4">
                                                     <span className="font-bold">{msg.senderId === viewTicket.customer.id ? viewTicket.customer.name : 'Agente'}</span>
                                                     <span>{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                 </div>
                                                 {msg.content}
                                             </div>
                                             {msg.senderId !== viewTicket.customer.id && (
                                                 <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex-shrink-0 flex items-center justify-center font-bold text-xs text-indigo-600 dark:text-indigo-300">
                                                     A
                                                 </div>
                                             )}
                                         </div>
                                     ))}
                                     
                                     {/* Quick Reply Box */}
                                     <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                                         <div className="relative">
                                             <input type="text" placeholder="Responder..." className="w-full pl-4 pr-10 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 transition-all dark:text-white" />
                                             <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg" title="Enviar mensagem">
                                                 <Send size={16} />
                                             </button>
                                         </div>
                                     </div>
                                 </div>
                             )}
                        </div>
                  </div>

                  {/* Right Column: Sidebar */}
                  <div className="w-full md:w-80 bg-slate-50 dark:bg-slate-900/50 border-l border-slate-100 dark:border-slate-700 flex flex-col">
                      <div className="p-6 overflow-y-auto space-y-6">
                           {/* Customer Info */}
                           <div className="space-y-3">
                               <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cliente</h4>
                               <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-sm font-bold text-slate-600 dark:text-slate-300 shadow-sm">
                                       {viewTicket.customer.name.substring(0,2).toUpperCase()}
                                   </div>
                                   <div>
                                       <div className="font-bold text-sm text-slate-800 dark:text-white">{viewTicket.customer.name}</div>
                                       <div className="text-xs text-slate-500 dark:text-slate-400">Cliente Recorrente</div>
                                   </div>
                               </div>
                               <button className="w-full py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors" title="Ver perfil do cliente">
                                   Ver Perfil Completo
                               </button>
                           </div>

                           <hr className="border-slate-200 dark:border-slate-700" />

                           {/* Dates & SLA */}
                           <div className="space-y-3">
                               <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Datas & SLA</h4>
                               <div className="flex items-center justify-between text-sm">
                                   <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                       <Calendar size={14} /> Criado
                                   </div>
                                   <span className="text-slate-700 dark:text-slate-200">Há 2 dias</span>
                               </div>
                               <div className="flex items-center justify-between text-sm">
                                   <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                       <Clock size={14} /> SLA
                                   </div>
                                   <span className={clsx("font-medium", viewTicket.slaStatus === 'overdue' ? "text-red-500" : "text-emerald-500")}>
                                       {viewTicket.slaStatus || 'OK'}
                                   </span>
                               </div>
                           </div>

                           <hr className="border-slate-200 dark:border-slate-700" />

                           {/* Tags (Editable) */}
                           <div className="space-y-3">
                               <div className="flex items-center justify-between">
                                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tags</h4>
                               </div>
                               <div className="flex flex-wrap gap-2">
                                   {viewTicket.tags.map(tag => (
                                       <span key={tag} className="group px-2 py-1 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs rounded-md border border-slate-200 dark:border-slate-600 flex items-center gap-1 shadow-sm">
                                           {tag}
                                           <button 
                                              onClick={() => handleRemoveTag(tag)}
                                              className="opacity-50 group-hover:opacity-100 hover:text-red-500 transition-opacity"
                                              title="Remover tag"
                                           >
                                              <X size={12} />
                                           </button>
                                       </span>
                                   ))}
                                   <div className="relative">
                                      <input 
                                          type="text" 
                                          placeholder="+ Tag"
                                          className="w-16 px-2 py-1 bg-transparent text-slate-600 dark:text-slate-300 text-xs rounded-md border border-dashed border-slate-300 dark:border-slate-600 hover:border-indigo-400 focus:w-24 focus:border-indigo-500 focus:ring-0 outline-none transition-all placeholder:text-slate-400"
                                          onKeyDown={(e) => {
                                              if(e.key === 'Enter') {
                                                  const val = e.currentTarget.value.trim();
                                                  if(val) handleAddTag(val);
                                                  e.currentTarget.value = '';
                                              }
                                          }}
                                          title="Digite e pressione Enter para adicionar"
                                      />
                                   </div>
                               </div>
                           </div>

                           <hr className="border-slate-200 dark:border-slate-700" />
                            
                           {/* Quick Actions */}
                           <div className="space-y-3">
                               <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ações</h4>
                               <div className="grid grid-cols-3 gap-2">
                                   <button className="flex flex-col items-center gap-1 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg hover:border-indigo-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors" title="Responder">
                                       <MessageCircle size={16} />
                                       <span className="text-[10px] font-medium">Msg</span>
                                   </button>
                                   <button className="flex flex-col items-center gap-1 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg hover:border-indigo-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors" title="Enviar E-mail">
                                       <Mail size={16} />
                                       <span className="text-[10px] font-medium">Email</span>
                                   </button>
                                   <button className="flex flex-col items-center gap-1 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg hover:border-indigo-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors" title="Definir Lembrete">
                                       <Clock size={16} />
                                       <span className="text-[10px] font-medium">Lembrete</span>
                                   </button>
                               </div>
                           </div>
                      </div>
                  </div>
              </div>
          )}
      </Modal>

    </motion.div>
  );
};

export default TicketBoard;