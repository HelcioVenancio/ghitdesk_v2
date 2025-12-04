import React, { createContext, useContext, useState, useEffect } from 'react';
import { Ticket, Task, Contact, User, TicketStatus, Priority, ChannelType, TaskStatus, CalendarEvent, EventType, FlowNode, FlowConnection } from '../types';
import { MessageCircle, Clock } from 'lucide-react';

// --- INITIAL MOCK DATA ---

const MOCK_USERS: User[] = [
    { id: 'u1', name: 'Carlos Mendes', email: 'carlos@ghitdesk.com', role: 'agent', avatar: '' },
    { id: 'u2', name: 'Ana Beatriz', email: 'ana@ghitdesk.com', role: 'agent', avatar: '' },
    { id: 'u3', name: 'Roberto Silva', email: 'roberto@ghitdesk.com', role: 'agent', avatar: '' },
    { id: 'c1', name: 'Maria Silva', email: 'maria@client.com', role: 'customer', avatar: 'https://i.pravatar.cc/150?u=1' },
    { id: 'c2', name: 'Fernanda Alves', email: 'fernanda@client.com', role: 'customer', avatar: 'https://i.pravatar.cc/150?u=2' },
    { id: 'c3', name: 'Carla Ferreira', email: 'carla@client.com', role: 'customer', avatar: 'https://i.pravatar.cc/150?u=3' },
    { id: 'c4', name: 'João Santos', email: 'joao@client.com', role: 'customer', avatar: 'https://i.pravatar.cc/150?u=4' },
    { id: 'c5', name: 'Pedro Oliveira', email: 'pedro@client.com', role: 'customer', avatar: 'https://i.pravatar.cc/150?u=5' },
];

