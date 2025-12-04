
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
    Zap, MessageSquare, User, Clock, Play, Save, Trash2, 
    AlertCircle, MessageCircle, ZoomIn, ZoomOut, RotateCcw, Hand, MousePointer2,
    Image as ImageIcon, Video, Code, Mail, FileText, Split, CheckSquare, Search, Copy, MoreVertical,
    ChevronLeft, Settings, Phone, Globe, Instagram, Send as SendIcon, Facebook, MousePointerClick, Flag
} from 'lucide-react';
import { clsx } from 'clsx';
import { useData } from '../contexts/DataContext';
import { NodeType, FlowNode, ChannelType } from '../types';

// --- GEOMETRY CONSTANTS ---
const NODE_WIDTH = 280;
const HEADER_HEIGHT = 48; 
const HANDLE_OFFSET_Y = 24; 
const ZOOM_STEP = 0.1;
const MIN_ZOOM = 0.4;
const MAX_ZOOM = 2.0;

// --- TYPES ---
interface Viewport {
    x: number;
    y: number;
    zoom: number;
}

const AutomationBuilder: React.FC = () => {
    const { flowNodes, flowConnections, setFlowNodes, addFlowNode, deleteFlowNode, addFlowConnection, deleteFlowConnection, updateFlowNode } = useData();
    
    // --- STATE ---
    const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
    const [isPanning, setIsPanning] = useState(false);
    
    // Interaction State
    const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
    const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 }); // World coordinates
    
    // Editor State
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [selectedChannel, setSelectedChannel] = useState<ChannelType>(ChannelType.WHATSAPP);

    const canvasRef = useRef<HTMLDivElement>(null);
    const dragStartRef = useRef<{ x: number, y: number } | null>(null);

    const selectedNode = flowNodes.find(n => n.id === selectedNodeId);

    // --- SIDEBAR DATA (RICH) ---
    const nodeCategories = {
        triggers: [
            { type: 'trigger', subType: 'manual', title: 'Manual', desc: 'Disparo manual', iconName: 'MousePointerClick' },
            { type: 'trigger', subType: 'keyword', title: 'Palavra-chave', desc: 'Ao receber texto', iconName: 'MessageCircle' },
            { type: 'trigger', subType: 'conversation_start', title: 'Início Conversa', desc: 'Novo contato', iconName: 'Flag' },
        ],
        bubbles: [
            { type: 'message', title: 'Texto', desc: 'Enviar mensagem', iconName: 'MessageSquare' },
            { type: 'image', title: 'Imagem', desc: 'Enviar imagem/gif', iconName: 'ImageIcon' },
            { type: 'video', title: 'Vídeo', desc: 'Enviar vídeo', iconName: 'Video' },
            { type: 'embed', title: 'Embed', desc: 'Conteúdo web', iconName: 'Code' },
        ],
        inputs: [
            { type: 'input_text', title: 'Texto', desc: 'Coletar resposta', iconName: 'FileText' },
            { type: 'input_email', title: 'Email', desc: 'Coletar email', iconName: 'Mail' },
            { type: 'input_phone', title: 'Telefone', desc: 'Coletar número', iconName: 'Phone' },
        ],
        logic: [
            { type: 'condition', title: 'Condição', desc: 'Ramificar fluxo', iconName: 'Split' },
            { type: 'wait', title: 'Esperar', desc: 'Delay no fluxo', iconName: 'Clock' },
            { type: 'agent_handoff', title: 'Humano', desc: 'Transferir p/ agente', iconName: 'User' },
        ],
        integrations: [
             { type: 'email_send', title: 'Enviar Email', desc: 'SMTP/API', iconName: 'Mail' },
             { type: 'webhook', title: 'Webhook', desc: 'HTTP Request', iconName: 'Zap' },
        ]
    };

    // --- HELPERS ---

    const getIcon = (name: string, size = 18) => {
        const props = { size };
        switch(name) {
            case 'MessageCircle': return <MessageCircle {...props} />;
            case 'Zap': return <Zap {...props} />;
            case 'MessageSquare': return <MessageSquare {...props} />;
            case 'User': return <User {...props} />;
            case 'Clock': return <Clock {...props} />;
            case 'AlertCircle': return <AlertCircle {...props} />;
            case 'ImageIcon': return <ImageIcon {...props} />;
            case 'Video': return <Video {...props} />;
            case 'Code': return <Code {...props} />;
            case 'Mail': return <Mail {...props} />;
            case 'FileText': return <FileText {...props} />;
            case 'Split': return <Split {...props} />;
            case 'CheckSquare': return <CheckSquare {...props} />;
            case 'Phone': return <Phone {...props} />;
            case 'MousePointerClick': return <MousePointerClick {...props} />;
            case 'Flag': return <Flag {...props} />;
            default: return <Zap {...props} />;
        }
    };

    const getChannelIcon = (type: ChannelType) => {
        switch(type) {
            case ChannelType.WHATSAPP: return <MessageCircle size={18} />;
            case ChannelType.INSTAGRAM: return <Instagram size={18} />;
            case ChannelType.FACEBOOK: return <Facebook size={18} />;
            case ChannelType.EMAIL: return <Mail size={18} />;
            case ChannelType.CHAT: return <Globe size={18} />;
            case ChannelType.TELEGRAM: return <SendIcon size={18} />;
            default: return <MessageSquare size={18} />;
        }
    };

    const screenToWorld = useCallback((screenX: number, screenY: number) => {
        if (!canvasRef.current) return { x: 0, y: 0 };
        const rect = canvasRef.current.getBoundingClientRect();
        return {
            x: (screenX - rect.left - viewport.x) / viewport.zoom,
            y: (screenY - rect.top - viewport.y) / viewport.zoom
        };
    }, [viewport]);

    // --- EVENT HANDLERS ---

    const handleCanvasMouseDown = (e: React.MouseEvent) => {
        // Allow selection of node by clicking canvas (deselect)
        if (e.target === e.currentTarget) {
            setSelectedNodeId(null);
        }

        if (e.button === 0 || e.button === 1) { 
            setIsPanning(true);
            dragStartRef.current = { x: e.clientX, y: e.clientY };
        }
    };

    const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
        e.stopPropagation();
        setDraggingNodeId(nodeId);
        setSelectedNodeId(nodeId); // Select node on click
    };

    const handleHandleMouseDown = (e: React.MouseEvent, nodeId: string) => {
        e.stopPropagation();
        setConnectingSourceId(nodeId);
        const worldPos = screenToWorld(e.clientX, e.clientY);
        setMousePos(worldPos);
    };

    // GLOBAL MOUSE HANDLERS
    useEffect(() => {
        const handleWindowMouseMove = (e: MouseEvent) => {
            const worldPos = screenToWorld(e.clientX, e.clientY);
            setMousePos(worldPos);

            if (isPanning && dragStartRef.current) {
                const dx = e.clientX - dragStartRef.current.x;
                const dy = e.clientY - dragStartRef.current.y;
                setViewport(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
                dragStartRef.current = { x: e.clientX, y: e.clientY };
            }

            if (draggingNodeId) {
                setFlowNodes(prev => prev.map(n => {
                    if (n.id === draggingNodeId) {
                        return {
                            ...n,
                            x: n.x + (e.movementX / viewport.zoom),
                            y: n.y + (e.movementY / viewport.zoom)
                        };
                    }
                    return n;
                }));
            }
        };

        const handleWindowMouseUp = (e: MouseEvent) => {
            if (isPanning) setIsPanning(false);
            if (draggingNodeId) setDraggingNodeId(null);
            if (connectingSourceId) setConnectingSourceId(null);
        };

        if (isPanning || draggingNodeId || connectingSourceId) {
            window.addEventListener('mousemove', handleWindowMouseMove);
            window.addEventListener('mouseup', handleWindowMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleWindowMouseMove);
            window.removeEventListener('mouseup', handleWindowMouseUp);
        };
    }, [isPanning, draggingNodeId, connectingSourceId, viewport, screenToWorld, setFlowNodes]);


    const handleHandleMouseUp = (e: React.MouseEvent, targetNodeId: string) => {
        e.stopPropagation();
        if (connectingSourceId && connectingSourceId !== targetNodeId) {
            const exists = flowConnections.find(c => c.from === connectingSourceId && c.to === targetNodeId);
            if (!exists) {
                addFlowConnection({
                    id: `c-${Date.now()}`,
                    from: connectingSourceId,
                    to: targetNodeId
                });
            }
        }
        setConnectingSourceId(null);
    };

    // Sidebar Drag & Drop
    const handleDragStartSidebar = (e: React.DragEvent, item: any) => {
        e.dataTransfer.setData('nodeData', JSON.stringify(item));
        e.dataTransfer.effectAllowed = 'copy';
    };

    const handleDropCanvas = (e: React.DragEvent) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('nodeData');
        if (!data) return;

        const item = JSON.parse(data);
        const worldPos = screenToWorld(e.clientX, e.clientY);

        const newNode: FlowNode = {
            id: `node-${Date.now()}`,
            type: item.type as NodeType,
            x: worldPos.x - (NODE_WIDTH / 2),
            y: worldPos.y - (HEADER_HEIGHT / 2),
            data: {
                title: item.title,
                description: item.desc,
                iconName: item.iconName,
                content: '',
                variable: '',
                url: ''
            }
        };
        addFlowNode(newNode);
        setSelectedNodeId(newNode.id); // Auto select new node
    };

    const zoomIn = () => setViewport(prev => ({ ...prev, zoom: Math.min(prev.zoom + ZOOM_STEP, MAX_ZOOM) }));
    const zoomOut = () => setViewport(prev => ({ ...prev, zoom: Math.max(prev.zoom - ZOOM_STEP, MIN_ZOOM) }));
    const zoomReset = () => setViewport({ x: 0, y: 0, zoom: 1 });

    const getBezierPath = (start: {x: number, y: number}, end: {x: number, y: number}) => {
        const dist = Math.abs(end.x - start.x);
        const controlOffset = Math.max(dist * 0.5, 50); 
        return `M ${start.x} ${start.y} C ${start.x + controlOffset} ${start.y}, ${end.x - controlOffset} ${end.y}, ${end.x} ${end.y}`;
    };

    // --- NODE STYLING ---

    const getNodeConfig = (type: NodeType) => {
        switch (type) {
            case 'trigger': return { color: 'slate', headerBg: 'bg-slate-800', text: 'text-white', icon: 'Zap', border: 'border-slate-800' };
            case 'message': return { color: 'blue', headerBg: 'bg-blue-600', text: 'text-white', icon: 'MessageSquare', border: 'border-blue-600' };
            case 'image': return { color: 'sky', headerBg: 'bg-sky-600', text: 'text-white', icon: 'ImageIcon', border: 'border-sky-600' };
            case 'video': return { color: 'sky', headerBg: 'bg-sky-700', text: 'text-white', icon: 'Video', border: 'border-sky-700' };
            case 'embed': return { color: 'indigo', headerBg: 'bg-indigo-600', text: 'text-white', icon: 'Code', border: 'border-indigo-600' };
            case 'input_text': 
            case 'input_email':
            case 'input_phone':
                return { color: 'orange', headerBg: 'bg-orange-500', text: 'text-white', icon: 'FileText', border: 'border-orange-500' };
            case 'email_send': return { color: 'pink', headerBg: 'bg-pink-600', text: 'text-white', icon: 'Mail', border: 'border-pink-600' };
            case 'condition': return { color: 'purple', headerBg: 'bg-purple-600', text: 'text-white', icon: 'Split', border: 'border-purple-600' };
            case 'wait': return { color: 'gray', headerBg: 'bg-slate-600', text: 'text-white', icon: 'Clock', border: 'border-slate-600' };
            case 'agent_handoff': return { color: 'rose', headerBg: 'bg-rose-600', text: 'text-white', icon: 'User', border: 'border-rose-600' };
            default: return { color: 'slate', headerBg: 'bg-slate-600', text: 'text-white', icon: 'Zap', border: 'border-slate-600' };
        }
    };

    const renderNodePreview = (node: FlowNode) => {
        if (node.type === 'message') {
            return (
                 <div className="p-3 text-sm text-slate-600 dark:text-slate-300 line-clamp-3">
                     {node.data.content || <span className="italic opacity-50">Sem conteúdo...</span>}
                 </div>
            );
        }
        if (node.type === 'image' && node.data.url) {
            return (
                <div className="p-0 overflow-hidden h-32 rounded-b-xl relative">
                    <img src={node.data.url} className="w-full h-full object-cover" alt="" />
                </div>
            )
        }
        return (
            <div className="p-3 text-xs text-slate-500 dark:text-slate-400">
                {node.data.description || 'Configurar este bloco'}
            </div>
        );
    };

    // --- SIDEBAR PANELS ---

    const renderToolbox = () => (
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {Object.entries(nodeCategories).map(([key, items]) => (
                <div key={key}>
                    <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-3 px-1">
                        {key === 'triggers' ? 'Gatilhos' : key === 'bubbles' ? 'Conteúdo' : key === 'inputs' ? 'Entradas' : key === 'logic' ? 'Lógica' : 'Integrações'}
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                        {items.map((item, idx) => (
                            <div 
                                key={idx}
                                draggable
                                onDragStart={(e) => handleDragStartSidebar(e, item)}
                                onClick={() => {
                                    const newNode = {
                                        id: `node-${Date.now()}`,
                                        type: item.type as NodeType,
                                        x: 100 - viewport.x + (flowNodes.length * 20),
                                        y: 100 - viewport.y + (flowNodes.length * 20),
                                        data: { title: item.title, description: item.desc, iconName: item.iconName, content: '' }
                                    };
                                    addFlowNode(newNode);
                                    setSelectedNodeId(newNode.id);
                                }}
                                className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-grab hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md transition-all group text-center hover:scale-[1.02]"
                            >
                                <div className="text-slate-500 dark:text-slate-400 group-hover:text-indigo-500 transition-colors">
                                    {getIcon(item.iconName, 20)}
                                </div>
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{item.title}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );

    const renderProperties = () => {
        if (!selectedNode) return null;
        
        const updateData = (key: string, value: any) => {
            updateFlowNode(selectedNode.id, { data: { ...selectedNode.data, [key]: value } });
        };

        return (
            <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-800">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50">
                    <button onClick={() => setSelectedNodeId(null)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500">
                        <ChevronLeft size={20} />
                    </button>
                    <span className="font-bold text-slate-800 dark:text-white text-sm">Editar {selectedNode.data.title}</span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-5">
                    {/* Common Fields */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Título do Bloco</label>
                        <input 
                            type="text" 
                            className="w-full text-sm border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={selectedNode.data.title}
                            onChange={(e) => updateData('title', e.target.value)}
                        />
                    </div>

                    {/* Specific Fields */}
                    {selectedNode.type === 'message' && (
                         <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Conteúdo da Mensagem</label>
                            <textarea 
                                className="w-full text-sm border border-slate-200 dark:border-slate-600 rounded-lg p-3 bg-white dark:bg-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none min-h-[120px]"
                                placeholder="Olá! Como podemos ajudar?"
                                value={selectedNode.data.content || ''}
                                onChange={(e) => updateData('content', e.target.value)}
                            />
                            <div className="mt-2 text-xs text-slate-400">Você pode usar variáveis como {'{{nome}}'}.</div>
                        </div>
                    )}

                    {(selectedNode.type === 'image' || selectedNode.type === 'video') && (
                        <div>
                             <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">URL da Mídia</label>
                             <div className="flex gap-2 mb-2">
                                 <input 
                                    type="text" 
                                    className="flex-1 text-sm border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="https://exemplo.com/imagem.jpg"
                                    value={selectedNode.data.url || ''}
                                    onChange={(e) => updateData('url', e.target.value)}
                                />
                             </div>
                             {selectedNode.data.url && (
                                 <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 aspect-video bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                                     <img src={selectedNode.data.url} className="max-h-full" alt="Preview" />
                                 </div>
                             )}
                        </div>
                    )}

                    {selectedNode.type.startsWith('input_') && (
                        <>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Pergunta</label>
                                <input 
                                    type="text" 
                                    className="w-full text-sm border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="Ex: Qual seu email?"
                                    value={selectedNode.data.content || ''}
                                    onChange={(e) => updateData('content', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Salvar na Variável</label>
                                <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-2">
                                    <span className="text-slate-400 text-sm">@</span>
                                    <input 
                                        type="text"
                                        className="w-full text-sm bg-transparent border-none p-2.5 focus:ring-0 outline-none text-slate-700 dark:text-slate-200"
                                        placeholder="email_cliente"
                                        value={selectedNode.data.variable || ''}
                                        onChange={(e) => updateData('variable', e.target.value)}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {selectedNode.type === 'condition' && (
                        <div>
                             <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-200">
                                 A lógica de condição será implementada na próxima versão. Por enquanto, use este bloco para representar visualmente uma decisão.
                             </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                    <button 
                        onClick={() => {
                             deleteFlowNode(selectedNode.id);
                             setSelectedNodeId(null);
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                        <Trash2 size={16} /> Excluir Bloco
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-hidden">
            {/* Toolbar Header */}
            <div className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 z-20 flex-shrink-0 shadow-sm">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                            <Zap size={20} fill="currentColor" />
                        </div>
                        <div>
                            <h1 className="font-bold text-slate-800 dark:text-white text-base leading-tight">Fluxo de Atendimento</h1>
                            <p className="text-xs text-slate-400">Edição Automática</p>
                        </div>
                    </div>

                    {/* Channel Selector */}
                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>

                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/50 p-1 rounded-lg">
                        {[ChannelType.WHATSAPP, ChannelType.INSTAGRAM, ChannelType.CHAT, ChannelType.EMAIL].map(channel => (
                            <button
                                key={channel}
                                onClick={() => setSelectedChannel(channel)}
                                className={clsx(
                                    "p-2 rounded-md transition-all relative group",
                                    selectedChannel === channel 
                                        ? "bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm" 
                                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-600/50"
                                )}
                                title={channel}
                            >
                                {getChannelIcon(channel)}
                                {selectedChannel === channel && (
                                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400"></span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="text-xs text-slate-400 mr-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        Salvo automaticamente
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors border border-slate-200 dark:border-slate-600">
                        <Play size={16} /> Testar
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-slate-900 dark:bg-indigo-600 text-white hover:opacity-90 rounded-xl shadow-md transition-all transform hover:scale-105">
                        <Save size={16} /> Publicar
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Left Sidebar (Dual Mode: Toolbox / Properties) */}
                <div className="w-80 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col z-10 shadow-xl overflow-hidden transition-all duration-300 ease-in-out">
                    {selectedNodeId ? renderProperties() : (
                        <>
                            <div className="p-4 border-b border-slate-100 dark:border-slate-700">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                    <input type="text" placeholder="Buscar blocos..." className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-800 dark:text-white transition-all" />
                                </div>
                            </div>
                            {renderToolbox()}
                        </>
                    )}
                </div>

                {/* Canvas */}
                <div 
                    ref={canvasRef}
                    className={clsx(
                        "flex-1 bg-slate-50 dark:bg-slate-900 relative overflow-hidden select-none",
                        isPanning ? "cursor-grabbing" : "cursor-grab"
                    )}
                    onMouseDown={handleCanvasMouseDown}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDropCanvas}
                >
                    {/* Dot Pattern Background */}
                    <div 
                        className="absolute inset-0 pointer-events-none opacity-[0.15] dark:opacity-[0.07] transition-transform duration-75 ease-out"
                        style={{
                            backgroundImage: 'radial-gradient(#64748b 1.5px, transparent 1.5px)',
                            backgroundSize: '24px 24px',
                            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
                            transformOrigin: '0 0'
                        }}
                    ></div>

                    {/* Viewport Container */}
                    <div 
                        className="absolute inset-0 origin-top-left transition-transform duration-75 ease-out"
                        style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})` }}
                    >
                        {/* Connections */}
                        <svg className="absolute inset-0 overflow-visible pointer-events-none" style={{ width: '100%', height: '100%' }}>
                            {flowConnections.map(conn => {
                                const source = flowNodes.find(n => n.id === conn.from);
                                const target = flowNodes.find(n => n.id === conn.to);
                                if (!source || !target) return null;

                                const start = { x: source.x + NODE_WIDTH, y: source.y + HANDLE_OFFSET_Y };
                                const end = { x: target.x, y: target.y + HANDLE_OFFSET_Y };

                                return (
                                    <g key={conn.id}>
                                        <path 
                                            d={getBezierPath(start, end)}
                                            strokeWidth="5" // Thicker stroke for better hover target
                                            fill="none"
                                            className="stroke-transparent hover:stroke-black/5 dark:hover:stroke-white/5 cursor-pointer pointer-events-auto"
                                            onClick={() => deleteFlowConnection(conn.id)}
                                        />
                                        <path 
                                            d={getBezierPath(start, end)}
                                            stroke="#94a3b8"
                                            strokeWidth="2"
                                            fill="none"
                                            className="dark:stroke-slate-600 pointer-events-none"
                                        />
                                    </g>
                                );
                            })}
                            
                            {/* Draft Connection */}
                            {connectingSourceId && (
                                <path 
                                    d={getBezierPath(
                                        { 
                                            x: (flowNodes.find(n => n.id === connectingSourceId)?.x || 0) + NODE_WIDTH, 
                                            y: (flowNodes.find(n => n.id === connectingSourceId)?.y || 0) + HANDLE_OFFSET_Y 
                                        },
                                        mousePos
                                    )}
                                    stroke="#6366f1"
                                    strokeWidth="2"
                                    strokeDasharray="5,5"
                                    fill="none"
                                />
                            )}
                        </svg>

                        {/* Nodes */}
                        {flowNodes.map(node => {
                            const styles = getNodeConfig(node.type);
                            const isSelected = selectedNodeId === node.id;

                            return (
                                <div
                                    key={node.id}
                                    style={{ 
                                        transform: `translate(${node.x}px, ${node.y}px)`,
                                        width: NODE_WIDTH
                                    }}
                                    className={clsx(
                                        "absolute rounded-2xl bg-white dark:bg-slate-800 transition-all flex flex-col group select-none",
                                        "border-2",
                                        isSelected 
                                            ? "border-indigo-500 dark:border-indigo-400 shadow-[0_10px_40px_-10px_rgba(99,102,241,0.3)] scale-[1.02] z-50" 
                                            : "border-transparent shadow-[0_2px_15px_-3px_rgba(0,0,0,0.1)] dark:shadow-[0_2px_15px_-3px_rgba(0,0,0,0.3)] z-10 hover:border-slate-300 dark:hover:border-slate-600",
                                        draggingNodeId === node.id ? "cursor-grabbing" : "cursor-grab"
                                    )}
                                    onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                                >
                                    {/* Node Header */}
                                    <div className={clsx("h-12 px-4 rounded-t-xl flex items-center gap-3", styles.headerBg, styles.text)}>
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            {getIcon(styles.icon, 16)}
                                            <span className="font-bold text-sm truncate">{node.data.title}</span>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-1 hover:bg-white/20 rounded transition-colors"><Copy size={12}/></button>
                                        </div>
                                    </div>

                                    {/* Node Content Preview */}
                                    <div className="bg-white dark:bg-slate-800 rounded-b-xl min-h-[40px]">
                                        {renderNodePreview(node)}
                                    </div>

                                    {/* Input Handle */}
                                    {node.type !== 'trigger' && (
                                        <div 
                                            className="absolute -left-3 top-6 w-6 h-6 rounded-full bg-white dark:bg-slate-700 border-[3px] border-slate-300 dark:border-slate-500 hover:border-indigo-500 hover:scale-125 transition-all z-20 shadow-sm flex items-center justify-center"
                                            onMouseUp={(e) => handleHandleMouseUp(e, node.id)}
                                        >
                                           <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                                        </div>
                                    )}

                                    {/* Output Handle */}
                                    <div 
                                        className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-white dark:bg-slate-700 border-[3px] border-slate-300 dark:border-slate-500 hover:border-indigo-500 hover:scale-125 transition-all z-20 shadow-sm flex items-center justify-center cursor-crosshair"
                                        onMouseDown={(e) => handleHandleMouseDown(e, node.id)}
                                    >
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Canvas Controls */}
                    <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl z-30">
                        <button onClick={zoomOut} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"><ZoomOut size={18}/></button>
                        <span className="text-xs font-mono w-12 text-center text-slate-600 dark:text-slate-400 font-medium select-none">{Math.round(viewport.zoom * 100)}%</span>
                        <button onClick={zoomIn} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"><ZoomIn size={18}/></button>
                        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                        <button onClick={zoomReset} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors" title="Resetar Visualização"><RotateCcw size={18}/></button>
                    </div>
                    
                    {/* Help Text */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 font-medium pointer-events-none select-none shadow-sm z-30">
                        Arraste blocos do menu lateral • Clique para editar
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AutomationBuilder;
