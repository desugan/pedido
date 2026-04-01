# Buteco do TI - Sistema de Pedidos

Versao atual: 1.2.0

Sistema de pedidos com controle de credito, pagamento, estoque e relatorios. Este README consolida arquitetura, operacao, seguranca e todas as demandas funcionais solicitadas para a versao 1.2.

## Visao Geral

- Backend: Node.js + TypeScript + Express + Prisma + MySQL
- Frontend: React + Vite + TypeScript + Tailwind CSS
- Banco: MySQL via Docker
- Autenticacao: JWT Bearer Token
- Execucao local: backend e frontend com um unico comando

## Principais Entregas da Versao 1.2

### Seguranca e acesso

- Autenticacao JWT no backend
- Middleware global protegendo rotas da API
- Endpoint publico permitido: POST /api/auth/login
- Endpoint de saude publico: GET /health
- Senhas com bcrypt
- CORS controlado por variavel de ambiente
- Remocao de exposicao de campos sensiveis de usuario

### Pedidos e pagamentos

- Novo status de pedido: em_pagamento
- Pedido usado para gerar pagamento sai da selecao de pagamento
- Exclusao de pagamento reverte pedidos para confirmado
- Reversao de estoque e credito em fluxos de cancelamento/exclusao
- Remocao de item em pedido existente
- Coluna Cliente em Pedidos exibe nome do cliente (nao apenas Cliente N)

### Regras de credito e cliente

- Cliente so fica inadimplente se estiver inativado e com debitos
- Cartoes de credito no relatorio corrigidos para usar fonte correta
- Ajustes de duplicacao e consistencia de informacoes de credito

### Interface e exibicao

- Valores monetarios com formato R$ onde aplicavel
- Total de lancamentos exibido com moeda
- Produtos com identificacao de campos melhorada
- Quantidade tratada como inteiro (sem virgula)
- Ajustes de alinhamento em secoes de relatorio de pedidos/pagamentos

### Operacao e ambiente

- Host/IP centralizado por variaveis de ambiente
- Sem necessidade de editar varios arquivos ao trocar IP
- Comando unico para subir backend + frontend
- Versao dos pacotes atualizada para 1.2.0

## Requisitos

- Node.js 22+
- npm
- Docker + Docker Compose

## Setup Rapido

1. Copie variaveis de ambiente:

```bash
cp .env.example .env
```

2. Instale dependencias:

```bash
npm install
npm --prefix backend install
npm --prefix frontend install
```

3. Suba banco MySQL:

```bash
docker-compose up -d mysql
```

4. Rode migrations:

```bash
npm --prefix backend run db:migrate
```

5. Suba backend + frontend em um comando:

```bash
npm run dev
```

## Variaveis de Ambiente

Arquivo base: .env.example

### Banco

- MYSQL_ROOT_PASSWORD
- MYSQL_DATABASE
- MYSQL_USER
- MYSQL_PASSWORD
- MYSQL_PORT

### API

- NODE_ENV
- PORT
- HOST_IP
- API_URL

### Seguranca

- JWT_SECRET
- CORS_ORIGIN (lista separada por virgula)

### Frontend

- VITE_API_URL
- VITE_API_PROTOCOL
- VITE_API_HOST
- VITE_API_PORT
- VITE_PORT

Exemplo para trocar host sem tocar no codigo:

```bash
HOST_IP=192.168.0.18
API_URL=http://192.168.0.18:3000
VITE_API_URL=http://192.168.0.18:3000
VITE_API_HOST=192.168.0.18
VITE_API_PORT=3000
```

## Comandos do Projeto

### Raiz

```bash
npm run dev      # sobe backend + frontend com concurrently
npm run build    # build backend + frontend
npm test         # testes backend
```

### Backend

```bash
npm --prefix backend run dev
npm --prefix backend run build
npm --prefix backend test
npm --prefix backend run test:coverage
npm --prefix backend run db:migrate
npm --prefix backend run db:studio
```

### Frontend

```bash
npm --prefix frontend run dev
npm --prefix frontend run build
npm --prefix frontend run type-check
```

## Estrutura de Pastas

```text
.
|-- backend/
|   |-- prisma/
|   `-- src/
|       |-- controllers/
|       |-- middleware/
|       |-- repositories/
|       |-- routes/
|       |-- services/
|       |-- types/
|       |-- utils/
|       `-- server.ts
|-- frontend/
|   `-- src/
|       |-- components/
|       |-- pages/
|       |-- services/
|       |-- styles/
|       `-- types/
|-- docker-compose.yml
`-- README.md
```

## Regras de Negocio (Resumo)

### Pedido

- Status suportados: pendente, confirmado, em_pagamento, pago, cancelado
- Pedido em pagamento nao deve aparecer para novo pagamento
- Ao excluir pagamento, pedido volta para confirmado
- Cancelamentos/exclusoes devem reverter estoque e credito conforme fluxo

### Cliente e credito

- Cliente inadimplente somente quando inativado e com debitos
- Limite, utilizado e saldo devem permanecer consistentes apos reversoes

### Produtos

- Quantidade sempre inteira
- Exibicao de valores monetarios no formato BRL

## API e Seguranca

- Token JWT enviado no header Authorization: Bearer <token>
- Rotas protegidas por middleware de autenticacao
- CORS com whitelist configuravel por env
- Senhas com hash bcrypt

## Testes e Qualidade

- Testes unitarios/integracao no backend (Jest)
- Configuracao ts-jest atualizada para formato nao deprecado
- Build frontend validado
- Build backend validado

## Troubleshooting

### Porta ocupada (3000 ou 5173)

- Encerre processos da porta e rode novamente npm run dev

### Frontend nao encontra API

- Revise HOST_IP, VITE_API_URL e CORS_ORIGIN no .env
- Reinicie backend e frontend apos alterar .env

### Falha de autenticacao

- Verifique JWT_SECRET configurado
- Confirme se o token esta sendo enviado no header Authorization

## Versionamento

- Workspace: 1.2.0
- Backend: 1.2.0
- Frontend: 1.2.0

## Licenca

MIT
