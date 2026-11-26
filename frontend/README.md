# Actron Analytics - Frontend Dashboard

Interface web executiva (BI) do **Dashboard de Transações de Compra**, desenvolvida em **React 19**, **Vite 6**, **TypeScript**, **Tailwind CSS 4**, **Axios**, **Lucide React** e **Recharts**.

---

## 1. Funcionalidades

- **Indicadores Agregados (KPIs)** (`GET /api/dashboard`):
  - Quantidade total de compras e base ativa de clientes/produtos.
  - Valor total de compras e ticket médio.
  - Valor total de descontos, desconto médio e percentual sobre o valor bruto.
  - Valor total de produtos e valor médio por item.
- **Análise e Rankings de Performance** (`GET /api/dashboard`):
  - Painel de **Compras por Cliente** (Nome, E-mail, CPF formatado, Valor Total e Valor Médio) com gráfico horizontal Top 5 (Recharts), busca local e atalho para filtrar as compras daquele cliente.
  - Painel de **Compras por Produto** (Nome, Quantidade Vendida, Valor Total e Valor Médio) com gráfico horizontal Top 5 (Recharts) e busca local.
- **Listagem de Transações com Filtros e Paginação** (`GET /api/purchases`):
  - Filtros dinâmicos combináveis por **Código de Referência** (`reference_code`), **Cliente** (nome, e-mail ou CPF), **Data** (por período `start_date`/`end_date` ou data exata `date`) e **Valor** (por faixa `min_amount`/`max_amount` ou valor exato `amount`), com validação client-side e botões **Filtrar** / **Limpar filtros**.
  - Tabela responsiva integrada à paginação do Laravel (`Anterior`, páginas, `Próxima` e seletor de itens por página `per_page`).
  - Gaveta lateral de detalhes (*drawer*) exibindo cliente, todos os itens comprados (`quantidade`, `valor unitário`, `subtotal`), resumo financeiro e observações.
- **Atualização em Tempo Real e Estados de UI:**
  - Polling automático silencioso a cada **10 segundos** controlado por um *split button* no cabeçalho (ação manual + indicador de status para pausar/retomar), com pausa automática quando a aba está inativa.
  - *Loading skeletons*, estados vazios amigáveis e banners de erro com ação de tentar novamente.

---

## 2. Estrutura do Projeto

```text
frontend/
├── public/
│   └── actron-logo.png                # Favicon da aplicação
├── src/
│   ├── assets/
│   │   └── actron-logo.png            # Logo exibida no cabeçalho
│   ├── components/
│   │   ├── Header.tsx                 # Cabeçalho, navegação e split button de atualização
│   │   ├── KpiCards.tsx               # Cards de métricas agregadas + skeletons
│   │   ├── RankingsSection.tsx        # Gráficos Top 5 (Recharts) e tabelas de rankings
│   │   ├── PurchaseFiltersBar.tsx     # Barra de filtros combináveis com validação
│   │   ├── PurchasesTable.tsx         # Tabela paginada de transações
│   │   ├── PurchaseDetailModal.tsx    # Gaveta lateral de detalhes da compra
│   │   └── StateFeedback.tsx          # Alertas de erro e estados vazios
│   ├── pages/
│   │   └── Dashboard.tsx              # Página principal e orquestração de estado/polling
│   ├── services/
│   │   └── api.ts                     # Cliente Axios configurado via VITE_API_URL
│   ├── types/
│   │   ├── dashboard.ts               # Contratos de GET /api/dashboard
│   │   ├── purchase.ts                # Contratos de GET /api/purchases e paginação
│   │   └── index.ts
│   └── utils/
│       ├── formatters.ts              # Moeda BRL, datas pt-BR, CPF e tratamento de erros
│       └── purchaseFilters.ts         # Estado inicial e serialização dos filtros
├── .env.example
├── package.json
└── vite.config.ts
```

---

## 3. Pré-requisitos

- **Node.js 18+** e **npm**
- Backend Laravel em execução em `http://localhost` (ver `../backend/README.md`)

---

## 4. Como Executar

1. Copie o arquivo de variáveis de ambiente:

```bash
cp .env.example .env
```

2. Verifique a URL da API no `.env` (padrão já compatível com o Sail na porta 80):

```env
VITE_API_URL=http://localhost/api
```

3. Instale as dependências e inicie o servidor de desenvolvimento:

```bash
npm install
npm run dev
```

A aplicação estará disponível em **http://localhost:5173**.

---

## 5. Scripts Disponíveis

```bash
# Servidor de desenvolvimento (porta 5173)
npm run dev

# Checagem de tipos TypeScript + build de produção (dist/)
npm run build

# Verificação de lint (ESLint)
npm run lint

# Pré-visualizar o build de produção localmente
npm run preview
```
