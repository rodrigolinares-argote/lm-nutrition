/**
 * LM Nutrition — Modal
 * Bottom-sheet modal. Singleton.
 * Uso: modal.open({ title, content, onClose });  modal.close();
 */

class ModalManager {
  constructor() {
    this._backdrop = null;
    this._body     = null;
    this._onClose  = null;
    this._bound    = this._onKey.bind(this);
  }

  _init() {
    if (this._backdrop) return;
    this._backdrop = document.getElementById('modal-backdrop');
    if (!this._backdrop) {
      this._backdrop = document.createElement('div');
      this._backdrop.id        = 'modal-backdrop';
      this._backdrop.className = 'modal-backdrop';
      this._backdrop.innerHTML = `<div class="modal"><div class="modal__handle"></div><div class="modal__body"></div></div>`;
      document.body.appendChild(this._backdrop);
    }
    this._body = this._backdrop.querySelector('.modal__body');
    this._backdrop.addEventListener('click', (e) => { if (e.target === this._backdrop) this.close(); });
  }

  open({ title = '', content = '', onClose = null } = {}) {
    this._init();
    this._body.innerHTML = `${title ? `<h2 class="modal__title">${title}</h2>` : ''}${content}`;
    this._onClose = onClose;
    this._backdrop.setAttribute('aria-hidden', 'false');
    this._backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', this._bound);
    requestAnimationFrame(() => {
      const f = this._body.querySelector('input, button, select, textarea');
      f?.focus();
    });
  }

  close() {
    if (!this._backdrop) return;
    this._backdrop.classList.remove('open');
    this._backdrop.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', this._bound);
    if (this._onClose) { this._onClose(); this._onClose = null; }
  }

  _onKey(e) { if (e.key === 'Escape') this.close(); }

  setContent(html) {
    this._init();
    if (this._body) this._body.innerHTML = html;
  }

  isOpen() { return this._backdrop?.classList.contains('open') ?? false; }
}

export const modal = new ModalManager();
