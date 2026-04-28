# Design System — finanzas-app

**Dirección estética: "Midnight Ledger"**  
Fintech premium, dark-first. Editorial y sofisticado, como un dashboard Bloomberg
con personalidad. Fondo oscuro profundo, acento teal-esmeralda que evoca crecimiento,
rojo-rosa para gastos, y tipografía con carácter.

---

## 1. Tipografía

### Fuentes

| Rol | Fuente | Import |
|-----|--------|--------|
| Display / Headings | **Plus Jakarta Sans** | `next/font/google` → `Plus_Jakarta_Sans` |
| Body / UI | **DM Sans** | `next/font/google` → `DM_Sans` |
| Números / Monospace | **JetBrains Mono** | `next/font/google` → `JetBrains_Mono` |

**Por qué estas fuentes:**
- *Plus Jakarta Sans*: geométrica moderna con personalidad, evita el cliché Inter/Roboto.
- *DM Sans*: legible, friendly, optimizada para UI.
- *JetBrains Mono*: monospace premium para importes, códigos y datos numéricos.

### Escala tipográfica

| Token | Tamaño | Line-height | Uso |
|-------|--------|-------------|-----|
| `text-display` | 3rem / 48px | 1.1 | Balances principales |
| `text-title` | 1.875rem / 30px | 1.2 | Títulos de página |
| `text-heading` | 1.25rem / 20px | 1.3 | Encabezados de sección |
| `text-subheading` | 1rem / 16px | 1.4 | Subencabezados, labels |
| `text-body` | 0.875rem / 14px | 1.6 | Texto de cuerpo |
| `text-caption` | 0.75rem / 12px | 1.5 | Notas, fechas, metadatos |

### Pesos

| Token | Peso | Uso |
|-------|------|-----|
| `font-normal` | 400 | Texto de cuerpo |
| `font-medium` | 500 | Labels, botones secundarios |
| `font-semibold` | 600 | Headings, botones primarios |
| `font-bold` | 700 | Display, importes destacados |

---

## 2. Paleta de colores

### Base (Dark-first)

```css
/* Fondos — de más oscuro a más claro */
--color-bg-base:       #0C0F14   /* Fondo de página */
--color-bg-surface:    #141820   /* Cards, paneles */
--color-bg-elevated:   #1C2230   /* Modales, dropdowns */
--color-bg-overlay:    #252D3D   /* Hover sobre surface */
--color-bg-muted:      #2E3748   /* Borders visibles, separadores */

/* Texto */
--color-text-primary:  #F0F4FF   /* Texto principal */
--color-text-secondary:#8B95A8   /* Texto secundario, labels */
--color-text-muted:    #545E6F   /* Placeholders, disabled */
--color-text-inverse:  #0C0F14   /* Texto sobre fondos claros */

/* Bordes */
--color-border:        #252D3D   /* Borde estándar */
--color-border-subtle: #1C2230   /* Borde muy sutil */
--color-border-strong: #3A4558   /* Borde enfatizado */
```

### Colores semánticos — Financieros

```css
/* Ingresos — Verde esmeralda */
--color-income:        #10D9A0   /* Principal */
--color-income-dim:    #0A9E74   /* Variante oscurecida */
--color-income-bg:     #0A2E22   /* Fondo de badges/chips */
--color-income-border: #0F6648   /* Borde de elementos income */

/* Gastos — Rosa-rojo */
--color-expense:       #F0516A   /* Principal */
--color-expense-dim:   #B83C52   /* Variante oscurecida */
--color-expense-bg:    #2E0F18   /* Fondo de badges/chips */
--color-expense-border:#7A2535   /* Borde de elementos expense */

/* Neutro / Transferencia */
--color-neutral:       #6B9FDB   /* Azul desaturado */
--color-neutral-bg:    #0F1E35   /* Fondo */
```

### Color de marca — Teal

```css
--color-brand:         #00C9A7   /* Acento principal */
--color-brand-hover:   #00B596   /* Hover */
--color-brand-dim:     #007D68   /* Variante oscura */
--color-brand-bg:      #002922   /* Fondo muy sutil */
--color-brand-glow:    rgba(0, 201, 167, 0.15)  /* Glow para focus */
```

### Estados

```css
--color-warning:       #F5A623   /* Advertencias */
--color-warning-bg:    #2E1F06   
--color-error:         #F0516A   /* Errores (= expense) */
--color-error-bg:      #2E0F18   
--color-success:       #10D9A0   /* Éxito (= income) */
--color-success-bg:    #0A2E22   
--color-info:          #6B9FDB   /* Info */
--color-info-bg:       #0F1E35   
```

### Modo claro (Light mode)

