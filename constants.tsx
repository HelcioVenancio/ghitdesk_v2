import React from 'react';
import { Phone, MessageCircle, Mail, MessagesSquare, Facebook, Instagram, Hexagon, Twitter, Send, AtSign, Pin, Webhook } from 'lucide-react';
import { ChannelType, Priority, TicketStatus } from './types';

export const CHANNEL_ICONS: Record<ChannelType, React.ReactNode> = {
  [ChannelType.WHATSAPP]: <MessageCircle className="text-green-500" size={18} />,
  [ChannelType.EMAIL]: <Mail className="text-blue-500" size={18} />,
  [ChannelType.CHAT]: <MessagesSquare className="text-indigo-500" size={18} />,
  [ChannelType.PHONE]: <Phone className="text-orange-500" size={18} />,
  [ChannelType.INSTAGRAM]: <Instagram className="text-pink-500" size={18} />,
  [ChannelType.FACEBOOK]: <Facebook className="text-blue-600" size={18} />,
  [ChannelType.PINTEREST]: <Pin className="text-red-600" size={18} />,
  [ChannelType.TWITTER]: <Twitter className="text-slate-800" size={18} />,
  [ChannelType.THREADS]: <AtSign className="text-slate-900" size={18} />,
  [ChannelType.TELEGRAM]: <Send className="text-sky-500" size={18} />,
  [ChannelType.WEBHOOK]: <Webhook className="text-orange-600" size={18} />,
};

export const STATUS_COLORS: Record<TicketStatus, string> = {
  [TicketStatus.OPEN]: 'bg-red-100 text-red-700 border-red-200',
  [TicketStatus.PENDING]: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  [TicketStatus.WAITING]: 'bg-orange-100 text-orange-700 border-orange-200',
  [TicketStatus.RESOLVED]: 'bg-green-100 text-green-700 border-green-200',
  [TicketStatus.CLOSED]: 'bg-slate-100 text-slate-700 border-slate-200',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  [Priority.LOW]: 'text-slate-500',
  [Priority.MEDIUM]: 'text-blue-500',
  [Priority.HIGH]: 'text-orange-500',
  [Priority.URGENT]: 'text-red-500 font-bold',
};