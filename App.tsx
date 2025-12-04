import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Inbox from './components/Inbox';
import AIChatbot from './components/AIChatbot';
import TicketBoard from './components/TicketBoard';
import TaskBoard from './components/TaskBoard';
import ContactList from './components/ContactList';
import Settings from './components/Settings';
import ActivityBoard from './components/ActivityBoard';
import AutomationBuilder from './components/AutomationBuilder';
import { Menu } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { DataProvider } from './contexts/DataContext';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState('inbox'); 
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'inbox':
        return <Inbox />;
      case 'tickets':
        return <TicketBoard />;
      case 'tasks':
        return <TaskBoard />;
      case 'activities':
        return <ActivityBoard />;
      case 'flows':
        return <AutomationBuilder />;
      case 'contacts':
        return <ContactList />;
      case 'settings':
        return <Settings />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center transition-all duration-300">
             <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Em construção</h2>
             <p className="text-slate-500 dark:text-slate-400">A funcionalidade "{activeView}" estará disponível em breve.</p>
             <button onClick={() => setActiveView('dashboard')} className="mt-4 text-indigo-600 dark:text-indigo-400 hover:underline">Voltar ao Dashboard</button>
          </div>
        );
    }
  };

  return (
    <DataProvider>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-inter flex overflow-hidden transition-colors duration-300">
        {/* Mobile Header */}
        <div className="md:hidden bg-slate-900 dark:bg-slate-950 text-white p-4 flex justify-between items-center fixed top-0 w-full z-30 shadow-md h-16">
            <span className="font-bold text-xl">GhitDesk</span>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                <Menu size={24} />
            </button>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
            <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)}>
                <div className="bg-slate-900 w-64 h-full p-4" onClick={e => e.stopPropagation()}>
                    <div className="flex flex-col gap-4 mt-10">
                        <button onClick={() => {setActiveView('dashboard'); setMobileMenuOpen(false)}} className="text-white font-medium text-left py-2">Dashboard</button>
                        <button onClick={() => {setActiveView('inbox'); setMobileMenuOpen(false)}} className="text-white font-medium text-left py-2">Inbox</button>
                        <button onClick={() => {setActiveView('tickets'); setMobileMenuOpen(false)}} className="text-white font-medium text-left py-2">Tickets</button>
                        <button onClick={() => {setActiveView('tasks'); setMobileMenuOpen(false)}} className="text-white font-medium text-left py-2">Tarefas</button>
                        <button onClick={() => {setActiveView('activities'); setMobileMenuOpen(false)}} className="text-white font-medium text-left py-2">Atividades</button>
                        <button onClick={() => {setActiveView('flows'); setMobileMenuOpen(false)}} className="text-white font-medium text-left py-2">Fluxos</button>
                        <button onClick={() => {setActiveView('contacts'); setMobileMenuOpen(false)}} className="text-white font-medium text-left py-2">Contatos</button>
                        <button onClick={() => {setActiveView('settings'); setMobileMenuOpen(false)}} className="text-white font-medium text-left py-2">Configurações</button>
                    </div>
                </div>
            </div>
        )}

        <Sidebar 
            activeView={activeView} 
            setActiveView={setActiveView} 
            isCollapsed={isSidebarCollapsed}
            toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            theme={theme}
            toggleTheme={toggleTheme}
        />
        
        {/* Main Content Area with dynamic margin */}
        <motion.main 
            className="flex-1 h-screen overflow-hidden pt-16 md:pt-0"
            animate={{ marginLeft: isSidebarCollapsed ? 80 : 280 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
        >
            <AnimatePresence mode="wait">
                {renderView()}
            </AnimatePresence>
        </motion.main>
        
        <AIChatbot />
        </div>
    </DataProvider>
  );
};

export default App;