# 🚀 Guia Rápido de Uso - Agenda Compartilhada

## ⚡ Início Rápido (5 minutos)

### 1. Configure o Banco de Dados
```bash
# No PostgreSQL
createdb agenda_db
psql agenda_db < database_setup.sql
```

### 2. Configure as Variáveis de Ambiente

Crie os arquivos `.env` conforme os exemplos abaixo:

**servico1/.env**
```env
PORT=3001
JWT_SECRET=sua_chave_secreta_super_segura_aqui_12345
DB_USER=postgres
DB_HOST=localhost
DB_DATABASE=agenda_db
DB_PASSWORD=sua_senha_postgres
DB_PORT=5432
```

**servico2/.env**
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

**frontend/.env**
```env
VITE_AUTH_API_URL=http://localhost:3001
VITE_EVENTS_API_URL=http://localhost:3002
```

### 3. Inicie o Sistema
```bash
# Na raiz do projeto
npm run start:local

# Em outro terminal
cd frontend
npm run dev
```

### 4. Acesse
Abra o navegador em: http://localhost:5173

---

## 📖 Como Usar o Sistema

### 🔐 Primeiro Acesso

1. **Criar Conta**
   - Clique em "Criar conta gratuita"
   - Preencha nome, email e senha
   - Clique em "Criar conta"

2. **Fazer Login**
   - Digite seu email e senha
   - Clique em "Entrar"

### 📅 Criar um Evento

1. No Dashboard, clique em **"+ Novo Evento"**
2. Preencha os dados:
   - **Título**: Nome do evento (obrigatório)
   - **Descrição**: Detalhes do evento (opcional)
   - **Data e Hora de Início**: Quando começa (obrigatório)
   - **Data e Hora de Fim**: Quando termina (obrigatório)
3. Clique em **"Criar Evento"**

### 👥 Convidar Pessoas

1. Vá na aba **"Meus Eventos"**
2. No card do evento, clique no **menu** (⋮)
3. Clique em **"Convidar"**
4. Selecione os usuários que deseja convidar
5. Clique em **"Enviar Convites"**

### 📨 Responder Convites

1. Vá na aba **"Convites Pendentes"** (você verá um badge vermelho se houver convites)
2. Veja os detalhes do evento
3. Clique em:
   - **"Aceitar"** para confirmar presença
   - **"Recusar"** para declinar

### 📋 Ver Participantes

1. Em qualquer evento, clique no card
2. Clique em **"Ver Participantes"** ou no botão **"Participantes"** (para organizadores)
3. Veja a lista completa com status de cada pessoa:
   - 🟢 **Confirmado**: Aceitou o convite
   - 🟡 **Pendente**: Ainda não respondeu
   - 🔴 **Recusou**: Declinou o convite

### ✏️ Editar Evento

⚠️ **Apenas o organizador pode editar**

1. Vá em **"Meus Eventos"**
2. Clique no menu (⋮) do evento
3. Clique em **"Editar"**
4. Faça as alterações
5. Clique em **"Salvar Alterações"**

### 🗑️ Deletar Evento

⚠️ **Apenas o organizador pode deletar**

1. Vá em **"Meus Eventos"**
2. Clique no menu (⋮) do evento
3. Clique em **"Deletar"**
4. Confirme a exclusão

---

## 📱 Navegação

### Abas do Dashboard

| Aba | Descrição |
|-----|-----------|
| **Todos os Eventos** | Visualiza todos os eventos públicos do sistema |
| **Meus Eventos** | Eventos que você criou (organizador) |
| **Eventos Aceitos** | Eventos para os quais você confirmou presença |
| **Convites Pendentes** | Convites aguardando sua resposta 🔴 |

---

## 💡 Dicas

### Para Organizadores

✅ **Convide antes do evento**: Envie convites com antecedência para dar tempo das pessoas responderem

✅ **Acompanhe os participantes**: Verifique regularmente quem confirmou presença

✅ **Atualize se necessário**: Você pode editar data/hora se houver mudanças

### Para Participantes

✅ **Responda os convites**: Mantenha sua agenda atualizada aceitando ou recusando convites

✅ **Verifique "Eventos Aceitos"**: Consulte seus compromissos confirmados

✅ **Veja os participantes**: Saiba quem mais estará no evento

---

## 🎯 Casos de Uso Comuns

### Organizar uma Reunião de Equipe
1. Criar evento "Reunião Semanal"
2. Convidar toda a equipe
3. Acompanhar confirmações
4. Ver lista de presentes

### Participar de um Evento
1. Verificar "Convites Pendentes"
2. Ler detalhes do evento
3. Aceitar ou recusar
4. Se aceitar, evento aparece em "Eventos Aceitos"

### Consultar sua Agenda
1. Ir em "Eventos Aceitos" - ver eventos que você vai participar
2. Ir em "Meus Eventos" - ver eventos que você organizou
3. Verificar "Convites Pendentes" regularmente

---

## ❓ FAQ

**P: Posso editar um evento que não criei?**  
R: Não, apenas o organizador pode editar ou deletar eventos.

**P: Como sei se alguém aceitou meu convite?**  
R: Clique em "Participantes" no seu evento e veja o status de cada pessoa.

**P: Posso cancelar minha confirmação?**  
R: Atualmente não, mas você pode pedir ao organizador para removê-lo ou simplesmente não comparecer.

**P: Os outros participantes podem me ver?**  
R: Sim, qualquer pessoa pode ver a lista de participantes de um evento.

**P: Quanto tempo tenho para responder um convite?**  
R: Não há limite, mas é bom responder logo para o organizador planejar melhor.

**P: Posso convidar alguém que ainda não tem conta?**  
R: Não, a pessoa precisa criar uma conta no sistema primeiro.

---

## 🐛 Problemas Comuns

### "Token inválido ou expirado"
- **Solução**: Faça logout e login novamente. O token dura 1 hora.

### Não vejo meus convites
- **Solução**: Clique na aba "Convites Pendentes" e atualize a página.

### Erro ao criar evento
- **Solução**: Verifique se preencheu todos os campos obrigatórios e se a data de fim é depois da data de início.

### Não consigo editar um evento
- **Solução**: Verifique se você é o organizador do evento. Apenas organizadores podem editar.

---

## 🔐 Segurança

- Nunca compartilhe sua senha
- O sistema usa criptografia forte (bcrypt + JWT)
- Sua senha não é visível nem para administradores
- Tokens expiram em 1 hora para sua segurança

---

## 📞 Suporte

Se encontrar algum problema:
1. Verifique o console do navegador (F12)
2. Verifique se os serviços backend estão rodando
3. Consulte o arquivo `README_IMPLEMENTACAO.md` para detalhes técnicos

---

**Pronto para começar?** 🎉  
Crie sua conta e organize sua primeira reunião!

