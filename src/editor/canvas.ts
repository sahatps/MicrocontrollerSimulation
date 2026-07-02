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
const DARK_MODE_STORAGE_KEY = 'hackCable-canvas-dark-mode';
const GRID_VISIBLE_STORAGE_KEY = 'hackCable-canvas-grid-visible';
const MIN_CANVAS_WIDTH = 1800;
const MIN_CANVAS_HEIGHT = 1200;
const CANVAS_ORIGIN_OFFSET_X = 600;
const CANVAS_ORIGIN_OFFSET_Y = 420;

const FastPanningSelectionPolicy = draw2d.policy.canvas.SingleSelectionPolicy.extend({
    NAME: "hackCable.policy.canvas.FastPanningSelectionPolicy",

    onMouseDrag: function(
        canvas: Canvas,
        dx: number,
        dy: number,
        dx2: number,
        dy2: number,
        shiftKey: boolean,
        ctrlKey: boolean
    ) {
        this._super(canvas, dx, dy, dx2, dy2, shiftKey, ctrlKey);

        // The pointer target is hit-tested once on mousedown by Canvas.
        // Draw2D's stock panning policy repeats getBestFigure() on every
        // mousemove, which becomes noticeably expensive on large circuits.
        if (!canvas.isBlankPanActive()) return;

        const host = canvas.getPanScrollHost();
        if (!host) return;

        // Draw2D reports drag deltas in canvas coordinates:
        //   pointer movement in CSS pixels * zoomFactor
        // Scroll offsets are CSS pixels, so convert the delta back. Without
        // this, zooming in (zoomFactor < 1) makes panning proportionally slow.
        const zoom = Math.max(Number(canvas.getZoom()) || 1, 0.001);
        host.scrollLeft -= dx2 / zoom;
        host.scrollTop -= dy2 / zoom;
    }
});

export class Canvas extends draw2d.Canvas{

    private selected: any = null;
    private codeGenerator: CodeGenerator;
    private onCircuitChangeCallback: ((code: string) => void) | null = null;
    private onCircuitStateChangeCallback: (() => void) | null = null;
    private circuitStateChangeTimer: ReturnType<typeof setTimeout> | null = null;
    private editorElement: HTMLElement | null = null;
    private canvasElement: HTMLElement | null = null;
    private isPanningPointerDown = false;
    private darkMode = false;
    private gridVisible = true;
    private responsiveCanvasResizeTimer: any = null;
    private lastCanvasLogicalWidth = 0;
    private lastCanvasLogicalHeight = 0;
    private isSyncingCanvasLayout = false;

