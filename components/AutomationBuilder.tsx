
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
    Zap, MessageSquare, User, Clock, ArrowRight, Play, Save, Plus, Trash2, 
    AlertCircle, MessageCircle, Edit2, ZoomIn, ZoomOut, RotateCcw, Hand, MousePointer2
} from 'lucide-react';
import { clsx } from 'clsx';
import { useData } from '../contexts/DataContext';
import { NodeType, FlowNode } from '../types';
import Modal from './Modal';

// --- GEOMETRY CONSTANTS ---
const NODE_WIDTH = 280;
const HEADER_HEIGHT = 72; 
const HANDLE_OFFSET_Y = 54; // Vertical center of the header content
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
    
    // Viewport (Pan & Zoom)
    const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
    const [isPanning, setIsPanning] = useState(false);
    
    // Interaction State
    const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
    const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 }); // World coordinates (relative to canvas origin)
    
    // Edit Modal
    const [editingNode, setEditingNode] = useState<FlowNode | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDesc, setEditDesc] = useState('');

    const canvasRef = useRef<HTMLDivElement>(null);
    const dragStartRef = useRef<{ x: number, y: number } | null>(null); // For accurate delta calculation

    // --- SIDEBAR DATA ---
    const nodeCategories = {
        triggers: [
            { type: 'trigger', title: 'Mensagem Recebida', desc: 'Inicia com nova msg', iconName: 'MessageCircle' },
            { type: 'trigger', title: 'Ticket Criado', desc: 'Inicia com novo ticket', iconName: 'Zap' },
        ],
        actions: [
            { type: 'action', title: 'Enviar Mensagem', desc: 'Responde ao cliente', iconName: 'MessageSquare' },
            { type: 'action', title: 'Atribuir Agente', desc: 'Define responsável', iconName: 'User' },
        ],
        conditions: [
            { type: 'condition', title: 'Horário Comercial', desc: 'Verifica hora', iconName: 'Clock' },
            { type: 'condition', title: 'Palavra-chave', desc: 'Contém termo', iconName: 'AlertCircle' },
        ]
    };

    // --- HELPERS ---

    const getIcon = (name: string, size = 18) => {
        switch(name) {
            case 'MessageCircle': return <MessageCircle size={size} />;
            case 'Zap': return <Zap size={size} />;
            case 'MessageSquare': return <MessageSquare size={size} />;
            case 'User': return <User size={size} />;
            case 'Clock': return <Clock size={size} />;
            case 'AlertCircle': return <AlertCircle size={size} />;
            default: return <Zap size={size} />;
        }
    };

    // Transform Screen Coordinates to World Coordinates
    const screenToWorld = useCallback((screenX: number, screenY: number) => {
        if (!canvasRef.current) return { x: 0, y: 0 };
        const rect = canvasRef.current.getBoundingClientRect();
        return {
            x: (screenX - rect.left - viewport.x) / viewport.zoom,
            y: (screenY - rect.top - viewport.y) / viewport.zoom
        };
    }, [viewport]);

    // --- EVENT HANDLERS ---

    // 1. Panning Logic
    const handleCanvasMouseDown = (e: React.MouseEvent) => {
        // Only pan if clicking purely on the background (not bubbling from a node)
        if (e.button === 0 || e.button === 1) { // Left or Middle click
            setIsPanning(true);
            dragStartRef.current = { x: e.clientX, y: e.clientY };
        }
    };

    // 2. Node Dragging Logic
    const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
        e.stopPropagation(); // Stop propagation to canvas (prevent panning)
        setDraggingNodeId(nodeId);
        // We don't use dragStartRef for nodes here because we calculate delta in the global move handler relative to previous mouse pos
        // But to prevent "jumping", we could store an offset. simplified here for robustness.
    };

    // 3. Connection Logic
    const handleHandleMouseDown = (e: React.MouseEvent, nodeId: string) => {
        e.stopPropagation();
        setConnectingSourceId(nodeId);
        const worldPos = screenToWorld(e.clientX, e.clientY);
        setMousePos(worldPos);
    };

    // GLOBAL MOUSE HANDLERS (The Fix for "Stuck" Nodes)
    useEffect(() => {
        const handleWindowMouseMove = (e: MouseEvent) => {
            // Update Mouse Pos in World Coords (for connection line drawing)
            const worldPos = screenToWorld(e.clientX, e.clientY);
            setMousePos(worldPos);

            // Handle Panning
            if (isPanning && dragStartRef.current) {
                const dx = e.clientX - dragStartRef.current.x;
                const dy = e.clientY - dragStartRef.current.y;
                setViewport(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
                dragStartRef.current = { x: e.clientX, y: e.clientY };
            }

            // Handle Node Dragging
            if (draggingNodeId) {
                // Determine delta movement in world coordinates
                // We need the movement since the last frame.
                // Since we don't track "lastFrameMouse", we use movementX/Y but scaled
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
            
            // Connection Finalization
            if (connectingSourceId) {
                // Logic to check if we dropped on a valid target handle
                // This is a bit tricky with global listener. 
                // We rely on the MouseUp on the target handle (see handleHandleMouseUp)
                // If we are here, it means we dropped on "nothing" or the canvas.
                setConnectingSourceId(null);
            }
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
            // Create connection
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

    // Sidebar Drag & Drop (HTML5 API)
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
                iconName: item.iconName
            }
        };
        addFlowNode(newNode);
    };

    // Zoom Controls
    const zoomIn = () => setViewport(prev => ({ ...prev, zoom: Math.min(prev.zoom + ZOOM_STEP, MAX_ZOOM) }));
    const zoomOut = () => setViewport(prev => ({ ...prev, zoom: Math.max(prev.zoom - ZOOM_STEP, MIN_ZOOM) }));
    const zoomReset = () => setViewport({ x: 0, y: 0, zoom: 1 });

    // --- RENDER HELPERS ---

    const getBezierPath = (start: {x: number, y: number}, end: {x: number, y: number}) => {
        const dist = Math.abs(end.x - start.x);
        const controlOffset = Math.max(dist * 0.5, 50); // Minimum curve
        return `M ${start.x} ${start.y} C ${start.x + controlOffset} ${start.y}, ${end.x - controlOffset} ${end.y}, ${end.x} ${end.y}`;
    };

    const getNodeStyles = (type: NodeType) => {
        switch (type) {
            case 'trigger': return {
                border: 'border-emerald-500',
                bg: 'bg-white dark:bg-slate-800',
                header: 'bg-emerald-50/50 dark:bg-emerald-900/20',
                iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
                handle: 'border-emerald-500 hover:bg-emerald-500'
            };
            case 'action': return {
                border: 'border-indigo-500',
                bg: 'bg-white dark:bg-slate-800',
                header: 'bg-indigo-50/50 dark:bg-indigo-900/20',
                iconBg: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400',
                handle: 'border-indigo-500 hover:bg-indigo-500'
            };
            case 'condition': return {
                border: 'border-amber-500',
                bg: 'bg-white dark:bg-slate-800',
                header: 'bg-amber-50/50 dark:bg-amber-900/20',
                iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
                handle: 'border-amber-500 hover:bg-amber-500'
            };
            default: return { border: 'border-slate-400', bg: 'bg-white', header: 'bg-slate-100', iconBg: 'bg-slate-200', handle: 'border-slate-400' };
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-hidden">
            {/* Toolbar Header */}
            <div className="h-14 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 z-10 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400">
                        <Zap size={20} />
                    </div>
                    <h1 className="font-bold text-slate-800 dark:text-white">Construtor de Fluxo</h1>
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                        <Play size={16} /> Testar
                    </button>
                    <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg shadow-sm transition-colors">
                        <Save size={16} /> Salvar
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Sidebar */}
                <div className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col z-10 shadow-lg">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-700">
                        <button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-2.5 rounded-lg font-medium text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2">
                            <Zap size={16} fill="currentColor" /> Criar com IA
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        {Object.entries(nodeCategories).map(([key, items]) => (
                            <div key={key}>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">{key === 'triggers' ? 'Gatilhos' : key === 'actions' ? 'Ações' : 'Condições'}</h3>
                                <div className="space-y-2">
                                    {items.map((item, idx) => (
                                        <div 
                                            key={idx}
                                            draggable
                                            onDragStart={(e) => handleDragStartSidebar(e, item)}
                                            onClick={() => {
                                                addFlowNode({
                                                    id: `node-${Date.now()}`,
                                                    type: item.type as NodeType,
                                                    x: 100 - viewport.x + (flowNodes.length * 20),
                                                    y: 100 - viewport.y + (flowNodes.length * 20),
                                                    data: { title: item.title, description: item.desc, iconName: item.iconName }
                                                });
                                            }}
                                            className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-grab hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md transition-all group"
                                        >
                                            <div className={clsx("p-2 rounded-lg", item.type === 'trigger' ? "bg-emerald-100 text-emerald-600" : item.type === 'action' ? "bg-indigo-100 text-indigo-600" : "bg-amber-100 text-amber-600")}>
                                                {getIcon(item.iconName, 16)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-sm text-slate-800 dark:text-slate-200 truncate">{item.title}</div>
                                                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{item.desc}</div>
                                            </div>
                                            <Plus size={16} className="text-slate-300 group-hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
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
                    {/* Background Pattern */}
                    <div 
                        className="absolute inset-0 pointer-events-none opacity-10 dark:opacity-5 transition-transform duration-75 ease-out"
                        style={{
                            backgroundImage: 'radial-gradient(#64748b 2px, transparent 2px)',
                            backgroundSize: '30px 30px',
                            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
                            transformOrigin: '0 0'
                        }}
                    ></div>

                    {/* Viewport Container */}
                    <div 
                        className="absolute inset-0 origin-top-left transition-transform duration-75 ease-out"
                        style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})` }}
                    >
                        {/* Connections Layer (SVG) */}
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
                                            stroke="#94a3b8"
                                            strokeWidth="3"
                                            fill="none"
                                            className="dark:stroke-slate-600 transition-colors hover:stroke-indigo-500 cursor-pointer pointer-events-auto"
                                            onClick={() => deleteFlowConnection(conn.id)}
                                        />
                                        {/* Optional Arrow or delete handle */}
                                        <circle 
                                            cx={start.x + (end.x - start.x)/2} 
                                            cy={start.y + (end.y - start.y)/2} 
                                            r="8" 
                                            className="fill-slate-300 dark:fill-slate-600 hover:fill-red-500 cursor-pointer pointer-events-auto transition-colors"
                                            onClick={() => deleteFlowConnection(conn.id)}
                                        />
                                        <text x={start.x + (end.x - start.x)/2} y={start.y + (end.y - start.y)/2} dy={3} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" className="pointer-events-none">×</text>
                                    </g>
                                );
                            })}
                            
                            {/* Draft Connection Line */}
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
                                    strokeWidth="3"
                                    strokeDasharray="5,5"
                                    fill="none"
                                />
                            )}
                        </svg>

                        {/* Nodes Layer */}
                        {flowNodes.map(node => {
                            const styles = getNodeStyles(node.type);
                            return (
                                <div
                                    key={node.id}
                                    style={{ 
                                        transform: `translate(${node.x}px, ${node.y}px)`,
                                        width: NODE_WIDTH
                                    }}
                                    className={clsx(
                                        "absolute rounded-2xl border-2 shadow-sm transition-shadow flex flex-col group select-none",
                                        styles.bg, styles.border,
                                        draggingNodeId === node.id ? "z-50 shadow-2xl scale-[1.02] cursor-grabbing" : "z-10 hover:shadow-lg cursor-grab"
                                    )}
                                    onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                                    onDoubleClick={(e) => {
                                        e.stopPropagation();
                                        setEditingNode(node);
                                        setEditTitle(node.data.title);
                                        setEditDesc(node.data.description);
                                    }}
                                >
                                    {/* Header */}
                                    <div className={clsx("h-[72px] px-4 rounded-t-xl flex items-center gap-4 border-b border-black/5 dark:border-white/5", styles.header)}>
                                        <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center shadow-sm", styles.iconBg)}>
                                            {getIcon(node.data.iconName || 'Zap', 20)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-[10px] font-bold uppercase opacity-60 tracking-wider block mb-0.5">
                                                {node.type === 'trigger' ? 'Gatilho' : node.type === 'action' ? 'Ação' : 'Condição'}
                                            </span>
                                            <span className="font-bold text-sm text-slate-800 dark:text-white truncate block">{node.data.title}</span>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => deleteFlowNode(node.id)} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded"><Trash2 size={14} /></button>
                                        </div>
                                    </div>

                                    {/* Body */}
                                    <div className="p-4 min-h-[60px]">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{node.data.description}</p>
                                    </div>

                                    {/* Handles */}
                                    {/* Input (Left) */}
                                    {node.type !== 'trigger' && (
                                        <div 
                                            className={clsx(
                                                "absolute -left-3 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border-4 cursor-crosshair hover:scale-125 transition-transform z-20 shadow-sm",
                                                styles.handle
                                            )}
                                            style={{ top: HANDLE_OFFSET_Y - 12 }} // Center vertically relative to header center
                                            onMouseUp={(e) => handleHandleMouseUp(e, node.id)}
                                        />
                                    )}

                                    {/* Output (Right) */}
                                    <div 
                                        className={clsx(
                                            "absolute -right-3 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border-4 cursor-crosshair hover:scale-125 transition-transform z-20 shadow-sm",
                                            styles.handle
                                        )}
                                        style={{ top: HANDLE_OFFSET_Y - 12 }}
                                        onMouseDown={(e) => handleHandleMouseDown(e, node.id)}
                                    />
                                </div>
                            );
                        })}
                    </div>

                    {/* Canvas Controls */}
                    <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg">
                        <button onClick={zoomOut} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300"><ZoomOut size={18}/></button>
                        <span className="text-xs font-mono w-12 text-center text-slate-600 dark:text-slate-400">{Math.round(viewport.zoom * 100)}%</span>
                        <button onClick={zoomIn} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300"><ZoomIn size={18}/></button>
                        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                        <button onClick={zoomReset} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300" title="Reset"><RotateCcw size={18}/></button>
                    </div>
                    
                    {/* Instructions */}
                    <div className="absolute top-4 right-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] text-slate-500 dark:text-slate-400 shadow-sm">
                        <div className="flex items-center gap-2 mb-1"><MousePointer2 size={12}/> Arraste para mover</div>
                        <div className="flex items-center gap-2"><Hand size={12}/> Clique e arraste fundo para navegar</div>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            <Modal
                isOpen={!!editingNode}
                onClose={() => setEditingNode(null)}
                title="Editar Nó"
                footer={
                    <button 
                        onClick={() => {
                            if(editingNode) {
                                updateFlowNode(editingNode.id, { data: { ...editingNode.data, title: editTitle, description: editDesc }});
                                setEditingNode(null);
                            }
                        }} 
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                    >
                        Salvar
                    </button>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Título</label>
                        <input type="text" className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 dark:text-white rounded-lg text-sm" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição</label>
                        <textarea className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 dark:text-white rounded-lg text-sm h-24 resize-none" value={editDesc} onChange={e => setEditDesc(e.target.value)} />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AutomationBuilder;
