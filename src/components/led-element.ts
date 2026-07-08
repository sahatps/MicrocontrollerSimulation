import { html, svg, LitElement } from 'lit';
import type { ElementPin } from '@wokwi/elements';

export class LedElement extends LitElement {
  readonly pinInfo: ElementPin[] = [
    { name: 'A', x: 23, y: 62, signals: [], number: 1 },
    { name: 'C', x: 37, y: 62, signals: [], number: 2 },
  ];

  value = false;
  isOn = false;

  private svgContent() {
    const on = this.isOn || this.value;

    return svg`
      <svg
        width="16mm"
        height="22mm"
        version="1.1"
        viewBox="0 0 60 82"
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

        <line x1="23" y1="50" x2="23" y2="72" stroke="#cfd4d8" stroke-width="3" stroke-linecap="round"/>
        <line x1="37" y1="50" x2="37" y2="72" stroke="#aeb5ba" stroke-width="3" stroke-linecap="round"/>
        <line x1="18" y1="72" x2="28" y2="72" stroke="#cfd4d8" stroke-width="2" stroke-linecap="round"/>
        <line x1="32" y1="72" x2="42" y2="72" stroke="#aeb5ba" stroke-width="2" stroke-linecap="round"/>

        <g opacity="${on ? '1' : '0'}" stroke="#ff3b30" stroke-width="2.2" stroke-linecap="round" filter="url(#ledGlow)">
          <line x1="30" y1="3" x2="30" y2="11"/>
          <line x1="8" y1="17" x2="14" y2="23"/>
          <line x1="52" y1="17" x2="46" y2="23"/>
          <line x1="4" y1="40" x2="12" y2="40"/>
          <line x1="56" y1="40" x2="48" y2="40"/>
        </g>
        <ellipse cx="30" cy="38" rx="${on ? '27' : '20'}" ry="${on ? '29' : '22'}"
                 fill="${on ? '#ff2a21' : '#230707'}"
                 opacity="${on ? '0.55' : '0.08'}"
                 filter="${on ? 'url(#ledGlow)' : 'none'}"/>
        <ellipse cx="30" cy="38" rx="18" ry="20" fill="url(#ledLens)"
                 stroke="${on ? '#ff8a80' : '#7a1010'}" stroke-width="1.3"
                 filter="${on ? 'url(#ledGlow)' : 'none'}"/>
        <path d="M18 39 C18 21 42 21 42 39 L42 49 C42 55 18 55 18 49 Z"
              fill="${on ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)'}"
              stroke="${on ? 'rgba(255,255,255,0.34)' : 'rgba(255,255,255,0.12)'}" stroke-width="0.8"/>
        <ellipse cx="24" cy="28" rx="5" ry="7" fill="${on ? '#ffffff' : '#6e2222'}" opacity="${on ? '0.86' : '0.18'}"/>
        <rect x="17" y="48" width="26" height="6" fill="${on ? '#cf1919' : '#7a0d0d'}" rx="2"/>

        <text x="23" y="80" fill="#2d3540" font-family="Arial, sans-serif" font-size="5" font-weight="700" text-anchor="middle">A</text>
        <text x="37" y="80" fill="#2d3540" font-family="Arial, sans-serif" font-size="5" font-weight="700" text-anchor="middle">C</text>
      </svg>
    `;
  }

  render() {
    return html`${this.svgContent()}`;
  }
}

customElements.define('led-element', LedElement);
