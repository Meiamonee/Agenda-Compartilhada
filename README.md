# 🗓️ Agenda Compartilhada - Sistema Multi-Tenant Completo

Sistema profissional de gerenciamento de agenda compartilhada com arquitetura multi-tenant, chat em tempo real, visualização de calendário e sistema completo de notificações.

## ✨ Funcionalidades Principais

### 🏢 Sistema Multi-Tenant
- 🏭 **Gestão de Empresas** - Cada empresa tem seu próprio espaço isolado
- � **Hierarquia de Usuários** - Donos e Funcionários com permissões diferenciadas
- �🔐 **Autenticação segura** com JWT e bcrypt
- � **Gerenciamento de Funcionários** - Donos podem criar, editar e remover funcionários

### �📅 Gerenciamento de Eventos
- ✅ **CRUD completo de eventos** (Criar, Listar, Editar, Deletar)
- � **Dashboard intuitivo** com 4 visualizações diferentes
- 📆 **Visualização em Calendário** - Grid mensal interativo com eventos
- �👥 **Sistema de convites** (Enviar, Aceitar, Recusar)
- � **Gerenciamento de participantes** com status em tempo real

### 💬 Chat em Tempo Real
- 🔴 **Socket.IO** para comunicação instantânea
- 💭 **Chat por evento** - Cada evento tem seu próprio chat
- 📝 **Histórico de mensagens** persistido no banco de dados
- 🔔 **Notificações de mensagens não lidas**
- 🟢 **Indicador de conexão** em tempo real

### 🔔 Sistema de Notificações
- � **Notificações de convites** para novos eventos
- 🔄 **Notificações de atualização** quando eventos são modificados
- ❌ **Notificações de cancelamento** quando eventos são deletados
- 📊 **Central de notificações** no dashboard
- ⚡ **Notificações em tempo real** via WebSocket

### 🎨 Interface Moderna
- 🎨 **Design responsivo** com Tailwind CSS
- 🌙 **Interface limpa e profissional**
- 📱 **Navegação mobile** com bottom navigation
- 🔄 **Feedback visual** para todas as ações
- ✨ **Animações suaves** e transições

### 🛡️ Segurança e Resiliência
- 🔐 **Senhas criptografadas** com bcrypt (10 rounds)
- 🎫 **Autenticação JWT** com expiração de 1 hora
- 🛡️ **Validação de permissões** em todos os endpoints
- 🔄 **Circuit Breaker** para tolerância a falhas
- 🏢 **Isolamento de dados** por empresa
- 🚫 **Proteção contra SQL injection**

### ⏰ Automação
- 🧹 **Limpeza automática** de eventos antigos (>30 dias)
- ⏰ **Cron jobs** para manutenção do sistema

## 🏗️ Arquitetura

### Microserviços
- **Serviço 1 (Porta 3001)**: Gerenciamento de Usuários, Empresas e Autenticação
- **Serviço 2 (Porta 3002)**: Gerenciamento de Eventos, Chat e Notificações

### Stack Tecnológica
- **Frontend**: React 19, Vite, Tailwind CSS, React Router DOM, Axios, Socket.IO Client, Lucide React
- **Backend**: Node.js, Express, JWT, bcrypt, Socket.IO, node-cron
- **Banco de Dados**: PostgreSQL com suporte SSL
- **Resiliência**: Opossum (Circuit Breaker)
- **Real-time**: Socket.IO para WebSockets

## 🚀 Início Rápido (5 minutos)

### 1. Pré-requisitos
- Node.js (v14+)
- PostgreSQL (v12+)
- npm ou yarn

### 2. Setup do Banco de Dados
```bash
createdb agenda_db
psql agenda_db < database_setup.sql
```

### 3. Configurar Variáveis de Ambiente
Crie os arquivos `.env` conforme documentado em **[CONFIG_ENV.md](CONFIG_ENV.md)**

### 4. Instalar Dependências
```bash
npm install
cd frontend && npm install
```

### 5. Iniciar o Sistema
```bash
# Terminal 1: Backends
npm run start:local

# Terminal 2: Frontend
cd frontend && npm run dev
```

### 6. Acessar
Abra seu navegador em: **http://localhost:5173**

## 📚 Documentação Completa

| Documento | Descrição |
|-----------|-----------|
| **[INDEX.md](INDEX.md)** 📚 | Índice de toda documentação |
| **[START.md](START.md)** ⚡ | Comandos rápidos de inicialização |
| **[GUIA_RAPIDO.md](GUIA_RAPIDO.md)** 📖 | Manual do usuário |
| **[README_IMPLEMENTACAO.md](README_IMPLEMENTACAO.md)** 🔧 | Documentação técnica completa |
| **[API_TESTS.md](API_TESTS.md)** 🧪 | Testes de API com exemplos |
| **[CONFIG_ENV.md](CONFIG_ENV.md)** ⚙️ | Configuração de variáveis de ambiente |
| **[RESUMO_IMPLEMENTACAO.md](RESUMO_IMPLEMENTACAO.md)** 📊 | Resumo executivo do projeto |

