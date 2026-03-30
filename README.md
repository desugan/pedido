# 🍺 Buteco do TI - Sistema de Pedidos

Sistema moderno para gerenciamento de pedidos para retirada local.

## 📋 Stack

- **Backend**: Node.js + TypeScript + Express + MySQL + Prisma
- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Infra**: Docker com MySQL

## 🚀 Quick Start

### Pré-requisitos
- Docker & Docker Compose
- Node.js 22+ (para desenvolvimento local)
- npm

### Desenvolvimento Local

1. **Clone o repositório**
```bash
cd c:\Users\desu\Desktop\buteco.js
```

2. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
```

3. **Instale as dependências**
```bash
# Backend
cd backend && npm install && cd ..

# Frontend
cd frontend && npm install && cd ..
```

4. **Inicie o banco de dados**
```bash
docker-compose up -d mysql
```

5. **Execute as migrations do Prisma**
```bash
cd backend && npx prisma migrate dev && cd ..
```

6. **Inicie o desenvolvimento**
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

Backend: http://localhost:3000
Frontend: http://localhost:5173

### Com Docker

```bash
docker-compose up
```

## 📁 Estrutura do Projeto

```
.
├── backend/
│   ├── src/
│   │   ├── controllers/     # Controladores (entrada/saída)
│   │   ├── services/        # Lógica de negócio
│   │   ├── repositories/    # Acesso ao banco
│   │   ├── routes/          # Definição de rotas
│   │   ├── config/          # Configurações
│   │   ├── types/           # Tipos TypeScript
│   │   ├── utils/           # Utilitários
│   │   └── server.ts        # Entrada da aplicação
│   ├── prisma/              # Schema do Prisma
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   ├── pages/           # Páginas
│   │   ├── services/        # Serviços API
│   │   ├── hooks/           # Hooks customizados
│   │   ├── styles/          # Estilos globais
│   │   ├── types/           # Tipos TypeScript
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml
└── .env.example
```

## 🧪 Testes

### Backend

```bash
cd backend

# Executar testes
npm test

# Com watch mode
npm run test:watch

# Com coverage
npm run test:coverage
```

## 📖 Padrões de Código

### Backend

- **Controllers**: Apenas entrada/saída HTTP
- **Services**: Toda lógica de negócio
- **Repositories**: Acesso ao banco de dados
- **Types**: Interfaces e tipos compartilhados

### Frontend

- **Components**: Componentes React reutilizáveis
- **Pages**: Telas da aplicação
- **Services**: Chamadas à API
- **Hooks**: Lógica reutilizável

## 🛠 Comandos Úteis

### Backend

```bash
npm run lint          # ESLint
npm run lint:fix      # Corrigir ESLint
npm run format        # Prettier
npm run db:migrate    # Migrations
npm run db:studio     # Interface Prisma
```

### Frontend

```bash
npm run lint          # ESLint
npm run lint:fix      # Corrigir ESLint
npm run format        # Prettier
npm run build         # Build para produção
npm run preview       # Preview do build
```

## 📅 Roadmap

- ✅ DIA 2: Fundação (estrutura base)
- 🔄 DIA 3: TDD (testes)
- 🔄 DIA 4: Implementação
- 🔄 DIA 5: Otimização
- 🔄 DIA 6: Frontend
- 🔄 DIA 7: Deploy

## 📝 Licença

MIT
