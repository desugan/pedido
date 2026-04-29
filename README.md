# Buteco do TI - Sistema de Pedidos

**Versão:** 1.5.0

Sistema de gerenciamento de pedidos com controle de crédito, pagamento, estoque e relatórios detalhados.

---

## 🚀 Funcionalidades

### 🛒 Pedidos & Vendas
- **Criação Ágil:** Adicione itens do catálogo rapidamente.
- **Estoque em Tempo Real:** Controle automático de entradas e saídas.
- **Fluxo de Status:** Pendente, Confirmado, Em pagamento, Pago e Cancelado.
- **Visualização Detalhada:** Modal com histórico e detalhes do pedido.

### 💸 Pagamentos & PIX
- **QR Code Automático:** Geração de QR Code PIX dinâmico.
- **Gestão de Chaves:** Configuração flexível da chave PIX receptora.
- **Conciliação:** Filtros por status (Abertos, Confirmados, Excluídos).
- **Vínculo Direto:** Histórico de pedidos associados a cada pagamento.

### 🔐 Segurança & Perfil
- **Sessão Segura:** Logout automático após 2 minutos de inatividade.
- **Troca de Senha:** Funcionalidade integrada para usuários.
- **Autenticação Robusta:** JWT com criptografia assimétrica (RS256).
- **Controle de Acesso:** Níveis diferenciados (Admin vs. Cliente).

### 🛠️ Administração (Painel Admin)
- **Clientes:** Cadastro, controle de limite de crédito e visualização de saldo.
- **Produtos:** Gestão de catálogo, saldo em estoque e valorização.
- **Fornecedores:** Cadastro com validação de CNPJ.
- **Lançamentos:** Entrada manual de estoque com histórico auditável.
- **Usuários:** Gestão completa de perfis e logs de acesso.

### 📊 Relatórios & Monitoramento
- **Extrato:** Histórico financeiro detalhado por cliente.
- **Dashboard:** Visão geral de pedidos e faturamento.
- **Health Check:** Monitoramento em tempo real do status da API e Banco de Dados.

---

## 🛠️ Tecnologias

| Componente | Tecnologia |
|------------|------------|
| **Backend (Principal)** | Flask (Python) + MySQL |
| **Backend (Alternativo)** | Express (Node.js) + Prisma |
| **Frontend** | React + Vite + TypeScript + Tailwind |
| **Autenticação** | JWT Bearer Token (RS256) |
| **Infra** | Docker & Docker Compose |

---

## 📦 Instalação e Configuração

### 1. Pré-requisitos
- Node.js (v18+)
- Python (v3.10+)
- Docker & Docker Compose (opcional, mas recomendado)

### 2. Configuração do Ambiente
Copie o arquivo de exemplo e configure suas variáveis:
```bash
cp .env.example .env
```
> **Nota:** Certifique-se de que os arquivos `jwt_private.pem` e `jwt_public.pem` existam na pasta `backend_flask/` para o funcionamento do JWT.

### 3. Execução com Docker (Recomendado)
Para subir todo o ambiente (Banco + App) em segundos:
```bash
docker-compose up -d
```

### 4. Execução Manual (Desenvolvimento)
Se preferir rodar localmente sem Docker:

**Instale as dependências:**
```bash
# Dependências do Workspace e Frontend
npm install

# Ambiente Virtual Python
python -m venv backend_flask/.venv
# Windows: backend_flask\.venv\Scripts\activate
# Linux/Mac: source backend_flask/.venv/bin/activate
pip install -r backend_flask/requirements.txt
```

**Inicie o Banco de Dados:**
```bash
docker run -d --name mysql-pedido -e MYSQL_ROOT_PASSWORD=senha -e MYSQL_DATABASE=pedido -p 3306:3306 mysql:8.0
```

**Rode o projeto:**
```bash
# Inicia Frontend + Backend Flask simultaneamente
npm run dev
```

---

## 📂 Estrutura do Projeto

```text
.
├── backend/            # Backend alternativo em Node.js (Express/Prisma)
├── backend_flask/      # Backend principal em Flask
│   ├── app/
│   │   ├── routes/     # Endpoints da API
│   │   └── db.py       # Conexão MySQL
│   └── run.py          # Entry point Flask
├── frontend/           # Aplicação React
│   ├── src/
│   │   ├── components/ # UI Components (Toast, Skeletons)
│   │   ├── pages/      # Telas da aplicação
│   │   └── services/   # Integração com API
│   └── vite.config.ts
├── docker-compose.yml  # Orquestração de containers
└── README.md
```

---

## ✨ Novidades v1.5.0
- **Monitoramento:** Indicadores visuais de conexão (API/DB) no cabeçalho.
- **Segurança:** Sistema de expiração de sessão por inatividade.
- **UI/UX:** Adição de "Skeleton Loaders" para carregamento suave.
- **Toasts:** Notificações flutuantes aprimoradas para feedbacks de erro/sucesso.
- **Performance:** Build otimizado e redução de bundle size.

---

## ❓ Troubleshooting

### Sessão expirando rápido demais?
- O sistema possui um timer de 2 minutos de inatividade por segurança. Você pode ajustar esse valor no `App.tsx` se necessário.

### Erro de Autenticação (JWT)
- Verifique se as chaves RSA (.pem) foram geradas e estão na pasta correta.
- O backend Flask espera chaves RS256 para assinatura dos tokens.

### Problemas com o Banco de Dados
- Se usar Docker Compose, verifique os logs: `docker-compose logs -f mysql`.
- Certifique-se de que a `DATABASE_URL` no `.env` aponta para o host correto (`localhost` manual ou `mysql` no Docker).
