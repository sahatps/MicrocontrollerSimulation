import { html, svg, LitElement } from 'lit';
import type { ElementPin } from '@wokwi/elements';

export class LedElement extends LitElement {
  readonly pinInfo: ElementPin[] = [
    { name: 'A', x: 44, y: 78, signals: [], number: 1 },
    { name: 'C', x: 76, y: 60, signals: [], number: 2 },
  ];

  value = false;
  isOn = false;
  private previewBlinkTimer: number | null = null;

  connectedCallback() {
    super.connectedCallback();
    this.syncPreviewBlink();
  }

  disconnectedCallback() {
    this.stopPreviewBlink();
    super.disconnectedCallback();
  }

  private syncPreviewBlink() {
    if (!this.hasAttribute('preview-blink')) {
      this.stopPreviewBlink();
      return;
    }
    if (this.previewBlinkTimer !== null) {
      return;
    }
    this.isOn = true;
    this.previewBlinkTimer = window.setInterval(() => {
      this.isOn = !this.isOn;
      this.requestUpdate();
    }, 650);
  }

  private stopPreviewBlink() {
    if (this.previewBlinkTimer !== null) {
      window.clearInterval(this.previewBlinkTimer);
      this.previewBlinkTimer = null;
    }
  }

  private svgContent() {
    const on = this.isOn || this.value;

    return svg`
      <svg
        width="6mm"
        height="5.5mm"
        version="1.1"
        viewBox="0 0 100 90"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="ledLens" cx="50%" cy="34%" r="70%">
            <stop offset="0%" stop-color="${on ? '#fffafa' : '#3a0a0a'}"/>
            <stop offset="34%" stop-color="${on ? '#ff2a21' : '#1f0505'}"/>
            <stop offset="100%" stop-color="${on ? '#c40000' : '#090101'}"/>
          </radialGradient>
          <filter id="ledGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="5" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <line x1="44" y1="42" x2="44" y2="78" stroke="#c2c8cf" stroke-width="2.6" stroke-linecap="square"/>
        <line x1="76" y1="42" x2="76" y2="60" stroke="#c2c8cf" stroke-width="2.6" stroke-linecap="square"/>
        <circle cx="44" cy="78" r="6.6" fill="#596272" stroke="#222831" stroke-width="1.6"/>
        <circle cx="76" cy="60" r="6.6" fill="#596272" stroke="#222831" stroke-width="1.6"/>

        <g opacity="${on ? '1' : '0'}" stroke="#ff3b30" stroke-width="2.2" stroke-linecap="round" filter="url(#ledGlow)">
          <line x1="58" y1="6" x2="58" y2="12"/>
          <line x1="24" y1="20" x2="30" y2="26"/>
          <line x1="92" y1="20" x2="86" y2="26"/>
          <line x1="20" y1="40" x2="28" y2="40"/>
          <line x1="96" y1="40" x2="88" y2="40"/>
        </g>
        <ellipse cx="58" cy="34" rx="${on ? '28' : '22'}" ry="${on ? '22' : '17'}"
                 fill="${on ? '#ff2a21' : '#230707'}"
                 opacity="${on ? '0.55' : '0.08'}"
                 filter="${on ? 'url(#ledGlow)' : 'none'}"/>
        <path d="M38 41 L38 21 C38 10 46 4 58 4 C70 4 78 10 78 21 L78 41 Z"
              fill="url(#ledLens)"
                 stroke="${on ? '#ff8a80' : '#7a1010'}" stroke-width="1.3"
                 filter="${on ? 'url(#ledGlow)' : 'none'}"/>
        <path d="M42 40 L42 18 C42 11 48 8 58 8 C68 8 74 11 74 18 L74 40 L62 40 L52 31 L52 40 Z"
              fill="${on ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)'}"
              stroke="${on ? 'rgba(255,255,255,0.34)' : 'rgba(255,255,255,0.12)'}" stroke-width="0.8"/>
        <ellipse cx="51" cy="17" rx="4.5" ry="6" fill="${on ? '#ffffff' : '#6e2222'}" opacity="${on ? '0.72' : '0.16'}"/>
        <rect x="38" y="40" width="40" height="5" fill="${on ? '#cf1919' : '#7a0d0d'}"/>

        <text x="44" y="78" fill="#ffffff" font-family="Arial, sans-serif" font-size="9" font-weight="700"
              text-anchor="middle" dominant-baseline="middle">+</text>
        <text x="76" y="60" fill="#ffffff" font-family="Arial, sans-serif" font-size="9" font-weight="700"
              text-anchor="middle" dominant-baseline="middle">-</text>
        <text x="31" y="80.5" fill="#c2c8cf" font-family="Arial, sans-serif" font-size="8" font-weight="700" text-anchor="middle">A</text>
        <text x="89" y="62.5" fill="#c2c8cf" font-family="Arial, sans-serif" font-size="8" font-weight="700" text-anchor="middle">C</text>
      </svg>
    `;
  }

  render() {
    return html`${this.svgContent()}`;
  }
}

customElements.define('led-element', LedElement);
