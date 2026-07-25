/**
 * LM Nutrition — Toast
 * Notificaciones flotantes. Singleton.
 * Uso: toast.show('Mensaje', 'success' | 'error' | 'warning' | 'info');
 */

class ToastManager {
  constructor() {
    this._el = null;
  }

  _container() {
    if (!this._el) {
      this._el = document.getElementById('toast-container');
      if (!this._el) {
        this._el = document.createElement('div');
        this._el.id = 'toast-container';
        document.body.appendChild(this._el);
      }
    }
    return this._el;
  }

  show(message, type = 'info', duration = 3000) {
    const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    el.innerHTML = `
      <span class="toast__icon">${icons[type] ?? icons.info}</span>
      <span class="toast__text">${message}</span>
    `;
    this._container().appendChild(el);
    setTimeout(() => {
      el.classList.add('leaving');
      el.addEventListener('animationend', () => el.remove(), { once: true });
      setTimeout(() => el.remove(), 400);
    }, duration);
    return el;
  }
}

export const toast = new ToastManager();
