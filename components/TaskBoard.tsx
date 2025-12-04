import React, { useState } from 'react';
import { Search, Plus, MoreHorizontal, Calendar, CheckSquare, MessageSquare, Tag, PanelRightClose, PanelRightOpen, X, CheckCircle, Circle, Clock, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TaskStatus, Priority, Task, Subtask } from '../types';
import Modal from './Modal';
import { clsx } from 'clsx';
import { useData } from '../contexts/DataContext';

const COLUMNS = [
  { id: TaskStatus.TODO, label: 'A Fazer', count: 5 },
  { id: TaskStatus.IN_PROGRESS, label: 'Em Progresso', count: 3 },
  { id: TaskStatus.REVIEW, label: 'Em Revisão', count: 2 },
  { id: TaskStatus.DONE, label: 'Concluído', count: 2 },
];

const TaskBoard: React.FC = () => {
  const { tasks, addTask, updateTask } = useData();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewTask, setViewTask] = useState<Task | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'subtasks'>('subtasks');
  const [isDetailsSidebarOpen, setIsDetailsSidebarOpen] = useState(true);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>(Priority.MEDIUM);
  const [newProject, setNewProject] = useState('GhitDesk Core');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const handleCreateTask = () => {
      if(!newTitle) return;
      
      const newTask: Task = {
          id: `TASK-${Math.floor(Math.random() * 1000)}`,
          title: newTitle,
          priority: newPriority,
          tags: ['nova'],
          checklist: {completed: 0, total: 0},
          comments: 0,
          dueDate: 'Sem data',
          project: newProject,
          status: TaskStatus.TODO,
          progress: 0,
          assignees: [],
          attachments: 0,
          subtasks: []
      };

      addTask(newTask);
      setIsCreateModalOpen(false);
      setNewTitle('');
  };

  const toggleSubtask = (subtaskId: string) => {
    if (!viewTask) return;

    const updatedSubtasks = viewTask.subtasks?.map(st => 
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
    ) || [];

    const total = updatedSubtasks.length;
    const completed = updatedSubtasks.filter(st => st.completed).length;
    const newProgress = total === 0 ? 0 : Math.round((completed / total) * 100);

    const updatedTask = {
        ...viewTask,
        subtasks: updatedSubtasks,
        checklist: { total, completed },
        progress: newProgress
    };

    setViewTask(updatedTask);
    updateTask(viewTask.id, updatedTask);
  };

  const addSubtask = () => {
      if (!viewTask || !newSubtaskTitle.trim()) return;

      const newSubtask: Subtask = {
          id: `st-${Date.now()}`,
          title: newSubtaskTitle,
          completed: false
      };

      const updatedSubtasks = [...(viewTask.subtasks || []), newSubtask];
      const total = updatedSubtasks.length;
      const completed = updatedSubtasks.filter(st => st.completed).length;
      const newProgress = total === 0 ? 0 : Math.round((completed / total) * 100);

      const updatedTask = {
          ...viewTask,
          subtasks: updatedSubtasks,
          checklist: { total, completed },
          progress: newProgress
      };

      setViewTask(updatedTask);
      updateTask(viewTask.id, updatedTask);
      setNewSubtaskTitle('');
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, status: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(status);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, status: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    if (!draggedTaskId) return;

    updateTask(draggedTaskId, { status });
    setDraggedTaskId(null);
  };

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
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Tarefas</h1>
            <div className="relative w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Buscar tarefas..." 
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-700/50 border-none rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 transition-all text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
                />
            </div>
        </div>
        <div className="flex items-center gap-3">
             <button className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"><MoreHorizontal /></button>
             <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 dark:shadow-none"
             >
                 <Plus size={18} /> Nova Tarefa
             </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto p-8">
          <div className="flex gap-6 h-full min-w-[1200px]">
             {COLUMNS.map(col => (
                 <div 
                    key={col.id} 
                    className={clsx(
                        "flex-1 flex flex-col min-w-[300px] rounded-2xl transition-all duration-200 p-2",
                        dragOverColumn === col.id ? "bg-indigo-50/50 dark:bg-indigo-900/20 ring-2 ring-indigo-200 dark:ring-indigo-800" : ""
                    )}
                    onDragOver={(e) => handleDragOver(e, col.id)}
                    onDrop={(e) => handleDrop(e, col.id)}
                 >
                     <div className="flex items-center justify-between mb-4 px-1">
                          <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-700 dark:text-slate-200">{col.label}</span>
                              <span className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs px-2 py-0.5 rounded-full font-bold">{tasks.filter(t => t.status === col.id).length}</span>
                          </div>
                          <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><Plus size={18} /></button>
                     </div>

                     <div className="flex-1 space-y-4 min-h-[200px]">
                         {tasks.filter(t => t.status === col.id).map(task => (
                             <motion.div 
                                layoutId={task.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent<HTMLDivElement>, task.id)}
                                whileHover={draggedTaskId !== task.id ? { y: -4, boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" } : {}}
                                key={task.id} 
                                onClick={() => setViewTask(task)}
                                className={clsx(
                                    "bg-white dark:bg-slate-800 p-5 rounded-2xl border shadow-sm cursor-grab active:cursor-grabbing transition-all relative",
                                    draggedTaskId === task.id 
                                        ? "border-indigo-400 dark:border-indigo-500 ring-2 ring-indigo-100 dark:ring-indigo-900/40 shadow-xl opacity-60 scale-[0.98] z-10" 
                                        : "border-slate-200 dark:border-slate-700 opacity-100 hover:border-indigo-300 dark:hover:border-indigo-700"
                                )}
                             >
                                <div className="flex justify-between items-start mb-3">
                                    <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm leading-tight flex-1">{task.title}</h4>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap ml-2 ${
                                        task.priority === 'Urgente' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                                        task.priority === 'Alta' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
                                        task.priority === 'Média' ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                    }`}>
                                        {task.priority}
                                    </span>
                                </div>
                                
                                <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mb-3 uppercase tracking-wider">{task.id}</div>
                                
                                <div className="flex flex-wrap gap-1 mb-4">
                                    {task.tags.map(tag => (
                                        <span key={tag} className="px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-600 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50">
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                {task.progress > 0 && (
                                    <div className="mb-4">
                                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${task.progress}%` }}></div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-3 mt-2">
                                    <div className="flex items-center gap-3 text-slate-400">
                                        {task.checklist.total > 0 && (
                                            <div className="flex items-center gap-1 text-xs">
                                                <CheckSquare size={14} /> {task.checklist.completed}/{task.checklist.total}
                                            </div>
                                        )}
                                        {task.comments > 0 && (
                                            <div className="flex items-center gap-1 text-xs">
                                                <MessageSquare size={14} /> {task.comments}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="flex justify-between items-center mt-3">
                                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                        <Calendar size={12} /> {task.dueDate}
                                    </div>
                                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">{task.project}</span>
                                </div>

                             </motion.div>
                         ))}
                     </div>
                 </div>
             ))}
          </div>
      </div>

      {/* Create Task Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Nova Tarefa"
        footer={
            <button onClick={handleCreateTask} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                Criar Tarefa
            </button>
        }
      >
          <div className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Título</label>
                  <input type="text" className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Ex: Implementar login" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Projeto</label>
                      <input type="text" className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400" value={newProject} onChange={e => setNewProject(e.target.value)} placeholder="Nome do projeto" />
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
          </div>
      </Modal>

      {/* Detailed View Task Modal - ClickUp Style */}
      <Modal
        isOpen={!!viewTask}
        onClose={() => setViewTask(null)}
        title=""
        maxWidth="max-w-[90vw]"
        noPadding
      >
          {viewTask && (
              <div className="flex flex-col md:flex-row h-[85vh]">
                  {/* Main Column */}
                  <motion.div 
                    layout
                    className="flex-1 p-6 md:p-8 overflow-y-auto border-r border-slate-100 dark:border-slate-700"
                  >
                        <div className="flex items-center justify-between mb-4">
                            {/* Breadcrumbs */}
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                <span>{viewTask.project}</span>
                                <span className="text-slate-300">/</span>
                                <span>{viewTask.id}</span>
                            </div>
                            
                            {/* Expand Sidebar Button (Visible when closed) */}
                            <AnimatePresence>
                                {!isDetailsSidebarOpen && (
                                    <motion.button
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        onClick={() => setIsDetailsSidebarOpen(true)}
                                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400 transition-colors"
                                        title="Expandir Detalhes"
                                    >
                                        <PanelRightOpen size={20} />
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </div>
                        
                        {/* Title */}
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white mb-6 leading-tight">{viewTask.title}</h2>

                        {/* Controls row (Status, Priority, etc - mobile view mostly, or quick access) */}
                        <div className="flex flex-wrap gap-3 mb-8">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-600">
                                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase">{viewTask.status}</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-600">
                                <Tag size={14} className="text-slate-400" />
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{viewTask.priority}</span>
                            </div>
                            <div className="flex items-center -space-x-2">
                                <div className="w-7 h-7 rounded-full bg-indigo-600 border-2 border-white dark:border-slate-900 flex items-center justify-center text-white text-[10px]">CM</div>
                                <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-900 flex items-center justify-center text-slate-500 text-[10px]">+</div>
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
                                onClick={() => setActiveTab('subtasks')}
                                className={clsx("px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2", activeTab === 'subtasks' ? "border-indigo-600 text-indigo-600 dark:text-indigo-400" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}
                            >
                                Subtarefas 
                                <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs px-1.5 rounded-full">{viewTask.subtasks?.length || 0}</span>
                            </button>
                        </div>

                        {/* Content based on Tab */}
                        <div className="space-y-6">
                            {activeTab === 'details' && (
                                <div>
                                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
                                        Nenhuma descrição fornecida para esta tarefa.
                                    </p>
                                    <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Anexos</h4>
                                        <div className="text-sm text-slate-400 italic text-center py-4 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg">Nenhum anexo.</div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'subtasks' && (
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Progresso</span>
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{viewTask.progress}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full mb-6">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${viewTask.progress}%` }}
                                            transition={{ duration: 0.5, ease: "easeOut" }}
                                            className="h-full bg-indigo-500 rounded-full"
                                        ></motion.div>
                                    </div>

                                    {(!viewTask.subtasks || viewTask.subtasks.length === 0) && (
                                        <div className="text-center py-8 text-slate-400 text-sm">
                                            Nenhuma subtarefa criada.
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        {viewTask.subtasks?.map(subtask => (
                                            <motion.div 
                                                layout
                                                key={subtask.id}
                                                onClick={() => toggleSubtask(subtask.id)}
                                                className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg group cursor-pointer transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-600"
                                            >
                                                <motion.div
                                                    initial={false}
                                                    animate={{ scale: subtask.completed ? [1, 1.2, 1] : 1 }}
                                                    className={clsx(
                                                        "text-slate-300 group-hover:text-slate-400 transition-colors",
                                                        subtask.completed ? "text-green-500 group-hover:text-green-600" : ""
                                                    )}
                                                >
                                                    {subtask.completed ? <CheckCircle size={20} className="fill-green-100 dark:fill-green-900/30" /> : <Circle size={20} />}
                                                </motion.div>
                                                <span className={clsx(
                                                    "text-sm transition-all flex-1",
                                                    subtask.completed ? "text-slate-400 line-through" : "text-slate-700 dark:text-slate-200"
                                                )}>
                                                    {subtask.title}
                                                </span>
                                            </motion.div>
                                        ))}
                                    </div>
                                   
                                    <div className="flex items-center gap-2 mt-4 pt-2 border-t border-slate-100 dark:border-slate-700">
                                        <Plus size={16} className="text-slate-400" />
                                        <input 
                                            type="text" 
                                            placeholder="Adicionar nova subtarefa..." 
                                            className="flex-1 bg-transparent text-sm py-2 outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
                                            value={newSubtaskTitle}
                                            onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
                                        />
                                        <button 
                                            disabled={!newSubtaskTitle.trim()}
                                            onClick={addSubtask}
                                            className="text-xs font-medium text-indigo-600 dark:text-indigo-400 disabled:opacity-50"
                                        >
                                            Adicionar
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                  </motion.div>

                  {/* Sidebar Column (Metadata & Activity) */}
                  <AnimatePresence initial={false}>
                      {isDetailsSidebarOpen && (
                          <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 320, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="bg-slate-50 dark:bg-slate-900/50 border-l border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col"
                          >
                                {/* Sidebar Header/Actions */}
                                <div className="p-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-white/50 dark:bg-slate-800/50">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-3">Propriedades</span>
                                    <div className="flex gap-1">
                                        <button 
                                            onClick={() => setIsDetailsSidebarOpen(false)}
                                            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md text-slate-500 dark:text-slate-400 transition-colors"
                                            title="Colapsar"
                                        >
                                            <PanelRightClose size={16} />
                                        </button>
                                        <button 
                                            onClick={() => setViewTask(null)}
                                            className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-md text-slate-400 hover:text-red-500 transition-colors"
                                            title="Fechar Modal"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6 overflow-y-auto flex-1 w-[320px]">
                                    <div className="space-y-6">
                                        
                                        {/* Dates */}
                                        <div className="space-y-3">
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Datas</h4>
                                            <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                                    <Calendar size={14} /> Criada
                                                </div>
                                                <span className="text-slate-700 dark:text-slate-200">15 Set</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                                    <Clock size={14} /> Prazo
                                                </div>
                                                <span className="text-red-500 font-medium">4 dias atrás</span>
                                            </div>
                                        </div>

                                        <hr className="border-slate-200 dark:border-slate-700" />

                                        {/* Tags */}
                                        <div className="space-y-3">
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Etiquetas</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {viewTask.tags.map(tag => (
                                                    <span key={tag} className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 text-xs rounded border border-indigo-100 dark:border-indigo-800">
                                                        {tag}
                                                    </span>
                                                ))}
                                                <button className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-400 text-xs rounded border border-dashed border-slate-300 dark:border-slate-500 transition-colors hover:bg-slate-200 dark:hover:bg-slate-600">+</button>
                                            </div>
                                        </div>

                                        <hr className="border-slate-200 dark:border-slate-700" />

                                        {/* Activity */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Atividade</h4>
                                            </div>
                                            <div className="space-y-4 relative">
                                                <div className="absolute left-3 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700"></div>
                                                
                                            </div>
                                            
                                            {/* Comment Input */}
                                            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                                <div className="flex gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs flex-shrink-0">CM</div>
                                                    <input type="text" placeholder="Escreva um comentário..." className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-indigo-300 dark:focus:border-indigo-600 rounded-lg px-3 py-1.5 text-xs outline-none text-slate-700 dark:text-slate-200 transition-all shadow-sm placeholder:text-slate-400" />
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                          </motion.div>
                      )}
                  </AnimatePresence>
              </div>
          )}
      </Modal>

    </motion.div>
  );
};

export default TaskBoard;