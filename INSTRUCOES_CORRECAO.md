# 🔧 Instruções para Corrigir o Erro de Criação/Edição de Eventos

## 🐛 Problema Identificado

O código da aplicação está tentando usar a coluna `is_public` na tabela `eventos`, mas essa coluna **não existe** no banco de dados atual. Isso causa um erro SQL sempre que você tenta:
- ✖️ Criar um novo evento
- ✖️ Editar um evento existente

## ✅ Solução

Você precisa adicionar a coluna `is_public` à tabela `eventos` no seu banco de dados PostgreSQL no Render.

## 📝 Passo a Passo

### Opção 1: Via Render Dashboard (Recomendado)

1. **Acesse o Render**: https://dashboard.render.com
2. **Navegue até seu banco de dados PostgreSQL**
3. **Clique na aba "Shell"** ou **"Connect"**
4. **Execute o seguinte comando SQL**:

```sql
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;
UPDATE eventos SET is_public = TRUE WHERE is_public IS NULL;
```

5. **Verifique se funcionou** executando:

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'eventos';
```

Você deve ver a coluna `is_public` listada.

### Opção 2: Via psql (Linha de Comando)

Se você preferir usar o terminal:

1. **Obtenha a connection string** do seu banco no Render:
   - Vá para o banco de dados no Render Dashboard
   - Copie a "External Database URL"

2. **Conecte-se via psql**:

```bash
psql "sua-connection-string-aqui"
```

3. **Execute os comandos SQL**:

```sql
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;
UPDATE eventos SET is_public = TRUE WHERE is_public IS NULL;
```

4. **Saia do psql**:

```bash
\q
```

### Opção 3: Usando o arquivo SQL fornecido

Você pode usar o arquivo `add_is_public_column.sql` que foi criado:

1. Conecte-se ao banco via psql (veja Opção 2)
2. Execute o arquivo:

```bash
\i add_is_public_column.sql
```

## 🧪 Teste Após a Correção

Após executar o SQL:

1. **Reinicie seus serviços no Render** (opcional, mas recomendado)
2. **Tente criar um novo evento** no frontend
3. **Tente editar um evento existente**

Ambas as operações devem funcionar normalmente agora!

## 📋 Schema Atualizado

Após a correção, sua tabela `eventos` terá a seguinte estrutura:

```sql
CREATE TABLE eventos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    organizer_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_public BOOLEAN DEFAULT TRUE,  -- ✨ NOVA COLUNA
    
    CONSTRAINT fk_organizer
        FOREIGN KEY (organizer_id)
        REFERENCES usuarios (id)
        ON DELETE CASCADE
);
```

## 🎯 O que a coluna `is_public` faz?

- **TRUE (padrão)**: O evento é público e visível para todos os usuários
- **FALSE**: O evento é privado e apenas usuários convidados podem vê-lo

## ❓ Precisa de Ajuda?

Se encontrar algum erro ao executar o SQL, me envie a mensagem de erro completa para eu ajudá-lo!

## ✅ Verificação Final

Para confirmar que tudo está funcionando, verifique se:

- [ ] A coluna `is_public` foi adicionada ao banco de dados
- [ ] Você consegue criar novos eventos sem erros
- [ ] Você consegue editar eventos existentes sem erros
- [ ] Os eventos públicos/privados funcionam conforme esperado

