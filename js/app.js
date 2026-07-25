/**
 * LM Nutrition — Entry Point
 * Bootstrap: inicializa servicios, monta componentes globales, inicia el router.
 */

import { router }           from './utils/router.js';
import { eventBus, EVENTS } from './utils/eventBus.js';
import { foodService }      from './services/FoodService.js';
import { profileService }   from './services/ProfileService.js';
import { mountBottomNav }   from './components/BottomNav.js';
import { modal }            from './components/Modal.js';

import { DashboardModule }  from './modules/Dashboard.js';
import { LogModule }        from './modules/Log.js';
import { FoodsModule }      from './modules/Foods.js';
import { ProgressModule }   from './modules/Progress.js';
import { ProfileModule }    from './modules/Profile.js';

async function boot() {
  try {
    // 1. Seed base de datos de alimentos si está vacía
    await foodService.seedIfEmpty();

    // 2. Detectar si es primera vez
    const complete    = await profileService.isComplete();
    const defaultRoute = complete ? 'dashboard' : 'profile';

    // 3. Registrar rutas
    router.register('dashboard', DashboardModule, 'Inicio — LM Nutrition');
    router.register('log',       LogModule,       'Registrar — LM Nutrition');
    router.register('foods',     FoodsModule,     'Alimentos — LM Nutrition');
    router.register('progress',  ProgressModule,  'Progreso — LM Nutrition');
    router.register('profile',   ProfileModule,   'Perfil — LM Nutrition');

    // 4. Montar componentes globales
    const appEl = document.getElementById('app');
    mountBottomNav(appEl);
    modal._init();

    // 5. Iniciar router
    const content = document.getElementById('app-content');
    router.start(content, defaultRoute);

    // 6. Ocultar loading
    const loading = document.getElementById('app-loading');
    if (loading) {
      loading.classList.add('fade-out');
      setTimeout(() => loading.remove(), 450);
    }

    // 7. Registrar Service Worker
    _registerSW();

    eventBus.emit(EVENTS.APP_READY);

  } catch (err) {
    console.error('[Boot] Error fatal:', err);
    const loading = document.getElementById('app-loading');
    if (loading) {
      loading.innerHTML = `
        <div style="text-align:center;padding:2rem;color:#E6EDF3;font-family:system-ui;max-width:320px">
          <div style="font-size:2.5rem;margin-bottom:1rem">⚠️</div>
          <div style="font-size:1.1rem;font-weight:600;margin-bottom:.5rem">No se pudo iniciar la app</div>
          <div style="font-size:.85rem;color:#8B949E;margin-bottom:1.5rem">${err.message}</div>
          <button onclick="location.reload()"
            style="background:#00C896;color:#0D1117;border:none;padding:.75rem 1.5rem;
            border-radius:8px;font-size:1rem;cursor:pointer;font-weight:600">
            Reintentar
          </button>
        </div>
      `;
    }
  }
}

function _registerSW() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('/service-worker.js', { scope: '/' })
    .then(reg => {
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing;
        nw?.addEventListener('statechange', () => {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) {
            // toast importado dinámicamente para no bloquear el boot
            import('./components/Toast.js').then(({ toast }) => {
              toast.show('Nueva versión disponible. Recargá para actualizar.', 'info', 7000);
            });
          }
        });
      });
    })
    .catch(e => console.warn('[SW] No registrado:', e));
}

window.addEventListener('unhandledrejection', e => {
  console.error('[App] Promise sin manejar:', e.reason);
});

document.addEventListener('DOMContentLoaded', boot);
