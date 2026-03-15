import { Canvas } from "./canvas";
import { ComponentFigure } from "./component-figure";
import draw2d from "draw2d";

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
    </svg>`,
    color: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
        <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
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
    private draggingLine: any = null;
    private dragging: boolean = false;
    private colorButton!: HTMLButtonElement;
    private colorInput!: HTMLInputElement;

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
        this.binElement.title = 'Delete selected item (or drag here)';

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

        // Create hidden native color input
        this.colorInput = document.createElement('input');
        this.colorInput.type = 'color';
        this.colorInput.value = '#129CE4';
        this.colorInput.style.cssText = 'position:absolute;opacity:0;width:0;height:0;pointer-events:none;';

        // Create color picker button
        this.colorButton = document.createElement('button');
        this.colorButton.className = 'hackCable-toolbar-btn hackCable-toolbar-color';
        this.colorButton.innerHTML = ICONS.color;
        this.colorButton.title = 'Change cable color';
        this.colorButton.disabled = true;
        this.colorButton.appendChild(this.colorInput);

        // Assemble toolbar
        this.toolbarElement.appendChild(this.binElement);
        this.toolbarElement.appendChild(this.forwardButton);
        this.toolbarElement.appendChild(this.backwardButton);
        this.toolbarElement.appendChild(this.colorButton);

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

        // Color button opens native color picker
        this.colorButton.addEventListener('click', () => {
            this.colorInput.click();
        });

        // When a color is picked, apply to selected cable line
        this.colorInput.addEventListener('input', () => {
            const selected = this.canvas.getSelected();
            if (selected !== null && !(selected instanceof ComponentFigure)) {
                selected.setColor(new draw2d.util.Color(this.colorInput.value));
            }
        });

        // Listen for selection changes to show/hide toolbar and enable/disable buttons
        this.canvas.on('select', (_emitter: any, event: any) => {
            if (event.figure !== null) {
                this.showToolbar();
            } else {
                this.hideToolbar();
            }
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

        // Detect drag on selected connection/line for drag-to-bin
        const canvasEl = document.getElementById('hackCable-canvas');
        canvasEl?.addEventListener('mousedown', () => {
            const selected = this.canvas.getSelected();
            if (selected !== null && !(selected instanceof ComponentFigure)) {
                const onFirstMove = () => {
                    this.draggingLine = selected;
                    this.dragging = true;
                    this.showBin();
                    document.removeEventListener('mousemove', onFirstMove);
                };
                document.addEventListener('mousemove', onFirstMove);
                document.addEventListener('mouseup', () => {
                    document.removeEventListener('mousemove', onFirstMove);
                }, { once: true });
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

        // Delete key to remove selected item (figure, connection, or line)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' || e.keyCode === 46) {
                this.deleteSelected();
            }
        });

        // Click bin to delete currently selected item
        this.binElement.addEventListener('click', () => {
            this.deleteSelected();
        });
    }

    private updateButtonStates(selected: any): void {
        const isComponentSelected = selected instanceof ComponentFigure;
        const isCableSelected = selected !== null && !isComponentSelected;
        this.forwardButton.disabled = !isComponentSelected;
        this.backwardButton.disabled = !isComponentSelected;
        this.colorButton.disabled = !isCableSelected;
        if (isCableSelected) {
            const col = selected.getColor?.();
            if (col) {
                const hex = col.hashString ? col.hashString() : col.html?.();
                if (hex) this.colorInput.value = hex;
            }
        }
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
            this.hideToolbar();
        } else if (this.draggingLine) {
            // Remove the connection/line via command stack
            this.deleteSelected();
            this.draggingLine = null;
        }
    }

    private showToolbar(): void {
        this.toolbarElement.classList.add('visible');
    }

    private hideToolbar(): void {
        this.toolbarElement.classList.remove('visible');
    }

    private showBin(): void {
        this.binElement.classList.add('active');
    }

    private hideBin(): void {
        this.binElement.classList.remove('active');
    }

    private deleteSelected(): void {
        const selected = this.canvas.getSelected();
        if (selected !== null) {
            const cmd = selected.createCommand(
                new draw2d.command.CommandType(draw2d.command.CommandType.DELETE)
            );
            if (cmd !== null) {
                this.canvas.getCommandStack().execute(cmd);
                this.hideToolbar();
            }
        }
    }

    private resetBinState(): void {
        this.isDraggingOverBin = false;
        this.binElement.classList.remove('hover');
        this.hideBin();
        this.dragging = false;
        this.draggingLine = null;
    }
}
