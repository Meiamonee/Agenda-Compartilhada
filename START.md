# 🚀 Iniciar Sistema - Comandos Rápidos

## ⚡ Setup Inicial (Primeira Vez)

```bash
# 1. Criar banco de dados
createdb agenda_db
psql agenda_db < database_setup.sql

# 2. Criar arquivos .env (veja CONFIG_ENV.md para detalhes)
# servico1/.env
# servico2/.env
# frontend/.env

# 3. Instalar dependências (se ainda não fez)
npm install
cd frontend && npm install && cd ..
```

## 🎬 Iniciar Sistema

### Opção 1: Tudo junto (Recomendado)

```bash
# Terminal 1: Iniciar backends (servico1 + servico2)
npm run start:local

# Terminal 2: Iniciar frontend
cd frontend
npm run dev
```

### Opção 2: Separadamente

```bash
# Terminal 1: Serviço de Usuários
npm run start:servico1

# Terminal 2: Serviço de Eventos
npm run start:servico2

# Terminal 3: Frontend
cd frontend
npm run dev
```

## 🌐 Acessar

- **Frontend**: http://localhost:5173
- **API Usuários**: http://localhost:3001
- **API Eventos**: http://localhost:3002

## ✅ Verificar Se Está Funcionando

### Backend - Serviço 1
```bash
curl http://localhost:3001/usuarios
```
Deve retornar erro 401 (esperado, pois a rota é protegida)

### Backend - Serviço 2
```bash
curl http://localhost:3002/eventos
```
Deve retornar `[]` (lista vazia)

### Frontend
Abra http://localhost:5173 e veja a tela de login

## 🧪 Teste Rápido

1. Acesse http://localhost:5173
2. Clique em "Criar conta gratuita"
3. Preencha: Nome, Email, Senha
4. Clique em "Criar conta"
5. Faça login com as credenciais
6. Clique em "+ Novo Evento"
7. Preencha os dados do evento
8. Clique em "Criar Evento"
9. Veja seu evento aparecer na lista! 🎉

## 🛑 Parar Sistema

Pressione `Ctrl+C` em cada terminal

## 🔄 Reiniciar Banco de Dados (Limpar Tudo)

```bash
psql agenda_db < database_setup.sql
```

## 📚 Documentação

- **Guia Completo**: `README_IMPLEMENTACAO.md`
- **Guia Rápido de Uso**: `GUIA_RAPIDO.md`
- **Configuração .env**: `CONFIG_ENV.md`
- **Testes de API**: `API_TESTS.md`
- **Resumo**: `RESUMO_IMPLEMENTACAO.md`

## 🐛 Problemas?

### Backend não inicia
```bash
# Verificar se PostgreSQL está rodando
psql -U postgres -c "SELECT version();"

# Verificar variáveis de ambiente
cat servico1/.env
cat servico2/.env
```

### Frontend não conecta
```bash
# Verificar variáveis de ambiente do frontend
cat frontend/.env

# Deve ter:
# VITE_AUTH_API_URL=http://localhost:3001
# VITE_EVENTS_API_URL=http://localhost:3002
```

### Erro de autenticação
- Verifique se JWT_SECRET é idêntico em servico1/.env e servico2/.env

## ✨ Pronto!

Sistema rodando! Acesse http://localhost:5173 e comece a usar! 🎊

