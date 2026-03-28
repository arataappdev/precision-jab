/**
 ╔═══════════════════════════════════════════╗
 ║        PRECISION-JAB v1.2 — Monolith      ║
 ║   Scroll-triggered social proof & urgency  ║
 ╚═══════════════════════════════════════════╝
 */
(function (w, d) {
  'use strict';

  const CONFIG = Object.freeze({
    productName:   'Premium Membership',
    productImage:  '',
    toastDuration: 5000,
    maxShows:      5,
    cooldown:      1500,
    countdownSecs: 900,
    redirectUrl:   'https://example.com/expired',
    countdownText: '🔥 This offer expires in',
    storagePrefix: 'pjab',
    brand:         '#7C3AED',
    brandName:     'by <b>ProveSource</b>',
    theme:         'light',
  });

  const LS_END = `${CONFIG.storagePrefix}_end`;
  const LS_ON  = `${CONFIG.storagePrefix}_on`;
  const POOL   = w.PRECISION_JAB_DATA || {
    names: ['Someone'], locations: ['Earth'],
    timeframes: ['just now'], verbs: ['purchased']
  };
  const PAD  = Array.from({ length: 100 }, (_, i) => (i < 10 ? '0' : '') + i);
  const pick = a => a[(Math.random() * a.length) | 0];
  const Store = {
    get: k => localStorage.getItem(k),
    set: (k, v) => localStorage.setItem(k, String(v)),
    del: k => localStorage.removeItem(k),
  };

  const B = CONFIG.brand;

  d.head.insertAdjacentHTML('beforeend', `<style id="pjab-css">
.pjab-w{position:fixed;bottom:24px;left:20px;right:20px;z-index:2147483647;
  font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;
  display:flex;justify-content:center;pointer-events:none;
  opacity:0;transform:translateY(100%) scale(.95);
  transition:transform .55s cubic-bezier(.175,.885,.32,1.275),opacity .35s ease}
.pjab-w.in{opacity:1;transform:translateY(0) scale(1);pointer-events:auto}
.pjab-w.out{opacity:0;transform:translateY(20px) scale(.96);
  transition:transform .28s ease,opacity .25s ease;pointer-events:none}

.pjab-toast{width:100%;max-width:400px;background:#fff;border-radius:16px;
  box-shadow:0 0 0 .5px rgba(0,0,0,.06),0 4px 6px -2px rgba(0,0,0,.05),
  0 16px 40px -8px rgba(0,0,0,.14);
  padding:11px 13px;display:flex;align-items:center;gap:12px;
  cursor:pointer;overflow:hidden;position:relative}
.pjab-img{flex-shrink:0;width:60px;height:60px;border-radius:10px;
  background:#f4f1fd;overflow:hidden;border:.5px solid rgba(124,58,237,.12);
  display:flex;align-items:center;justify-content:center}
.pjab-img img{width:100%;height:100%;object-fit:cover}
.pjab-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}
.pjab-l1{font-size:14.5px;line-height:1.3;color:#18181b;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pjab-l1 b{font-weight:600}
.pjab-l1 span{color:#71717a;font-weight:400}
.pjab-l2{font-size:13.5px;color:#71717a;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pjab-l2 b{color:#18181b;font-weight:500}
.pjab-l3{display:flex;align-items:center;gap:5px;font-size:12px;color:#71717a;margin-top:1px}
.pjab-badge{display:inline-flex;align-items:center;gap:4px;color:${B};font-weight:600}
.pjab-chk{width:15px;height:15px;background:${B};border-radius:50%;
  display:inline-flex;align-items:center;justify-content:center;flex-shrink:0}

.pjab-drain{position:absolute;bottom:0;left:0;height:2.5px;width:100%;
  background:rgba(124,58,237,.1);border-radius:0 0 16px 16px;overflow:hidden}
.pjab-drain::after{content:'';display:block;height:100%;width:100%;
  background:${B};transform-origin:left;
  animation-name:pjab-d;animation-timing-function:linear;animation-fill-mode:forwards;
  animation-duration:var(--pjab-dur)}
@keyframes pjab-d{to{transform:scaleX(0)}}

.pjab-bar{width:85%;max-width:430px;border-radius:12px;overflow:hidden;
  animation:pjab-s .4s cubic-bezier(.175,.885,.32,1.275)}
.pjab-bar.light{background:#fff;box-shadow:0 10px 40px rgba(0,0,0,.1);border:1px solid rgba(0,0,0,.08)}
.pjab-bar.dark{background:#0a0a0b;box-shadow:0 10px 40px rgba(0,0,0,.4);border:1px solid rgba(255,255,255,.1)}
.pjab-bar-in{width:100%;box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;padding:16px 36px;gap:16px}
.pjab-bar-txt{font-size:15px;font-weight:500;line-height:1.4;max-width:120px}
.pjab-bar.light .pjab-bar-txt{color:#18181b}
.pjab-bar.dark .pjab-bar-txt{color:#fff}
.pjab-bar-tm{font-size:42px;font-weight:900;font-variant-numeric:tabular-nums;
  letter-spacing:4px;border-radius:10px;padding:12px 20px;font-feature-settings:'tnum'}
.pjab-bar.light .pjab-bar-tm{color:#dc2626;background:rgba(220,38,38,.05)}
.pjab-bar.dark .pjab-bar-tm{color:#fff;background:rgba(255,255,255,.05)}
@keyframes pjab-s{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}

@media(max-width:480px){
  .pjab-w{bottom:12px;left:12px;right:12px}
  .pjab-bar-in{padding:12px 16px;flex-direction:row;gap:10px;text-align:left}
  .pjab-bar-tm{font-size:32px;padding:10px 16px;width:fit-content}
  .pjab-bar-txt{font-size:13px}
}
</style>`);

  /* ── BASE WIDGET ── */
  class JabWidget {
    constructor() {
      if (new.target === JabWidget) throw new Error('Abstract');
      this.el = d.createElement('div');
      this.el.className = 'pjab-w';
      this._dead = false;
      this._timer = 0;
      this._raf = 0;
    }
    mount() {
      d.body.appendChild(this.el);
      requestAnimationFrame(() => requestAnimationFrame(() => this.el.classList.add('in')));
      return this;
    }
    dismiss(cb) {
      if (this._dead) return;
      this._dead = true;
      clearTimeout(this._timer);
      this.el.classList.replace('in', 'out');
      const cleanup = () => { this.el.remove(); cb?.(); };
      this.el.addEventListener('transitionend', cleanup, { once: true });
      setTimeout(cleanup, 400);
    }
    destroy() {
      if (this._dead) return;
      this._dead = true;
      clearTimeout(this._timer);
      cancelAnimationFrame(this._raf);
      this.el.remove();
    }
  }

  /* ── SOCIAL PROOF TOAST ── */
  class SocialJab extends JabWidget {
    constructor() {
      super();
      const name = pick(POOL.names), loc = pick(POOL.locations);
      const verb = pick(POOL.verbs),  time = pick(POOL.timeframes);
      const prod = CONFIG.productName;
      this.el.setAttribute('role', 'status');
      this.el.setAttribute('aria-live', 'polite');
      this.el.innerHTML = `
        <div class="pjab-toast">
          <div class="pjab-img">${CONFIG.productImage
            ? `<img src="${CONFIG.productImage}" alt="${prod}">`
            : `<svg width="38" height="38" viewBox="0 0 38 38" fill="none">
                <rect width="38" height="38" rx="8" fill="${B}" opacity=".12"/>
                <path d="M10 27c3-8 8-14 14-10s5 8 5 8" stroke="${B}" stroke-width="2.2" stroke-linecap="round"/>
                <circle cx="14" cy="16" r="3" fill="${B}" opacity=".4"/>
              </svg>`}
          </div>
          <div class="pjab-body">
            <div class="pjab-l1"><b>${name}</b> <span>(${loc})</span></div>
            <div class="pjab-l2">${verb} <b>${prod}</b></div>
            <div class="pjab-l3">
              ${time}&nbsp;
              <span class="pjab-badge">
                <span class="pjab-chk"><svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path d="M1.5 4l2 2 3-3" stroke="#fff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                </svg></span>
                ${CONFIG.brandName}
              </span>
            </div>
          </div>
          <div class="pjab-drain" style="--pjab-dur:${CONFIG.toastDuration}ms"></div>
        </div>`;
    }
    activate(onDone) {
      this.mount();
      this._timer = setTimeout(() => this.dismiss(onDone), CONFIG.toastDuration);
      this.el.addEventListener('click', () => {
        clearTimeout(this._timer);
        this.dismiss(onDone);
      }, { once: true });
      return this;
    }
  }

  /* ── URGENCY COUNTDOWN ── */
  class UrgencyJab extends JabWidget {
    constructor() {
      super();
      const stored = Store.get(LS_END);
      this.endTime = stored && +stored > Date.now()
        ? +stored
        : (() => {
            const t = Date.now() + CONFIG.countdownSecs * 1000;
            Store.set(LS_END, t);
            Store.set(LS_ON, '1');
            return t;
          })();
      this.el.setAttribute('role', 'timer');
      this.el.setAttribute('aria-live', 'assertive');
      this.el.innerHTML = `
        <div class="pjab-bar ${CONFIG.theme}">
          <div class="pjab-bar-in">
            <div class="pjab-bar-txt">${CONFIG.countdownText}</div>
            <div class="pjab-bar-tm">00:00:00</div>
          </div>
        </div>`;
      this._digits = this.el.querySelector('.pjab-bar-tm');
      this._tick = this._tick.bind(this);
    }
    activate() {
      this.mount();
      this._raf = requestAnimationFrame(this._tick);
      return this;
    }
    _tick() {
      const diff = this.endTime - Date.now();
      if (diff <= 0) { this._digits.textContent = '00:00:00'; return this._expire(); }
      const h = (diff / 3600000) | 0;
      const m = ((diff % 3600000) / 60000) | 0;
      const s = ((diff % 60000) / 1000) | 0;
      this._digits.textContent = `${PAD[h]}:${PAD[m]}:${PAD[s]}`;
      this._raf = requestAnimationFrame(this._tick);
    }
    _expire() {
      Store.del(LS_END);
      Store.del(LS_ON);
      if (CONFIG.redirectUrl) w.location.replace(CONFIG.redirectUrl);
    }
    destroy() { cancelAnimationFrame(this._raf); super.destroy(); }
  }

  /* ── ORCHESTRATOR ── */
  class PrecisionJab {
    constructor() {
      this.state    = 'idle';
      this.observer = null;
      this.active   = null;
      this.shows    = 0;
      this.cooldown = false;
      this._seen    = new WeakSet(); // per-element idempotency guard
    }
    boot() {
      if (Store.get(LS_ON)) {
        const end = +Store.get(LS_END);
        if (end > Date.now()) return this._enterUrgency();
        Store.del(LS_END);
        Store.del(LS_ON);
        if (CONFIG.redirectUrl) return w.location.replace(CONFIG.redirectUrl);
      }
      this._observe();
    }
    _observe() {
      const targets = d.querySelectorAll('[data-precision-jab]');
      if (!targets.length) return;
      this.observer = new IntersectionObserver(entries => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const type = e.target.dataset.precisionJab;
          if (type === 'urgency') { this.observer.disconnect(); return this._enterUrgency(); }
          if (type === 'social-proof' && this.state !== 'urgency') this._enterSocial(e.target);
        }
      }, { threshold: 0.15 });
      targets.forEach(t => this.observer.observe(t));
    }
    _enterSocial(el) {
      if (this.state === 'urgency' || this.shows >= CONFIG.maxShows) return;
      if (this._seen.has(el)) return;  // already triggered — bail
      this._seen.add(el);              // mark before any async work
      this.observer.unobserve(el);     // stop observing (optimization)

      // dismiss any live toast immediately, then show the new one
      if (this.active && !this.active._dead) this.active.dismiss();

      this.state    = 'social';
      this.shows++;
      this.cooldown = true;
      this.active   = new SocialJab().activate(() => {
        this.active = null;
        this.state  = 'idle';
        setTimeout(() => { this.cooldown = false; }, CONFIG.cooldown);
      });
    }
    _enterUrgency() {
      if (this.state === 'urgency') return;
      if (this.active) { this.active.destroy(); this.active = null; }
      this.observer?.disconnect();
      this.state = 'urgency';
      Store.set(LS_ON, '1');
      this.active = new UrgencyJab().activate();
    }
    destroy() {
      this.observer?.disconnect();
      this.active?.destroy();
      Store.del(LS_END);
      Store.del(LS_ON);
      d.getElementById('pjab-css')?.remove();
    }
  }

  const boot = () => { const pj = new PrecisionJab(); pj.boot(); w.PrecisionJab = pj; };
  d.readyState === 'loading'
    ? d.addEventListener('DOMContentLoaded', boot, { once: true })
    : boot();
})(window, document);
