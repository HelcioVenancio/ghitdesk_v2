import React, { useState } from 'react';
import { Search, Plus, Filter, Download, Star, Eye, MessageCircle, Mail, Instagram, Globe, Clock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChannelType, Contact } from '../types';
import Modal from './Modal';
import { useData } from '../contexts/DataContext';
import { clsx } from 'clsx';

const ContactList: React.FC = () => {
  const { contacts, addContact } = useData();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewContact, setViewContact] = useState<Contact | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [recentContacts, setRecentContacts] = useState<Contact[]>([]);

  // Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newChannel, setNewChannel] = useState<ChannelType>(ChannelType.EMAIL);

  const handleCreateContact = () => {
      if(!newName) return;

      const newContact: Contact = {
          id: Math.random().toString(36).substr(2, 9),
          name: newName,
          email: newEmail,
          phone: newPhone,
          document: '-',
          primaryChannel: newChannel,
          lastInteraction: 'Agora',
          tags: ['novo'],
          rating: 0
      };

      addContact(newContact);
      setIsCreateModalOpen(false);
      setNewName('');
      setNewEmail('');
      setNewPhone('');
  };

  const handleViewContact = (contact: Contact) => {
      setViewContact(contact);
      setRecentContacts(prev => {
          const filtered = prev.filter(c => c.id !== contact.id);
          return [contact, ...filtered].slice(0, 5);
      });
  };

  const removeRecent = (e: React.MouseEvent, contactId: string) => {
      e.stopPropagation();
      setRecentContacts(prev => prev.filter(c => c.id !== contactId));
  };

  const getChannelIcon = (channel: ChannelType) => {
      switch(channel) {
          case ChannelType.WHATSAPP: return <div className="flex items-center gap-1 text-green-600 dark:text-green-400"><MessageCircle size={16} /> WhatsApp</div>;
          case ChannelType.EMAIL: return <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400"><Mail size={16} /> E-mail</div>;
          case ChannelType.INSTAGRAM: return <div className="flex items-center gap-1 text-pink-600 dark:text-pink-400"><Instagram size={16} /> Instagram</div>;
          case ChannelType.CHAT: return <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400"><Globe size={16} /> Chat Web</div>;
          default: return <span>{channel}</span>;
      }
  }

  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col h-full bg-white dark:bg-slate-800 overflow-hidden transition-colors duration-300"
    >
      {/* Header */}
      <div className="h-20 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-8 flex-shrink-0">
        <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Contatos</h1>
            <div className="relative w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Buscar conversas, tickets ou contatos..." 
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-700/50 border-none rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 transition-all text-slate-700 dark:text-slate-200"
                />
            </div>
        </div>
        <div className="flex items-center gap-3">
             <button className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"><Filter size={20} /></button>
             <button className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"><Download size={20} /></button>
             <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 dark:shadow-none"
             >
                 <Plus size={18} /> Novo Contato
             </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
          {/* Recently Viewed Section */}
          <AnimatePresence>
            {recentContacts.length > 0 && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-8 pt-6 pb-2"
                >
                    <div className="flex items-center gap-2 mb-3">
                        <Clock size={14} className="text-slate-400" />
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Acessados Recentemente</h3>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                        {recentContacts.map(contact => (
                            <motion.div 
                                layout
                                key={contact.id}
                                onClick={() => handleViewContact(contact)}
                                className="min-w-[220px] bg-white dark:bg-slate-700/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 cursor-pointer transition-all group relative"
                            >
                                <button 
                                    onClick={(e) => removeRecent(e, contact.id)}
                                    className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={14} />
                                </button>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-100 dark:border-indigo-800">
                                        {contact.name.substring(0,2).toUpperCase()}
                                    </div>
                                    <div className="overflow-hidden">
                                        <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate">{contact.name}</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{contact.email}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}
          </AnimatePresence>

          {/* Filter/Nav Bar */}
          <div className="flex items-center justify-between px-8 py-4 bg-white dark:bg-slate-800 sticky top-0 z-10 border-b border-slate-50 dark:border-slate-700/50">
              <div className="flex flex-col gap-1 w-64">
                  <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="text" 
                        placeholder="Buscar por nome ou e-mail..." 
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                  </div>
              </div>
              <span className="text-sm text-slate-500 dark:text-slate-400">Contatos ({filteredContacts.length})</span>
          </div>

          {/* Table */}
          <div className="px-8 pb-8 pt-4">
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                  <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                          <tr>
                              <th className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400">Contato</th>
                              <th className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400">Documento</th>
                              <th className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400">Canal Principal</th>
                              <th className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400">Última Interação</th>
                              <th className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400">Tags</th>
                              <th className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400">Avaliação</th>
                              <th className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400 text-right">Ações</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                          {filteredContacts.length > 0 ? (
                              filteredContacts.map((contact) => (
                                  <tr key={contact.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group cursor-pointer" onClick={() => handleViewContact(contact)}>
                                      <td className="px-6 py-4">
                                          <div className="flex items-center gap-3">
                                              <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center font-bold text-xs">
                                                  {contact.name.substring(0,2).toUpperCase()}
                                              </div>
                                              <div>
                                                  <div className="font-medium text-slate-900 dark:text-slate-200">{contact.name}</div>
                                                  <div className="text-xs text-slate-400">{contact.email} {contact.phone && `• ${contact.phone}`}</div>
                                              </div>
                                          </div>
                                      </td>
                                      <td className="px-6 py-4 font-mono text-slate-600 dark:text-slate-400">{contact.document}</td>
                                      <td className="px-6 py-4">{getChannelIcon(contact.primaryChannel)}</td>
                                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{contact.lastInteraction}</td>
                                      <td className="px-6 py-4">
                                          <div className="flex gap-1 flex-wrap">
                                              {contact.tags.map(tag => (
                                                  <span key={tag} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-[10px] border border-slate-200 dark:border-slate-600">
                                                      {tag}
                                                  </span>
                                              ))}
                                          </div>
                                      </td>
                                      <td className="px-6 py-4">
                                          <div className="flex items-center gap-1 text-orange-400 font-medium">
                                              <Star size={14} fill="currentColor" />
                                              <span className="text-slate-700 dark:text-slate-300">{contact.rating.toFixed(1)}</span>
                                          </div>
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                          <button onClick={(e) => { e.stopPropagation(); handleViewContact(contact); }} className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                                              <Eye size={18} />
                                          </button>
                                      </td>
                                  </tr>
                              ))
                          ) : (
                              <tr>
                                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                                      Nenhum contato encontrado.
                                  </td>
                              </tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>

      {/* Create Contact Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Novo Contato"
        footer={
            <button onClick={handleCreateContact} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                Salvar Contato
            </button>
        }
      >
          <div className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome Completo</label>
                  <input type="text" className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={newName} onChange={e => setNewName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">E-mail</label>
                      <input type="email" className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Telefone</label>
                      <input type="text" className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={newPhone} onChange={e => setNewPhone(e.target.value)} />
                  </div>
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Canal Principal</label>
                  <select className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={newChannel} onChange={e => setNewChannel(e.target.value as ChannelType)}>
                      {Object.values(ChannelType).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
              </div>
          </div>
      </Modal>

      {/* View Contact Modal */}
      <Modal
        isOpen={!!viewContact}
        onClose={() => setViewContact(null)}
        title="Detalhes do Contato"
      >
          {viewContact && (
              <div className="flex flex-col items-center py-4">
                  <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-2xl font-bold text-slate-500 dark:text-slate-300 mb-4">
                      {viewContact.name.substring(0,2).toUpperCase()}
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">{viewContact.name}</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">{viewContact.email}</p>

                  <div className="w-full space-y-4">
                      <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                          <span className="text-slate-500 dark:text-slate-400 text-sm">Telefone</span>
                          <span className="text-slate-800 dark:text-slate-200 text-sm font-medium">{viewContact.phone}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                          <span className="text-slate-500 dark:text-slate-400 text-sm">Documento</span>
                          <span className="text-slate-800 dark:text-slate-200 text-sm font-medium">{viewContact.document}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                          <span className="text-slate-500 dark:text-slate-400 text-sm">Canal</span>
                          <span className="text-slate-800 dark:text-slate-200 text-sm font-medium">{viewContact.primaryChannel}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                          <span className="text-slate-500 dark:text-slate-400 text-sm">Avaliação</span>
                          <div className="flex items-center gap-1">
                              <span className="text-slate-800 dark:text-slate-200 text-sm font-medium">{viewContact.rating}</span>
                              <Star size={14} className="text-orange-400 fill-orange-400" />
                          </div>
                      </div>
                  </div>
              </div>
          )}
      </Modal>

    </motion.div>
  );
};

export default ContactList;