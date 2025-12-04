import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, Sparkles, MinusCircle } from 'lucide-react';
import { createChatSession } from '../services/geminiService';
import { Chat, GenerateContentResponse } from '@google/genai';
import { useData } from '../contexts/DataContext';
import { FlowNode, NodeType } from '../types';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

const AIChatbot: React.FC = () => {
  const { flowNodes, addFlowNode, deleteFlowNode, addFlowConnection } = useData();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !chatSessionRef.current) {
      const session = createChatSession();
      if (session) {
        chatSessionRef.current = session;
        setMessages([{ role: 'model', text: 'Olá! Sou o assistente IA do GhitDesk. Como posso ajudar você hoje?' }]);
      } else {
        setMessages([{ role: 'model', text: 'Erro: API Key não configurada. Verifique suas configurações.' }]);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleToolExecution = (functionCall: any) => {
      console.log('Executing Tool:', functionCall.name, functionCall.args);
      
      try {
        if (functionCall.name === 'create_flow_node') {
            const { type, title, description, x, y } = functionCall.args;
            const newNode: FlowNode = {
                id: `node-ai-${Date.now()}`,
                type: type as NodeType,
                x: x || 300,
                y: y || 300,
                data: {
                    title,
                    description,
                    iconName: type === 'trigger' ? 'Zap' : type === 'action' ? 'MessageSquare' : 'Clock'
                }
            };
            addFlowNode(newNode);
            return { result: "Node created successfully with ID: " + newNode.id };
        } 
        else if (functionCall.name === 'delete_flow_node') {
            const { identifier } = functionCall.args;
            // Fuzzy search for ID or Title
            const nodeToDelete = flowNodes.find(n => n.id === identifier || n.data.title.toLowerCase().includes(identifier.toLowerCase()));
            
            if (nodeToDelete) {
                deleteFlowNode(nodeToDelete.id);
                return { result: `Node '${nodeToDelete.data.title}' (${nodeToDelete.id}) deleted.` };
            }
            return { result: "Node not found." };
        }
        else if (functionCall.name === 'connect_flow_nodes') {
             const { from, to } = functionCall.args;
             const source = flowNodes.find(n => n.id === from || n.data.title.toLowerCase().includes(from.toLowerCase()));
             const target = flowNodes.find(n => n.id === to || n.data.title.toLowerCase().includes(to.toLowerCase()));

             if (source && target) {
                 addFlowConnection({
                     id: `conn-ai-${Date.now()}`,
                     from: source.id,
                     to: target.id
                 });
                 return { result: `Connected '${source.data.title}' to '${target.data.title}'.` };
             }
             return { result: "One or both nodes not found." };
        }
      } catch (e: any) {
          return { error: e.message };
      }
      return { error: "Function not found" };
  };

  const handleSend = async () => {
    if (!input.trim() || !chatSessionRef.current || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      let result = await chatSessionRef.current.sendMessageStream({ message: userMessage });
      
      // Add placeholder for model response
      setMessages(prev => [...prev, { role: 'model', text: '' }]);

      let fullText = '';
      let functionCallFound = false;

      for await (const chunk of result) {
        const c = chunk as any; // Cast to any to access functionCalls easily if type def is incomplete

        // Check for Function Calls in the chunk
        const functionCalls = c.functionCalls; // From @google/genai SDK structure
        
        if (functionCalls && functionCalls.length > 0) {
            functionCallFound = true;
            const call = functionCalls[0];
            const toolResult = handleToolExecution(call);
            
            // Send tool result back to model
            const toolResponse = await chatSessionRef.current.sendToolResponse({
                functionResponses: [{
                    id: call.id,
                    name: call.name,
                    response: { result: toolResult }
                }]
            });
            
            // Process the response after tool execution
            for await (const toolChunk of toolResponse) {
                if (toolChunk.text) {
                    fullText += toolChunk.text;
                    setMessages(prev => {
                        const newMessages = [...prev];
                        newMessages[newMessages.length - 1] = { role: 'model', text: fullText };
                        return newMessages;
                    });
                }
            }
        }
        else if (c.text) {
            fullText += c.text;
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = { role: 'model', text: fullText };
                return newMessages;
            });
        }
      }

    } catch (error) {
      console.error('Chat Error:', error);
      setMessages(prev => [...prev, { role: 'model', text: 'Desculpe, ocorreu um erro ao processar sua mensagem ou executar a ação.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-xl transition-all duration-300 z-50 flex items-center justify-center ${
          isOpen 
            ? 'bg-rose-500 text-white rotate-90' 
            : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-110'
        }`}
      >
        {isOpen ? <X size={24} /> : <Bot size={24} />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 md:w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-50 animate-in slide-in-from-bottom-10 fade-in duration-200 overflow-hidden">
          {/* Header */}
          <div className="bg-indigo-600 p-4 flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-1.5 rounded-lg">
                <Sparkles size={18} className="text-indigo-100" />
              </div>
              <div>
                <h3 className="font-bold text-sm">GhitDesk AI</h3>
                <p className="text-indigo-200 text-xs">Powered by Gemini 3 Pro</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-indigo-200 hover:text-white">
              <MinusCircle size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm whitespace-pre-wrap ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-br-none' 
                    : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none shadow-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
               <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-bl-none shadow-sm flex gap-1 items-center">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
                  </div>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-slate-200">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Digite sua pergunta..."
                className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                disabled={isLoading}
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg disabled:opacity-50 transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatbot;