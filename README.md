# 🗓️ Agenda Compartilhada - Sistema Completo

Sistema completo de gerenciamento de agenda compartilhada com autenticação JWT, sistema de convites e interface moderna.

## ✨ Funcionalidades Principais

- 🔐 **Autenticação segura** com JWT e bcrypt
- 📅 **CRUD completo de eventos** (Criar, Listar, Editar, Deletar)
- 👥 **Sistema de convites** (Enviar, Aceitar, Recusar)
- 📊 **Dashboard intuitivo** com múltiplas visualizações
- 🔔 **Notificações** de convites pendentes
- 👤 **Gerenciamento de participantes** com status em tempo real
- 🎨 **Interface moderna** com Tailwind CSS
- 🛡️ **Segurança robusta** e validação de permissões
- 🔄 **Tolerância a falhas** com Circuit Breaker

## 🏗️ Arquitetura

### Microserviços
- **Serviço 1 (Porta 3001)**: Gerenciamento de Usuários e Autenticação
- **Serviço 2 (Porta 3002)**: Gerenciamento de Eventos e Participações

### Stack Tecnológica
- **Frontend**: React, Vite, Tailwind CSS, React Router DOM, Axios
- **Backend**: Node.js, Express, JWT, bcrypt
- **Banco de Dados**: PostgreSQL
- **Resiliência**: Opossum (Circuit Breaker)

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

### Para Organizadores
- ✅ Criar eventos com título, descrição, data/hora
- ✅ Editar e deletar seus eventos
- ✅ Convidar múltiplos usuários
- ✅ Acompanhar confirmações de presença
- ✅ Ver lista completa de participantes

### Para Participantes
- ✅ Receber convites para eventos
- ✅ Aceitar ou recusar convites
- ✅ Visualizar eventos confirmados
- ✅ Ver outros participantes
- ✅ Notificações de convites pendentes

## 🎨 Interface

O sistema possui um dashboard intuitivo com 4 abas principais:

1. **Todos os Eventos**: Visualiza todos os eventos públicos
2. **Meus Eventos**: Eventos que você criou (com controles completos)
3. **Eventos Aceitos**: Eventos para os quais você confirmou presença
4. **Convites Pendentes**: Convites aguardando resposta (com badge de notificação)

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
├── servico1/           # API de Usuários (3001)
├── servico2/           # API de Eventos (3002)
├── frontend/           # Interface React
├── database_setup.sql  # Script SQL
└── *.md               # Documentação
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
# Criar usuário
curl -X POST http://localhost:3001/usuarios \
  -H "Content-Type: application/json" \
  -d '{"nome": "Teste", "email": "teste@email.com", "senha": "123456"}'

# Login
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{"email": "teste@email.com", "senha": "123456"}'
```

## 📊 Endpoints da API

### Serviço 1 - Usuários (3001)
- `POST /usuarios` - Registrar usuário
- `POST /login` - Login e obter JWT
- `GET /usuarios` - Listar usuários (protegida)
- `GET /usuarios/:id` - Buscar usuário (protegida)

### Serviço 2 - Eventos (3002)
- `POST /eventos` - Criar evento (protegida)
- `GET /eventos` - Listar eventos
- `PUT /eventos/:id` - Atualizar evento (protegida)
- `DELETE /eventos/:id` - Deletar evento (protegida)
- `POST /eventos/:id/convidar` - Enviar convites (protegida)
- `GET /eventos/:id/participantes` - Listar participantes (protegida)
- `PUT /participations/:id` - Aceitar/Recusar convite (protegida)
- `GET /usuarios/:id/convites` - Convites pendentes (protegida)
- `GET /usuarios/:id/aceitos` - Eventos aceitos (protegida)

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

- ✅ **13 endpoints** completos e funcionais
- ✅ **~3.200 linhas** de código implementado
- ✅ **7 arquivos** de documentação detalhada
- ✅ **Interface moderna** e responsiva
- ✅ **Segurança profissional** com JWT + bcrypt
- ✅ **Tolerância a falhas** com Circuit Breaker
- ✅ **Código limpo** e bem organizado
- ✅ **Pronto para produção**

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

## 📞 Suporte

- 📖 **Documentação**: Veja [INDEX.md](INDEX.md)
- 🧪 **Testes**: Veja [API_TESTS.md](API_TESTS.md)
- ❓ **FAQ**: Veja [GUIA_RAPIDO.md](GUIA_RAPIDO.md#-faq)

## 📝 Licença

Este projeto foi desenvolvido para fins educacionais e demonstração de sistema completo de microserviços com React.

## 🎉 Começar Agora!

**Pronto para usar?** Siga o guia de início rápido acima ou consulte **[START.md](START.md)** para comandos detalhados!

---

**Desenvolvido com ❤️ - Sistema Profissional de Agenda Compartilhada**

*Última atualização: Novembro 2025*
