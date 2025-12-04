import React from 'react';
import { LayoutDashboard, MessageSquare, Users, Settings, CheckSquare, Ticket, ChevronLeft, ChevronRight, LogOut, Moon, Sun, Calendar, Workflow } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, isCollapsed, toggleCollapse, theme, toggleTheme }) => {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'inbox', icon: MessageSquare, label: 'Inbox', badge: 12 },
    { id: 'tickets', icon: Ticket, label: 'Tickets', badge: 7 },
    { id: 'tasks', icon: CheckSquare, label: 'Tarefas', badge: 5 },
    { id: 'activities', icon: Calendar, label: 'Atividades' },
    { id: 'flows', icon: Workflow, label: 'Fluxos (Chatbot)' },
    { id: 'contacts', icon: Users, label: 'Contatos' },
    { id: 'settings', icon: Settings, label: 'Configurações' },
  ];

  return (
    <motion.aside 
      animate={{ width: isCollapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="bg-white dark:bg-slate-800 h-screen fixed left-0 top-0 border-r border-slate-200 dark:border-slate-700 z-20 hidden md:flex flex-col justify-between shadow-sm transition-colors duration-300"
    >
      <div>
        {/* Header / Logo */}
        <div className={clsx("h-20 flex items-center border-b border-slate-50 dark:border-slate-700 relative transition-all", isCollapsed ? "justify-center px-0" : "px-6")}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="min-w-[40px] h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none">
                <span className="font-bold text-white text-xl">G</span>
            </div>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  className="flex flex-col whitespace-nowrap"
                >
                  <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">GhitDesk</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">TechCorp Ltda</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Collapse Button */}
          <button 
            onClick={toggleCollapse}
            className="absolute -right-3 top-10 w-6 h-6 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-sm z-30 hover:scale-110 transition-all"
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Navigation */}
        <div className="p-3 mt-2">
           <nav className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={clsx(
                  "w-full flex items-center transition-all duration-200 group relative",
                  isCollapsed ? "justify-center px-0 py-3 rounded-xl" : "gap-3 px-4 py-3 rounded-xl",
                  activeView === item.id
                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                <div className="relative">
                    <item.icon size={22} strokeWidth={activeView === item.id ? 2.5 : 2} className={clsx(
                        "flex-shrink-0 transition-colors",
                        activeView === item.id ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                    )} />
                    
                    {/* Badge */}
                    {item.badge && (
                        <div className={clsx(
                            "absolute -top-1.5 -right-2 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-bold border-2",
                            activeView === item.id ? "bg-indigo-600 text-white border-white dark:border-slate-800" : "bg-indigo-600 text-white border-white dark:border-slate-800"
                        )}>
                            {item.badge}
                        </div>
                    )}
                </div>
                
                <AnimatePresence>
                    {!isCollapsed && (
                        <motion.span 
                            initial={{ opacity: 0, width: 0 }} 
                            animate={{ opacity: 1, width: 'auto' }} 
                            exit={{ opacity: 0, width: 0 }}
                            className="whitespace-nowrap overflow-hidden font-medium"
                        >
                            {item.label}
                        </motion.span>
                    )}
                </AnimatePresence>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Footer / Theme & User Profile */}
      <div className="bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700">
        {/* Theme Toggle */}
        <div className={clsx("px-3 pt-3", isCollapsed ? "flex justify-center" : "")}>
             <button 
                onClick={toggleTheme}
                className={clsx(
                    "flex items-center justify-center gap-3 rounded-xl transition-all bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600",
                    isCollapsed ? "w-10 h-10 p-0" : "w-full py-2 px-3"
                )}
                title={theme === 'light' ? "Mudar para modo escuro" : "Mudar para modo claro"}
             >
                 {theme === 'light' ? (
                     <Moon size={18} className="text-slate-600 dark:text-slate-300" />
                 ) : (
                     <Sun size={18} className="text-amber-400" />
                 )}
                 
                 {!isCollapsed && (
                     <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                         {theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
                     </span>
                 )}
             </button>
        </div>

        {/* User Profile */}
        <div className={clsx("p-3", isCollapsed ? "flex justify-center" : "")}>
            <button className={clsx("flex items-center gap-3 rounded-xl hover:bg-white dark:hover:bg-slate-700/50 hover:shadow-sm transition-all group", isCollapsed ? "p-2" : "w-full p-2")}>
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-sm flex-shrink-0 border-2 border-white dark:border-slate-600 shadow-sm">
                    CM
                </div>
                <AnimatePresence>
                    {!isCollapsed && (
                        <motion.div 
                            initial={{ opacity: 0, width: 0 }} 
                            animate={{ opacity: 1, width: 'auto' }} 
                            exit={{ opacity: 0, width: 0 }}
                            className="flex flex-col items-start overflow-hidden"
                        >
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap group-hover:text-indigo-700 dark:group-hover:text-indigo-400">Carlos Mendes</span>
                            <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">Agente</span>
                        </motion.div>
                    )}
                </AnimatePresence>
                
                {!isCollapsed && <LogOut size={16} className="ml-auto text-slate-400 hover:text-rose-500" />}
            </button>
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;