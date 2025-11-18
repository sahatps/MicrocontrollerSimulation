import draw2d from "draw2d";
import {connectionsPolicy} from "./connections-policies";
import {ComponentFigure} from "./component-figure";
import {css} from "../utils/dom";
import {CodeGenerator} from "./code-generator";

const DEFAULT_ZOOM = .6;

export class Canvas extends draw2d.Canvas{

    private selected: any = null;
    private codeGenerator: CodeGenerator;
    private onCircuitChangeCallback: ((code: string) => void) | null = null;

    constructor(divId: string){
        super(divId);

        // Overlay
        this.overlayContainer = document.querySelector('.hackCable-canvas-overlay-container');
        this.html.prepend(this.overlayContainer);

        this.setScrollArea(document.querySelector('.hackCable-canvas'))

        // Edit policies
        this.installEditPolicy(new draw2d.policy.canvas.PanningSelectionPolicy())
        this.installEditPolicy(new draw2d.policy.canvas.SnapToGeometryEditPolicy())
        this.installEditPolicy(new draw2d.policy.canvas.SnapToInBetweenEditPolicy())
        this.installEditPolicy(new draw2d.policy.canvas.SnapToCenterEditPolicy())
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
    private onSelectionChange(selected: any){
        if(this.selected != selected){
            if(this.selected instanceof ComponentFigure) this.selected.onUnselected()
            if(selected instanceof ComponentFigure) selected.onSelected();
            this.selected = selected;
        }
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
}