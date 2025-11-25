# 🧪 Testes de API - Agenda Compartilhada

Este arquivo contém exemplos de requisições para testar a API usando **curl**, **Postman**, **Insomnia** ou qualquer cliente HTTP.

## 🔐 Serviço 1 - Usuários (Porta 3001)

### 1. Registrar Novo Usuário

```bash
curl -X POST http://localhost:3001/usuarios \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "email": "joao@email.com",
    "senha": "123456"
  }'
```

**Resposta esperada:**
```json
{
  "id": 1,
  "email": "joao@email.com",
  "nome": "João Silva"
}
```

### 2. Fazer Login

```bash
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@email.com",
    "senha": "123456"
  }'
```

**Resposta esperada:**
```json
{
  "message": "Login bem-sucedido!",
  "user": {
    "id": 1,
    "email": "joao@email.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

⚠️ **IMPORTANTE**: Salve o token retornado! Você precisará dele para as próximas requisições.

### 3. Listar Todos os Usuários (Protegida)

```bash
curl -X GET http://localhost:3001/usuarios \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada:**
```json
[
  {
    "id": 1,
    "email": "joao@email.com"
  },
  {
    "id": 2,
    "email": "maria@email.com"
  }
]
```

### 4. Buscar Usuário por ID (Protegida)

```bash
curl -X GET http://localhost:3001/usuarios/1 \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada:**
```json
{
  "id": 1,
  "email": "joao@email.com"
}
```

---

## 📅 Serviço 2 - Eventos (Porta 3002)

### 5. Criar Evento (Protegida)

```bash
curl -X POST http://localhost:3002/eventos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "title": "Reunião de Planejamento",
    "description": "Discutir metas do trimestre",
    "start_time": "2025-12-01T14:00:00Z",
    "end_time": "2025-12-01T16:00:00Z",
    "organizer_id": 1
  }'
```

**Resposta esperada:**
```json
{
  "id": 1,
  "title": "Reunião de Planejamento",
  "description": "Discutir metas do trimestre",
  "start_time": "2025-12-01T14:00:00.000Z",
  "end_time": "2025-12-01T16:00:00.000Z",
  "organizer_id": 1,
  "created_at": "2025-11-25T10:30:00.000Z"
}
```

### 6. Listar Todos os Eventos (Pública)

```bash
curl -X GET http://localhost:3002/eventos
```

**Resposta esperada:**
```json
[
  {
    "id": 1,
    "title": "Reunião de Planejamento",
    "description": "Discutir metas do trimestre",
    "start_time": "2025-12-01T14:00:00.000Z",
    "end_time": "2025-12-01T16:00:00.000Z",
    "organizer_id": 1,
    "created_at": "2025-11-25T10:30:00.000Z"
  }
]
```

### 7. Atualizar Evento (Protegida)

```bash
curl -X PUT http://localhost:3002/eventos/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "title": "Reunião de Planejamento - ATUALIZADO",
    "description": "Discutir metas e estratégias",
    "start_time": "2025-12-01T15:00:00Z",
    "end_time": "2025-12-01T17:00:00Z"
  }'
```

### 8. Deletar Evento (Protegida)

```bash
curl -X DELETE http://localhost:3002/eventos/1 \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada:**
```json
{
  "message": "Evento deletado com sucesso",
  "evento": {
    "id": 1,
    "title": "Reunião de Planejamento",
    ...
  }
}
```

---

## 👥 Gerenciamento de Participantes

### 9. Enviar Convites (Protegida)

```bash
curl -X POST http://localhost:3002/eventos/1/convidar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "user_ids": [2, 3, 4]
  }'
```

**Resposta esperada:**
```json
{
  "message": "3 convite(s) enviado(s) ou atualizado(s) com sucesso.",
  "invites": [
    {
      "id": 1,
      "event_id": 1,
      "user_id": 2,
      "status": "invited"
    },
    {
      "id": 2,
      "event_id": 1,
      "user_id": 3,
      "status": "invited"
    },
    {
      "id": 3,
      "event_id": 1,
      "user_id": 4,
      "status": "invited"
    }
  ]
}
```

### 10. Listar Participantes de um Evento (Protegida)

```bash
curl -X GET http://localhost:3002/eventos/1/participantes \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada:**
```json
[
  {
    "id": 2,
    "email": "maria@email.com",
    "status": "invited",
    "participation_id": 1
  },
  {
    "id": 3,
    "email": "pedro@email.com",
    "status": "accepted",
    "participation_id": 2
  }
]
```

### 11. Aceitar/Recusar Convite (Protegida)

**Aceitar:**
```bash
curl -X PUT http://localhost:3002/participations/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "status": "accepted"
  }'
```

**Recusar:**
```bash
curl -X PUT http://localhost:3002/participations/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "status": "declined"
  }'
