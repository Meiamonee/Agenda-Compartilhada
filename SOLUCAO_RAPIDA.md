# 🚀 SOLUÇÃO RÁPIDA - Erro ao Criar/Editar Eventos

## ❌ O PROBLEMA

Você não consegue criar ou editar eventos porque **falta uma coluna no banco de dados**.

O código espera a coluna `is_public` mas ela não existe na tabela `eventos`.

---

## ✅ A SOLUÇÃO - ESCOLHA UMA:

### 🎯 OPÇÃO 1: Usar o Script Automático (MAIS FÁCIL!)

Você já tem um script pronto chamado `fix_schema.js` no servico2!

**No seu computador local:**

```bash
cd servico2
node fix_schema.js
```

**OU no Render (via Shell):**

1. Acesse: https://dashboard.render.com
2. Vá em **servico2** (não no banco de dados)
3. Clique em **"Shell"**
4. Execute:

```bash
node fix_schema.js
```

Você deve ver:
```
🔌 Conectando ao banco de dados...
✅ Conectado!
🛠️ Adicionando coluna 'is_public' à tabela 'eventos'...
✅ Coluna 'is_public' adicionada com sucesso!
```

**PRONTO!** ✅

---

### 🛠️ OPÇÃO 2: Executar SQL Manualmente

**No Render Dashboard:**

1. Entre em: https://dashboard.render.com
2. Clique no seu **PostgreSQL Database**
3. Clique na aba **"Shell"** ou **"Connect"**
4. Cole e execute:

```sql
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;
```

5. Confirme que funcionou:

```sql
\d eventos
```

Você deve ver a coluna `is_public` na lista.

---

## 🧪 Testar a Correção

Após executar qualquer uma das opções acima:

1. Acesse sua aplicação frontend
2. Tente **criar um novo evento**
3. Tente **editar um evento existente**

**DEVE FUNCIONAR AGORA!** ✅

Se quiser garantir, reinicie o servico2 no Render:
- Vá em **servico2**
- Clique em **"Manual Deploy"** → **"Deploy latest commit"**

---

## 🤔 O QUE FAZ A COLUNA `is_public`?

- ✅ **TRUE (padrão)**: Evento público - todos podem ver e participar
- 🔒 **FALSE**: Evento privado - só convidados podem ver

---

## 📞 AINDA NÃO FUNCIONA?

Se continuar com erro:

1. Me envie a mensagem de erro completa
2. Me envie o resultado do comando: `\d eventos`
3. Verifique os logs do **servico2** no Render

---

## 📋 RESUMO DO QUE ACONTECEU

- Seu código já estava **correto**
- O problema era apenas que **faltava uma coluna no banco**
- Ao adicionar a coluna, tudo volta a funcionar
- Nenhum dado existente é afetado

---

## ✨ BONUS: Schema Completo Atualizado

Depois da correção, sua tabela `eventos` fica assim:

```sql
CREATE TABLE eventos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    organizer_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_public BOOLEAN DEFAULT TRUE, -- ✨ NOVA!
    
    CONSTRAINT fk_organizer
        FOREIGN KEY (organizer_id)
        REFERENCES usuarios (id)
        ON DELETE CASCADE
);
```

---

**Criado em**: 27/11/2025  
**Tempo estimado**: 3 minutos  
**Dificuldade**: ⭐ Muito Fácil

