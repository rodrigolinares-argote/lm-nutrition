# LM Nutrition

Aplicación de nutrición deportiva premium. PWA lista para Android/iOS vía Capacitor.

## Arranque local

```bash
# Opción 1 — Python (recomendado para desarrollo)
cd lm-nutrition
python3 -m http.server 3000
# → http://localhost:3000

# Opción 2 — Node.js
npx serve .
# → http://localhost:3000

# Opción 3 — VS Code
# Instalar extensión "Live Server" → clic derecho en index.html → Open with Live Server
```

> **Importante:** Requiere servidor HTTP local. Abriendo `index.html` directamente (`file://`) los ES Modules no funcionan por restricciones del navegador.

---

## Stack

| Capa         | Tecnología                          |
|-------------|--------------------------------------|
| UI           | Vanilla JS + ES Modules nativos      |
| Estilos      | CSS custom properties (sin preprocesador) |
| Almacenamiento | IndexedDB (wrapper propio, sin Dexie) |
| PWA          | Service Worker + Web App Manifest    |
| Nativo futuro | Capacitor (sin cambios de código)  |

Sin frameworks. Sin bundlers. Sin dependencias npm. Listo para producción tal como está.

---

## Estructura

```
lm-nutrition/
├── index.html              → Shell mínima. Sin lógica.
├── manifest.json           → PWA manifest
├── service-worker.js       → Cache-first, soporte offline
├── README.md
│
├── assets/
│   ├── icons/              → icon-192.png, icon-512.png (para PWA)
│   ├── images/             → Imágenes de la app
│   └── logo/               → logo.svg
│
├── css/
│   ├── tokens.css          → Design tokens (paleta, tipografía, espaciado)
│   ├── base.css            → Reset + app shell + utilidades
│   ├── components.css      → Todos los componentes reutilizables
│   └── animations.css      → Todos los @keyframes centralizados
│
└── js/
    ├── app.js              → Entry point: boot → servicios → router → SW
    │
    ├── components/
    │   ├── BottomNav.js    → Barra de navegación inferior
    │   ├── MacroRing.js    → Anillos SVG (elemento signature)
    │   ├── Modal.js        → Bottom-sheet modal singleton
    │   └── Toast.js        → Notificaciones flotantes
    │
    ├── modules/
    │   ├── Dashboard.js    → Vista diaria: ring, agua, comidas
    │   ├── Log.js          → Búsqueda y registro de alimentos
    │   ├── Foods.js        → Base de datos + creación de alimentos
    │   ├── Progress.js     → Peso + gráfico de calorías
    │   └── Profile.js      → Perfil + onboarding + TDEE
    │
    ├── services/
    │   ├── NutritionService.js → Comidas, ítems, resúmenes
    │   ├── FoodService.js      → CRUD alimentos + 34 base
    │   └── ProfileService.js   → Perfil + cálculo de objetivos
    │
    ├── storage/
    │   ├── db.js           → Wrapper IndexedDB (Promise-based)
    │   └── schema.js       → Stores, versiones, factories de defaults
    │
    └── utils/
        ├── router.js       → SPA router hash-based con guards
        ├── eventBus.js     → Pub/Sub desacoplado entre módulos
        ├── dateUtils.js    → Helpers de fecha sin dependencias
        └── macroCalc.js    → Mifflin-St Jeor, TDEE, macros, BMI
```

---

## Reglas de arquitectura

**Comunicación entre módulos:** exclusivamente via `eventBus`. Ningún módulo importa a otro.

**Acceso a datos:** los módulos llaman a Services. Los Services son la única capa que llama a `db.js`. Nunca saltar capas.

**Agregar una vista:**
1. Crear `/js/modules/NuevaVista.js` con `{ render(container), destroy() }`
2. `router.register('ruta', NuevaVista, 'Título')` en `app.js`
3. Agregar tab en `BottomNav.js` si corresponde

**Agregar un store de datos:**
1. Definición en `schema.js > STORES`
2. Incrementar `DB_VERSION`
3. Bloque `if (oldVersion < N)` en `db.js > _open > onupgradeneeded`

**Agregar auth:** `router.addGuard()` en `app.js`. Sin tocar módulos.

**Agregar cloud sync:** implementar `db.sync()` en `db.js`. Todos los callers ya lo invocan.

---

## Preparación para Capacitor (Android/iOS)

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npx cap init "LM Nutrition" "com.linares.nutrition"
npx cap add android
npx cap add ios
npx cap sync
npx cap run android   # o ios
```

No requiere refactoring porque:
- Vanilla JS sin bundler → WebView lo ejecuta directamente
- IndexedDB funciona en Capacitor WebView
- `safe-area-inset-bottom` implementado para notch/home indicator
- `env(safe-area-inset-*)` ya está en el CSS

---

## Próximas funcionalidades (arquitectura lista)

- [ ] Escáner de código de barras (Capacitor Barcode Scanner)
- [ ] Health Connect / Apple Health (Capacitor Health)
- [ ] Sincronización cloud (hook `db.sync()`)
- [ ] Cuentas de usuario (guard en router)
- [ ] Widget nativo
- [ ] Inteligencia artificial para sugerencias
