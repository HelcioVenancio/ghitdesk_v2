# Documentação do Sistema - GhitDesk

GhitDesk é uma plataforma de gestão omnichannel unificada para suporte ao cliente, integrando CRM, Helpdesk, Gestão de Projetos e Automação via IA. A aplicação é construída com **React**, **Tailwind CSS**, **Framer Motion** para animações, **Recharts** para gráficos e **Google Gemini API** para inteligência artificial.

---

## 1. Arquitetura Central

### Gerenciamento de Estado (`contexts/DataContext.tsx`)
O coração da aplicação. Utiliza a Context API do React para simular um banco de dados em tempo real no frontend.
- **Persistência**: Utiliza `localStorage` para salvar dados entre sessões.
- **Entidades Gerenciadas**:
  - `Tickets`: Chamados de suporte.
  - `Tasks`: Tarefas internas de projetos.
  - `Contacts`: Base de clientes (CRM).
  - `Events`: Calendário e agendamentos.
  - `Users`: Membros da equipe e permissões.
  - `FlowNodes/Connections`: Dados do construtor de automação.

### Definições de Tipos (`types.ts`)
Define as interfaces TypeScript e Enums que garantem a integridade dos dados em todo o sistema.
- **Enums Principais**: `ChannelType` (WhatsApp, Email, etc.), `TicketStatus`, `Priority`.
- **Interfaces**: Estruturas complexas para `Ticket`, `Task`, `FlowNode` (nós do fluxograma).

### Integração com IA (`services/geminiService.ts`)
Módulo de comunicação com a API do Google Gemini.
- **`generateSmartReply`**: Lê o histórico do ticket e sugere respostas empáticas para o agente.
- **`analyzeSentiment`**: Analisa o texto do cliente para classificar sentimento (Positivo/Neutro/Negativo).
- **`summarizeTicket`**: Gera um resumo conciso de tickets longos.
- **`createChatSession`**: Inicializa o chatbot global com ferramentas (Function Calling) capazes de manipular o **Automation Builder** (criar/deletar nós via chat).

---

## 2. Módulos de Interface (Views)

A aplicação é dividida em "Views" renderizadas dinamicamente pelo `App.tsx` e navegáveis via `Sidebar.tsx`.

### 📊 Dashboard (`components/Dashboard.tsx`)
Painel analítico para visão gerencial.
- **KPIs Financeiros**: Cards com tendências de Receita, Lucro e Despesas.
- **Gráficos de Área**: Visualização de visitantes únicos vs totais.
- **Gráficos de Barra**: Distribuição por Sistema Operacional, Navegador e Dispositivo.
- **Gráficos de Pizza (Donut)**: Distribuição de despesas e custos.
- **Interatividade**: Tooltips personalizados e design responsivo.

### 📥 Inbox (`components/Inbox.tsx`)
Central de atendimento omnichannel unificada.
- **Lista de Canais**: Filtragem por origem (WhatsApp, Instagram, Email, etc.).
- **Lista de Conversas**: Exibição de tickets com indicadores de "Não lido", Tags e Prioridade.
- **Área de Chat**:
  - **Modo Público vs Interno**: Permite enviar mensagens ao cliente ou notas internas para a equipe (com visual amarelo distinto).
  - **Assistência de IA**: Botão "AI Assist" para gerar ou completar respostas.
  - **Respostas Rápidas**: Menu de mensagens pré-definidas.
- **Sidebar de Detalhes**: Painel retrátil com dados do cliente (CRM), edição de SLA, Tags e anotações.

### 🎫 Ticket Board (`components/TicketBoard.tsx`)
Visualização Kanban para gestão de fluxo de suporte.
- **Colunas**: Aberto, Em andamento, Aguardando Cliente, Resolvido.
- **Drag and Drop**: Atualização de status arrastando cards.
- **Modal de Detalhes**: Visualização expandida do ticket permitindo edição rica de propriedades, ver mensagens e alterar responsáveis.
- **Filtros**: Busca global e filtros por prioridade.

### ✅ Task Board (`components/TaskBoard.tsx`)
Gerenciamento de projetos internos e tarefas da equipe.
- **Estrutura Kanban**: Semelhante aos tickets, mas focado em *workflow* de desenvolvimento/operações.
- **Subtarefas**: Barra de progresso visual baseada na conclusão de checklists internos.
- **Sidebar Estilo "ClickUp"**: Ao clicar em uma tarefa, abre-se um painel lateral direito para edição detalhada, comentários e histórico de atividade.

### 📅 Atividades (`components/ActivityBoard.tsx`)
Módulo de calendário e timeline.
- **Timeline Lateral**: Lista cronológica de eventos passados e futuros.
- **Grid de Calendário**: Visualização mensal interativa.
- **Tipos de Evento**: Reuniões (Video), Chamadas, Emails.
- **Criação Rápida**: Modal para agendamento com seleção de data/hora e participantes.

### 👥 Contatos (`components/ContactList.tsx`)
CRM simplificado.
- **Recentes**: Barra superior com contatos acessados recentemente.
- **Tabela de Dados**: Listagem completa com busca, filtragem por canal e avaliação (estrelas).
- **Perfil**: Modal com histórico de interações e dados cadastrais.

### 🤖 Automation Builder (`components/AutomationBuilder.tsx`)
Construtor visual de fluxogramas (Chatbots/Régua de relacionamento).
- **Canvas Infinito**: Área de desenho com suporte a Pan (arrastar tela) e Zoom.
- **Nós (Nodes)**:
  - *Gatilhos*: Início de conversa, Palavra-chave.
  - *Conteúdo*: Texto, Imagem, Vídeo.
  - *Entradas*: Coleta de Texto, Email, Telefone.
  - *Lógica*: Condicionais (placeholder), Espera.
- **Conexões**: Linhas de Bézier desenhadas interativamente entre os nós.
- **Edição Inline**: Sidebar esquerda dinâmica que alterna entre "Toolbox" (arrastar novos blocos) e "Propriedades" (editar bloco selecionado).
- **IA Generativa**: Este módulo pode ser controlado via voz/texto pelo `AIChatbot` (ex: "Crie um fluxo que pede o email").

### ⚙️ Configurações (`components/Settings.tsx`)
Painel administrativo tabulado.
- **Equipe**: Gestão de usuários (CRUD básico).
- **Canais**: Configuração de integrações (simulação de conexão com WhatsApp, Instagram, Webhooks).
- **Automação**: Definição de horário de atendimento e regras de SLA.
- **Notificações**: Preferências de alertas (Email vs In-App).
- **Geral**: Dados da empresa (White-label).

---

## 3. Componentes Auxiliares

### `AIChatbot.tsx`
Assistente flutuante global (canto inferior direito).
- Conecta-se à **Gemini API** com um prompt de sistema específico.
- **Function Calling**: Possui ferramentas definidas (`create_flow_node`, `connect_flow_nodes`) que permitem ao usuário construir fluxos de automação conversando com o bot.

### `Sidebar.tsx`
Menu de navegação lateral responsivo.
- Suporta modo colapsado (apenas ícones) e expandido.
- Gerencia a troca de temas (Dark/Light Mode).

### `CalendarWidget.tsx`
Widget reutilizável para seleção de data e hora, utilizado dentro de modais de agendamento.

### `Modal.tsx`
Componente base para todos os diálogos do sistema (Criação, Edição, Alertas), com suporte a animações de entrada/saída.
