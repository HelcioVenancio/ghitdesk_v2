import { GoogleGenAI, Chat, FunctionDeclaration, SchemaType, Type } from "@google/genai";
import { Ticket, Message } from "../types";

const apiKey = process.env.API_KEY || ''; 

let ai: GoogleGenAI | null = null;
try {
    if (apiKey) {
        ai = new GoogleGenAI({ apiKey });
    }
} catch (e) {
    console.error("Failed to initialize Gemini client", e);
}

// --- Tools Definitions for Flow Builder ---

const flowTools: FunctionDeclaration[] = [
  {
    name: 'create_flow_node',
    description: 'Creates a new node in the automation flow builder. Coordinates x and y default to 300, 300 if not specified.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        type: {
          type: Type.STRING,
          description: 'Type of node.',
          enum: ["trigger", "message", "image", "input_text", "condition", "wait", "email_send", "agent_handoff"]
        },
        title: {
          type: Type.STRING,
          description: 'Title displayed on the node.'
        },
        description: {
          type: Type.STRING,
          description: 'Short description.'
        },
        content: { type: Type.STRING, description: 'Content for message nodes.' },
        x: { type: Type.NUMBER, description: 'X coordinate (optional)' },
        y: { type: Type.NUMBER, description: 'Y coordinate (optional)' }
      },
      required: ['type', 'title']
    }
  },
  {
    name: 'delete_flow_node',
    description: 'Deletes a node from the flow builder by its ID or Title (fuzzy match).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        identifier: {
          type: Type.STRING,
          description: 'The ID or Title of the node to delete.'
        }
      },
      required: ['identifier']
    }
  },
  {
    name: 'connect_flow_nodes',
    description: 'Connects two nodes in the flow builder.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        from: { type: Type.STRING, description: 'ID or Title of the source node.' },
        to: { type: Type.STRING, description: 'ID or Title of the target node.' }
      },
      required: ['from', 'to']
    }
  }
];

export const generateSmartReply = async (ticket: Ticket, draft?: string): Promise<string> => {
  if (!ai) return "A configuração da API Key do Gemini é necessária para sugestões.";

  const historyText = ticket.messages.map(m => 
    `${m.senderId === ticket.customer.id ? 'Cliente' : 'Agente'}: ${m.content}`
  ).join('\n');

  const prompt = `
    Você é um assistente de suporte ao cliente experiente e empático da plataforma GhitDesk.
    
    Histórico da conversa:
    ${historyText}

    ${draft ? `O agente começou a digitar: "${draft}"` : ''}

    Tarefa: Gere uma resposta sugerida para o agente enviar ao cliente. 
    A resposta deve ser profissional, amigável, em Português do Brasil e resolver o problema ou solicitar mais informações se necessário.
    Mantenha a resposta concisa (máximo 3 parágrafos).
    Se houver um rascunho, complete-o ou melhore-o.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Não foi possível gerar uma sugestão.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Erro ao conectar com a IA.";
  }
};

export const analyzeSentiment = async (text: string): Promise<{ sentiment: 'positive' | 'neutral' | 'negative', score: number }> => {
    if (!ai) return { sentiment: 'neutral', score: 0.5 };

    try {
        const prompt = `Analise o sentimento da seguinte mensagem de um cliente e retorne APENAS um JSON.
        Mensagem: "${text}"
        
        Schema JSON esperado:
        {
            "sentiment": "positive" | "neutral" | "negative",
            "score": number (0 a 10, onde 0 é muito negativo e 10 muito positivo)
        }
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });

        const jsonStr = response.text;
        if (jsonStr) {
            return JSON.parse(jsonStr);
        }
        return { sentiment: 'neutral', score: 5 };
    } catch (e) {
        return { sentiment: 'neutral', score: 5 };
    }
}

export const summarizeTicket = async (ticket: Ticket): Promise<string> => {
    if (!ai) return "IA indisponível.";

    const historyText = ticket.messages.map(m => 
        `${m.senderId === ticket.customer.id ? 'Cliente' : 'Agente'}: ${m.content}`
      ).join('\n');
    
      const prompt = `Resuma o problema e o estado atual deste ticket de suporte em um parágrafo curto (pt-BR).
      
      Histórico:
      ${historyText}`;

      try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "Sem resumo.";
      } catch (e) {
          return "Erro ao gerar resumo.";
      }
}

export const createChatSession = (): Chat | null => {
    if (!ai) return null;
    return ai.chats.create({
        model: 'gemini-3-pro-preview',
        config: {
            systemInstruction: "Você é o assistente virtual inteligente do GhitDesk. Ajude os usuários (agentes de suporte) a navegar na plataforma, entender métricas, ou dê dicas de como lidar com clientes difíceis. Você também tem a capacidade de manipular o Construtor de Fluxo (Flow Builder). Se o usuário pedir para criar, deletar ou conectar nós no fluxo, use as ferramentas disponíveis. Responda sempre em Português do Brasil.",
            tools: [{ functionDeclarations: flowTools }]
        }
    });
}