```css
/* Activar con clase .light o media query */
--color-bg-base:       #F5F7FA
--color-bg-surface:    #FFFFFF
--color-bg-elevated:   #FFFFFF
--color-bg-overlay:    #EEF1F6
--color-bg-muted:      #E2E7EF
--color-text-primary:  #111827
--color-text-secondary:#4B5563
--color-text-muted:    #9CA3AF
--color-border:        #E2E7EF
--color-border-subtle: #F0F2F7
--color-border-strong: #CBD5E1
```

---

## 3. Espaciado

Basado en una grilla de **4px** (múltiplos de 4).

| Token | Valor | Uso típico |
|-------|-------|------------|
| `space-1` | 4px | Gaps mínimos, icon padding |
| `space-2` | 8px | Padding interno pequeño |
| `space-3` | 12px | Gap entre elementos relacionados |
| `space-4` | 16px | Padding de componentes base |
| `space-5` | 20px | Gap entre secciones pequeñas |
| `space-6` | 24px | Padding de cards |
| `space-8` | 32px | Separación entre secciones |
| `space-10` | 40px | Padding de página |
| `space-12` | 48px | Espaciado grande |
| `space-16` | 64px | Secciones mayores |

---

## 4. Border radius

| Token | Valor | Uso |
|-------|-------|-----|
| `rounded-sm` | 4px | Badges pequeños, chips |
| `rounded` | 6px | Inputs, botones pequeños |
| `rounded-md` | 8px | Botones estándar |
| `rounded-lg` | 12px | Cards, panels |
| `rounded-xl` | 16px | Cards grandes, modales |
| `rounded-2xl` | 20px | Elementos hero |
| `rounded-full` | 9999px | Avatares, pills |

---

## 5. Sombras

```css
/* Sombras — optimizadas para dark mode */
--shadow-sm:   0 1px 3px rgba(0,0,0,0.4);
--shadow-md:   0 4px 12px rgba(0,0,0,0.5);
--shadow-lg:   0 8px 24px rgba(0,0,0,0.6);
--shadow-xl:   0 16px 40px rgba(0,0,0,0.7);

/* Glow de marca */
--shadow-brand: 0 0 20px rgba(0, 201, 167, 0.2);
--shadow-income: 0 0 16px rgba(16, 217, 160, 0.15);
--shadow-expense: 0 0 16px rgba(240, 81, 106, 0.15);

/* Inner shadow para inputs */
--shadow-inner: inset 0 1px 3px rgba(0,0,0,0.4);
```

---

## 6. Patrones de componentes

### Botones

```
PRIMARY     — bg brand, texto oscuro, hover: brand-hover + glow
SECONDARY   — bg bg-elevated, borde border, hover: bg-overlay
GHOST       — sin fondo ni borde, hover: bg-overlay
DANGER      — bg expense-bg, borde expense-border, texto expense
INCOME      — bg income-bg, borde income-border, texto income
```

**Tamaños:**
- `sm`: h-8, px-3, text-caption, rounded-md
- `md` (default): h-10, px-4, text-body, rounded-md
- `lg`: h-12, px-6, text-subheading, rounded-lg

**Estados:** `focus-visible:ring-2 ring-brand/40` para todos.

---

### Inputs / Form fields

```
Fondo:    bg-bg-elevated
Borde:    border border-border
Focus:    border-brand, ring-2 ring-brand-glow
Error:    border-expense, ring-2 ring-expense/20
Label:    text-text-secondary, text-caption, font-medium
Hint:     text-text-muted, text-caption
```

---

### Cards

```
Base:
  bg-bg-surface
  border border-border
  rounded-xl
  p-6

Hover interactivo:
  hover:border-border-strong
  hover:bg-bg-overlay
  transition-colors duration-150

Card de métrica (KPI):
  Esquina superior: label en text-caption text-text-secondary
  Centro: importe en text-display font-bold font-mono
  Inferior: badge de variación (income/expense color)
  Border-left de 3px con color semántico
```

---

### Badges / Chips

```
INCOME:   bg-income-bg, text-income, border-income-border
EXPENSE:  bg-expense-bg, text-expense, border-expense-border
NEUTRAL:  bg-neutral-bg, text-neutral
DEFAULT:  bg-bg-elevated, text-text-secondary, border-border

Tamaño: px-2 py-0.5, text-caption, font-medium, rounded-sm
```

---

### Navegación / Sidebar

```
Fondo:          bg-bg-surface
Item activo:    bg-brand-bg, text-brand, border-l-2 border-brand
Item hover:     bg-bg-overlay, text-text-primary
Item normal:    text-text-secondary
Icons:          20px, color heredado del item
```

---

### Tablas / Listas de transacciones