## 🎯 Funcionalidades Detalhadas

### 👔 Para Donos de Empresa
- ✅ Criar e gerenciar a empresa
- ✅ Adicionar, editar e remover funcionários
- ✅ Visualizar todos os usuários da empresa
- ✅ Todas as funcionalidades de organizador e participante

### 📅 Para Organizadores de Eventos
- ✅ Criar eventos com título, descrição, data/hora
- ✅ Editar e deletar seus eventos
- ✅ Convidar múltiplos funcionários da empresa
- ✅ Acompanhar confirmações de presença
- ✅ Ver lista completa de participantes
- ✅ Gerenciar chat do evento
- ✅ Remover participantes

### 👥 Para Participantes
- ✅ Receber convites para eventos
- ✅ Aceitar ou recusar convites
- ✅ Visualizar eventos confirmados
- ✅ Ver outros participantes
- ✅ Receber notificações de convites, atualizações e cancelamentos
- ✅ Participar do chat do evento
- ✅ Visualizar eventos no calendário
- ✅ Sair de eventos

## 🎨 Interface

O sistema possui um dashboard intuitivo com **5 visualizações principais**:

1. **📋 Todos os Eventos**: Visualiza todos os eventos da empresa
2. **📝 Meus Eventos**: Eventos que você criou (com controles completos de edição/exclusão)
3. **✅ Eventos Aceitos**: Eventos para os quais você confirmou presença
4. **📬 Notificações**: Central de notificações com convites, atualizações e cancelamentos (com badge de contador)
5. **📆 Calendário**: Visualização mensal em grid com todos os eventos

### 💬 Chat Widget
- **Botão flutuante** no canto inferior direito
- **Chat por evento** - Disponível quando você está visualizando um evento
- **Contador de mensagens não lidas**
- **Histórico completo** de conversas
- **Indicador de status** de conexão

### 👥 Gerenciamento de Funcionários (Apenas Donos)
- **Página dedicada** para gerenciar funcionários
- **Adicionar novos funcionários** com email e senha
- **Editar informações** de funcionários existentes
- **Remover funcionários** da empresa

## 🔐 Segurança

- ✅ Senhas criptografadas com bcrypt (10 rounds)
- ✅ Autenticação JWT com expiração de 1 hora
- ✅ Validação de permissões em todos os endpoints
- ✅ Proteção contra SQL injection
- ✅ CORS configurado corretamente
- ✅ Tokens no header Authorization

## 🛠️ Desenvolvimento

### Estrutura de Arquivos
```
Agenda-Compartilhada/
├── servico1/              # API de Usuários e Empresas (3001)
│   └── index.js          # Servidor principal
├── servico2/              # API de Eventos, Chat e Notificações (3002)
│   └── index.js          # Servidor principal com Socket.IO
├── frontend/              # Interface React
│   ├── src/
│   │   ├── components/   # Componentes reutilizáveis
│   │   │   ├── ChatWidget.jsx       # Widget de chat flutuante
│   │   │   ├── CalendarView.jsx     # Visualização de calendário
│   │   │   ├── EventCard.jsx        # Card de evento
│   │   │   ├── NotificationCard.jsx # Card de notificação
│   │   │   ├── Layout.jsx           # Layout principal
│   │   │   └── ...
│   │   ├── pages/        # Páginas da aplicação
│   │   │   ├── Dashboard.jsx        # Dashboard principal
│   │   │   ├── Employees.jsx        # Gerenciamento de funcionários
│   │   │   ├── Login.jsx            # Página de login
│   │   │   ├── RegisterCompany.jsx  # Registro de empresa
│   │   │   └── RegisterEmployee.jsx # Registro de funcionário
│   │   └── services/     # Serviços de API
│   └── package.json
├── package.json           # Scripts e dependências raiz
└── *.md                  # Documentação
```

### Scripts Disponíveis
```bash
# Raiz do projeto
npm run start:local      # Inicia ambos serviços backend
npm run start:servico1   # Apenas serviço de usuários
npm run start:servico2   # Apenas serviço de eventos

# Frontend
cd frontend
npm run dev              # Servidor de desenvolvimento
npm run build            # Build para produção
npm run preview          # Preview do build
```

## 🧪 Testes

Para testar a API manualmente, consulte **[API_TESTS.md](API_TESTS.md)** com exemplos completos de todas as requisições.

### Teste Rápido
```bash
# 1. Registrar Empresa e Dono
curl -X POST http://localhost:3001/empresas \
  -H "Content-Type: application/json" \
  -d '{"nome_empresa": "Minha Empresa", "email": "dono@empresa.com", "senha": "123456"}'

# 2. Login (retorna token JWT)
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{"email": "dono@empresa.com", "senha": "123456"}'

# 3. Criar Funcionário (use o token do login)
curl -X POST http://localhost:3001/usuarios \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{"email": "funcionario@empresa.com", "senha": "123456", "nome": "João Silva"}'
```

