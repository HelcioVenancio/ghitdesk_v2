import React, { useState } from 'react';
import { User, Bell, Shield, Smartphone, Globe, Mail, MessageCircle, Instagram, Plus, Trash2, Edit2, Check, X, Clock, Zap, Tag, Lock, Save, AlertTriangle, Ticket, AtSign, UserCheck, Facebook, Pin, Send, Twitter, Webhook } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import Modal from './Modal';
import { ChannelType } from '../types';

// Mock Data
const MOCK_USERS = [
    { id: '1', name: 'Carlos Mendes', email: 'carlos@techcorp.com', role: 'Admin', avatar: '', status: 'Active' },
    { id: '2', name: 'Ana Beatriz', email: 'ana@techcorp.com', role: 'Agente', avatar: '', status: 'Active' },
    { id: '3', name: 'Roberto Silva', email: 'roberto@techcorp.com', role: 'Agente', avatar: '', status: 'Away' },
];

const MOCK_INTEGRATIONS = [
    { id: 'whatsapp', name: 'WhatsApp Business', icon: <MessageCircle size={24} />, status: 'connected', type: ChannelType.WHATSAPP },
    { id: 'instagram', name: 'Instagram Direct', icon: <Instagram size={24} />, status: 'connected', type: ChannelType.INSTAGRAM },
    { id: 'facebook', name: 'Facebook Messenger', icon: <Facebook size={24} />, status: 'disconnected', type: ChannelType.FACEBOOK },
    { id: 'email', name: 'Email Support', icon: <Mail size={24} />, status: 'connected', type: ChannelType.EMAIL },
    { id: 'telegram', name: 'Telegram Bot', icon: <Send size={24} />, status: 'disconnected', type: ChannelType.TELEGRAM },
    { id: 'twitter', name: 'X (Twitter)', icon: <Twitter size={24} />, status: 'disconnected', type: ChannelType.TWITTER },
    { id: 'chat', name: 'Web Chat Widget', icon: <Globe size={24} />, status: 'disconnected', type: ChannelType.CHAT },
    { id: 'threads', name: 'Threads', icon: <AtSign size={24} />, status: 'disconnected', type: ChannelType.THREADS },
    { id: 'pinterest', name: 'Pinterest', icon: <Pin size={24} />, status: 'disconnected', type: ChannelType.PINTEREST },
    { id: 'webhook', name: 'Webhook', icon: <Webhook size={24} />, status: 'disconnected', type: ChannelType.WEBHOOK },
];

const MOCK_TAGS = [
    { id: '1', name: 'Urgente', color: 'red' },
    { id: '2', name: 'VIP', color: 'purple' },
    { id: '3', name: 'Bug', color: 'orange' },
    { id: '4', name: 'Financeiro', color: 'green' },
];

interface NotificationSetting {
    email: boolean;
    inApp: boolean;
    label: string;
    icon: React.ElementType;
    desc: string;
}

