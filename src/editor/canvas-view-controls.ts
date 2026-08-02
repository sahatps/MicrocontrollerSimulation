import type { Canvas } from "./canvas";

const ICONS = {
    moon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
        <path d="M20.5 14.2A8.7 8.7 0 0 1 9.8 3.5a.8.8 0 0 0-.9-1A10.1 10.1 0 1 0 21.5 15a.8.8 0 0 0-1-.8z"/>
    </svg>`,
    grid: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
        <path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z"/>
    </svg>`,
};

export class CanvasViewControls {
    private readonly canvas: Canvas;
    private readonly container: HTMLDivElement;
    private readonly darkModeButton: HTMLButtonElement;
    private readonly gridButton: HTMLButtonElement;

    constructor(canvas: Canvas) {
        this.canvas = canvas;
        this.container = document.createElement('div');
        this.container.className = 'hackCable-canvas-view-controls';
        this.darkModeButton = this.createButton('hackCable-canvas-dark-toggle', ICONS.moon);
        this.gridButton = this.createButton('hackCable-canvas-grid-toggle', ICONS.grid);

        this.container.appendChild(this.darkModeButton);
        this.container.appendChild(this.gridButton);

        const editorContainer = document.querySelector('.hackCable-editor');
        const canvasElement = editorContainer?.querySelector('#hackCable-canvas') ?? null;
        editorContainer?.insertBefore(this.container, canvasElement);

        this.darkModeButton.addEventListener('click', () => {
            this.canvas.setDarkMode(!this.canvas.isDarkMode());
            this.updateButtonStates();
        });

        this.gridButton.addEventListener('click', () => {
            this.canvas.setGridVisible(!this.canvas.isGridVisible());
            this.updateButtonStates();
        });

        this.updateButtonStates();
    }

    private createButton(className: string, icon: string): HTMLButtonElement {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `hackCable-canvas-view-btn ${className}`;
        button.innerHTML = icon;
        return button;
    }

    private updateButtonStates(): void {
        const darkMode = this.canvas.isDarkMode();
        const gridVisible = this.canvas.isGridVisible();

        this.darkModeButton.classList.toggle('active', darkMode);
        this.darkModeButton.setAttribute('aria-pressed', String(darkMode));
        this.darkModeButton.setAttribute('aria-label', darkMode ? 'Switch to light canvas' : 'Switch to dark canvas');
        this.darkModeButton.title = darkMode ? 'Switch to light canvas' : 'Switch to dark canvas';

        this.gridButton.classList.toggle('active', gridVisible);
        this.gridButton.setAttribute('aria-pressed', String(gridVisible));
        this.gridButton.setAttribute('aria-label', gridVisible ? 'Hide grid' : 'Show grid');
        this.gridButton.title = gridVisible ? 'Hide grid' : 'Show grid';
    }
}
