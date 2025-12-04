import React from 'react';

export enum ChannelType {
  WHATSAPP = 'WhatsApp',
  EMAIL = 'E-mail',
  CHAT = 'Chat Web',
  PHONE = 'Telefone',
  INSTAGRAM = 'Instagram',
  FACEBOOK = 'Facebook',
  PINTEREST = 'Pinterest',
  TWITTER = 'X (Twitter)',
  THREADS = 'Threads',
  TELEGRAM = 'Telegram',
  WEBHOOK = 'Webhook'
}

export enum TicketStatus {
  OPEN = 'Aberto',
  PENDING = 'Em andamento',
  WAITING = 'Aguardando cliente',
  RESOLVED = 'Resolvido',
  CLOSED = 'Fechado'
}

export enum TaskStatus {
  TODO = 'A Fazer',
  IN_PROGRESS = 'Em Progresso',
  REVIEW = 'Em Revisão',
  DONE = 'Concluído'
}

export enum Priority {
  LOW = 'Baixa',
  MEDIUM = 'Média',
  HIGH = 'Alta',
  URGENT = 'Urgente'
}

export enum EventType {
  MEETING = 'Reunião',
  CALL = 'Chamada',
  NOTE = 'Nota',
  EMAIL = 'Email'
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  role: 'agent' | 'admin' | 'customer';
  email?: string;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string; // ISO string
  isInternal?: boolean; // For internal notes
  attachments?: string[];
}

export interface Ticket {
  id: string; // e.g. T-001
  subject: string;
  description?: string;
  customer: User;
  channel: ChannelType;
  status: TicketStatus;
  priority: Priority;
  lastMessageAt: string;
  assignee?: User;
  messages: Message[];
  tags: string[];
  unreadCount: number;
  slaStatus?: 'ok' | 'attention' | 'overdue';
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string; // e.g. TASK-001
  title: string;
  status: TaskStatus;
  priority: Priority;
  tags: string[];
  assignees: User[];
  progress: number; // 0-100
  checklist: { total: number; completed: number };
  comments: number;
  attachments: number;
  dueDate?: string;
  project: string;
  subtasks?: Subtask[];
}

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string; // Optional if we use initials
  document?: string; // CPF/CNPJ
  primaryChannel: ChannelType;
  lastInteraction: string;
  tags: string[];
  rating: number; // 0.0 to 5.0
  company?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string; // ISO string
  end: string; // ISO string
  type: EventType;
  attendees: User[];
  status: 'scheduled' | 'completed' | 'cancelled';
  relatedTicketId?: string;
}

export interface DashboardStats {
  totalTickets: number;
  avgResponseTime: string;
  satisfactionScore: number;
  ticketsByChannel: { name: string; value: number; fill: string }[];
  ticketsByStatus: { name: string; value: number; fill: string }[];
}

// Flow Automation Types
export type NodeType = 'trigger' | 'message' | 'image' | 'video' | 'embed' | 'input_text' | 'input_email' | 'input_phone' | 'condition' | 'wait' | 'email_send' | 'agent_handoff' | 'webhook';

export interface FlowNode {
    id: string;
    type: NodeType;
    x: number;
    y: number;
    data: {
        title: string;
        description?: string;
        iconName?: string; // Helper for serialization
        // Dynamic fields
        content?: string;
        url?: string;
        variable?: string;
        placeholder?: string;
        options?: string[];
        subject?: string;
        to?: string;
        condition?: string;
        duration?: number;
    };
}

export interface FlowConnection {
    id: string;
    from: string;
    to: string;
}