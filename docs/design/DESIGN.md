# DESIGN.md — Design System P14 Portal de Practică

> Design tokens oficiali pentru toate ecranele proiectului P14.
> **Stack**: Tailwind CSS — valorile de mai jos corespund claselor Tailwind și custom properties CSS.
> Toți mock-urile HTML din `mocks/` TREBUIE să folosească exclusiv aceste tokens.

---

## 1. Tokens Culori (Light Mode)

### Paleta Primară — Albastru Universitar
| Token | Valoare Hex | Clasa Tailwind | Utilizare |
|-------|-------------|----------------|-----------|
| `--color-primary-50` | `#eff6ff` | `bg-blue-50` | Fundal card highlight |
| `--color-primary-100` | `#dbeafe` | `bg-blue-100` | Fundal badge |
| `--color-primary-500` | `#3b82f6` | `bg-blue-500` | Buton primar, link activ |
| `--color-primary-600` | `#2563eb` | `bg-blue-600` | Hover buton primar |
| `--color-primary-700` | `#1d4ed8` | `bg-blue-700` | Active/focus buton |
| `--color-primary-900` | `#1e3a8a` | `bg-blue-900` | Text dark pe fundal light |

### Paleta Neutră — Suprafețe & Text
| Token | Valoare Hex | Clasa Tailwind | Utilizare |
|-------|-------------|----------------|-----------|
| `--color-bg-page` | `#f8fafc` | `bg-slate-50` | Fundal pagină |
| `--color-bg-card` | `#ffffff` | `bg-white` | Fundal card |
| `--color-bg-sidebar` | `#f1f5f9` | `bg-slate-100` | Sidebar / nav |
| `--color-border` | `#e2e8f0` | `border-slate-200` | Borduri card/input |
| `--color-text-primary` | `#0f172a` | `text-slate-900` | Text principal |
| `--color-text-secondary` | `#475569` | `text-slate-600` | Text secundar, label |
| `--color-text-muted` | `#94a3b8` | `text-slate-400` | Text dezactivat / placeholder |

### Paleta Semantică — Status
| Token | Hex | Tailwind | Utilizare |
|-------|-----|----------|-----------|
| `--color-success-bg` | `#f0fdf4` | `bg-green-50` | Card status succes |
| `--color-success` | `#16a34a` | `text-green-600` | Text / icon succes |
| `--color-warning-bg` | `#fffbeb` | `bg-amber-50` | Card status atenție |
| `--color-warning` | `#d97706` | `text-amber-600` | Text / icon atenție |
| `--color-error-bg` | `#fef2f2` | `bg-red-50` | Card status eroare |
| `--color-error` | `#dc2626` | `text-red-600` | Text / icon eroare |
| `--color-info-bg` | `#eff6ff` | `bg-blue-50` | Card status informativ |
| `--color-info` | `#2563eb` | `text-blue-600` | Text / icon informativ |

### Status Plasament
| Status Enum | Badge BG | Badge Text | Tailwind |
|-------------|----------|------------|----------|
| `PENDING_CONFIRMATION` | `#fef9c3` | `#854d0e` | `bg-yellow-100 text-yellow-800` |
| `CONFIRMED` | `#dcfce7` | `#166534` | `bg-green-100 text-green-800` |
| `CANCELLED_BY_STUDENT` | `#fee2e2` | `#991b1b` | `bg-red-100 text-red-800` |
| `CANCELLED_BY_COMPANY` | `#fee2e2` | `#991b1b` | `bg-red-100 text-red-800` |
| `CANCELLED_BY_COORDINATOR` | `#f3f4f6` | `#374151` | `bg-gray-100 text-gray-700` |

---

## 2. Tokens Culori (Dark Mode)

