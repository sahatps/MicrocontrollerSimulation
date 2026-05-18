import draw2d from "draw2d";
import {connectionsPolicy} from "./connections-policies";
import {ComponentFigure} from "./component-figure";
import {css} from "../utils/dom";
import {CodeGenerator} from "./code-generator";
import {CanvasToolbar} from "./canvas-toolbar";
import {ArduinoUnoElement, ArduinoMegaElement, ArduinoNanoElement, ESP32DevkitV1Element} from "@wokwi/elements";
import {CustomESP32BoardElement} from "../components/custom-esp32-board";
import {HandysenseProBoardElement} from "../components/handysense-pro-board";

const DEFAULT_ZOOM = .6;

export class Canvas extends draw2d.Canvas{

    private selected: any = null;
    private codeGenerator: CodeGenerator;
    private onCircuitChangeCallback: ((code: string) => void) | null = null;
    private editorElement: HTMLElement | null = null;
    private canvasElement: HTMLElement | null = null;
    private isPanningPointerDown = false;

    constructor(divId: string){
        super(divId);

        // Overlay
        this.overlayContainer = document.querySelector('.hackCable-canvas-overlay-container');
        this.html.prepend(this.overlayContainer);

        // Use the editor container as scroll area so drag-panning works on the visible viewport.
        this.setScrollArea(
            document.querySelector('.hackCable-editor') ||
            document.querySelector('.hackCable-canvas')
        )

        // Edit policies
        this.installEditPolicy(new draw2d.policy.canvas.PanningSelectionPolicy())
        this.installEditPolicy(new draw2d.policy.canvas.SnapToGeometryEditPolicy())
        this.installEditPolicy(new draw2d.policy.canvas.SnapToInBetweenEditPolicy())
        this.installEditPolicy(new draw2d.policy.canvas.SnapToCenterEditPolicy())
        this.uninstallEditPolicy("draw2d.policy.connection.ComposedConnectionCreatePolicy")
        this.uninstallEditPolicy("draw2d.policy.connection.DragConnectionCreatePolicy")
        this.installEditPolicy(connectionsPolicy);

        // Initialize code generator
        this.codeGenerator = new CodeGenerator(this);

        // Listeners
        this.on("select", (_emitter: any, event: any) => this.onSelectionChange(event.figure));
        this.on("zoom", () => this.onZoomChange());
        this.on("figure:add", () => this.onCircuitChange());
        this.on("figure:remove", () => this.onCircuitChange());
        this.on("connection:add", () => this.onCircuitChange());
        this.on("connection:remove", () => this.onCircuitChange());

        this.setZoom(DEFAULT_ZOOM);

        // Handle window resize for responsive canvas
        this.setupResponsiveCanvas();

        // Initialize canvas toolbar (bin, forward, backward buttons)
        new CanvasToolbar(this);

        // Improve pan UX: drag only while mouse is held and always stop on global mouse release.
        this.setupPanInteraction();

        // Add test figures (commented out - using auto-setup instead)
        /*
        let rect = new draw2d.shape.basic.Rectangle({x: 100, y: 10, stroke: 3, color: "#9e0000", bgColor: "#cd0000"});
        rect.createPort("hybrid", new CoordinatePortLocator("", 0, 0));
        rect.createPort("hybrid", new CoordinatePortLocator("", 30, 30));
        this.add(rect)
        let led = new ComponentFigure(wokwiComponentByClass[LEDElement.name]);
        this.add(led.setX(100).setY(100))
        let card = new ComponentFigure(wokwiComponentByClass[ArduinoUnoElement.name]);
        this.add(card.setX(200).setY(150))
        let pixel = new ComponentFigure(wokwiComponentByClass[NeoPixelElement.name]);
        this.add(pixel.setX(200).setY(50))
        let dht22 = new ComponentFigure(wokwiComponentByClass[Dht22Element.name]);
        this.add(dht22.setX(250).setY(10))
        */



    }
    private setupPanInteraction(){
        this.editorElement = document.querySelector('.hackCable-editor') as HTMLElement | null;
        this.canvasElement = document.getElementById('hackCable-canvas');
        if (!this.canvasElement) return;

        this.canvasElement.addEventListener('mousedown', (event: MouseEvent) => {
            if (event.button !== 0) return;

            const pos = this.fromDocumentToCanvasCoordinate(event.clientX, event.clientY);
            const figure = this.getBestFigure(pos.x, pos.y);
            this.isPanningPointerDown = figure === null;

            if (this.isPanningPointerDown) {
                this.editorElement?.classList.add('is-panning');
                this.setPanningCursor(true);
            }
        });

        this.canvasElement.addEventListener('mouseup', () => this.stopPanInteraction());
        window.addEventListener('mouseup', (event: MouseEvent) => this.stopPanInteraction(event));
        window.addEventListener('blur', () => this.stopPanInteraction());
    }

    private setPanningCursor(active: boolean){
        const cursorValue = active ? 'grabbing' : '';
        if (this.editorElement) this.editorElement.style.cursor = cursorValue;
        if (this.canvasElement) this.canvasElement.style.cursor = cursorValue;
        if (this.overlayContainer instanceof HTMLElement) this.overlayContainer.style.cursor = cursorValue;
    }

