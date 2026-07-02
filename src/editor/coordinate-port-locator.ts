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

        // draw2d passes the PORT as "figure" here. We need parent component metrics.
        const parentFigure = figure?.getParent?.() ?? figure;

        // Get SVG from parent component overlay to extract viewBox for coordinate scaling.
        const svg = parentFigure?.overlay?.shadowRoot?.querySelector("svg");
        if (!svg) {
            // Fallback: no scaling if SVG not found.
            this.applyConsiderRotation(figure, this.x, this.y);
            return;
        }

        // Extract viewBox attribute.
        const viewBox = svg.getAttribute('viewBox');
        if (!viewBox) {
            // Fallback: no scaling if viewBox not defined.
            this.applyConsiderRotation(figure, this.x, this.y);
            return;
        }

        // Parse viewBox: "minX minY width height".
        const viewBoxParts = viewBox.trim().split(/\s+/).map(Number);
        if (viewBoxParts.length < 4) {
            this.applyConsiderRotation(figure, this.x, this.y);
            return;
        }
        const vbWidth = viewBoxParts[2];
        const vbHeight = viewBoxParts[3];
        if (!Number.isFinite(vbWidth) || !Number.isFinite(vbHeight) || vbWidth <= 0 || vbHeight <= 0) {
            this.applyConsiderRotation(figure, this.x, this.y);
            return;
        }

        // Get parent component dimensions (in pixels, already set by ComponentFigure).
        const figureWidth = parentFigure.getWidth?.();
        const figureHeight = parentFigure.getHeight?.();
        if (!Number.isFinite(figureWidth) || !Number.isFinite(figureHeight) || figureWidth <= 0 || figureHeight <= 0) {
            this.applyConsiderRotation(figure, this.x, this.y);
            return;
        }

        // Calculate scale factors to convert viewBox units to pixel coordinates.
        const scaleX = figureWidth / vbWidth;
        const scaleY = figureHeight / vbHeight;

        // Apply scaled coordinates.
        const scaledX = this.x * scaleX;
        const scaledY = this.y * scaleY;

        this.applyConsiderRotation(figure, scaledX, scaledY);
    }


}
