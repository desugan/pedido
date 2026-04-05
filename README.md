# Buteco do TI - Sistema de Pedidos

Versao atual: 1.2.0

Sistema de pedidos com frontend React e API Flask, com controle de credito, pagamento, estoque e relatorios.

## Visao Geral

- Backend: Flask + MySQL
- Frontend: React + Vite + TypeScript + Tailwind CSS
- Banco: MySQL via Docker
- Autenticacao: JWT Bearer Token
- Porta padrao da API Flask: 5000

## Requisitos

- Python 3.12+
- Node.js 22+
- npm
- Docker + Docker Compose

## Setup Rapido

1. Copie as variaveis de ambiente:

```bash
cp .env.example .env
cp backend_flask/.env.example backend_flask/.env
```

2. Instale as dependencias do frontend:

```bash
npm install
npm --prefix frontend install
```

3. Crie e ative um ambiente virtual para a API Flask:

```bash
python3 -m venv backend_flask/.venv
. backend_flask/.venv/bin/activate
pip install -r backend_flask/requirements.txt
```

4. Suba o MySQL:

```bash
docker-compose up -d mysql
```

5. Suba backend e frontend:

```bash
npm run dev
```

Os scripts da raiz usam automaticamente `backend_flask/.venv/bin/python`.

## Variaveis de Ambiente

Arquivo base: .env.example

### Banco

- MYSQL_ROOT_PASSWORD
- MYSQL_DATABASE
- MYSQL_USER
- MYSQL_PASSWORD
- MYSQL_PORT

### API Flask

- FLASK_ENV
- PORT
- HOST_IP
- API_URL
- JWT_SECRET
- CORS_ORIGIN

### Frontend

- VITE_API_URL
- VITE_API_PROTOCOL
- VITE_API_HOST
- VITE_API_PORT
- VITE_PORT

Exemplo:

```bash
HOST_IP=192.168.0.18
API_URL=http://192.168.0.18:5000
VITE_API_URL=http://192.168.0.18:5000
VITE_API_HOST=192.168.0.18
VITE_API_PORT=5000
```

## Comandos do Projeto

```bash
npm run dev
npm run build
npm test
npm --prefix frontend run dev
npm --prefix frontend run build
```

## Estrutura de Pastas

```text
.
|-- backend_flask/
|   |-- app/
|   |-- tests/
|   `-- run.py
|-- frontend/
|   `-- src/
|-- docker-compose.yml
`-- README.md
```

## Observacoes

- A API Node foi removida do projeto.
- A aplicacao frontend deve apontar para a API Flask na porta 5000.
- Se alterar `.env`, reinicie backend e frontend.