```

**Resposta esperada:**
```json
{
  "message": "Status atualizado para: accepted",
  "participacao": {
    "id": 1,
    "event_id": 1,
    "user_id": 2,
    "status": "accepted"
  }
}
```

### 12. Listar Convites Pendentes do Usuário (Protegida)

```bash
curl -X GET http://localhost:3002/usuarios/2/convites \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada:**
```json
[
  {
    "id": 1,
    "title": "Reunião de Planejamento",
    "description": "Discutir metas do trimestre",
    "start_time": "2025-12-01T14:00:00.000Z",
    "end_time": "2025-12-01T16:00:00.000Z",
    "organizer_id": 1,
    "created_at": "2025-11-25T10:30:00.000Z",
    "participation_id": 1
  }
]
```

### 13. Listar Eventos Aceitos do Usuário (Protegida)

```bash
curl -X GET http://localhost:3002/usuarios/2/aceitos \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada:**
```json
[
  {
    "id": 1,
    "title": "Reunião de Planejamento",
    "description": "Discutir metas do trimestre",
    "start_time": "2025-12-01T14:00:00.000Z",
    "end_time": "2025-12-01T16:00:00.000Z",
    "organizer_id": 1,
    "created_at": "2025-11-25T10:30:00.000Z",
    "participation_id": 1
  }
]
```

---

## 🧪 Cenário de Teste Completo

### Passo a Passo:

```bash
# 1. Criar dois usuários
curl -X POST http://localhost:3001/usuarios \
  -H "Content-Type: application/json" \
  -d '{"nome": "João", "email": "joao@email.com", "senha": "123456"}'

curl -X POST http://localhost:3001/usuarios \
  -H "Content-Type: application/json" \
  -d '{"nome": "Maria", "email": "maria@email.com", "senha": "123456"}'

# 2. Fazer login com João
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{"email": "joao@email.com", "senha": "123456"}'

# Salve o token do João!
JOAO_TOKEN="cole_aqui_o_token_do_joao"

# 3. João cria um evento
curl -X POST http://localhost:3002/eventos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JOAO_TOKEN" \
  -d '{
    "title": "Reunião de Equipe",
    "description": "Reunião semanal",
    "start_time": "2025-12-05T10:00:00Z",
    "end_time": "2025-12-05T11:00:00Z",
    "organizer_id": 1
  }'

# 4. João convida Maria (assumindo que Maria tem ID 2)
curl -X POST http://localhost:3002/eventos/1/convidar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JOAO_TOKEN" \
  -d '{"user_ids": [2]}'

# 5. Fazer login com Maria
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{"email": "maria@email.com", "senha": "123456"}'

# Salve o token da Maria!
MARIA_TOKEN="cole_aqui_o_token_da_maria"

# 6. Maria vê seus convites
curl -X GET http://localhost:3002/usuarios/2/convites \
  -H "Authorization: Bearer $MARIA_TOKEN"

# 7. Maria aceita o convite (assumindo que participation_id é 1)
curl -X PUT http://localhost:3002/participations/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MARIA_TOKEN" \
  -d '{"status": "accepted"}'

# 8. João verifica os participantes
curl -X GET http://localhost:3002/eventos/1/participantes \
  -H "Authorization: Bearer $JOAO_TOKEN"
```

---

## 🔍 Códigos de Status HTTP

| Código | Significado |
|--------|-------------|
| 200 | Sucesso (GET, PUT, DELETE) |
| 201 | Criado com sucesso (POST) |
| 400 | Requisição inválida |
| 401 | Não autenticado (token ausente) |
| 403 | Não autorizado (token inválido ou sem permissão) |
| 404 | Recurso não encontrado |
| 409 | Conflito (ex: email já cadastrado) |
| 500 | Erro interno do servidor |
| 503 | Serviço indisponível (Circuit Breaker aberto) |

---

## 📝 Notas Importantes

1. **Token JWT**: 
   - Expira em 1 hora
   - Deve ser incluído no header `Authorization: Bearer TOKEN`
   - Gerado no login

2. **Permissões**:
   - Apenas o organizador pode editar/deletar eventos
   - Apenas o organizador pode enviar convites
   - Usuários só podem aceitar/recusar seus próprios convites

3. **Datas**:
   - Use formato ISO 8601: `YYYY-MM-DDTHH:mm:ssZ`
   - Timestamps são armazenados em UTC

4. **Circuit Breaker**:
   - Se o Serviço 1 estiver offline, você receberá erro 503
   - O circuit breaker reabre após 10 segundos

---

## 🎯 Importar no Postman/Insomnia

Para facilitar, você pode criar uma Collection com estas requisições e usar variáveis de ambiente:

- `{{baseURL_auth}}` = `http://localhost:3001`
- `{{baseURL_events}}` = `http://localhost:3002`
- `{{token}}` = Token JWT do usuário logado
- `{{userId}}` = ID do usuário logado

Exemplo de requisição com variáveis:
```
POST {{baseURL_events}}/eventos
Authorization: Bearer {{token}}
```

---

**Happy Testing!** 🚀