| Token | Light Hex | Dark Hex | Dark Tailwind |
|-------|-----------|----------|---------------|
| `--color-bg-page` | `#f8fafc` | `#0f172a` | `dark:bg-slate-950` |
| `--color-bg-card` | `#ffffff` | `#1e293b` | `dark:bg-slate-800` |
| `--color-bg-sidebar` | `#f1f5f9` | `#1e293b` | `dark:bg-slate-800` |
| `--color-border` | `#e2e8f0` | `#334155` | `dark:border-slate-700` |
| `--color-text-primary` | `#0f172a` | `#f8fafc` | `dark:text-slate-50` |
| `--color-text-secondary` | `#475569` | `#94a3b8` | `dark:text-slate-400` |
| `--color-text-muted` | `#94a3b8` | `#64748b` | `dark:text-slate-500` |
| `--color-primary-500` | `#3b82f6` | `#60a5fa` | `dark:text-blue-400` |

---

## 3. Tipografie

| Token | Valoare | Tailwind |
|-------|---------|----------|
| `--font-sans` | `Inter, ui-sans-serif, system-ui` | `font-sans` |
| `--font-mono` | `JetBrains Mono, ui-monospace` | `font-mono` |
| `--text-xs` | `12px / 16px` | `text-xs` |
| `--text-sm` | `14px / 20px` | `text-sm` |
| `--text-base` | `16px / 24px` | `text-base` |
| `--text-lg` | `18px / 28px` | `text-lg` |
| `--text-xl` | `20px / 28px` | `text-xl` |
| `--text-2xl` | `24px / 32px` | `text-2xl` |
| `--text-3xl` | `30px / 36px` | `text-3xl` |
| `--font-medium` | `500` | `font-medium` |
| `--font-semibold` | `600` | `font-semibold` |
| `--font-bold` | `700` | `font-bold` |

---

## 4. Spațieri (Spacing Scale)

Bazat pe scara de 4px a Tailwind:

| Token | Valoare | Tailwind |
|-------|---------|----------|
| `--space-1` | `4px` | `p-1`, `m-1` |
| `--space-2` | `8px` | `p-2`, `gap-2` |
| `--space-3` | `12px` | `p-3`, `gap-3` |
| `--space-4` | `16px` | `p-4`, `gap-4` |
| `--space-6` | `24px` | `p-6`, `gap-6` |
| `--space-8` | `32px` | `p-8` |
| `--space-12` | `48px` | `py-12` |
| `--space-16` | `64px` | `py-16` |

---

## 5. Border Radius

| Token | Valoare | Tailwind |
|-------|---------|----------|
| `--radius-sm` | `4px` | `rounded-sm` |
| `--radius-md` | `8px` | `rounded-md` |
| `--radius-lg` | `12px` | `rounded-lg` |
| `--radius-xl` | `16px` | `rounded-xl` |
| `--radius-full` | `9999px` | `rounded-full` |

---

## 6. Umbre (Shadows)

| Token | Tailwind | Utilizare |
|-------|----------|-----------|
| `--shadow-sm` | `shadow-sm` | Card compact |
| `--shadow-md` | `shadow-md` | Card principal |
| `--shadow-lg` | `shadow-lg` | Modal / dropdown |

---

## 7. Componente Reutilizabile (Clase Tailwind Canonice)

### Buton Primar
```
bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md transition-colors
```

### Buton Secundar / Outline
```
border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium px-4 py-2 rounded-md transition-colors
```

### Buton Pericol (Destructiv)
```
bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-md transition-colors
```

### Card
```
bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 p-6
```

### Badge Status
```
inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
```

### Input
```
w-full border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500
```

### Skeleton Loader
```
animate-pulse bg-slate-200 dark:bg-slate-700 rounded-md
```

---

## 8. Iconuri

**Librărie**: [Lucide React](https://lucide.dev/) — consistent cu stiva proiectului.

Iconuri recomandate per context:
- Dashboard: `LayoutDashboard`
- Studenți: `Users`, `GraduationCap`
- Firme: `Building2`
- Plasamente: `Link2`, `CheckCircle2`
- Alerte: `AlertTriangle`, `Info`, `CheckCircle`, `XCircle`
- Export: `Download`, `FileDown`
- Stare goală: `Inbox`
- Loading: `Loader2` (cu `animate-spin`)