    constructor(divId: string){
        super(divId);

        this.editorElement = document.querySelector('.hackCable-editor') as HTMLElement | null;
        this.canvasElement = document.getElementById(divId);

        // Overlay
        this.overlayContainer = document.querySelector('.hackCable-canvas-overlay-container');
        this.html.prepend(this.overlayContainer);

        // Use the editor container as scroll area so drag-panning works on the visible viewport.
        this.setScrollArea(
            this.editorElement ||
            this.canvasElement ||
            document.querySelector('.hackCable-canvas')
        )

        this.initializeViewPreferences();

        // Edit policies
        this.installEditPolicy(new FastPanningSelectionPolicy())
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
    private getEditorElement(): HTMLElement | null {
        if (!this.editorElement) {
            this.editorElement = document.querySelector('.hackCable-editor') as HTMLElement | null;
        }
        return this.editorElement;
    }

    private safeReadPreference(key: string): string | null {
        try {
            return localStorage.getItem(key);
        } catch (_error) {
            return null;
        }
    }

    private safeWritePreference(key: string, value: string): void {
        try {
            localStorage.setItem(key, value);
        } catch (_error) {
            // Ignore storage failures so canvas controls still work for this session.
        }
    }

    private initializeViewPreferences(): void {
        this.setDarkMode(this.safeReadPreference(DARK_MODE_STORAGE_KEY) === 'true', false);
        this.setGridVisible(this.safeReadPreference(GRID_VISIBLE_STORAGE_KEY) !== 'false', false);
    }

    public setDarkMode(enabled: boolean, persist = true): void {
        this.darkMode = enabled;
        this.getEditorElement()?.classList.toggle('canvas-dark-mode', enabled);
        if (persist) this.safeWritePreference(DARK_MODE_STORAGE_KEY, String(enabled));
    }

    public isDarkMode(): boolean {
        return this.darkMode;
    }

    public setGridVisible(visible: boolean, persist = true): void {
        this.gridVisible = visible;
        this.getEditorElement()?.classList.toggle('canvas-grid-hidden', !visible);
        if (persist) this.safeWritePreference(GRID_VISIBLE_STORAGE_KEY, String(visible));
    }

    public isGridVisible(): boolean {
        return this.gridVisible;
    }

    private setupPanInteraction(){
        this.getEditorElement();
        this.canvasElement = this.canvasElement || document.getElementById('hackCable-canvas');
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
        const scheduleCanvasLayoutSync = () => this.scheduleCanvasLayoutSync();

        // Initial update
        setTimeout(scheduleCanvasLayoutSync, 100);

        // Update on window resize
        window.addEventListener('resize', () => {
            clearTimeout(this.responsiveCanvasResizeTimer);
            this.responsiveCanvasResizeTimer = setTimeout(scheduleCanvasLayoutSync, 250);
        });
    }

    private onZoomChange(){
        css(this.overlayContainer, {transform: 'scale(' + 1/this.getZoom() + ')'})
        this.scheduleCanvasLayoutSync();
    }

    private scheduleCanvasLayoutSync(): void {
        if (this.isSyncingCanvasLayout) return;
        requestAnimationFrame(() => this.syncCanvasLayout());
    }

    private syncCanvasLayout(): void {
        if (this.isSyncingCanvasLayout) return;

        const container = this.getEditorElement();
        this.canvasElement = this.canvasElement || document.getElementById('hackCable-canvas');
        if (!container || !this.canvasElement) return;

        this.isSyncingCanvasLayout = true;
        try {
            const logicalWidth = Math.max(container.clientWidth, MIN_CANVAS_WIDTH);
            const logicalHeight = Math.max(container.clientHeight, MIN_CANVAS_HEIGHT);
            const zoomScale = 1 / Math.max(Number(this.getZoom()) || 1, 0.001);
            const renderedOverflowWidth = Math.max(0, Math.ceil(logicalWidth * (zoomScale - 1)));
            const renderedOverflowHeight = Math.max(0, Math.ceil(logicalHeight * (zoomScale - 1)));

            if (
                logicalWidth !== this.lastCanvasLogicalWidth ||
                logicalHeight !== this.lastCanvasLogicalHeight
            ) {
                this.setDimension(logicalWidth, logicalHeight);
                this.lastCanvasLogicalWidth = logicalWidth;
                this.lastCanvasLogicalHeight = logicalHeight;
            }
            this.applyZoomedDraw2dSize(logicalWidth, logicalHeight, zoomScale);

            const regionConstraint = (this as any).regionDragDropConstraint;
            regionConstraint?.setBoundingBox?.(
                new (draw2d as any).geo.Rectangle(0, 0, logicalWidth, logicalHeight)
            );

            css(this.overlayContainer, {
                width: logicalWidth,
                height: logicalHeight
            });
            css(this.canvasElement, {
                paddingLeft: CANVAS_ORIGIN_OFFSET_X,
                paddingTop: CANVAS_ORIGIN_OFFSET_Y,
                paddingRight: renderedOverflowWidth,
                paddingBottom: renderedOverflowHeight
            });
        } finally {
            this.isSyncingCanvasLayout = false;
        }
    }

    private applyZoomedDraw2dSize(logicalWidth: number, logicalHeight: number, zoomScale: number): void {
        const canvasAny = this as any;
        canvasAny.paper?.setViewBox?.(0, 0, logicalWidth, logicalHeight);

        if (!this.canvasElement) return;
        Array.from(this.canvasElement.children).forEach((child) => {
            if (child.tagName.toLowerCase() !== 'svg') return;
            child.setAttribute('width', String(logicalWidth * zoomScale));
            child.setAttribute('height', String(logicalHeight * zoomScale));
        });
    }

    private getScrollHost(): HTMLElement | null {
        const scrollArea: any = this.getScrollArea?.();
        return scrollArea?.get ? scrollArea.get(0) as HTMLElement : null;
    }

    public isBlankPanActive(): boolean {
        return this.isPanningPointerDown;
    }

    public getPanScrollHost(): HTMLElement | null {
        return this.getScrollHost();
    }

    private getContentBounds(): { x: number; y: number; width: number; height: number } | null {
        let minX = Number.POSITIVE_INFINITY;
        let minY = Number.POSITIVE_INFINITY;
        let maxX = Number.NEGATIVE_INFINITY;
        let maxY = Number.NEGATIVE_INFINITY;
        let hasBounds = false;

        const includeBox = (item: any) => {
            const box = item?.getBoundingBox?.();
            if (!box) return;

            const x = Number(box.x);
            const y = Number(box.y);
            const width = Number(box.w ?? box.width ?? 0);
            const height = Number(box.h ?? box.height ?? 0);
            if (![x, y, width, height].every(Number.isFinite)) return;

            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x + width);
            maxY = Math.max(maxY, y + height);
            hasBounds = true;
        };

        this.getAllFigures().forEach((figure) => includeBox(figure));
        this.getLines().each((_index: number, line: any) => includeBox(line));

        if (!hasBounds) return null;
        return {
            x: minX,
            y: minY,
            width: Math.max(0, maxX - minX),
            height: Math.max(0, maxY - minY),
        };
    }

