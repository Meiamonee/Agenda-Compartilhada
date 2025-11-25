# ⚙️ Configuração de Variáveis de Ambiente

## 📝 Instruções

Crie os seguintes arquivos `.env` em cada diretório:

---

## 🔹 servico1/.env

Crie o arquivo `servico1/.env` com o seguinte conteúdo:

```env
PORT=3001
JWT_SECRET=sua_chave_secreta_super_segura_aqui_12345

# Configuração do Banco de Dados (Desenvolvimento Local)
DB_USER=postgres
DB_HOST=localhost
DB_DATABASE=agenda_db
DB_PASSWORD=SUA_SENHA_DO_POSTGRES_AQUI
DB_PORT=5432

# OU use DATABASE_URL para produção (Heroku, Railway, etc)
# DATABASE_URL=postgresql://user:password@host:port/database
```

⚠️ **Importante**: Substitua `SUA_SENHA_DO_POSTGRES_AQUI` pela senha real do seu PostgreSQL!

---

## 🔹 servico2/.env

Crie o arquivo `servico2/.env` com o seguinte conteúdo:

```env
PORT=3002
JWT_SECRET=sua_chave_secreta_super_segura_aqui_12345
SERVICO1_URL=http://localhost:3001

# Configuração do Banco de Dados (Desenvolvimento Local)
DB_USER=postgres
DB_HOST=localhost
DB_DATABASE=agenda_db
DB_PASSWORD=SUA_SENHA_DO_POSTGRES_AQUI
DB_PORT=5432

# OU use DATABASE_URL para produção (Heroku, Railway, etc)
# DATABASE_URL=postgresql://user:password@host:port/database
```

⚠️ **Importante**: 
- Substitua `SUA_SENHA_DO_POSTGRES_AQUI` pela senha real do seu PostgreSQL!
- O `JWT_SECRET` **DEVE SER O MESMO** em ambos os serviços!

---

## 🔹 frontend/.env

Crie o arquivo `frontend/.env` com o seguinte conteúdo:

```env
VITE_AUTH_API_URL=http://localhost:3001
VITE_EVENTS_API_URL=http://localhost:3002
```

---

## 🔐 Segurança do JWT_SECRET

### Para Desenvolvimento (Local)
Você pode usar qualquer string longa e complexa:
```
JWT_SECRET=minha_chave_super_secreta_para_desenvolvimento_12345
```

### Para Produção
Gere uma chave aleatória forte:

**Linux/Mac:**
```bash
openssl rand -base64 32
```

**Node.js:**
```javascript
require('crypto').randomBytes(32).toString('base64')
```

**Online:**
Use sites como [RandomKeygen](https://randomkeygen.com/) (CodeIgniter Encryption Keys)

---

## 🗄️ Configuração do Banco de Dados

### Opção 1: Variáveis Individuais (Recomendado para Local)

```env
DB_USER=postgres
DB_HOST=localhost
DB_DATABASE=agenda_db
DB_PASSWORD=sua_senha
DB_PORT=5432
```

### Opção 2: URL de Conexão (Recomendado para Produção)

```env
DATABASE_URL=postgresql://usuario:senha@host:porta/banco
```

**Exemplos:**
- Local: `postgresql://postgres:123456@localhost:5432/agenda_db`
- Heroku: `postgresql://user:pass@ec2-xx-xxx-xxx-xx.compute-1.amazonaws.com:5432/dbname`
- Railway: Fornecido automaticamente

---

## ✅ Checklist de Configuração

- [ ] Criar arquivo `servico1/.env`
- [ ] Criar arquivo `servico2/.env`
- [ ] Criar arquivo `frontend/.env`
- [ ] Configurar senha do PostgreSQL em ambos serviços
- [ ] Verificar que JWT_SECRET é idêntico nos dois serviços
- [ ] Criar banco de dados: `createdb agenda_db`
- [ ] Executar script SQL: `psql agenda_db < database_setup.sql`
- [ ] Testar conexão: iniciar os serviços e verificar logs

---

## 🧪 Testar Configuração

### 1. Testar Backend - Serviço 1
```bash
cd servico1
node index.js
```

Você deve ver:
```
✅ Conectado ao banco com sucesso!
🕓 Hora do servidor PostgreSQL: ...
🚀 Servidor de Usuários rodando na porta 3001
```

### 2. Testar Backend - Serviço 2
```bash
cd servico2
node index.js
```

Você deve ver:
```
🚀 Serviço de eventos rodando na porta 3002
```

### 3. Testar Frontend
```bash
cd frontend
npm run dev
```

Você deve ver:
```
  VITE vX.X.X  ready in XXX ms

  ➜  Local:   http://localhost:5173/
```

---

## 🐛 Troubleshooting

### Erro: "password authentication failed"
- Verifique a senha do PostgreSQL no `.env`
- Teste manualmente: `psql -U postgres -d agenda_db`

### Erro: "database does not exist"
- Crie o banco: `createdb agenda_db`
- Execute o script: `psql agenda_db < database_setup.sql`

### Erro: "ECONNREFUSED ::1:5432"
- PostgreSQL não está rodando
- Windows: Verifique em Serviços
- Linux/Mac: `sudo service postgresql start`

### Erro: "Token inválido ou expirado"
- JWT_SECRET diferente entre servico1 e servico2
- Verifique se é EXATAMENTE o mesmo em ambos

### Erro: "Cannot find module 'dotenv'"
- Execute: `npm install` no diretório do serviço

---

## 📦 Estrutura de Arquivos .env

```
Agenda-Compartilhada/
├── servico1/
│   └── .env          ← Criar este arquivo
├── servico2/
│   └── .env          ← Criar este arquivo
└── frontend/
    └── .env          ← Criar este arquivo
```

---

## 🔒 Segurança

⚠️ **NUNCA** commite arquivos `.env` no Git!

Os arquivos `.env` já estão no `.gitignore` por padrão, mas sempre verifique:

```bash
# Verificar se .env está no .gitignore
cat .gitignore | grep .env
```

Se não estiver, adicione:
```
.env
*.env
.env.local
```

---

## ✨ Pronto!

Após configurar todos os arquivos `.env`, você pode iniciar o sistema:

```bash
# Na raiz do projeto
npm run start:local

# Em outro terminal
cd frontend
npm run dev
```

Acesse: http://localhost:5173

**Boa sorte!** 🚀

