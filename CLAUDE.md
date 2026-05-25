@AGENTS.md

# Wears — App Context

## Concepto
Cost-per-wear tracker para mujeres fashion-conscious 18-35. El problema: culpa al gastar en ropa. La solución: cada vez que usas una prenda, su CPW baja — el app valida el gasto en vez de castigarlo. Tono financiero irónico ("earnings report", "profitable", "cost basis", "assets").

Audiencia: TikTok beauty/fashion, inglés.

## Visual Identity
- **Background:** `#F5F2EB` (cream)
- **Text:** `#1A1A1A` (near-black)
- **Accent CPW:** `#C4503A` (terracotta/rust) — solo para números de CPW
- **Accent badge:** `#5C5347` (dark taupe) — badges "PROFITABLE", "NORMAL", etc.
- **Typography:** serif editorial para números CPW grandes (DMSerifDisplay o similar), sans-serif para body
- **Aesthetic:** receipt / ledger — bordes punteados, monospace para tablas, tono financiero

## Tier System (CPW thresholds)
| Tier | CPW threshold |
|------|--------------|
| investment | > $80 |
| luxury | ≤ $80 |
| normal | ≤ $25 |
| workhorse | ≤ $10 |
| free basically | ≤ $2 |

Status "PROFITABLE" se activa cuando CPW ≤ $25 (tier normal o mejor).

## Core Screens
1. **Closet Ledger** (`/(app)/index`) — Home. Lista de todas las prendas con blended CPW, summary stats. Estilo earnings report.
2. **Item Ticker** (`/(app)/item/[id]`) — Detail. Foto grande, CPW enorme en serif, badge tier, CTA "I wore this today", progress bar de wears.
3. **Tier Progress** (`/(app)/item/[id]` tab 2) — Tier ladder con checkmarks, stats row (wears ×, spent $, saved vs new $).
4. **Wear Log** (`/(app)/item/[id]` tab 3) — Historial completo de usos estilo receipt. Fecha, ocasión, CPW de ese momento.
5. **Add Item** (`/modal/add-item`) — Modal. Foto, nombre, marca, precio, categoría, fecha compra.
6. **Share Sheet** (`/modal/share/[id]`) — 3 formatos exportables: Receipt, Polaroid, Wallet Pass.

## Supabase Schema
```sql
-- items: cada prenda del closet
create table items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  brand text,
  category text, -- outerwear, knitwear, denim, shoes, etc.
  price numeric not null, -- original purchase price (cost basis)
  purchased_at date not null,
  image_url text,
  created_at timestamptz default now()
);

-- wears: cada vez que se usa una prenda
create table wears (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references items not null,
  user_id uuid references auth.users not null,
  worn_at date not null default current_date,
  occasion text, -- "office", "date night", "errand", etc.
  created_at timestamptz default now()
);
```

CPW se calcula en cliente: `item.price / count(wears)`.

## Shareable Export Formats
- **Receipt** — Recibo térmico B&W con tabla de wears. Shareable hero para TikTok.
- **Polaroid** — Foto polaroid + sticky note "cost basis: justified". Aesthetic para Stories.
- **Wallet Pass** — Card gradiente terracotta estilo Apple Wallet. "she's earning her keep."

Generados con `react-native-view-shot` → guardados en camera roll.

## Terminología del app (tono financiero)
- "cost basis" en vez de "precio"
- "wears logged" en vez de "veces usada"
- "blended CPW" para el promedio del closet
- "PROFITABLE" como badge cuando CPW ≤ $25
- "earnings report" para el receipt shareable
- "assets" para las prendas
- "shareholder notes" para las notas del usuario

## Free vs Pro
- Free: hasta 5 items
- Pro: items ilimitados + share exports + stats avanzados
- Price: $4.99/mes o $29.99/año, 7-day trial
