import draw2d from "draw2d";
import {ElementPin} from "@wokwi/elements";
import {WokwiComponent, WokwiComponentInfo} from "../panels/component";
import {CoordinatePortLocator} from "./coordinate-port-locator";
import {css, unitToPx} from "../utils/dom";
import {Port} from "draw2d-types";

export declare type FigureData = {componentId: number, figureId: string, x: number, y: number}
export declare type WiringData = {svgPath: string, fromFigure: string, fromPortName: string, targetFigure: string, targetPortName: string}

export class ComponentFigure extends draw2d.shape.basic.Rectangle{

    private readonly component: WokwiComponentInfo;
    public readonly componentElement: WokwiComponent;
    private overlayBaseWidth = 0;
    private overlayBaseHeight = 0;

    constructor(component: WokwiComponentInfo){
        super();
        this.component = component;

        this.setBackgroundColor(null)
        this.setColor(null)
        this.setResizeable(false)
        this.installEditPolicy(new draw2d.policy.figure.AntSelectionFeedbackPolicy());

        // Load wokwi component into overlay
        let element: WokwiComponent = new component.clasz();
        this.overlay = element;
        this.componentElement = element;

        element.pinInfo.forEach((pinInfo: ElementPin) => {
            let port = this.createPort("hybrid", new CoordinatePortLocator(pinInfo.name, pinInfo.x, pinInfo.y));
            port.setAlpha(.7)
            port.setBackgroundColor('#424B5A')
            port.setDiameter(7)
            port.on("connect", () => port.setVisible(false));
            port.on("disconnect", () => port.setVisible(true));
        })


        // Listeners
        this.on("added", (_emitter: any, event: any) => {
            event.canvas.overlayContainer.append(this.overlay)

            setTimeout(() => {
                let svg = this.overlay.shadowRoot?.querySelector("svg")
                this.overlayBaseWidth = unitToPx(svg.getAttribute('width'));
                this.overlayBaseHeight = unitToPx(svg.getAttribute('height'));
                this.setWidth(this.overlayBaseWidth)
                this.setHeight(this.overlayBaseHeight)
                css(this.overlay, {top: this.getY(), left: this.getX()});
                this.syncOverlayTransform();
                this.refreshPortsAndConnections();
            })
        })
        this.on("removed", (_emitter: any, _event: any) => {
            this.overlay.remove()
        })
        this.on("move", (_emitter: any, event: any) => {
            css(this.overlay, {top: event.y, left: event.x})
        })
        this.on("click", (_emitter: any, _event: any) => {
            this.toFront()
        })
    }

    public onSelected(){
        this.toFront()
    }
    public onUnselected(){

    }
    public toFront(){
        super.toFront()
        this.getCanvas().overlayContainer.append(this.overlay)
    }
    public toBack(){
        super.toBack()
        const container = this.getCanvas().overlayContainer;
        if (container && container.firstChild !== this.overlay) {
            container.insertBefore(this.overlay, container.firstChild);
        }
    }

    public setRotationAngle(angle: any): any {
        const result = super.setRotationAngle(angle);
        this.syncOverlayTransform();
        this.refreshPortsAndConnections();
        return result;
    }

    public setDimension(w: any, h: any): any {
        const result = super.setDimension(w, h);
        this.syncOverlayTransform();
        this.refreshPortsAndConnections();
        return result;
    }

    private syncOverlayTransform(): void {
        if (!this.overlay) return;

        const angle = this.normalizeRightAngle(Number(this.getRotationAngle?.() ?? 0));
        let transform = `rotate(${angle}deg)`;
        const baseWidth = this.overlayBaseWidth || Number(this.getWidth?.() ?? 0);
        const baseHeight = this.overlayBaseHeight || Number(this.getHeight?.() ?? 0);

        if ((angle === 90 || angle === 270) && baseWidth > 0 && baseHeight > 0) {
            // Keep the rotated overlay anchored to the figure top-left even though draw2d swaps dimensions.
            const halfDelta = (baseWidth - baseHeight) / 2;
            // For both 90 and 270, the rotated bounding box shifts by the same top-left delta.
            const translateX = -halfDelta;
            const translateY = halfDelta;
            // CSS applies right-to-left: rotate first, then apply the anchoring translation.
            transform = `translate(${translateX}px, ${translateY}px) rotate(${angle}deg)`;
        }

        css(this.overlay, {
            transformOrigin: "center center",
            transform
        });
    }

    private normalizeRightAngle(angle: number): number {
        const snapped = Math.round(angle / 90) * 90;
        return ((snapped % 360) + 360) % 360;
    }

    private refreshPortsAndConnections(): void {
        if (!this.getCanvas?.()) return;
        const repaintedConnections = new Set<string>();

        this.getPorts().data.forEach((port: Port) => {
            // Recompute exact port coordinates after angle changes.
            port.getLocator().relocate(0, port);

            port.getConnections().data.forEach((connection: any) => {
                const id = connection.getId?.();
                if (id && repaintedConnections.has(id)) return;
                if (id) repaintedConnections.add(id);
                connection.routingRequired = true;
                connection.repaint?.();
            });
        });
    }

    public getPortByName(name: string): Port{
        return this.hybridPorts.data.find((port: Port) => { // Iterate through ports
            return port.getLocator().portId === name;
        })
    }

    public getFigureData(): FigureData{
        return {
            componentId: this.component.id,
            figureId: this.getId(),
            x: this.getX(),
            y: this.getY(),
        }
    }
    public getWiringData(): WiringData[]{

        let wiringData: WiringData[] = [];

        this.hybridPorts.data.forEach((sourcePort: Port) => { // Iterate through ports
            sourcePort.getConnections().data.forEach((connection: any) => { // Iterate through connections of this port
                if(connection.sourcePort === sourcePort){ // Save connections only from theirs source port
                    wiringData.push({
                        svgPath: connection.getVertices().data,
                        fromFigure: this.getId(),
                        fromPortName: sourcePort.getLocator().portId,
                        targetFigure: connection.getTarget().getParent().getId(),
                        targetPortName: connection.getTarget().getLocator().portId
                    });
                }
            })
        })
        return wiringData;
    }
}