## 📊 Endpoints da API

### Serviço 1 - Usuários e Empresas (3001)

#### Empresas
- `POST /empresas` - Registrar empresa e dono (público)
- `GET /empresas/:id` - Buscar detalhes da empresa (protegida)
- `PUT /empresas/:id` - Atualizar empresa (protegida - apenas dono)
- `GET /empresas/:id/usuarios` - Listar usuários da empresa (protegida)

#### Usuários
- `POST /usuarios` - Registrar funcionário (protegida - apenas dono)
- `POST /login` - Login e obter JWT (público)
- `GET /usuarios` - Listar usuários da empresa (protegida)
- `GET /usuarios/:id` - Buscar usuário específico (protegida)
- `PUT /usuarios/:id` - Atualizar funcionário (protegida - apenas dono)
- `DELETE /usuarios/:id` - Deletar funcionário (protegida - apenas dono)

### Serviço 2 - Eventos, Chat e Notificações (3002)

#### Eventos
- `POST /eventos` - Criar evento (protegida)
- `GET /eventos` - Listar eventos da empresa (protegida)
- `GET /eventos/:id` - Buscar evento específico (protegida)
- `PUT /eventos/:id` - Atualizar evento (protegida - apenas organizador)
- `DELETE /eventos/:id` - Deletar evento (protegida - apenas organizador)
- `POST /eventos/:id/participar` - Participar de evento (protegida)
- `DELETE /eventos/:id/sair` - Sair de evento (protegida)

#### Convites e Participantes
- `POST /eventos/:evento_id/convidar` - Enviar convites (protegida - apenas organizador)
- `GET /eventos/:id/participantes` - Listar participantes (protegida)
- `DELETE /eventos/:evento_id/participantes/:user_id` - Remover participante (protegida - apenas organizador)
- `PUT /participations/:id` - Aceitar/Recusar convite (protegida)
- `GET /usuarios/:user_id/convites` - Convites pendentes (protegida)
- `GET /usuarios/:user_id/aceitos` - Eventos aceitos (protegida)

#### Chat (WebSocket + REST)
- `GET /eventos/:id/chat/messages` - Histórico de mensagens (protegida)
- **WebSocket Events**:
  - `join_event_chat` - Entrar no chat do evento
  - `send_message` - Enviar mensagem
  - `receive_message` - Receber mensagem
  - `chat_error` - Erro no chat

#### Notificações
- `GET /notificacoes` - Listar notificações do usuário (protegida)
- `PUT /notificacoes/:id/read` - Marcar notificação como lida (protegida)
- **WebSocket Events**:
  - `new_notification` - Nova notificação em tempo real

## 🐛 Troubleshooting

### Problemas Comuns

**Backend não inicia:**
- Verifique se o PostgreSQL está rodando
- Confirme as credenciais no arquivo `.env`
- Verifique se o banco `agenda_db` existe

**Frontend não conecta:**
- Confirme as URLs no `frontend/.env`
- Verifique se os backends estão rodando
- Verifique console do navegador (F12)

**Erro de autenticação:**
- O `JWT_SECRET` deve ser idêntico em `servico1/.env` e `servico2/.env`
- Token pode ter expirado (válido por 1 hora)

Para mais detalhes, consulte: **[CONFIG_ENV.md - Troubleshooting](CONFIG_ENV.md#-troubleshooting)**

## 🌟 Destaques da Implementação

- ✅ **Arquitetura Multi-Tenant** completa com isolamento de dados
- ✅ **25+ endpoints** REST completos e funcionais
- ✅ **Chat em tempo real** com Socket.IO e persistência
- ✅ **Sistema de notificações** completo (convites, updates, cancelamentos)
- ✅ **Visualização de calendário** interativa
- ✅ **Gerenciamento de funcionários** com hierarquia de permissões
- ✅ **Interface moderna** e responsiva com React 19
- ✅ **Segurança profissional** com JWT + bcrypt + isolamento multi-tenant
- ✅ **Tolerância a falhas** com Circuit Breaker
- ✅ **Automação** com cron jobs para limpeza
- ✅ **WebSocket** para comunicação em tempo real
- ✅ **Código limpo** e bem organizado
- ✅ **Pronto para produção** com suporte SSL

## 🚀 Deploy em Produção

### Opções Recomendadas
- **Frontend**: Vercel, Netlify
- **Backend**: Railway, Heroku, Render
- **Banco de Dados**: Supabase, Railway, Heroku Postgres

### Variáveis de Ambiente para Produção
Configure as mesmas variáveis dos arquivos `.env`, ajustando:
- URLs dos serviços
- Credenciais do banco de dados
- JWT_SECRET forte e único

## 📝 Licença

Este projeto foi desenvolvido para fins educacionais e demonstração de sistema completo de microserviços com React.

---

**Desenvolvido com ❤️ - Sistema Profissional de Agenda Compartilhada Multi-Tenant**

*Última atualização: Dezembro 2025*
