# Design System - CnxPlay (Conecta Empresarios)

> Referencia visual e tecnica para desenvolvimento consistente do frontend.

---

## Sumario

1. [Stack e Dependencias](#stack-e-dependencias)
2. [Cores e Tokens](#cores-e-tokens)
3. [Tipografia](#tipografia)
4. [Espacamento e Border Radius](#espacamento-e-border-radius)
5. [Gradientes](#gradientes)
6. [Sombras](#sombras)
7. [Componentes UI](#componentes-ui)
8. [Icones](#icones)
9. [Animacoes](#animacoes)
10. [Layout](#layout)
11. [Padroes de Pagina](#padroes-de-pagina)
12. [Sistema de Niveis](#sistema-de-niveis)
13. [Tema (Dark/Light)](#tema)

---

## Stack e Dependencias

| Tecnologia | Versao | Uso |
|------------|--------|-----|
| Next.js | 16.1.6 | App Router, SSR |
| React | 19.2.3 | UI |
| TypeScript | ^5 | Tipagem |
| Tailwind CSS | ^4 | Estilizacao (via @tailwindcss/postcss) |
| Radix UI | varias | Primitivos acessiveis (Dialog, Select, Tabs, etc.) |
| class-variance-authority | 0.7.1 | Variantes de componentes (CVA) |
| Framer Motion | 12.34.3 | Animacoes |
| Lucide React | 0.575.0 | Icones |
| next-themes | 0.4.6 | Tema dark/light |
| clsx + tailwind-merge | - | Merge de classes (funcao `cn()`) |

### Funcao utilitaria `cn()`

```typescript
// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

Usada em todos os componentes para combinar classes Tailwind sem conflitos.

---

## Cores e Tokens

Todas as cores sao definidas via CSS custom properties em `src/app/globals.css` usando formato HSL.

### Light Mode (`:root`)

| Token | HSL | Uso |
|-------|-----|-----|
| `--background` | 0 0% 100% | Fundo principal (branco) |
| `--foreground` | 222.2 84% 4.9% | Texto principal (azul escuro) |
| `--card` | 0 0% 100% | Fundo de cards |
| `--card-foreground` | 222.2 84% 4.9% | Texto em cards |
| `--popover` | 0 0% 100% | Fundo de popovers |
| `--popover-foreground` | 222.2 84% 4.9% | Texto em popovers |
| `--primary` | 221.2 83.2% 53.3% | Azul principal |
| `--primary-foreground` | 210 40% 98% | Texto sobre primary |
| `--secondary` | 210 40% 96.1% | Cinza claro |
| `--secondary-foreground` | 222.2 47.4% 11.2% | Texto sobre secondary |
| `--muted` | 210 40% 96.1% | Fundo sutil |
| `--muted-foreground` | 215.4 16.3% 46.9% | Texto secundario |
| `--accent` | 210 40% 96.1% | Destaque hover |
| `--accent-foreground` | 222.2 47.4% 11.2% | Texto sobre accent |
| `--destructive` | 0 84.2% 60.2% | Vermelho (acoes perigosas) |
| `--destructive-foreground` | 210 40% 98% | Texto sobre destructive |
| `--border` | 214.3 31.8% 91.4% | Bordas |
| `--input` | 214.3 31.8% 91.4% | Inputs |
| `--ring` | 221.2 83.2% 53.3% | Focus ring (azul) |

### Dark Mode (`.dark`) — **Tema padrao**

| Token | HSL | Uso |
|-------|-----|-----|
| `--background` | 222.2 84% 4.9% | Fundo escuro azulado |
| `--foreground` | 210 40% 98% | Texto claro |
| `--card` | 222.2 84% 4.9% | Card escuro |
| `--card-foreground` | 210 40% 98% | Texto claro em cards |
| `--primary` | 217.2 91.2% 59.8% | Azul mais vivo |
| `--primary-foreground` | 222.2 47.4% 11.2% | Texto escuro sobre primary |
| `--secondary` | 217.2 32.6% 17.5% | Azul escuro acinzentado |
| `--secondary-foreground` | 210 40% 98% | Texto claro |
| `--muted` | 217.2 32.6% 17.5% | Fundo sutil escuro |
| `--muted-foreground` | 215 20.2% 65.1% | Texto cinza medio |
| `--accent` | 217.2 32.6% 17.5% | Destaque hover escuro |
| `--destructive` | 0 62.8% 30.6% | Vermelho escuro |
| `--border` | 217.2 32.6% 17.5% | Bordas escuras |
| `--input` | 217.2 32.6% 17.5% | Input escuro |
| `--ring` | 224.3 76.3% 48% | Focus ring azul claro |

### Cores Funcionais (usadas direto no Tailwind)

| Cor | Classe | Uso |
|-----|--------|-----|
| Azul | `blue-400` / `blue-500` / `blue-600` / `blue-700` | Acoes primarias, links, Safira |
| Roxo | `purple-500` / `purple-600` / `purple-700` | Gradientes, destaques, referral |
| Rosa | `pink-500` / `pink-600` | Gradientes (com roxo) |
| Verde | `green-500` / `green-600` / `green-700` | Sucesso, deals, confirmacoes |
| Amarelo | `amber-500` / `yellow-500` | Alertas, pendentes, admin |
| Vermelho | `red-500` / `red-600` | Erros, acoes destrutivas |
| Ciano | `cyan-400` / `cyan-500` | Nivel Diamante |
| Slate | `slate-600` a `slate-950` | Fundos, bordas, textos no dark |

### Padroes de Opacidade

| Padrao | Uso |
|--------|-----|
| `{cor}-500/10` | Fundo sutil (ex: bg-blue-500/10) |
| `{cor}-500/20` | Bordas sutis (ex: border-blue-500/20) |
| `{cor}-500/40` | Fundos com mais presenca |
| `{cor}/50` | Overlays e fundos intermediarios |
| `{cor}/80` | Textos e overlays fortes |

---

## Tipografia

| Propriedade | Valor | Classe Tailwind |
|-------------|-------|-----------------|
| Font family | System (sans-serif via Next.js) | `font-sans` |
| Titulo principal | 2xl-3xl, bold | `text-2xl md:text-3xl font-bold` |
| Subtitulo | lg-xl, semibold | `text-lg font-semibold` / `text-xl font-bold` |
| Corpo | sm-base | `text-sm` / `text-base` |
| Label | sm, medium | `text-sm font-medium` |
| Texto auxiliar | xs, muted | `text-xs text-muted-foreground` |
| Badge | xs, semibold | `text-xs font-semibold` |

### Padroes de texto

```
Titulos de pagina:  text-2xl md:text-3xl font-bold
Titulos de secao:   text-lg font-semibold
Titulos de card:    text-base font-semibold
Labels de form:     text-sm font-medium
Texto auxiliar:     text-xs text-muted-foreground
Valores numericos:  text-2xl font-bold (stats cards)
```

---

## Espacamento e Border Radius

### Border Radius

| Token | Valor | Classe |
|-------|-------|--------|
| `--radius` (base) | 0.75rem (12px) | `rounded-lg` |
| `--radius-md` | calc(12px - 2px) = 10px | `rounded-md` |
| `--radius-sm` | calc(12px - 4px) = 8px | `rounded-sm` |
| Circular | 50% | `rounded-full` |
| Extra | 1rem | `rounded-xl` |
| Extra+ | 1.5rem | `rounded-2xl` |
| Maximo | 1.875rem | `rounded-3xl` |

### Padroes por contexto

| Elemento | Border Radius |
|----------|---------------|
| Botoes | `rounded-md` (padrao), `rounded-xl` (inputs de login) |
| Cards | `rounded-2xl` |
| Modais | `rounded-3xl` (sm:rounded-3xl) |
| Avatares | `rounded-full` |
| Badges | `rounded-full` |
| Inputs | `rounded-md` (padrao), `rounded-xl` (auth pages) |
| Indicadores | `rounded-full` |

### Espacamento padrao de paginas

```
Padding principal:  p-4 md:p-6 lg:p-8
Gap entre cards:    gap-4 md:gap-6
Padding de card:    p-4 md:p-6
Margem entre secoes: space-y-6 md:space-y-8
```

---

## Gradientes

### Gradientes primarios

| Nome | Classes | Uso |
|------|---------|-----|
| Primary | `bg-gradient-to-r from-blue-600 to-purple-600` | Botao principal (login, CTA) |
| Primary hover | `hover:from-blue-700 hover:to-purple-700` | Hover do primary |
| Referral | `bg-gradient-to-r from-purple-600 to-pink-600` | Botao de indicacao |
| Logo | `bg-gradient-to-br from-blue-600 to-purple-600` | Icone/logo da marca |
| Background sutil | `from-blue-900/10 to-purple-900/10` | Cards de destaque (daily match) |
| Certificate Diamante | `from-cyan-900 to-blue-900` | Certificado Diamante |
| Certificate Safira | `from-blue-900 to-indigo-900` | Certificado Safira |
| Certificate Platina | `from-slate-800 to-gray-900` | Certificado Platina |

### Gradientes decorativos (login page)

```
Blur superior-direita:  w-[600px] h-[600px] bg-purple-500/10 blur-[100px]
Blur inferior-esquerda: w-[500px] h-[500px] bg-blue-500/10 blur-[100px]
Barra superior do card: from-blue-500 via-purple-500 to-pink-500
```

### Gradiente animado

```css
@keyframes gradient {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
.animate-gradient { animation: gradient 8s ease infinite; }
```

---

## Sombras

| Tipo | Classe | Uso |
|------|--------|-----|
| Sutil | `shadow-sm` | Cards em repouso |
| Media | `shadow-lg` | Cards destacados, botoes primarios |
| Forte | `shadow-2xl` | Card de login |
| Colorida azul | `shadow-lg shadow-blue-500/20` | Logo, botoes CTA |
| Colorida blue escuro | `shadow-blue-900/20` | Cards de destaque |
| Colorida primary | `shadow-lg shadow-primary/20` | Item ativo no sidebar |

---

## Componentes UI

Todos em `src/components/ui/`. Baseados em Radix UI + CVA (class-variance-authority).

### Button

| Variante | Estilo |
|----------|--------|
| `default` | bg-primary, text-primary-foreground, hover:bg-primary/90 |
| `destructive` | bg-destructive, text-destructive-foreground, hover:bg-destructive/90 |
| `outline` | border-input, bg-background, hover:bg-accent |
| `secondary` | bg-secondary, text-secondary-foreground, hover:bg-secondary/80 |
| `ghost` | hover:bg-accent, hover:text-accent-foreground |
| `link` | text-primary, underline-offset-4, hover:underline |

| Tamanho | Dimensoes |
|---------|-----------|
| `default` | h-10, px-4, py-2 |
| `sm` | h-9, px-3 |
| `lg` | h-11, px-8 |
| `icon` | h-10, w-10 |

**Base:** rounded-md, text-sm, font-medium, ring-offset-background, focus-visible:ring-2, transition-colors

### Badge

| Variante | Estilo |
|----------|--------|
| `default` | bg-primary, text-primary-foreground, hover:bg-primary/80 |
| `secondary` | bg-secondary, text-secondary-foreground, hover:bg-secondary/80 |
| `destructive` | bg-destructive, text-destructive-foreground, hover:bg-destructive/80 |
| `outline` | text-foreground, border |

**Base:** rounded-full, border, px-2.5, py-0.5, text-xs, font-semibold

### Input

**Estilo:** h-10, w-full, rounded-md, border-input, bg-background, px-3, py-2, text-sm
**Placeholder:** text-muted-foreground
**Focus:** ring-2, ring-ring, ring-offset-2
**Disabled:** opacity-50, cursor-not-allowed
**Nos forms de auth:** h-12, rounded-xl, bg-secondary/50, focus:ring-primary/20

### Checkbox

**Estilo:** h-5, w-5, rounded-md, border-slate-600, bg-slate-900/50
**Checked:** bg-blue-600, border-blue-600, text-white
**Icone:** Lucide Check (h-3.5, w-3.5)

### Avatar

| Parte | Estilo |
|-------|--------|
| Root | h-10, w-10, rounded-full, overflow-hidden |
| Image | aspect-square, h-full, w-full |
| Fallback | bg-muted, flex items-center justify-center |

### Dialog / AlertDialog

**Overlay:** bg-black/80, fade-in/out
**Content:** max-w-lg, bg-background, border, rounded-lg, p-6, shadow-lg
**Animacoes:** zoom-in-95, slide-in-from-left-1/2, slide-in-from-top-[48%]
**Variacao dark:** bg-slate-950, border-slate-800, text-white (usado nos features)

### DropdownMenu

**Content:** min-w-[8rem], rounded-md, border, bg-popover, p-1, shadow-md
**Item:** px-2, py-1.5, text-sm, focus:bg-accent
**Separator:** h-px, bg-muted

### Select

**Trigger:** h-10, w-full, rounded-md, border-input, bg-background
**Content:** max-h-96, min-w-[8rem], rounded-md, border, bg-popover
**Item:** py-1.5, pl-8, pr-2, focus:bg-accent

### Tabs

**List:** h-10, rounded-md, bg-muted, p-1
**Trigger:** rounded-sm, px-3, py-1.5, text-sm, data-[state=active]:bg-background
**Content:** mt-2

### Table

**Head:** h-12, px-4, font-medium, text-muted-foreground
**Cell:** p-4, align-middle
**Row:** border-b, hover:bg-muted/50

### Toast

| Variante | Estilo |
|----------|--------|
| `default` | border, bg-background |
| `destructive` | border-destructive, bg-destructive, text-destructive-foreground |

**Base:** rounded-md, border, p-6, pr-8, shadow-lg

---

## Icones

Biblioteca: **Lucide React** (`lucide-react`)

### Icones por contexto

| Contexto | Icones |
|----------|--------|
| Navegacao | Home, Search, Calendar, MessageCircle, User, ShieldCheck, CreditCard |
| Acoes | LogOut, X, Menu, MoreHorizontal, ArrowRight, ExternalLink |
| Status | Check, AlertTriangle, Lock, Clock, Eye, EyeOff |
| Social | Bell, Gift, Heart, Share2, Copy, Send |
| Business | Building2, Briefcase, MapPin, TrendingUp, DollarSign, Award |
| Tema | Sun, Moon |
| Decorativo | Sparkles, Rocket, Trophy, Star, Users, Crown |
| Contato | Mail, Phone |

### Tamanhos padrao

| Contexto | Tamanho |
|----------|---------|
| Sidebar/Header icons | h-5 w-5 |
| Button icon (small) | h-4 w-4 |
| Stats card icon | h-5 w-5 (dentro de div p-2.5 rounded-xl) |
| Decorativo grande | h-8 w-8 / h-10 w-10 |
| Checkbox icon | h-3.5 w-3.5 |
| Indicador inline | h-3 w-3 |

---

## Animacoes

### Framer Motion — Padroes reutilizaveis

#### Entrada de cards (staggered)

```typescript
// Usado em dashboard stats, secoes de pagina
<motion.div
  initial={{ y: 20, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  transition={{ delay: index * 0.1 }}
>
```

#### Entrada de pagina

```typescript
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
```

#### Sidebar slide

```typescript
<motion.aside
  initial={{ x: -320 }}
  animate={{ x: isOpen ? 0 : -320 }}
  transition={{ type: "spring", damping: 25, stiffness: 200 }}
>
```

#### Hover/Tap em botoes

```typescript
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
```

#### Modal/Overlay

```typescript
// Overlay
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
>

// Conteudo do modal
<motion.div
  initial={{ scale: 0.95, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  transition={{ type: "spring", duration: 0.5 }}
>
```

#### Certificado (3D flip)

```typescript
<motion.div
  initial={{ scale: 0.8, opacity: 0, rotateX: 20 }}
  animate={{ scale: 1, opacity: 1, rotateX: 0 }}
  transition={{ type: "spring", duration: 0.8 }}
>
```

### Animacoes CSS (globals.css)

| Classe | Animacao | Duracao | Uso |
|--------|----------|---------|-----|
| `animate-gradient` | Movimento de gradiente | 8s ease infinite | Fundos animados |
| `animate-fall` | Queda vertical + rotacao | 10s linear infinite | Confetti/particulas |
| `animate-twinkle` | Pulsacao de escala + opacidade | 2s ease-in-out infinite | Estrelas decorativas |
| `animate-accordion-down` | Expansao de altura | 0.2s ease-out | Accordion abrindo |
| `animate-accordion-up` | Reducao de altura | 0.2s ease-out | Accordion fechando |
| `animate-pulse` | Pulsacao (nativo Tailwind) | - | Indicador online |
| `animate-bounce` | Pulo (nativo Tailwind) | - | Typing indicator |

---

## Layout

### Estrutura geral

```
┌──────────────────────────────────────────────────┐
│ Header (h-16, sticky, z-40, backdrop-blur)       │
├──────────┬───────────────────────────────────────┤
│          │                                       │
│ Sidebar  │  Main Content                         │
│ (w-72)   │  (p-4 md:p-6 lg:p-8)                │
│ (z-60)   │  (max-w container centralizado)       │
│          │                                       │
│          │                                       │
│          │                                       │
├──────────┴───────────────────────────────────────┤
│ SupportChat (fixed, bottom-6 right-6, z-60)     │
└──────────────────────────────────────────────────┘
```

### Header

- Posicao: `sticky top-0 z-40`
- Fundo: `bg-background/80 backdrop-blur-sm`
- Altura: `h-16`
- Borda inferior: `border-b border-border`
- Conteudo: logo/menu toggle (esq), notificacoes + referral + avatar (dir)

### Sidebar

- Largura: `w-72`
- Posicao: `fixed inset-y-0 left-0 z-[60]`
- Fundo: `bg-card border-r border-border`
- Mobile: animacao slide com backdrop `bg-black/80`
- Desktop: visivel a partir de `lg`
- Spring: `damping: 25, stiffness: 200`

### Item de navegacao

```
Ativo:    bg-primary text-primary-foreground shadow-lg shadow-primary/20
Hover:    hover:bg-accent hover:text-foreground
Admin:    bg-amber-500/10 text-amber-600 border-amber-500/20
Default:  text-muted-foreground
```

### Content area

- Padding: `p-4 md:p-6 lg:p-8`
- Container: `max-w-[1400px] mx-auto` (varia por pagina)
- Fundo: `bg-background`
- Selection: `selection:bg-primary/20`

---

## Padroes de Pagina

### Card padrao

```tsx
<div className="bg-card border border-border rounded-2xl p-4 md:p-6 shadow-sm">
  <h3 className="text-lg font-semibold">{titulo}</h3>
  <p className="text-sm text-muted-foreground">{descricao}</p>
</div>
```

### Stats card (dashboard)

```tsx
<div className="bg-card border border-border rounded-2xl p-4 md:p-6">
  <div className="flex items-center gap-3">
    <div className="p-2.5 rounded-xl bg-blue-500/10">
      <Icon className="h-5 w-5 text-blue-500" />
    </div>
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{valor}</p>
    </div>
  </div>
</div>
```

**Cores por stat:**

| Stat | Background | Texto |
|------|-----------|-------|
| Reunioes | bg-blue-500/10 | text-blue-500 |
| Score | bg-purple-500/10 | text-purple-500 |
| Negocios | bg-green-500/10 | text-green-500 |
| Valor | bg-yellow-500/10 | text-yellow-500 |

### Formulario padrao

```tsx
<div className="space-y-4">
  <div className="space-y-2">
    <Label className="text-sm font-medium">{label}</Label>
    <Input className="bg-secondary/50" />
  </div>
</div>
```

### Pagina de auth (login/register)

```
- Fundo: bg-background com blurs decorativos
- Card central: bg-card rounded-3xl shadow-2xl border-border
- Barra colorida no topo: h-1.5 from-blue-500 via-purple-500 to-pink-500
- Logo: w-16 h-16 rounded-2xl gradient blue-purple
- Inputs: h-12 rounded-xl bg-secondary/50
- Botao CTA: gradient from-blue-600 to-purple-600 h-12 rounded-xl
```

### Status indicators

| Status | Background | Texto | Borda |
|--------|-----------|-------|-------|
| Pendente | bg-amber-500/10 | text-amber-500 | border-amber-500/20 |
| Ativo/Sucesso | bg-green-500/10 | text-green-500 | border-green-500/20 |
| Erro/Inativo | bg-red-500/10 | text-red-500 | border-red-500/20 |
| Info | bg-blue-500/10 | text-blue-500 | border-blue-500/20 |

### Indicador de notificacao nao lida

```tsx
<span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-red-600 rounded-full" />
```

### Indicador online

```tsx
<span className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
```

---

## Sistema de Niveis

Definido em `src/lib/constants.ts`. Niveis sao **calculados**, nunca armazenados.

| Nivel | Reunioes | Cor texto | Cor fundo | Cor borda | Descricao |
|-------|----------|-----------|-----------|-----------|-----------|
| Platina | 0-49 | `text-muted-foreground` | `bg-muted/10` | `border-muted/20` | Iniciando Jornada |
| Safira | 50-150 | `text-blue-400` | `bg-blue-500/10` | `border-blue-500/20` | Networker Experiente |
| Diamante | 151+ | `text-cyan-400` | `bg-cyan-500/10` | `border-cyan-500/20` | Elite Empresarial |

### Uso no componente

```tsx
const level = getUserLevel(meetingsCount)
// Retorna: { name, color, bg, border, description, min, max }

<Badge className={cn(level.bg, level.color, level.border, "border")}>
  {level.name}
</Badge>
```

---

## Tema

### Configuracao

Provider: `next-themes` em `src/providers/theme-provider.tsx`

```tsx
<ThemeProvider
  attribute="class"
  defaultTheme="dark"
  enableSystem
  disableTransitionOnChange
>
```

**Tema padrao: dark**

### Toggle

Botao no Sidebar e Header usando icones `Sun` / `Moon`:

```tsx
<Button variant="ghost" size="icon" onClick={toggleTheme}>
  {theme === 'dark' ? <Sun /> : <Moon />}
</Button>
```

### Scrollbar customizado

```css
/* Global */
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: hsl(var(--muted) / 0.5); }
::-webkit-scrollbar-thumb {
  background: hsl(var(--muted-foreground) / 0.3);
  border-radius: 9999px;
}
::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--muted-foreground) / 0.5);
}

/* Compacto (classe .custom-scrollbar) */
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track {
  background: hsl(var(--muted) / 0.3);
  border-radius: 9999px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: hsl(var(--muted-foreground) / 0.2);
  border-radius: 9999px;
}
```

---

## Breakpoints

Tailwind v4 padrao:

| Prefixo | Min-width | Uso no projeto |
|---------|-----------|----------------|
| `sm` | 640px | Ajustes de formulario |
| `md` | 768px | Padding maior, grid 2 colunas |
| `lg` | 1024px | Sidebar visivel, grid 3 colunas |
| `xl` | 1280px | Max-width containers |

### Grid patterns

```
1 coluna mobile → 2 colunas md → 3 colunas lg:
  grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4

Stats cards:
  grid grid-cols-2 lg:grid-cols-4 gap-4

Formulario + lista side-by-side:
  grid grid-cols-1 lg:grid-cols-3 gap-6
```

---

## Resumo de Arquivos

```
src/
├── app/globals.css              ← Tokens de cor, animacoes CSS, scrollbar
├── lib/utils.ts                 ← Funcao cn()
├── lib/constants.ts             ← SUPER_ADMINS, LEVEL_THRESHOLDS, getUserLevel
├── providers/theme-provider.tsx ← next-themes (dark default)
├── components/ui/               ← 15 componentes base (Radix + CVA)
│   ├── button.tsx               ← 6 variants, 4 sizes
│   ├── badge.tsx                ← 4 variants
│   ├── input.tsx                ← Estilo base
│   ├── label.tsx                ← Radix Label
│   ├── checkbox.tsx             ← Blue checked state
│   ├── avatar.tsx               ← Root + Image + Fallback
│   ├── dialog.tsx               ← 11 subcomponentes
│   ├── alert-dialog.tsx         ← 11 subcomponentes
│   ├── dropdown-menu.tsx        ← 15 subcomponentes
│   ├── popover.tsx              ← 3 subcomponentes
│   ├── select.tsx               ← 10 subcomponentes
│   ├── tabs.tsx                 ← 4 subcomponentes
│   ├── table.tsx                ← 8 subcomponentes
│   ├── toast.tsx                ← 2 variants (default, destructive)
│   └── toaster.tsx              ← Composicao de toast
├── components/layout/           ← Header + Sidebar
└── components/features/         ← 7 componentes de feature
```
