# Precision-Jab v1.2

> Scroll-triggered social proof toasts & urgency countdown — zero dependencies.

Precision-Jab watches for tagged sections entering the viewport and fires one of two behaviours: a fleeting **social-proof popup** or a **persistent countdown bar** that locks in once triggered and survives page refreshes.

---

## Files

| File | Purpose |
|---|---|
| `precision-jab.js` | Core plugin — all logic, styles, and widgets |
| `precision-jab-data.js` | Dictionary of names, locations, timeframes, and verbs |

Load the dictionary **before** the plugin.

```html
<script src="precision-jab-data.js"></script>
<script src="precision-jab.js"></script>
```

---

## Quick Start

Tag any element with `data-precision-jab` and set its type:

```html
<!-- Fires a social-proof toast when scrolled into view -->
<section data-precision-jab="social-proof">
  ...
</section>

<!-- Fires the countdown bar — permanent from this point on -->
<section data-precision-jab="urgency">
  ...
</section>
```

That's it. No `new`, no init call — the plugin boots itself on `DOMContentLoaded`.

---

## Configuration

All hardcoded values live at the top of `precision-jab.js` inside the `CONFIG` object. Edit these before deploying:

```js
const CONFIG = Object.freeze({
  // Social proof
  productName:   'Premium Membership',  // Shown in the toast body
  productImage:  '',                    // URL to product image; leave empty for default icon
  toastDuration: 5000,                  // ms the toast stays visible
  maxShows:      5,                     // Max social-proof toasts per session
  cooldown:      1500,                  // ms between consecutive toasts

  // Countdown
  countdownSecs: 900,                   // Timer duration in seconds (900 = 15 min)
  redirectUrl:   'https://example.com/expired', // Where to go when the timer hits zero
  countdownText: '🔥 This offer expires in',    // Label beside the clock
  theme:         'light',               // 'light' | 'dark'

  // Internals
  storagePrefix: 'pjab',               // localStorage key prefix
  brand:         '#7C3AED',            // Accent color (hex)
  brandName:     'by <b>ProveSource</b>', // Badge label in toast
});
```

---

## Trigger Types

### `social-proof`

- Fires **once per element** (re-entering the viewport does nothing).
- Displays a randomised toast — name, location, verb, and timeframe are picked at random from `precision-jab-data.js`.
- Disappears automatically after `toastDuration` ms or on click.
- Stops firing once the urgency bar is active or `maxShows` is reached.

### `urgency`

- Fires a **sticky countdown bar** at the bottom of the screen.
- The end-time is written to `localStorage` on first trigger — it **persists across refreshes**.
- If the page is reloaded after the countdown has already started, the bar resumes from where it left off.
- When the timer reaches zero the user is redirected to `redirectUrl`.
- Once the urgency bar is active, all social-proof triggers are suppressed.

---

## Customising the Dictionary

Edit `precision-jab-data.js` to control what appears in social-proof toasts. Keep this file separate so `precision-jab.js` stays lean.

```js
window.PRECISION_JAB_DATA = {
  names:      ['Emma', 'Liam', /* ... */],
  locations:  ['London, UK', 'New York, US', /* ... */],
  timeframes: ['2 minutes ago', '1 hour ago', /* ... */],
  verbs:      ['purchased', 'signed up for', /* ... */],
};
```

All four arrays are required. The plugin falls back to single-item defaults if `PRECISION_JAB_DATA` is missing, so the page won't break if the dictionary fails to load.

---

## How It Works

```
Page load
  │
  ├─ localStorage has active countdown?
  │     └─ Yes → resume UrgencyJab immediately
  │
  └─ No → attach IntersectionObserver to all [data-precision-jab] elements
              │
              ├─ "social-proof" enters viewport → show SocialJab toast
              │     (max once per element, respects cooldown & maxShows)
              │
              └─ "urgency" enters viewport → destroy observer, show UrgencyJab
                    (persists until redirect)
```

---

## Debugging the Social-Proof Toast

If toasts aren't appearing, check the following in order:

1. **`precision-jab-data.js` loads before `precision-jab.js`** — the plugin reads `window.PRECISION_JAB_DATA` at parse time.
2. **The attribute is spelled correctly** — it must be `data-precision-jab="social-proof"` (hyphenated, lowercase).
3. **`maxShows` not exhausted** — each page session allows up to `maxShows` toasts. Reload to reset.
4. **Urgency already active** — if `localStorage` holds a live countdown, social proof is suppressed on load. Clear `localStorage` to test fresh.
5. **Element not crossing the threshold** — the observer fires at `0.15` intersection ratio. If the trigger element is very short it may never reach 15 % visibility; make it taller or reduce the threshold.

---

## API

The plugin exposes itself as `window.PrecisionJab` after boot for manual control:

```js
// Force-start the urgency countdown programmatically
window.PrecisionJab._enterUrgency();

// Tear everything down and clean up localStorage
window.PrecisionJab.destroy();
```

---

## Browser Support

Works in any browser with `IntersectionObserver` support — all modern browsers and Safari 12.1+. No polyfills included.

---

## License

MIT
