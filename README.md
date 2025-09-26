# Agenda Compartilhada – Serviços com Comunicação REST

## 📌 Descrição
Este projeto demonstra a **implementação mínima de dois serviços REST** que se comunicam entre si:
- **Serviço 1 – Usuários:** gerencia os usuários do sistema.
- **Serviço 2 – Eventos:** gerencia os eventos criados pelos usuários.

Foi utilizado **PostgreSQL** como banco de dados e a comunicação entre os serviços é feita via **REST**.

---

## 🗂 Estrutura do Projeto
agenda-compartilhada/
│
├── servico1/ # Serviço de Usuários
│ ├── index.js # API REST para usuários
│ └── db.js # Conexão com PostgreSQL
│
├── servico2/ # Serviço de Eventos
│ ├── index.js # API REST para eventos
│ └── db.js # Conexão com PostgreSQL
│
├── package.json
└── README.md


---

## ⚙️ Tecnologias Utilizadas
- Node.js + Express
- PostgreSQL
- pgAdmin (para gerenciar o banco)
- curl (para testes REST)
- concurrently (para rodar os dois serviços juntos)

---

## 🚀 Como Rodar Localmente

### 1. Pré-requisitos
- [Node.js](https://nodejs.org/) instalado
- [PostgreSQL](https://www.postgresql.org/) + [pgAdmin](https://www.pgadmin.org/) configurados

Instalar dependências

npm install

Configurar Banco de Dados

CREATE DATABASE agenda;

\c agenda

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100),
    email VARCHAR(100)
);

CREATE TABLE eventos (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(100),
    descricao TEXT,
    data DATE,
    hora TIME,
    usuario_id INT REFERENCES usuarios(id)
);


