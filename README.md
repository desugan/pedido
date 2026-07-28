# Pedidos — Sistema de Gestão

Sistema de pedidos, pagamentos, clientes e controle financeiro.

## Arquitetura

```
pedido/
├── api/          # Backend Flask (Python)
│   ├── app/
│   │   ├── routes/     → Validação e serializsação (Pydantic)
│   │   ├── services/   → Orquestração e regras de negócio
│   │   ├── queries/    → SQL puro (MySQL)
│   │   ├── schemas/    → Schemas Pydantic v2
│   │   ├── auth_guard.py
│   │   ├── config.py
│   │   ├── db.py       → PyMySQL connection pool
│   │   ├── security.py → MD5 + JWT HS256
│   │   └── __init__.py → create_app + migrar_schema()
│   ├── run.py       → flask run (porta 5001)
│   ├── requirements.txt
│   └── tests/
└── web/          # Frontend React (Vite + TypeScript + Tailwind)
    └── src/
        ├── pages/      → 13 páginas
        ├── components/ → Componentes reutilizáveis
        ├── hooks/      → Hook por recurso
        ├── services/   → api.get/post wrappers
        ├── mapper/     → snake_case → camelCase
        ├── utils/      → PIX QR Code, formatação
        ├── types/      → Interfaces TypeScript
        └── styles/     → CSS
```

### Backend: Route → Service → Query

```
GET /api/pedidos
  → routes/pedidos.py (valida)
    → services/pedido_service.py (orquestra)
      → queries/pedido_queries.py (SQL)
```

### Frontend: Component → Hook → Service

```
Pedidos.tsx
  → hooks/usePedidos.ts
    → services/pedidoService.ts
      → api.get('/api/pedidos')
```

## Funcionalidades

- **Pedidos**: CRUD, controle de estoque, status (pendente/confirmado/pago/cancelado)
- **Pagamentos**: PIX (QR Code BR Code EMV®), múltiplos pedidos por pagamento, vínculo financeiro
- **Clientes**: Cadastro, limite de crédito, saldo utilizado
- **Produtos**: Cadastro, saldo, preço
- **Fornecedores**: Cadastro de fornecedores
- **Lançamentos**: Notas de entrada, ajuste de estoque
- **Usuários**: Perfis (admin/usuário), autenticação MD5
- **Relatórios**: Detalhamento por cliente com pedidos + pagamentos
- **Autenticação**: JWT HS256, rate-limit por IP, 2 níveis de perfil

## Stack

| Layer | Tecnologia |
|-------|-----------|
| Backend | Python 3, Flask 3.1, PyMySQL, PyJWT, Pydantic v2 |
| Frontend | React 18, TypeScript, Vite 5, Tailwind CSS |
| Banco | MySQL 8 |
| Auth | JWT (HS256), senhas MD5 |
| Pagamento | PIX BR Code EMV® (CRC16-CCITT) |

## Setup

### Pré-requisitos
- Python 3.11+
- Node.js 20+
- MySQL 8
- `.env` em `api/`:

```
DATABASE_URL=mysql+pymysql://user:pass@host/db
PORT=5001
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173,http://192.168.0.115:5171
JWT_SECRET=<sua_chave_secreta>
```

### Backend

```bash
cd api
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python run.py
# → http://localhost:5001
```

### Frontend

```bash
cd web
npm install
npm run dev
# → http://localhost:5173
```

### Ambos simultâneos (raiz)

```bash
npm run dev
```

## Rotas da API

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/login` | Login |
| PATCH | `/api/auth/senha` | Alterar senha |
| GET | `/api/clientes` | Listar clientes |
| GET | `/api/pedidos` | Listar pedidos |
| GET | `/api/pedidos/para-pagamento` | Pedidos disponíveis para pagamento |
| POST | `/api/pedidos` | Criar pedido |
| PATCH | `/api/pedidos/<id>/status` | Atualizar status do pedido |
| POST | `/api/pedidos/<id>/itens` | Adicionar item ao pedido |
| DELETE | `/api/pedidos/<id>/itens/<item_id>` | Remover item do pedido |
| DELETE | `/api/pedidos/<id>` | Deletar pedido |
| GET | `/api/pagamentos` | Listar pagamentos |
| GET | `/api/pagamentos/cliente/<id>` | Pagamentos de um cliente |
| POST | `/api/pagamentos` | Criar pagamento |
| PATCH | `/api/pagamentos/<id>/status` | Atualizar status do pagamento |
| DELETE | `/api/pagamentos/<id>` | Deletar pagamento |
| GET | `/api/produtos` | Listar produtos |
| GET | `/api/fornecedores` | Listar fornecedores |
| GET | `/api/lancamentos` | Listar lançamentos |
| GET | `/api/relatorios/usuario` | Relatório detalhado por cliente |
| GET | `/api/relatorios/pedidos` | Relatório de pedidos |
| GET | `/api/relatorios/pagamentos` | Relatório de pagamentos |
| GET | `/api/relatorios/clientes` | Relatório de clientes |
| GET | `/api/relatorios/vendas` | Relatório de vendas |
| GET | `/api/usuarios` | Listar usuários (admin) |

## Testes

```bash
cd api
pytest
```
