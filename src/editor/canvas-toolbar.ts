import { Canvas } from "./canvas";
import { ComponentFigure } from "./component-figure";

// SVG Icons (inline for simplicity)
const ICONS = {
    bin: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
    </svg>`,
    forward: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
        <path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm10 0l4-4 4 4h-3v6h-2v-6h-3z"/>
    </svg>`,
    backward: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
        <path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm10 6l4 4 4-4h-3v-6h-2v6h-3z"/>
    </svg>`
};

export class CanvasToolbar {
    private canvas: Canvas;
    private toolbarElement!: HTMLDivElement;
    private binElement!: HTMLDivElement;
    private forwardButton!: HTMLButtonElement;
    private backwardButton!: HTMLButtonElement;
    private isDraggingOverBin: boolean = false;
    private draggingFigure: ComponentFigure | null = null;
    private dragging: boolean = false;

    constructor(canvas: Canvas) {
        this.canvas = canvas;
        this.createToolbar();
        this.setupEventListeners();
    }

    private createToolbar(): void {
        // Create toolbar container
        this.toolbarElement = document.createElement('div');
        this.toolbarElement.className = 'hackCable-canvas-toolbar';

        // Create bin drop zone
        this.binElement = document.createElement('div');
        this.binElement.className = 'hackCable-toolbar-bin';
        this.binElement.innerHTML = ICONS.bin;
        this.binElement.title = 'Drag component here to delete';

        // Create forward button
        this.forwardButton = document.createElement('button');
        this.forwardButton.className = 'hackCable-toolbar-btn';
        this.forwardButton.innerHTML = ICONS.forward;
        this.forwardButton.title = 'Bring to front';
        this.forwardButton.disabled = true;

        // Create backward button
        this.backwardButton = document.createElement('button');
        this.backwardButton.className = 'hackCable-toolbar-btn';
        this.backwardButton.innerHTML = ICONS.backward;
        this.backwardButton.title = 'Send to back';
        this.backwardButton.disabled = true;

        // Assemble toolbar
        this.toolbarElement.appendChild(this.binElement);
        this.toolbarElement.appendChild(this.forwardButton);
        this.toolbarElement.appendChild(this.backwardButton);

        // Insert toolbar into editor container (fixed position, not affected by zoom/pan)
        const editorContainer = document.querySelector('.hackCable-editor');
        if (editorContainer) {
            editorContainer.appendChild(this.toolbarElement);
        }
    }

    private setupEventListeners(): void {
        // Forward button click
        this.forwardButton.addEventListener('click', () => {
            const selected = this.canvas.getSelected();
            if (selected instanceof ComponentFigure) {
                selected.toFront();
            }
        });

        // Backward button click
        this.backwardButton.addEventListener('click', () => {
            const selected = this.canvas.getSelected();
            if (selected instanceof ComponentFigure) {
                selected.toBack();
            }
        });

        // Listen for selection changes to enable/disable buttons
        this.canvas.on('select', (_emitter: any, event: any) => {
            this.updateButtonStates(event.figure);
        });

        // Attach drag listeners to existing figures
        this.canvas.getFigures().each((_index: number, figure: any) => {
            if (figure instanceof ComponentFigure) {
                this.attachDragListeners(figure);
            }
        });

        // Attach drag listeners to newly added figures
        this.canvas.on('figure:add', (_emitter: any, event: any) => {
            if (event.figure instanceof ComponentFigure) {
                this.attachDragListeners(event.figure);
            }
        });

        // Monitor mouse position during drag to detect bin hover
        document.addEventListener('mousemove', (e) => {
            if (this.dragging) {
                this.checkBinHover(e.clientX, e.clientY);
            }
        });

        // Handle drop on bin
        document.addEventListener('mouseup', () => {
            if (this.dragging && this.isDraggingOverBin) {
                this.handleDropOnBin();
            }
            this.resetBinState();
        });
    }

    private updateButtonStates(selected: any): void {
        const isComponentSelected = selected instanceof ComponentFigure;
        this.forwardButton.disabled = !isComponentSelected;
        this.backwardButton.disabled = !isComponentSelected;
    }

    private attachDragListeners(figure: ComponentFigure): void {
        figure.on('dragstart', () => {
            this.setDragging(true, figure);
            this.showBin();
        });

        figure.on('dragend', () => {
            this.setDragging(false, null);
            this.hideBin();
        });
    }

    private setDragging(state: boolean, figure: ComponentFigure | null): void {
        this.dragging = state;
        this.draggingFigure = figure;
    }

    private checkBinHover(clientX: number, clientY: number): void {
        const binRect = this.binElement.getBoundingClientRect();
        const isOver = (
            clientX >= binRect.left &&
            clientX <= binRect.right &&
            clientY >= binRect.top &&
            clientY <= binRect.bottom
        );

        if (isOver && !this.isDraggingOverBin) {
            this.isDraggingOverBin = true;
            this.binElement.classList.add('hover');
        } else if (!isOver && this.isDraggingOverBin) {
            this.isDraggingOverBin = false;
            this.binElement.classList.remove('hover');
        }
    }

    private handleDropOnBin(): void {
        if (this.draggingFigure) {
            // Remove the figure from canvas
            this.canvas.remove(this.draggingFigure);
            this.draggingFigure = null;
        }
    }

    private showBin(): void {
        this.binElement.classList.add('active');
    }

    private hideBin(): void {
        this.binElement.classList.remove('active');
    }

    private resetBinState(): void {
        this.isDraggingOverBin = false;
        this.binElement.classList.remove('hover');
        this.hideBin();
        this.dragging = false;
    }
}
