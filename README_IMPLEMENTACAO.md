# Sistema de Agenda Compartilhada - Guia Completo

## 📋 Visão Geral

Sistema completo de agenda compartilhada com autenticação JWT, gerenciamento de eventos e sistema de convites.

## 🏗️ Arquitetura

### Backend
- **Serviço 1 (Porta 3001)**: Gerenciamento de Usuários e Autenticação
- **Serviço 2 (Porta 3002)**: Gerenciamento de Eventos e Participações

### Frontend
- React + Vite
- Tailwind CSS
- React Router DOM
- Axios

## 🚀 Como Configurar

### 1. Configurar Banco de Dados PostgreSQL

Execute os seguintes comandos SQL para criar as tabelas:

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    organizer_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_organizer
        FOREIGN KEY (organizer_id)
        REFERENCES users (id)
        ON DELETE CASCADE
);

CREATE TABLE participations (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'invited',
    CONSTRAINT fk_event
        FOREIGN KEY (event_id)
        REFERENCES events (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_user
        FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE CASCADE,
    UNIQUE (event_id, user_id)
);
```

### 2. Configurar Variáveis de Ambiente

#### Backend - Serviço 1 (`servico1/.env`)
```env
PORT=3001
JWT_SECRET=sua_chave_secreta_super_segura_aqui_12345
DB_USER=postgres
DB_HOST=localhost
DB_DATABASE=agenda_db
DB_PASSWORD=sua_senha_postgres
DB_PORT=5432
```

#### Backend - Serviço 2 (`servico2/.env`)
```env
PORT=3002
JWT_SECRET=sua_chave_secreta_super_segura_aqui_12345
SERVICO1_URL=http://localhost:3001
DB_USER=postgres
DB_HOST=localhost
DB_DATABASE=agenda_db
DB_PASSWORD=sua_senha_postgres
DB_PORT=5432
```

#### Frontend (`frontend/.env`)
```env
VITE_AUTH_API_URL=http://localhost:3001
VITE_EVENTS_API_URL=http://localhost:3002
```

### 3. Instalar Dependências

```bash
# Backend - Raiz do projeto
npm install

# Frontend
cd frontend
npm install
```

### 4. Iniciar os Serviços

#### Opção 1: Iniciar tudo junto (na raiz do projeto)
```bash
npm run start:local
```

#### Opção 2: Iniciar separadamente
```bash
# Terminal 1 - Serviço de Usuários
npm run start:servico1

# Terminal 2 - Serviço de Eventos
npm run start:servico2

# Terminal 3 - Frontend
cd frontend
npm run dev
```

### 5. Acessar o Sistema

Abra o navegador em: `http://localhost:5173`

## 📱 Funcionalidades Implementadas

### 🔐 Autenticação
- ✅ Registro de novos usuários
- ✅ Login com JWT
- ✅ Proteção de rotas
- ✅ Logout

### 📅 Gerenciamento de Eventos
- ✅ Criar eventos
- ✅ Listar todos os eventos
- ✅ Listar meus eventos (organizador)
- ✅ Editar eventos (apenas organizador)
- ✅ Deletar eventos (apenas organizador)
- ✅ Ver detalhes de eventos

### 👥 Sistema de Convites
- ✅ Convidar usuários para eventos
- ✅ Visualizar convites pendentes
- ✅ Aceitar convites
- ✅ Recusar convites
- ✅ Ver eventos aceitos
- ✅ Notificação visual de convites pendentes

### 👤 Participantes
- ✅ Ver lista de participantes de um evento
- ✅ Ver status de cada participante (confirmado, pendente, recusou)
- ✅ Coordenação entre serviços com Circuit Breaker

## 🎨 Interface do Usuário

### Tabs do Dashboard
1. **Todos os Eventos**: Visualiza todos os eventos do sistema
2. **Meus Eventos**: Eventos que você criou (com controles completos)
3. **Eventos Aceitos**: Eventos para os quais você aceitou o convite
4. **Convites Pendentes**: Convites que você ainda não respondeu (com badge de notificação)

### Ações Disponíveis

#### Como Organizador:
- Editar evento
- Deletar evento
- Convidar usuários
- Ver participantes

#### Como Participante:
- Ver detalhes do evento
- Aceitar/Recusar convites
- Ver outros participantes

## 🔧 Estrutura de Arquivos

```
Agenda-Compartilhada/
├── servico1/                    # Serviço de Usuários
│   ├── Banco/
│   │   └── db.js               # Configuração do PostgreSQL
│   ├── index.js                # Servidor de usuários
│   └── .env                    # Variáveis de ambiente
│
├── servico2/                    # Serviço de Eventos
│   ├── Banco/
│   │   └── db.js               # Configuração do PostgreSQL
│   ├── index.js                # Servidor de eventos
│   └── .env                    # Variáveis de ambiente
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── apiService.js   # Serviços de API com interceptors JWT
│   │   ├── components/
│   │   │   ├── EventCard.jsx   # Card de evento
│   │   │   ├── InviteCard.jsx  # Card de convite
│   │   │   └── Modal.jsx       # Modal reutilizável
│   │   ├── pages/
│   │   │   ├── Login.jsx       # Página de login/cadastro
│   │   │   └── Dashboard.jsx   # Dashboard principal
│   │   ├── App.jsx             # Rotas da aplicação
│   │   └── main.jsx            # Entry point
│   └── .env                    # Variáveis de ambiente
│
└── README_IMPLEMENTACAO.md     # Este arquivo
```

## 🔄 Fluxo de Dados

### Criar Evento
1. Usuário preenche formulário
2. Frontend envia para `/eventos` (Serviço 2)
3. Serviço 2 valida com Serviço 1 (Circuit Breaker)
4. Evento é criado no banco
5. Frontend atualiza a lista

### Enviar Convites
1. Organizador seleciona usuários
2. Frontend envia para `/eventos/:id/convidar` (Serviço 2)
3. Serviço 2 valida existência dos usuários (Serviço 1)
4. Participações são criadas com status 'invited'
5. Usuários veem convites na aba "Convites Pendentes"

### Aceitar/Recusar Convite
1. Usuário clica em Aceitar ou Recusar
2. Frontend envia para `/participations/:id` (Serviço 2)
3. Status é atualizado no banco
4. Frontend atualiza as listas automaticamente

## 🛡️ Segurança

- ✅ Senhas criptografadas com bcrypt
- ✅ Autenticação JWT com expiração de 1 hora
- ✅ Validação de permissões (apenas organizador pode editar/deletar)
- ✅ Validação de propriedade (usuário só vê seus próprios convites)
- ✅ Interceptors automáticos de autenticação
- ✅ Redirecionamento automático ao expirar token

## 🔧 Tolerância a Falhas

- ✅ Circuit Breaker para comunicação entre serviços
- ✅ Tratamento de erros em todas as requisições
- ✅ Mensagens de erro amigáveis para o usuário
- ✅ Fallback quando serviço está indisponível

## 📊 Endpoints da API

### Serviço 1 - Usuários (3001)
- `POST /usuarios` - Registrar usuário
- `POST /login` - Login
- `GET /usuarios` - Listar usuários (protegida)
- `GET /usuarios/:id` - Buscar usuário por ID (protegida)

### Serviço 2 - Eventos (3002)
- `POST /eventos` - Criar evento (protegida)
- `GET /eventos` - Listar todos os eventos
- `PUT /eventos/:id` - Atualizar evento (protegida)
- `DELETE /eventos/:id` - Deletar evento (protegida)
- `POST /eventos/:id/convidar` - Enviar convites (protegida)
- `GET /eventos/:id/participantes` - Listar participantes (protegida)
- `PUT /participations/:id` - Aceitar/Recusar convite (protegida)
- `GET /usuarios/:id/convites` - Listar convites pendentes (protegida)
- `GET /usuarios/:id/aceitos` - Listar eventos aceitos (protegida)

## 🎯 Próximas Melhorias Sugeridas

1. **Notificações em Tempo Real**: Implementar WebSockets para notificações instantâneas
2. **Busca e Filtros**: Adicionar busca por título/data e filtros avançados
3. **Calendário Visual**: Integrar biblioteca de calendário (FullCalendar, React Big Calendar)
4. **Recorrência de Eventos**: Permitir criar eventos recorrentes
5. **Anexos**: Permitir anexar arquivos aos eventos
6. **Comentários**: Sistema de comentários nos eventos
7. **Lembrete por Email**: Enviar emails de lembrete antes dos eventos
8. **Exportar para iCal/Google Calendar**: Integração com calendários externos
9. **Temas**: Modo escuro/claro
10. **Mobile Responsivo**: Melhorar experiência mobile

## 🐛 Troubleshooting

### Erro de conexão com banco de dados
- Verifique se o PostgreSQL está rodando
- Confirme as credenciais no arquivo `.env`
- Verifique se o banco `agenda_db` existe

### Erro 401/403 no frontend
- O token JWT pode ter expirado (válido por 1 hora)
- Faça logout e login novamente
- Verifique se o JWT_SECRET é o mesmo nos dois serviços

### Circuit Breaker aberto
- O Serviço 1 pode estar offline
- Reinicie o Serviço 1
- Aguarde 10 segundos para o circuit breaker se recuperar

### CORS Error
- Verifique se os CORs estão habilitados nos backends
- Confirme as URLs no arquivo `.env` do frontend

## 📝 Licença

Este projeto foi desenvolvido para fins educacionais.

## 👨‍💻 Autor

Desenvolvido como sistema completo de agenda compartilhada com microserviços.