    private stopPanInteraction(event?: MouseEvent){
        if (this.isPanningPointerDown) {
            this.isPanningPointerDown = false;
            this.editorElement?.classList.remove('is-panning');
            this.setPanningCursor(false);
        }

        // Draw2D only binds mouseup on the canvas element.
        // If release happens outside, force-reset internal drag state.
        const canvasAny = this as any;
        if (canvasAny.mouseDown !== true) return;

        if (event) {
            const pos = this.fromDocumentToCanvasCoordinate(event.clientX, event.clientY);
            canvasAny.editPolicy?.each((_: number, policy: any) => {
                policy.onMouseUp(this, pos.x, pos.y, event.shiftKey, event.ctrlKey);
            });
        }

        canvasAny.mouseDown = false;
        canvasAny.mouseDragDiffX = 0;
        canvasAny.mouseDragDiffY = 0;
    }

    private setupResponsiveCanvas(){
        // Update canvas dimensions based on container size
        const updateCanvasDimensions = () => {
            const container = document.querySelector('.hackCable-editor') as HTMLElement;
            if (container) {
                const width = Math.max(container.clientWidth, 800);
                const height = Math.max(container.clientHeight, 600);

                // Update canvas element dimensions
                const canvasElement = document.getElementById('hackCable-canvas');
                if (canvasElement) {
                    canvasElement.style.width = width + 'px';
                    canvasElement.style.height = height + 'px';
                }
            }
        };

        // Initial update
        setTimeout(updateCanvasDimensions, 100);

        // Update on window resize
        let resizeTimeout: any;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(updateCanvasDimensions, 250);
        });
    }

    private onZoomChange(){
        css(this.overlayContainer, {transform: 'scale(' + 1/this.getZoom() + ')'})
    }

    /**
     * Convert pointer coordinates to canvas coordinates using the active scroll host.
     * This keeps hit-testing accurate when the scroll area is the outer editor container.
     */
    public fromDocumentToCanvasCoordinate(x: any, y: any): any {
        const scrollArea: any = this.getScrollArea?.();
        const host = scrollArea?.get ? scrollArea.get(0) as HTMLElement : null;
        if (!host) return super.fromDocumentToCanvasCoordinate(x, y);

        const rect = host.getBoundingClientRect();
        return new (draw2d as any).geo.Point(
            (x - rect.left + host.scrollLeft) * this.getZoom(),
            (y - rect.top + host.scrollTop) * this.getZoom()
        );
    }

    /**
     * Convert canvas coordinates back to pointer/client coordinates.
     * This is used by wheel-zoom center calculations and must mirror the method above.
     */
    public fromCanvasToDocumentCoordinate(x: any, y: any): any {
        const scrollArea: any = this.getScrollArea?.();
        const host = scrollArea?.get ? scrollArea.get(0) as HTMLElement : null;
        if (!host) return super.fromCanvasToDocumentCoordinate(x, y);

        const rect = host.getBoundingClientRect();
        return new (draw2d as any).geo.Point(
            x * (1 / this.getZoom()) + rect.left - host.scrollLeft,
            y * (1 / this.getZoom()) + rect.top - host.scrollTop
        );
    }

    /**
     * Enable wheel-to-zoom directly on the circuit canvas without requiring Shift.
     */
    public onMouseWheel(wheelDelta: any, x: any, y: any, _shiftKey: any, ctrlKey: any): any {
        return super.onMouseWheel(wheelDelta, x, y, true, ctrlKey);
    }

    private onSelectionChange(selected: any){
        if(this.selected != selected){
            if(this.selected instanceof ComponentFigure) this.selected.onUnselected()
            if(selected instanceof ComponentFigure) selected.onSelected();
            this.selected = selected;
        }
    }
    public getSelected(): any {
        return this.selected;
    }
    public clear(){
        super.clear()
        // Clear all overlay components
        if(this.overlayContainer){
            this.overlayContainer.innerHTML = '';
        }
        this.setZoom(DEFAULT_ZOOM);
        this.onCircuitChange();
    }

    /**
     * Set callback to be called when circuit changes and code is generated
     */
    public setOnCircuitChangeCallback(callback: (code: string) => void) {
        this.onCircuitChangeCallback = callback;
    }

    /**
     * Called when circuit changes (components added/removed, connections made/broken)
     */
    private onCircuitChange() {
        // Debounce to avoid generating code too frequently
        setTimeout(() => {
            const generatedCode = this.codeGenerator.generateCode();
            if (this.onCircuitChangeCallback) {
                this.onCircuitChangeCallback(generatedCode);
            }
        }, 500);
    }

    /**
     * Manually trigger code generation
     */
    public generateCode(): string {
        return this.codeGenerator.generateCode();
    }

    /**
     * Get all ComponentFigures on the canvas
     */
    public getAllFigures(): ComponentFigure[] {
        const figures: ComponentFigure[] = [];
        this.getFigures().each((_index: number, figure: any) => {
            if (figure instanceof ComponentFigure) {
                figures.push(figure);
            }
        });
        return figures;
    }

    /**
     * Detect which board type is on the canvas
     */
    public getBoardType(): 'arduino' | 'esp32' | null {
        const figures = this.getAllFigures();
        for (const figure of figures) {
            const el = figure.componentElement;
            if (!el) continue;
            if (el instanceof ArduinoUnoElement ||
                el instanceof ArduinoMegaElement ||
                el instanceof ArduinoNanoElement) {
                return 'arduino';
            }
            if (el instanceof ESP32DevkitV1Element ||
                el instanceof CustomESP32BoardElement ||
                el instanceof HandysenseProBoardElement) {
                return 'esp32';
            }
        }
        return null;
    }
}
