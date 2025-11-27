# 🔍 Diagnóstico Completo - Erro ao Criar/Editar Eventos

## 📊 Resumo do Problema

**Status**: ✖️ ERRO IDENTIFICADO  
**Severidade**: 🔴 CRÍTICO  
**Impacto**: Impossibilita criação e edição de eventos

---

## 🐛 Causa Raiz

O erro ocorre devido a uma **incompatibilidade entre o schema do banco de dados e o código da aplicação**:

### ❌ Schema Atual do Banco (INCOMPLETO)

```sql
CREATE TABLE eventos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    organizer_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    -- ❌ FALTA: is_public BOOLEAN
);
```

### ✅ O que o Código Espera

**Arquivo**: `servico2/index.js`

**Linha 112** (POST /eventos):
```javascript
"INSERT INTO eventos (title, description, start_time, end_time, organizer_id, is_public) 
VALUES ($1, $2, $3, $4, $5, $6) RETURNING *"
```

**Linha 291** (PUT /eventos/:id):
```javascript
"UPDATE eventos SET title=$1, description=$2, start_time=$3, end_time=$4, is_public=$5 
WHERE id=$6 RETURNING *"
```

**Frontend**: `frontend/src/api/apiService.js`
```javascript
async createEvent(title, description, start_time, end_time, organizer_id, is_public = true) {
  // ... envia is_public
}
```

---

## 💥 Sintomas do Erro

Quando você tenta criar ou editar um evento, o PostgreSQL retorna:

```
ERROR: column "is_public" of relation "eventos" does not exist
```

---

## ✅ Solução

### Passo 1: Adicionar a Coluna ao Banco de Dados

Execute este SQL no seu banco PostgreSQL no Render:

```sql
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;
UPDATE eventos SET is_public = TRUE WHERE is_public IS NULL;
```

### Passo 2: Verificar a Correção

```sql
-- Verifica se a coluna foi adicionada
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'eventos' AND column_name = 'is_public';
```

Resultado esperado:
```
 column_name | data_type | column_default 
-------------+-----------+----------------
 is_public   | boolean   | true
```

### Passo 3: Testar a Aplicação

1. Tente criar um novo evento
2. Tente editar um evento existente
3. Verifique se ambas as operações funcionam

---

## 📁 Arquivos Afetados

### Backend - servico2/index.js

| Linha | Função | Problema |
|-------|--------|----------|
| 112   | POST /eventos | Tenta inserir `is_public` |
| 291   | PUT /eventos/:id | Tenta atualizar `is_public` |

### Frontend

| Arquivo | Linha | Componente |
|---------|-------|------------|
| apiService.js | 130-138 | createEvent() |
| apiService.js | 149-157 | updateEvent() |
| Dashboard.jsx | 46-51 | eventForm state |

---

## 🎯 Funcionalidade da Coluna `is_public`

A coluna `is_public` controla a visibilidade dos eventos:

| Valor | Comportamento |
|-------|---------------|
| `TRUE` | 🌐 **Evento Público** - Visível para todos os usuários, qualquer um pode participar |
| `FALSE` | 🔒 **Evento Privado** - Visível apenas para convidados, requer convite para participar |

### Lógica no Código

**servico2/index.js** (linha 334-384):
```javascript
// Se o evento é privado, verifica se o usuário foi convidado
if (!event.is_public && event.organizer_id !== userId) {
    const inviteCheck = await pool.query(
        "SELECT id FROM participacoes WHERE event_id = $1 AND user_id = $2",
        [evento_id, userId]
    );

    if (inviteCheck.rows.length === 0) {
        return res.status(403).json({
            error: "Este evento é privado. Você precisa de um convite para participar."
        });
    }
}
```

---

## 🔧 Como Executar a Correção

### Opção A: Render Dashboard (MAIS FÁCIL)

1. Acesse: https://dashboard.render.com
2. Vá para seu banco PostgreSQL
3. Clique em **"Shell"** ou **"Connect"**
4. Cole e execute:

```sql
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;
```

### Opção B: Linha de Comando (psql)

```bash
# Conectar ao banco (use a External Database URL do Render)
psql "postgresql://usuario:senha@host:5432/database"

# Executar o comando
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;

# Sair
\q
```

### Opção C: Usar Arquivo SQL

```bash
psql "sua-connection-string" -f add_is_public_column.sql
```

---

## 🧪 Validação Pós-Correção

Execute estes testes:

### 1. Verificar Schema
```sql
\d eventos
```

Deve mostrar:
```
Column      |  Type   | Nullable | Default 
------------+---------+----------+---------
is_public   | boolean |          | true
```

### 2. Criar Evento Público
```javascript
// Frontend - Dashboard
{
  title: "Teste Público",
  is_public: true
}
```

### 3. Criar Evento Privado
```javascript
// Frontend - Dashboard
{
  title: "Teste Privado",
  is_public: false
}
```

### 4. Editar Evento
```javascript
// Alterar qualquer evento existente
// Deve funcionar sem erros
```

---

## 📊 Checklist de Resolução

- [ ] Executar SQL para adicionar coluna `is_public`
- [ ] Verificar que a coluna existe no banco
- [ ] Testar criação de evento público
- [ ] Testar criação de evento privado
- [ ] Testar edição de evento
- [ ] Verificar logs do servico2 (não deve haver erros SQL)
- [ ] Confirmar que eventos privados só permitem convidados

---

## 🚨 Se o Erro Persistir

Se após executar o SQL você ainda tiver problemas:

1. **Verifique as variáveis de ambiente** do servico2 no Render:
   - `DATABASE_URL` deve apontar para o banco correto

2. **Reinicie o servico2** no Render:
   - Manual Deploys → Deploy latest commit

3. **Verifique os logs** do servico2:
   ```
   Logs → Filter by "error" or "eventos"
   ```

4. **Teste a conexão** com o banco:
   ```bash
   psql "sua-connection-string" -c "SELECT * FROM eventos LIMIT 1;"
   ```

---

## 📞 Suporte Adicional

Se precisar de ajuda:

1. Me envie os **logs do servico2** quando tentar criar um evento
2. Me envie o resultado de: `\d eventos` executado no banco
3. Me confirme se executou o SQL corretamente

---

## 📝 Notas Importantes

- ⚠️ Esta correção **NÃO** afeta dados existentes
- ✅ Eventos existentes serão marcados como `is_public = TRUE` por padrão
- ✅ A operação é **segura** e **reversível**
- ✅ O código já está preparado para usar esta funcionalidade
- ✅ Não é necessário alterar código, apenas o banco de dados

---

**Data do Diagnóstico**: 2025-11-27  
**Status**: Aguardando execução do SQL no banco de dados Render

