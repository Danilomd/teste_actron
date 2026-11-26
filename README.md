# Actron Analytics - Dashboard de Transações de Compra

Aplicação full-stack para ingestão idempotente de compras, integração via webhook com a Shopify e visualização analítica em painel web.

## Visão Geral e Arquitetura

O projeto está estruturado em monorepo separando API e interface web:

```text
.
├── backend/    # API RESTful em Laravel 13 (PHP 8.5), MySQL 8.4, Sail e Scramble
└── frontend/   # Dashboard em React 19, Vite, TypeScript, Tailwind CSS 4 e Recharts
```

Principais decisões técnicas:

- **Camada de Services (`backend/app/Services`):** `ProcessPurchaseService` isola a persistência transacional de clientes, produtos, compras e itens; `DashboardService` centraliza as consultas agregadas de KPIs e rankings.
- **Idempotência via `reference_code` único:** a coluna `purchases.reference_code` possui restrição `UNIQUE` combinada com trava de registro em transação no `ProcessPurchaseService`, evitando duplicidade em reenvios (`201 Created` na criação e `200 OK` com `already_processed: true` em reprocessamentos).
- **Padrão Adapter no webhook (`ShopifyWebhookController`):** traduz o payload `orders/create` da Shopify para o DTO interno `PurchaseData` e delega o fluxo ao `ProcessPurchaseService`, mantendo o domínio desacoplado de plataformas externas.
- **Dashboard modular (`frontend/src`):** organizado em `services/api.ts`, `types/`, `utils/`, `components/` e `pages/Dashboard.tsx`, com KPIs, gráficos Top 5 (Recharts), filtros combináveis, tabela paginada, gaveta de detalhes e atualização automática a cada 10 segundos.

### Endpoints da API

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/api/dashboard` | Métricas agregadas (KPIs) e rankings por cliente e por produto |
| `GET` | `/api/purchases` | Listagem paginada de compras com filtros (`reference_code`, `customer`, `date`, `start_date`, `end_date`, `amount`, `min_amount`, `max_amount`, `per_page`, `page`) |
| `POST` | `/api/purchases` | Processa e persiste uma compra de forma atômica e idempotente |
| `POST` | `/api/webhooks/shopify` | Recebe eventos `orders/create` da Shopify e processa a compra de forma idempotente |

## Pré-requisitos

- Docker e Docker Compose
- Node.js 18+ e npm

## Como Executar o Backend

1. Acesse a pasta do backend e crie o arquivo `.env`:

```bash
cd backend
cp .env.example .env
```

2. Caso a pasta `backend/vendor/` ainda não exista, instale as dependências via container:

```bash
docker run --rm \
    -u "$(id -u):$(id -g)" \
    -v "$(pwd):/var/www/html" \
    -w /var/www/html \
    laravelsail/php85-composer:latest \
    composer install --ignore-platform-reqs
```

3. Suba os containers, gere a chave da aplicação e execute as migrations com os dados iniciais (7 clientes, 6 produtos e 18 compras distribuídas nos últimos 30 dias):

```bash
./vendor/bin/sail up -d
./vendor/bin/sail artisan key:generate
./vendor/bin/sail artisan migrate --seed
```

A API ficará disponível em `http://localhost/api` e a documentação interativa (Scramble / OpenAPI) em `http://localhost/docs/api`.

## Como Executar o Frontend

Em outro terminal, a partir da raiz do repositório:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

O dashboard ficará disponível em `http://localhost:5173`, consumindo `VITE_API_URL=http://localhost/api`.

Para validar a tipagem TypeScript e gerar o build de produção:

```bash
npm run build
```

## Testes Automatizados

Dentro da pasta `backend/`, execute a suíte PHPUnit:

```bash
cd backend
./vendor/bin/sail artisan test
```

## Integração com Shopify (Webhook)

O endpoint `POST /api/webhooks/shopify` recebe o payload JSON do evento `orders/create` da Shopify, adapta cliente, CPF (via `note_attributes` ou `default_address.company`) e `line_items` para o formato interno e executa o `ProcessPurchaseService` de forma idempotente. O retorno é `201 Created` na primeira entrega e `200 OK` em reenvios do mesmo pedido.

### Teste local via `curl`

```bash
curl -i -X POST http://localhost/api/webhooks/shopify \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "X-Shopify-Topic: orders/create" \
  -d '{
    "id": 820982911946154508,
    "order_number": 1099,
    "name": "#1099",
    "created_at": "2026-11-25T14:30:00-03:00",
    "currency": "BRL",
    "total_discounts": "100.00",
    "total_price": "2588.90",
    "note": "Entregar na portaria",
    "note_attributes": [
      { "name": "cpf", "value": "321.654.987-00" }
    ],
    "customer": {
      "id": 115310627314723954,
      "first_name": "Fernanda",
      "last_name": "Ribeiro",
      "email": "fernanda.ribeiro@example.com",
      "default_address": {
        "company": null,
        "city": "São Paulo"
      }
    },
    "line_items": [
      {
        "id": 866550311766439020,
        "title": "Monitor 27\" 4K",
        "quantity": 1,
        "price": "2199.00"
      },
      {
        "id": 141249953214522974,
        "title": "Teclado Mecânico RGB",
        "quantity": 1,
        "price": "489.90"
      }
    ]
  }'
```

### Conectando uma loja de desenvolvimento

1. Exponha a porta local via túnel HTTPS:

```bash
cloudflared tunnel --url http://localhost:80
```

2. No painel da Shopify, acesse **Configurações → Notificações → Webhooks**, crie um webhook para **Criação de pedido (`orders/create`)** em formato **JSON** apontando para `https://<url-do-tunel>/api/webhooks/shopify`.
3. Dispare um pedido de teste para confirmar a ingestão automática no dashboard.
