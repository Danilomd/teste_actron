# Actron Analytics - Backend API

API RESTful do Dashboard de Transações de Compra, desenvolvida em Laravel 13 (PHP 8.5), MySQL 8.4, Laravel Sail e documentação OpenAPI via Dedoc Scramble.

## Arquitetura

- **Camada de Services e DTOs (`app/Services`, `app/DTOs`):** `ProcessPurchaseService` centraliza a persistência transacional de clientes, produtos, compras e itens; `DashboardService` consolida métricas globais e rankings diretamente via queries agregadas.
- **Idempotência:** a coluna `purchases.reference_code` possui índice `UNIQUE`, combinada com `lockForUpdate()` em transação e tratamento de `UniqueConstraintViolationException` (`201 Created` na criação e `200 OK` com `meta.already_processed: true` em reenvios).
- **Adapter de Webhook (`ShopifyWebhookController`):** traduz o payload `orders/create` da Shopify para o DTO interno `PurchaseData` e delega o fluxo para o `ProcessPurchaseService`.

## Pré-requisitos

- Docker e Docker Compose

## Como Executar

1. Crie o arquivo `.env`:

```bash
cp .env.example .env
```

2. Caso a pasta `vendor/` ainda não exista, instale as dependências via container:

```bash
docker run --rm \
    -u "$(id -u):$(id -g)" \
    -v "$(pwd):/var/www/html" \
    -w /var/www/html \
    laravelsail/php85-composer:latest \
    composer install --ignore-platform-reqs
```

3. Suba os containers, gere a chave da aplicação e execute as migrations com os dados iniciais (7 clientes, 6 produtos e 18 compras nos últimos 30 dias):

```bash
./vendor/bin/sail up -d
./vendor/bin/sail artisan key:generate
./vendor/bin/sail artisan migrate --seed
```

Para recriar o banco do zero e repopular os dados:

```bash
./vendor/bin/sail artisan migrate:fresh --seed
```

## Documentação da API (Scramble / OpenAPI)

Com o Sail em execução:

- **Interface interativa:** http://localhost/docs/api
- **Especificação OpenAPI (JSON):** http://localhost/docs/api.json

## Endpoints Principais (`routes/api.php`)

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/api/dashboard` | Métricas agregadas (KPIs) e rankings por cliente e por produto |
| `GET` | `/api/purchases` | Listagem paginada de compras com filtros (`reference_code`, `customer`, `date`, `start_date`, `end_date`, `amount`, `min_amount`, `max_amount`, `per_page`, `page`) |
| `POST` | `/api/purchases` | Processa uma compra de forma atômica e idempotente (`reference_code`) |
| `POST` | `/api/webhooks/shopify` | Recebe webhooks `orders/create` da Shopify e processa via `ProcessPurchaseService` |

## Webhook da Shopify

O endpoint `POST /api/webhooks/shopify` mapeia o payload padrão `orders/create` da Shopify:

- `reference_code`: `name` -> `order_number` -> `id`
- `discount`: `total_discounts`
- `total_amount`: `total_price`
- `purchased_at`: `created_at` (ou timestamp atual)
- `notes`: `note` (ou `'Pedido importado via Shopify'`)
- `customer`: `first_name` + `last_name`, `email` e `cpf` (via `note_attributes` ou `default_address.company`, opcional)
- `products`: `line_items` (`title`, `quantity`, `price`)

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

### Túnel HTTPS para loja de desenvolvimento

```bash
cloudflared tunnel --url http://localhost:80
```

Configure o webhook `orders/create` (formato `JSON`) no painel da Shopify apontando para `https://<url-do-tunel>/api/webhooks/shopify`.

## Testes Automatizados e Qualidade de Código

```bash
# Suíte completa (PHPUnit)
./vendor/bin/sail artisan test

# Suítes individuais
./vendor/bin/sail artisan test tests/Feature/Api/PurchaseTest.php
./vendor/bin/sail artisan test tests/Feature/Api/DashboardTest.php
./vendor/bin/sail artisan test tests/Feature/ShopifyWebhookTest.php

# Padronização de código (Laravel Pint)
./vendor/bin/sail bin pint --test
```

## Comandos Úteis do Sail

```bash
# Status dos containers
./vendor/bin/sail ps

# Logs
./vendor/bin/sail logs -f

# Parar containers
./vendor/bin/sail down

# Parar containers e remover volumes do banco
./vendor/bin/sail down -v
```
