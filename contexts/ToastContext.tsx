import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageCircle, Reply } from 'lucide-react';
import { clsx } from 'clsx';

export interface ToastMessage {
  id: string;
  senderName: string;
  avatar?: string;
  content: string;
  channel: string; // 'WhatsApp', 'Email', etc.
  ticketId: string;
  onReply: (text: string) => void;
}

interface ToastContextType {
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const ToastItem: React.FC<{ toast: ToastMessage; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [isSending, setIsSending] = useState(false);

    // Auto-dismiss if not interacting
    useEffect(() => {
        if (!isReplying) {
            const timer = setTimeout(() => {
                onRemove(toast.id);
            }, 8000); // 8 seconds display
            return () => clearTimeout(timer);
        }
    }, [isReplying, onRemove, toast.id]);

    const handleSend = async () => {
        if (!replyText.trim()) return;
        setIsSending(true);
        
        // Simulate network delay for UX
        await new Promise(resolve => setTimeout(resolve, 600));
        
        toast.onReply(replyText);
        setIsSending(false);
        onRemove(toast.id);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 w-80 sm:w-96 overflow-hidden pointer-events-auto backdrop-blur-sm"
        >
            <div className="p-4">
                <div className="flex items-start gap-3">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 font-bold overflow-hidden border border-slate-200 dark:border-slate-600">
                             {toast.avatar ? (
                                 <img src={toast.avatar} alt={toast.senderName} className="w-full h-full object-cover" />
                             ) : (
                                 toast.senderName.substring(0, 2).toUpperCase()
                             )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 rounded-full p-0.5 shadow-sm">
                             <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                                 <MessageCircle size={10} className="text-white" />
                             </div>
                        </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-0.5">
                            <h4 className="font-bold text-sm text-slate-800 dark:text-white truncate pr-2">{toast.senderName}</h4>
                            <button 
                                onClick={() => onRemove(toast.id)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-2 leading-relaxed">
                            {toast.content}
                        </p>
                        
                        {!isReplying ? (
                            <button 
                                onClick={() => setIsReplying(true)}
                                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline mt-1"
                            >
                                <Reply size={12} /> Responder rápido
                            </button>
                        ) : (
                            <div className="mt-3 animate-in fade-in zoom-in-95 duration-200">
                                <div className="relative">
                                    <input 
                                        autoFocus
                                        type="text" 
                                        className="w-full pl-3 pr-10 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white placeholder:text-slate-400"
                                        placeholder="Digite sua resposta..."
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                        disabled={isSending}
                                    />
                                    <button 
                                        onClick={handleSend}
                                        disabled={!replyText.trim() || isSending}
                                        className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                    >
                                        {isSending ? (
                                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <Send size={12} />
                                        )}
                                    </button>
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-[10px] text-slate-400">Pressione Enter para enviar</span>
                                    <button 
                                        onClick={() => setIsReplying(false)}
                                        className="text-[10px] text-red-500 hover:underline"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* Progress Bar (Visual flair) */}
            {!isReplying && (
                <motion.div 
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: 8, ease: "linear" }}
                    className="h-1 bg-indigo-500/20"
                />
            )}
        </motion.div>
    );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};