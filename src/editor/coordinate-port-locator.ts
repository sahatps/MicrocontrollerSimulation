import draw2d from "draw2d";

export class CoordinatePortLocator extends draw2d.layout.locator.PortLocator{

    public readonly portId: string;
    private readonly x: number;
    private readonly y: number;
    constructor(portId: string, x: number, y: number){
        super();
        this.portId = portId;
        this.x = x;
        this.y = y;
    }
    public relocate(index: any, figure: any){
        super.relocate(index, figure)

        // Get SVG from figure's overlay to extract viewBox for coordinate scaling
        const svg = figure.overlay?.shadowRoot?.querySelector("svg");
        if (!svg) {
            // Fallback: no scaling if SVG not found
            this.applyConsiderRotation(figure, this.x, this.y);
            return;
        }

        // Extract viewBox attribute
        const viewBox = svg.getAttribute('viewBox');
        if (!viewBox) {
            // Fallback: no scaling if viewBox not defined
            this.applyConsiderRotation(figure, this.x, this.y);
            return;
        }

        // Parse viewBox: "0 0 width height"
        const [, , vbWidth, vbHeight] = viewBox.split(' ').map(Number);

        // Get figure dimensions (in pixels, already set by ComponentFigure)
        const figureWidth = figure.getWidth();
        const figureHeight = figure.getHeight();

        // Calculate scale factors to convert viewBox units to pixel coordinates
        const scaleX = figureWidth / vbWidth;
        const scaleY = figureHeight / vbHeight;

        // Apply scaled coordinates
        const scaledX = this.x * scaleX;
        const scaledY = this.y * scaleY;

        this.applyConsiderRotation(figure, scaledX, scaledY);
    }


}