const Settings: React.FC = () => {
    const [activeTab, setActiveTab] = useState('team');
    
    // State for Features
    const [users, setUsers] = useState(MOCK_USERS);
    const [integrations, setIntegrations] = useState(MOCK_INTEGRATIONS);
    const [tags, setTags] = useState(MOCK_TAGS);
    
    // Notification Settings State
    const [notifications, setNotifications] = useState<Record<string, NotificationSetting>>({
        newTicket: { email: true, inApp: true, label: 'Novos Tickets', icon: Ticket, desc: 'Quando um novo ticket é criado.' },
        mentions: { email: true, inApp: true, label: 'Menções (@)', icon: AtSign, desc: 'Quando alguém menciona você em um comentário.' },
        slaWarning: { email: true, inApp: false, label: 'Avisos de SLA', icon: AlertTriangle, desc: 'Quando um ticket está perto de vencer.' },
        assigned: { email: true, inApp: true, label: 'Atribuições', icon: UserCheck, desc: 'Quando um ticket é atribuído a você.' }
    });
    
    // Modals
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Agente' });

    const [isIntegrationModalOpen, setIsIntegrationModalOpen] = useState(false);
    const [selectedIntegration, setSelectedIntegration] = useState<typeof MOCK_INTEGRATIONS[0] | null>(null);

    // Handlers
    const handleAddUser = () => {
        if(newUser.name && newUser.email) {
            setUsers([...users, { id: Date.now().toString(), ...newUser, avatar: '', status: 'Active' }]);
            setIsUserModalOpen(false);
            setNewUser({ name: '', email: '', role: 'Agente' });
        }
    };

    const handleRemoveUser = (id: string) => {
        setUsers(users.filter(u => u.id !== id));
    };

    const handleToggleIntegration = (id: string) => {
        setIntegrations(integrations.map(int => {
            if (int.id === id) {
                // If connecting, show modal for "configuration" simulation
                if (int.status === 'disconnected') {
                    setSelectedIntegration(int);
                    setIsIntegrationModalOpen(true);
                    return int; // State change happens after modal confirm in real app, but here we toggle for visual
                }
                return { ...int, status: 'disconnected' };
            }
            return int;
        }));
    };

    const confirmIntegration = () => {
        if(selectedIntegration) {
            setIntegrations(integrations.map(int => int.id === selectedIntegration.id ? { ...int, status: 'connected' } : int));
            setIsIntegrationModalOpen(false);
            setSelectedIntegration(null);
        }
    }

    const handleNotificationChange = (key: string, type: 'email' | 'inApp') => {
        setNotifications(prev => ({
            ...prev,
            [key]: { ...prev[key], [type]: !prev[key][type] }
        }));
    };

    const tabs = [
        { id: 'team', label: 'Equipe', icon: User, desc: 'Gerencie usuários e permissões' },
        { id: 'channels', label: 'Canais', icon: Smartphone, desc: 'Conecte suas contas de comunicação' },
        { id: 'automation', label: 'Automação', icon: Zap, desc: 'SLAs, horários e respostas' },
        { id: 'notifications', label: 'Notificações', icon: Bell, desc: 'Preferências de alerta' },
        { id: 'tags', label: 'Tags', icon: Tag, desc: 'Categorize seus tickets' },
        { id: 'general', label: 'Geral', icon: Shield, desc: 'Informações da empresa' },
    ];

    return (
        <div className="flex h-full bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
            {/* Sidebar Navigation */}
            <div className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex-shrink-0 flex flex-col">
                <div className="p-6">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-1">Configurações</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Gerencie sua plataforma</p>
                </div>
                <nav className="flex-1 px-4 space-y-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={clsx(
                                "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all text-left",
                                activeTab === tab.id 
                                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 shadow-sm" 
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                            )}
                        >
                            <tab.icon size={18} className={clsx(activeTab === tab.id ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400")} />
                            <div className="flex flex-col">
                                <span>{tab.label}</span>
                                <span className="text-[10px] font-normal opacity-70 hidden md:block">{tab.desc}</span>
                            </div>
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8 md:p-12">
                <div className="max-w-4xl mx-auto">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {/* TEAM TAB */}
                            {activeTab === 'team' && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Membros da Equipe</h2>
                                            <p className="text-slate-500 dark:text-slate-400">Gerencie quem tem acesso à plataforma.</p>
                                        </div>
                                        <button onClick={() => setIsUserModalOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-indigo-700 transition-colors">
                                            <Plus size={18} /> Adicionar Membro
                                        </button>
                                    </div>

                                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                                                <tr>
                                                    <th className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400">Usuário</th>
                                                    <th className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400">Email</th>
                                                    <th className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400">Cargo</th>
                                                    <th className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400">Status</th>
                                                    <th className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400 text-right">Ações</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                                {users.map(user => (
                                                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold text-xs">
                                                                    {user.name.substring(0,2).toUpperCase()}
                                                                </div>
                                                                <span className="font-medium text-slate-900 dark:text-slate-200">{user.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{user.email}</td>
                                                        <td className="px-6 py-4">
                                                            <span className={clsx(
                                                                "px-2 py-1 rounded text-xs font-medium",
                                                                user.role === 'Admin' ? "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                                                            )}>{user.role}</span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                                {user.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button onClick={() => handleRemoveUser(user.id)} className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* CHANNELS TAB */}
                            {activeTab === 'channels' && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Integrações</h2>
                                            <p className="text-slate-500 dark:text-slate-400">Conecte seus canais de atendimento.</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {integrations.map(integration => (
                                            <div key={integration.id} className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-start justify-between">
                                                <div className="flex gap-4">
                                                    <div className={clsx(
                                                        "w-12 h-12 rounded-lg flex items-center justify-center text-white text-2xl shadow-sm",
                                                        integration.type === ChannelType.WHATSAPP ? "bg-green-500" :
                                                        integration.type === ChannelType.INSTAGRAM ? "bg-pink-500" :
                                                        integration.type === ChannelType.EMAIL ? "bg-blue-500" :
                                                        integration.type === ChannelType.FACEBOOK ? "bg-blue-600" :
                                                        integration.type === ChannelType.PINTEREST ? "bg-red-600" :
                                                        integration.type === ChannelType.TELEGRAM ? "bg-sky-500" :
                                                        integration.type === ChannelType.TWITTER ? "bg-black dark:bg-slate-900" :
                                                        integration.type === ChannelType.THREADS ? "bg-slate-900 dark:bg-black" :
                                                        integration.type === ChannelType.WEBHOOK ? "bg-orange-500" :
                                                        "bg-indigo-500"
                                                    )}>
                                                        {integration.icon}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-slate-800 dark:text-white">{integration.name}</h3>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className={clsx(
                                                                "w-2 h-2 rounded-full",
                                                                integration.status === 'connected' ? "bg-green-500" : "bg-slate-300 dark:bg-slate-600"
                                                            )}></span>
                                                            <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                                                                {integration.status === 'connected' ? 'Ativo' : 'Desconectado'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {integration.status === 'connected' ? (
                                                        <button 
                                                            onClick={() => handleToggleIntegration(integration.id)}
                                                            className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                                        >
                                                            Desconectar
                                                        </button>
                                                    ) : (
                                                        <button 
                                                            onClick={() => handleToggleIntegration(integration.id)}
                                                            className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                                                        >
                                                            Conectar
                                                        </button>
                                                    )}
                                                    <button className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><Edit2 size={16} /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* AUTOMATION TAB */}
                            {activeTab === 'automation' && (
                                <div className="space-y-8">
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Automação & SLA</h2>
                                        <p className="text-slate-500 dark:text-slate-400">Defina regras para otimizar o atendimento.</p>
                                    </div>

                                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-6">
                                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-700">
                                            <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg text-amber-600 dark:text-amber-400">
                                                <Clock size={20} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-800 dark:text-white">Horário de Atendimento</h3>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">Defina quando sua equipe está disponível.</p>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Início</label>
                                                <input type="time" defaultValue="09:00" className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 dark:text-white rounded-lg text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fim</label>
                                                <input type="time" defaultValue="18:00" className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 dark:text-white rounded-lg text-sm" />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" id="weekend" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                                            <label htmlFor="weekend" className="text-sm text-slate-600 dark:text-slate-400">Atendimento aos fins de semana</label>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-6">
                                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-700">
                                            <div className="bg-rose-100 dark:bg-rose-900/30 p-2 rounded-lg text-rose-600 dark:text-rose-400">
                                                <AlertTriangle size={20} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-800 dark:text-white">Política de SLA</h3>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">Tempo limite para respostas e resoluções.</p>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Tempo para primeira resposta</span>
                                                <select className="bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded px-2 py-1 text-sm dark:text-white">
                                                    <option>30 minutos</option>
                                                    <option>1 hora</option>
                                                    <option>4 horas</option>
                                                </select>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Tempo para resolução (Alta Prioridade)</span>
                                                <select className="bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded px-2 py-1 text-sm dark:text-white">
                                                    <option>2 horas</option>
                                                    <option>4 horas</option>
                                                    <option>24 horas</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                             {/* NOTIFICATIONS TAB */}
                             {activeTab === 'notifications' && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Preferências de Notificação</h2>
                                            <p className="text-slate-500 dark:text-slate-400">Escolha como e quando você quer ser alertado.</p>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                                        {/* Header */}
                                        <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            <div className="col-span-8 md:col-span-6">Tipo de Alerta</div>
                                            <div className="col-span-2 md:col-span-3 text-center">Email</div>
                                            <div className="col-span-2 md:col-span-3 text-center">No App</div>
                                        </div>

                                        {/* Rows */}
                                        <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                            {Object.entries(notifications).map(([key, setting]: [string, NotificationSetting]) => (
                                                <div key={key} className="grid grid-cols-12 gap-4 px-6 py-5 items-center hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                                    <div className="col-span-8 md:col-span-6 flex items-start gap-4">
                                                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400 hidden sm:block">
                                                            <setting.icon size={20} />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-medium text-slate-800 dark:text-slate-200">{setting.label}</h4>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{setting.desc}</p>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Email Toggle */}
                                                    <div className="col-span-2 md:col-span-3 flex justify-center">
                                                        <button 
                                                            onClick={() => handleNotificationChange(key, 'email')}
                                                            className={clsx(
                                                                "w-11 h-6 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800",
                                                                setting.email ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-600"
                                                            )}
                                                        >
                                                            <span className={clsx(
                                                                "block w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform absolute top-1 left-1",
                                                                setting.email ? "translate-x-5" : "translate-x-0"
                                                            )} />
                                                        </button>
                                                    </div>

                                                    {/* In-App Toggle */}
                                                    <div className="col-span-2 md:col-span-3 flex justify-center">
                                                         <button 
                                                            onClick={() => handleNotificationChange(key, 'inApp')}
                                                            className={clsx(
                                                                "w-11 h-6 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800",
                                                                setting.inApp ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-600"
                                                            )}
                                                        >
                                                            <span className={clsx(
                                                                "block w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform absolute top-1 left-1",
                                                                setting.inApp ? "translate-x-5" : "translate-x-0"
                                                            )} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-end">
                                        <button className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-all">
                                            <Save size={18} /> Salvar Preferências
                                        </button>
                                    </div>
                                </div>
                             )}

                             {/* TAGS TAB */}
                             {activeTab === 'tags' && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Tags do Sistema</h2>
                                            <p className="text-slate-500 dark:text-slate-400">Categorize tickets e tarefas.</p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {tags.map(tag => (
                                            <div key={tag.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between group">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-3 h-3 rounded-full bg-${tag.color}-500`}></div>
                                                    <span className="font-medium text-slate-700 dark:text-slate-200">{tag.name}</span>
                                                </div>
                                                <button className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                        <button className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                            <Plus size={18} /> Nova Tag
                                        </button>
                                    </div>
                                </div>
                             )}

                             {/* GENERAL TAB */}
                             {activeTab === 'general' && (
                                 <div className="space-y-6">
                                     <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Informações da Empresa</h2>
                                     <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                                         <div>
                                             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome da Empresa</label>
                                             <input type="text" defaultValue="TechCorp Ltda" className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 dark:text-white rounded-lg text-sm" />
                                         </div>
                                         <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Site</label>
                                                <input type="text" defaultValue="https://techcorp.com.br" className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 dark:text-white rounded-lg text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Telefone Suporte</label>
                                                <input type="text" defaultValue="+55 11 0000-0000" className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 dark:text-white rounded-lg text-sm" />
                                            </div>
                                         </div>
                                         <div className="pt-4 flex justify-end">
                                             <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                                                 <Save size={16} /> Salvar Alterações
                                             </button>
                                         </div>
                                     </div>
                                 </div>
                             )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* User Modal */}
            <Modal
                isOpen={isUserModalOpen}
                onClose={() => setIsUserModalOpen(false)}
                title="Adicionar Novo Membro"
                footer={
                    <button onClick={handleAddUser} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                        Adicionar
                    </button>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome</label>
                        <input type="text" className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 dark:text-white rounded-lg text-sm" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                        <input type="email" className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 dark:text-white rounded-lg text-sm" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cargo</label>
                        <select className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 dark:text-white rounded-lg text-sm" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                            <option value="Agente">Agente</option>
                            <option value="Admin">Administrador</option>
                            <option value="Gerente">Gerente</option>
                        </select>
                    </div>
                </div>
            </Modal>

            {/* Integration Modal */}
            <Modal
                isOpen={isIntegrationModalOpen}
                onClose={() => setIsIntegrationModalOpen(false)}
                title={`Configurar ${selectedIntegration?.name}`}
                footer={
                    <button onClick={confirmIntegration} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                        Salvar e Conectar
                    </button>
                }
            >
                <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start gap-3">
                         <div className="text-blue-600 dark:text-blue-400 mt-0.5"><Lock size={18} /></div>
                         <p className="text-sm text-blue-700 dark:text-blue-300">Suas credenciais são criptografadas e armazenadas com segurança. Nós nunca compartilhamos seus tokens de acesso.</p>
                    </div>
                    
                    {/* Different inputs based on type */}
                    {selectedIntegration?.type === ChannelType.WEBHOOK ? (
                        <>
                             <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Webhook URL</label>
                                <input type="text" placeholder="https://api.seusite.com/webhook" className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 dark:text-white rounded-lg text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Secret Key (Opcional)</label>
                                <input type="password" placeholder="wh_secret_..." className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 dark:text-white rounded-lg text-sm" />
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">API Key / Token</label>
                                <input type="password" placeholder="••••••••••••••••" className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 dark:text-white rounded-lg text-sm" />
                            </div>
                            {selectedIntegration?.type === ChannelType.WHATSAPP && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone Number ID</label>
                                    <input type="text" placeholder="Ex: 105672..." className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 dark:text-white rounded-lg text-sm" />
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome da Conexão</label>
                                <input type="text" placeholder="Ex: Suporte Oficial" className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 dark:text-white rounded-lg text-sm" />
                            </div>
                        </>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default Settings;