const INITIAL_TICKETS: Ticket[] = [
  {
    id: 'T-1024',
    channel: ChannelType.WHATSAPP,
    customer: MOCK_USERS.find(u => u.id === 'c1')!,
    subject: 'Problema com a entrega do pedido #12345',
    description: 'Cliente relata que o pedido #12345 consta como entregue no sistema, mas ela não recebeu nada na portaria. Solicita comprovante de entrega ou reembolso imediato.',
    status: TicketStatus.OPEN,
    priority: Priority.HIGH,
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    unreadCount: 3,
    tags: ['Alta', 'SLA Atenção'],
    slaStatus: 'attention',
    assignee: MOCK_USERS.find(u => u.id === 'u1'),
    messages: [
      { id: 'm1', senderId: 'c1', content: 'Olá, preciso de ajuda com meu pedido #12345. Não consigo acompanhar o status dele.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString() },
      { id: 'm2', senderId: 'u1', content: 'Olá Maria! Bom dia, em que posso ajudá-la?', timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
      { id: 'm3', senderId: 'c1', content: 'Preciso de ajuda com meu pedido #12345. Não consigo acompanhar o status dele.', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString() }
    ]
  },
  {
    id: 'T-1025',
    channel: ChannelType.CHAT,
    customer: MOCK_USERS.find(u => u.id === 'c2')!,
    subject: 'Dúvida funcionalidade relatórios',
    description: 'Cliente quer saber se é possível exportar os relatórios de vendas em formato PDF diretamente pelo dashboard ou se precisa de permissão de administrador.',
    status: TicketStatus.RESOLVED,
    priority: Priority.LOW,
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    unreadCount: 1,
    tags: ['Baixa', 'SLA OK'],
    slaStatus: 'ok',
    messages: [
        { id: 'm10', senderId: 'c2', content: 'Quando sai a nova funcionalidade de relatórios?', timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString() }
    ]
  },
  {
    id: 'T-1026',
    channel: ChannelType.WHATSAPP,
    customer: MOCK_USERS.find(u => u.id === 'c3')!,
    subject: 'Agradecimento',
    description: 'Cliente entrou em contato apenas para elogiar o atendimento recebido pelo agente Roberto no ticket anterior.',
    status: TicketStatus.RESOLVED,
    priority: Priority.LOW,
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 200).toISOString(),
    unreadCount: 0,
    tags: ['Baixa', 'SLA OK'],
    slaStatus: 'ok',
    messages: [
        { id: 'm20', senderId: 'c3', content: 'Obrigada pelo atendimento! Problema resolvido.', timestamp: new Date(Date.now() - 1000 * 60 * 200).toISOString() }
    ]
  },
  {
      id: 'T-1027',
      channel: ChannelType.EMAIL,
      customer: MOCK_USERS.find(u => u.id === 'c4')!,
      subject: 'Solicitação de cancelamento',
      description: 'Cliente deseja cancelar assinatura do plano Pro antes da renovação automática.',
      status: TicketStatus.PENDING,
      priority: Priority.MEDIUM,
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      unreadCount: 0,
      tags: ['cancelamento', 'assinatura'],
      slaStatus: 'ok',
      assignee: MOCK_USERS.find(u => u.id === 'u2'),
      messages: [{ id: 'm30', senderId: 'c4', content: 'Gostaria de cancelar minha assinatura.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() }]
  }
];

const INITIAL_TASKS: Task[] = [
  { 
      id: 'TASK-003', 
      title: 'Corrigir bug no filtro de tickets', 
      priority: Priority.URGENT, 
      tags: ['bug', 'tickets'], 
      checklist: {completed: 0, total: 3}, 
      comments: 1, 
      dueDate: 'em cerca de 11 horas', 
      project: 'GhitDesk Core', 
      status: TaskStatus.TODO, 
      progress: 0, 
      assignees: [], 
      attachments: 0,
      subtasks: [
          { id: 'st1', title: 'Reproduzir erro em ambiente local', completed: false },
          { id: 'st2', title: 'Investigar logs do servidor', completed: false },
          { id: 'st3', title: 'Aplicar correção e criar PR', completed: false }
      ]
  },
  { 
      id: 'TASK-006', 
      title: 'Implementar busca global', 
      priority: Priority.MEDIUM, 
      tags: ['feature', 'busca'], 
      checklist: {completed: 0, total: 0}, 
      comments: 0, 
      dueDate: 'em 7 dias', 
      project: 'GhitDesk Core', 
      status: TaskStatus.TODO, 
      progress: 0, 
      assignees: [], 
      attachments: 0,
      subtasks: []
  },
  { 
      id: 'TASK-001', 
      title: 'Implementar autenticação com 2FA', 
      priority: Priority.HIGH, 
      tags: ['desenvolvimento', 'segurança'], 
      checklist: {completed: 2, total: 3}, 
      comments: 2, 
      dueDate: 'em 2 dias', 
      project: 'GhitDesk Core', 
      status: TaskStatus.IN_PROGRESS, 
      progress: 66, 
      assignees: [], 
      attachments: 2,
      subtasks: [
          { id: 'st1', title: 'Configurar Google Authenticator', completed: true },
          { id: 'st2', title: 'Criar tela de verificação de código', completed: true },
          { id: 'st3', title: 'Escrever testes unitários', completed: false }
      ]
  },
  { 
      id: 'TASK-004', 
      title: 'Design do dashboard v2', 
      priority: Priority.MEDIUM, 
      tags: ['design', 'ui/ux'], 
      checklist: {completed: 1, total: 3}, 
      comments: 2, 
      dueDate: 'em 5 dias', 
      project: 'GhitDesk UI', 
      status: TaskStatus.IN_PROGRESS, 
      progress: 33, 
      assignees: [], 
      attachments: 1,
      subtasks: [
          { id: 'st1', title: 'Criar wireframes de baixa fidelidade', completed: true },
          { id: 'st2', title: 'Definir paleta de cores acessível', completed: false },
          { id: 'st3', title: 'Prototipar interações no Figma', completed: false }
      ]
  },
  { 
      id: 'TASK-002', 
      title: 'Revisar documentação da API', 
      priority: Priority.MEDIUM, 
      tags: ['documentação'], 
      checklist: {completed: 2, total: 3}, 
      comments: 0, 
      dueDate: 'em cerca de 23 horas', 
      project: 'GhitDesk Core', 
      status: TaskStatus.REVIEW, 
      progress: 70, 
      assignees: [], 
      attachments: 0,
      subtasks: [
          { id: 'st1', title: 'Atualizar endpoints de Usuários', completed: true },
          { id: 'st2', title: 'Documentar novos webhooks', completed: true },
          { id: 'st3', title: 'Revisar exemplos de request/response', completed: false }
      ]
  },
  { 
      id: 'TASK-005', 
      title: 'Configurar CI/CD', 
      priority: Priority.HIGH, 
      tags: ['devops', 'infraestrutura'], 
      checklist: {completed: 3, total: 3}, 
      comments: 0, 
      dueDate: 'há 2 dias', 
      project: 'GhitDesk Core', 
      status: TaskStatus.DONE, 
      progress: 100, 
      assignees: [], 
      attachments: 0,
      subtasks: [
          { id: 'st1', title: 'Configurar GitHub Actions', completed: true },
          { id: 'st2', title: 'Criar pipeline de build', completed: true },
          { id: 'st3', title: 'Automatizar deploy em produção', completed: true }
      ]
  },
];

const INITIAL_CONTACTS: Contact[] = [
    { id: 'c1', name: 'Maria Silva', email: 'maria@client.com', phone: '+55 11 99999-1234', document: '123.456.789-00', primaryChannel: ChannelType.WHATSAPP, lastInteraction: 'Há 5 min', tags: ['vip', 'recorrente'], rating: 4.8 },
    { id: 'c4', name: 'João Santos', email: 'joao@client.com', phone: '+55 11 98888-2345', document: '987.654.321-00', primaryChannel: ChannelType.EMAIL, lastInteraction: 'Há 2 dias', tags: ['empresarial'], rating: 4.2 },
    { id: 'c5', name: 'Pedro Oliveira', email: 'pedro@client.com', phone: '+55 11 97777-1111', document: '456.789.123-00', primaryChannel: ChannelType.CHAT, lastInteraction: 'Há 1 dia', tags: ['técnico'], rating: 3.8 },
    { id: 'c3', name: 'Carla Ferreira', email: 'carla@client.com', phone: '+55 11 97777-9999', document: '321.654.987-00', primaryChannel: ChannelType.WHATSAPP, lastInteraction: 'Há 4 horas', tags: ['startup', 'satisfeita'], rating: 4.9 },
];

const INITIAL_EVENTS: CalendarEvent[] = [
    {
        id: 'ev-1',
        title: 'Reunião Mensal de Resultados',
        description: 'Apresentação dos KPIs de vendas e suporte.',
        start: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // Tomorrow
        end: new Date(Date.now() + 1000 * 60 * 60 * 25).toISOString(),
        type: EventType.MEETING,
        attendees: [MOCK_USERS[0], MOCK_USERS[1]],
        status: 'scheduled'
    },
    {
        id: 'ev-2',
        title: 'Onboarding Cliente Maria Silva',
        description: 'Configuração inicial da conta.',
        start: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
        end: new Date(Date.now() - 1000 * 60 * 60 * 47).toISOString(),
        type: EventType.MEETING,
        attendees: [MOCK_USERS[0], MOCK_USERS[3]],
        status: 'completed',
        relatedTicketId: 'T-1024'
    }
];

const INITIAL_FLOW_NODES: FlowNode[] = [
    {
        id: 'start-1',
        type: 'trigger',
        x: 100,
        y: 100,
        data: {
            title: 'Mensagem Recebida',
            description: 'Quando um cliente envia msg',
            iconName: 'MessageCircle'
        }
    },
    {
        id: 'cond-1',
        type: 'condition',
        x: 400,
        y: 100,
        data: {
            title: 'Horário Comercial?',
            description: 'Verificar horário',
            iconName: 'Clock'
        }
    }
];

const INITIAL_FLOW_CONNECTIONS: FlowConnection[] = [
    { id: 'c1', from: 'start-1', to: 'cond-1' }
];

// --- CONTEXT DEFINITION ---

interface DataContextType {
    tickets: Ticket[];
    tasks: Task[];
    contacts: Contact[];
    events: CalendarEvent[];
    users: User[];
    currentUser: User;
    flowNodes: FlowNode[];
    flowConnections: FlowConnection[];
    
    addTicket: (ticket: Ticket) => void;
    updateTicket: (id: string, updates: Partial<Ticket>) => void;
    deleteTicket: (id: string) => void;
    
    addTask: (task: Task) => void;
    updateTask: (id: string, updates: Partial<Task>) => void;
    deleteTask: (id: string) => void;
    
    addContact: (contact: Contact) => void;
    updateContact: (id: string, updates: Partial<Contact>) => void;
    
    addEvent: (event: CalendarEvent) => void;
    updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
    deleteEvent: (id: string) => void;
    
    addUser: (user: User) => void;

    // Flow Methods
    addFlowNode: (node: FlowNode) => void;
    updateFlowNode: (id: string, updates: Partial<FlowNode>) => void;
    deleteFlowNode: (id: string) => void;
    addFlowConnection: (connection: FlowConnection) => void;
    deleteFlowConnection: (id: string) => void;
    setFlowNodes: (nodes: FlowNode[]) => void; // For mass updates (dragging)
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
    const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
    const [contacts, setContacts] = useState<Contact[]>(INITIAL_CONTACTS);
    const [events, setEvents] = useState<CalendarEvent[]>(INITIAL_EVENTS);
    const [users, setUsers] = useState<User[]>(MOCK_USERS);
    const [flowNodes, setFlowNodes] = useState<FlowNode[]>(INITIAL_FLOW_NODES);
    const [flowConnections, setFlowConnections] = useState<FlowConnection[]>(INITIAL_FLOW_CONNECTIONS);
    
    // Simulating logged in user
    const currentUser = MOCK_USERS[0];

    // Load from LocalStorage on mount
    useEffect(() => {
        const storedTickets = localStorage.getItem('ghitdesk_tickets');
        const storedTasks = localStorage.getItem('ghitdesk_tasks');
        const storedContacts = localStorage.getItem('ghitdesk_contacts');
        const storedEvents = localStorage.getItem('ghitdesk_events');
        const storedUsers = localStorage.getItem('ghitdesk_users');
        const storedFlowNodes = localStorage.getItem('ghitdesk_flow_nodes');
        const storedFlowConnections = localStorage.getItem('ghitdesk_flow_connections');

        if (storedTickets) setTickets(JSON.parse(storedTickets));
        if (storedTasks) setTasks(JSON.parse(storedTasks));
        if (storedContacts) setContacts(JSON.parse(storedContacts));
        if (storedEvents) setEvents(JSON.parse(storedEvents));
        if (storedUsers) setUsers(JSON.parse(storedUsers));
        if (storedFlowNodes) setFlowNodes(JSON.parse(storedFlowNodes));
        if (storedFlowConnections) setFlowConnections(JSON.parse(storedFlowConnections));
    }, []);

    // Save to LocalStorage whenever state changes
    useEffect(() => { localStorage.setItem('ghitdesk_tickets', JSON.stringify(tickets)); }, [tickets]);
    useEffect(() => { localStorage.setItem('ghitdesk_tasks', JSON.stringify(tasks)); }, [tasks]);
    useEffect(() => { localStorage.setItem('ghitdesk_contacts', JSON.stringify(contacts)); }, [contacts]);
    useEffect(() => { localStorage.setItem('ghitdesk_events', JSON.stringify(events)); }, [events]);
    useEffect(() => { localStorage.setItem('ghitdesk_users', JSON.stringify(users)); }, [users]);
    useEffect(() => { localStorage.setItem('ghitdesk_flow_nodes', JSON.stringify(flowNodes)); }, [flowNodes]);
    useEffect(() => { localStorage.setItem('ghitdesk_flow_connections', JSON.stringify(flowConnections)); }, [flowConnections]);

    // Actions
    const addTicket = (ticket: Ticket) => setTickets(prev => [ticket, ...prev]);
    const updateTicket = (id: string, updates: Partial<Ticket>) => {
        setTickets(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    };
    const deleteTicket = (id: string) => setTickets(prev => prev.filter(t => t.id !== id));

    const addTask = (task: Task) => setTasks(prev => [task, ...prev]);
    const updateTask = (id: string, updates: Partial<Task>) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    };
    const deleteTask = (id: string) => setTasks(prev => prev.filter(t => t.id !== id));

    const addContact = (contact: Contact) => setContacts(prev => [contact, ...prev]);
    const updateContact = (id: string, updates: Partial<Contact>) => {
        setContacts(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    };

    const addEvent = (event: CalendarEvent) => setEvents(prev => [...prev, event]);
    const updateEvent = (id: string, updates: Partial<CalendarEvent>) => {
        setEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    };
    const deleteEvent = (id: string) => setEvents(prev => prev.filter(e => e.id !== id));

    const addUser = (user: User) => setUsers(prev => [...prev, user]);

    // Flow Actions
    const addFlowNode = (node: FlowNode) => setFlowNodes(prev => [...prev, node]);
    const updateFlowNode = (id: string, updates: Partial<FlowNode>) => {
        setFlowNodes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
    };
    const deleteFlowNode = (id: string) => {
        setFlowNodes(prev => prev.filter(n => n.id !== id));
        setFlowConnections(prev => prev.filter(c => c.from !== id && c.to !== id));
    };
    const addFlowConnection = (connection: FlowConnection) => setFlowConnections(prev => [...prev, connection]);
    const deleteFlowConnection = (id: string) => setFlowConnections(prev => prev.filter(c => c.id !== id));

    return (
        <DataContext.Provider value={{
            tickets, tasks, contacts, events, users, currentUser,
            flowNodes, flowConnections,
            addTicket, updateTicket, deleteTicket,
            addTask, updateTask, deleteTask,
            addContact, updateContact,
            addEvent, updateEvent, deleteEvent,
            addUser,
            addFlowNode, updateFlowNode, deleteFlowNode,
            addFlowConnection, deleteFlowConnection, setFlowNodes
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};