    private getPrimaryBoardCenter(): { x: number; y: number } | null {
        const figures = this.getAllFigures();
        for (const figure of figures) {
            const el = figure.componentElement;
            if (!el) continue;

            const isBoard = el instanceof ArduinoUnoElement
                || el instanceof ArduinoMegaElement
                || el instanceof ArduinoNanoElement
                || el instanceof ESP32DevkitV1Element
                || el instanceof CustomESP32BoardElement
                || el instanceof HandysenseProBoardElement;
            if (!isBoard) continue;

            const box = figure.getBoundingBox?.();
            if (!box) continue;

            const x = Number(box.x);
            const y = Number(box.y);
            const width = Number(box.w ?? box.width ?? 0);
            const height = Number(box.h ?? box.height ?? 0);
            if (![x, y, width, height].every(Number.isFinite)) continue;

            return {
                x: x + (width / 2),
                y: y + (height / 2),
            };
        }
        return null;
    }

    public centerViewportOnPoint(x: number, y: number) {
        const host = this.getScrollHost();
        if (!host) return;

        const zoomFactor = 1 / this.getZoom();
        const targetLeft = CANVAS_ORIGIN_OFFSET_X + (x * zoomFactor) - (host.clientWidth / 2);
        const targetTop = CANVAS_ORIGIN_OFFSET_Y + (y * zoomFactor) - (host.clientHeight / 2);
        const maxLeft = Math.max(0, host.scrollWidth - host.clientWidth);
        const maxTop = Math.max(0, host.scrollHeight - host.clientHeight);

        host.scrollLeft = Math.max(0, Math.min(maxLeft, targetLeft));
        host.scrollTop = Math.max(0, Math.min(maxTop, targetTop));
    }

    public centerViewportOnContent(fallbackPoint: {x: number; y: number} = {x: 400, y: 250}) {
        const bounds = this.getContentBounds();
        if (!bounds) {
            this.centerViewportOnPoint(fallbackPoint.x, fallbackPoint.y);
            return;
        }

        this.centerViewportOnPoint(
            bounds.x + (bounds.width / 2),
            bounds.y + (bounds.height / 2)
        );
    }

    public centerViewportOnPrimaryBoardOrContent(fallbackPoint: {x: number; y: number} = {x: 400, y: 250}) {
        const boardCenter = this.getPrimaryBoardCenter();
        if (boardCenter) {
            this.centerViewportOnPoint(boardCenter.x, boardCenter.y);
            return;
        }

        this.centerViewportOnContent(fallbackPoint);
    }

    /**
     * Convert pointer coordinates to canvas coordinates using the active scroll host.
     * This keeps hit-testing accurate when the scroll area is the outer editor container.
     */
    public fromDocumentToCanvasCoordinate(x: any, y: any): any {
        const host = this.getScrollHost();
        if (!host) return super.fromDocumentToCanvasCoordinate(x, y);

        const rect = host.getBoundingClientRect();
        return new (draw2d as any).geo.Point(
            (x - rect.left + host.scrollLeft - CANVAS_ORIGIN_OFFSET_X) * this.getZoom(),
            (y - rect.top + host.scrollTop - CANVAS_ORIGIN_OFFSET_Y) * this.getZoom()
        );
    }

    /**
     * Convert canvas coordinates back to pointer/client coordinates.
     * This is used by wheel-zoom center calculations and must mirror the method above.
     */
    public fromCanvasToDocumentCoordinate(x: any, y: any): any {
        const host = this.getScrollHost();
        if (!host) return super.fromCanvasToDocumentCoordinate(x, y);

        const rect = host.getBoundingClientRect();
        return new (draw2d as any).geo.Point(
            x * (1 / this.getZoom()) + rect.left - host.scrollLeft + CANVAS_ORIGIN_OFFSET_X,
            y * (1 / this.getZoom()) + rect.top - host.scrollTop + CANVAS_ORIGIN_OFFSET_Y
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
     * Set a lightweight callback for persisting the circuit state. Unlike code
     * generation, this fires immediately so a refresh cannot lose the latest edit.
     */
    public setOnCircuitStateChangeCallback(callback: () => void) {
        this.onCircuitStateChangeCallback = callback;
    }

    /** Notify persistence without regenerating code. Drag updates can be debounced. */
    public notifyCircuitStateChange(debounce = false) {
        if (debounce) {
            if (this.circuitStateChangeTimer) clearTimeout(this.circuitStateChangeTimer);
            this.circuitStateChangeTimer = setTimeout(() => {
                this.circuitStateChangeTimer = null;
                this.onCircuitStateChangeCallback?.();
            }, 150);
            return;
        }

        if (this.circuitStateChangeTimer) {
            clearTimeout(this.circuitStateChangeTimer);
            this.circuitStateChangeTimer = null;
        }
        if (this.onCircuitStateChangeCallback) {
            this.onCircuitStateChangeCallback();
        }
    }

    /**
     * Called when circuit changes (components added/removed, connections made/broken)
     */
    private onCircuitChange() {
        this.notifyCircuitStateChange();

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