```
Header:     text-text-muted, text-caption, font-medium, uppercase tracking-wider
Row:        border-b border-border-subtle, hover:bg-bg-overlay
Importe +:  text-income, font-mono, font-semibold
Importe -:  text-expense, font-mono, font-semibold
Fecha:      text-text-muted, text-caption, font-mono
Categoría:  Badge correspondiente
```

---

### Gráficos (Recharts)

```
Background:     transparent (hereda el card)
Grid lines:     stroke: var(--color-border), strokeDasharray: "3 3"
Tooltip:        bg-bg-elevated, border-border, rounded-lg, shadow-lg
Ejes:           fill: var(--color-text-muted), fontSize: 12

Colores de series:
  Ingresos:    #10D9A0
  Gastos:      #F0516A
  Balance:     #6B9FDB
  Categorías:  Paleta rotativa de 8 colores (ver abajo)

Paleta para categorías (donut/pie):
  ["#10D9A0", "#6B9FDB", "#F5A623", "#C084FC",
   "#F0516A", "#38BDF8", "#FB923C", "#A3E635"]
```

---

## 7. Animaciones

```css
/* Duraciones */
--duration-fast:   100ms
--duration-base:   150ms
--duration-slow:   250ms
--duration-slower: 400ms

/* Easings */
--ease-out:   cubic-bezier(0.0, 0.0, 0.2, 1)
--ease-in:    cubic-bezier(0.4, 0.0, 1, 1)
--ease-inout: cubic-bezier(0.4, 0.0, 0.2, 1)
--ease-spring:cubic-bezier(0.34, 1.56, 0.64, 1)  /* Para modales/aparición */
```

**Regla:** usar `transition-colors duration-150` para cambios de color en hover.
Usar `duration-250 ease-spring` para aparición de modales y dropdowns.

---

## 8. Iconografía

Librería recomendada: **Lucide React** (`lucide-react`)

- Tamaño base: **18px** (UI general), **20px** (sidebar), **16px** (dentro de badges)
- `strokeWidth={1.5}` como default — más refinado que el 2 por defecto
- Color: siempre heredado del padre (`currentColor`)

---

## 9. Layout / Grid

```
Sidebar:      240px fijo en desktop, full-width en mobile (drawer)
Content area: flex-1, max-w-7xl, mx-auto, px-6 py-8
KPI row:      grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4, gap-4
Charts row:   grid grid-cols-1 lg:grid-cols-2, gap-6
```

---

## 10. Implementación en globals.css (Tailwind v4)

```css
@import "tailwindcss";

@theme {
  /* Fuentes */
  --font-display:  "Plus Jakarta Sans", sans-serif;
  --font-body:     "DM Sans", sans-serif;
  --font-mono:     "JetBrains Mono", monospace;

  /* Colores de marca */
  --color-brand:          #00C9A7;
  --color-brand-hover:    #00B596;
  --color-brand-dim:      #007D68;
  --color-brand-bg:       #002922;

  /* Semánticos */
  --color-income:         #10D9A0;
  --color-income-bg:      #0A2E22;
  --color-income-border:  #0F6648;
  --color-expense:        #F0516A;
  --color-expense-bg:     #2E0F18;
  --color-expense-border: #7A2535;
  --color-neutral:        #6B9FDB;
  --color-neutral-bg:     #0F1E35;

  /* Grises de UI */
  --color-bg-base:        #0C0F14;
  --color-bg-surface:     #141820;
  --color-bg-elevated:    #1C2230;
  --color-bg-overlay:     #252D3D;
  --color-bg-muted:       #2E3748;

  --color-text-primary:   #F0F4FF;
  --color-text-secondary: #8B95A8;
  --color-text-muted:     #545E6F;

  --color-border:         #252D3D;
  --color-border-subtle:  #1C2230;
  --color-border-strong:  #3A4558;

  /* Sombras */
  --shadow-brand: 0 0 20px rgba(0, 201, 167, 0.2);
  --shadow-income: 0 0 16px rgba(16, 217, 160, 0.15);
  --shadow-expense: 0 0 16px rgba(240, 81, 106, 0.15);
}
```

---

## 11. Checklist de consistencia

Antes de hacer merge de un componente nuevo, verificar:

- [ ] ¿Usa tokens CSS del design system? (no valores hardcodeados)
- [ ] ¿Funciona en dark mode?
- [ ] ¿Los importes usan `font-mono` y el color semántico correcto?
- [ ] ¿Los estados focus tienen `ring` visible para accesibilidad?
- [ ] ¿Los bordes/sombras son los del sistema?
- [ ] ¿La tipografía respeta la escala definida?
- [ ] ¿Los íconos usan `strokeWidth={1.5}`?
