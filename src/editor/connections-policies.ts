import draw2d from "draw2d";

const ENDPOINT_THRESHOLD = 15;

// Helper to convert a Connection to a standalone PolyLine, preserving vertices
function connectionToPolyLine(connection: any, vertices: any, canvas: any) {
    canvas.remove(connection);
    const polyline = new draw2d.shape.basic.PolyLine({stroke: 2, color: "#129CE4"});
    polyline.setRouter(new draw2d.layout.connection.VertexRouter());
    polyline.setVertices(vertices);
    polyline.installEditPolicy(new draw2d.policy.line.VertexSelectionFeedbackPolicy());
    polyline.setUserData({type: "standalone-line"});
    canvas.add(polyline);
}

// Custom endpoint handles that allow disconnecting a Connection by dragging its endpoint off a port
const DisconnectableStartHandle = draw2d.shape.basic.LineStartResizeHandle.extend({
    NAME: "DisconnectableStartHandle",
    onDragEnd: function(x: number, y: number, shiftKey: boolean, ctrlKey: boolean) {
        this.shape.attr({"cursor": "move"});
        if (this.owner instanceof draw2d.Connection) {
            const port = this.getOppositePort();
            if (port !== null && this.currentTarget !== null) {
                this.onDrop(this.currentTarget, x, y, shiftKey, ctrlKey);
                this.currentTarget.onDragLeave(port);
                this.currentTarget.setGlow(false);
                this.currentTarget.fireEvent("dragLeave", {draggingElement: port});
                this.currentTarget.onCatch(this, x, y, shiftKey, ctrlKey);
                this.currentTarget = null;
            } else {
                const canvas = this.owner.getCanvas();
                const vertices = this.owner.getVertices().clone();
                const startPos = this.owner.getStartPoint();
                vertices.overwriteElementAt(startPos, 0);
                connectionToPolyLine(this.owner, vertices, canvas);
            }
            if (this.command !== null) { this.command.cancel(); }
            this.command = null;
            this.owner.isMoving = false;
            this.setAlpha(1);
            return;
        }
        // For non-Connection lines, use default behavior
        this._super(x, y, shiftKey, ctrlKey);
    }
});

const DisconnectableEndHandle = draw2d.shape.basic.LineEndResizeHandle.extend({
    NAME: "DisconnectableEndHandle",
    onDragEnd: function(x: number, y: number, shiftKey: boolean, ctrlKey: boolean) {
        this.shape.attr({"cursor": "move"});
        if (this.owner instanceof draw2d.Connection) {
            const port = this.getOppositePort();
            if (port !== null && this.currentTarget !== null) {
                this.onDrop(this.currentTarget, x, y, shiftKey, ctrlKey);
                this.currentTarget.onDragLeave(port);
                this.currentTarget.setGlow(false);
                this.currentTarget.fireEvent("dragLeave", {draggingElement: port});
                this.currentTarget.onCatch(this, x, y, shiftKey, ctrlKey);
                this.currentTarget = null;
            } else {
                const canvas = this.owner.getCanvas();
                const vertices = this.owner.getVertices().clone();
                const endPos = this.owner.getEndPoint();
                vertices.overwriteElementAt(endPos, vertices.getSize() - 1);
                connectionToPolyLine(this.owner, vertices, canvas);
            }
            if (this.command !== null) { this.command.cancel(); }
            this.command = null;
            this.owner.isMoving = false;
            this.setAlpha(1);
            return;
        }
        this._super(x, y, shiftKey, ctrlKey);
    }
});

// Selection policy that shows draggable endpoint handles on connections
export const DisconnectableConnectionPolicy = draw2d.policy.line.VertexSelectionFeedbackPolicy.extend({
    NAME: "DisconnectableConnectionPolicy",
    onSelect: function(canvas: any, figure: any, _isPrimarySelection: boolean) {
        const startHandle = new DisconnectableStartHandle(figure);
        const endHandle = new DisconnectableEndHandle(figure);
        figure.selectionHandles.add(startHandle);
        figure.selectionHandles.add(endHandle);

        const points = figure.getVertices();
        const count = points.getSize() - 1;
        for (let i = 1; i < count; i++) {
            figure.selectionHandles.add(new draw2d.shape.basic.VertexResizeHandle(figure, i));
            figure.selectionHandles.add(new draw2d.shape.basic.GhostVertexResizeHandle(figure, i - 1));
        }
        figure.selectionHandles.add(new draw2d.shape.basic.GhostVertexResizeHandle(figure, count - 1));

        figure.selectionHandles.each(function(_i: number, e: any) {
            e.setDraggable(figure.isResizeable());
            e.show(canvas);
        });
        this.moved(canvas, figure);
    }
});

export class VertexClickConnectionPolicy extends draw2d.policy.connection.ClickConnectionCreatePolicy {

    // Custom state for standalone line drawing (canvas clicks, not port-to-port)
    private isDrawingStandalone: boolean = false;
    private standaloneStartPoint: any = null;
    private extendingLine: any = null;
    private extendEnd: "start" | "end" | null = null;

    onClick(figure: any, x: number, y: number, shiftKey: boolean, ctrlKey: boolean) {
        const self = this as any;

        // === DRAWING STATE: we are in the middle of drawing ===
        if (self.port1 !== null || this.isDrawingStandalone) {

            // Case: port-to-port (started from port, ending on port)
            if (self.port1 !== null && figure !== null && figure instanceof draw2d.Port) {
                super.onClick(figure, x, y, shiftKey, ctrlKey);
                return;
            }

            // Case: started from port, clicking on canvas → create standalone PolyLine
            if (self.port1 !== null && figure === null) {
                const startPos = self.port1.getAbsolutePosition();
                this.addStandalonePolyLine(startPos, new draw2d.geo.Point(x, y));
                this.cleanupDrawingState();
                return;
            }

            // Case: started from canvas, clicking on port → create standalone PolyLine
            if (this.isDrawingStandalone && figure !== null && figure instanceof draw2d.Port) {
                const endPos = figure.getAbsolutePosition();
                if (this.extendingLine) {
                    this.extendExistingLine(endPos);
                } else {
                    this.addStandalonePolyLine(this.standaloneStartPoint, endPos);
                }
                this.cleanupDrawingState();
                return;
            }

            // Case: started from canvas, clicking on canvas → create standalone PolyLine
            if (this.isDrawingStandalone && figure === null) {
                const endPoint = new draw2d.geo.Point(x, y);
                if (this.extendingLine) {
                    this.extendExistingLine(endPoint);
                } else {
                    this.addStandalonePolyLine(this.standaloneStartPoint, endPoint);
                }
                this.cleanupDrawingState();
                return;
            }

            // Started from port, clicking on non-port figure → ignore
            return;
        }

        // === IDLE STATE: not drawing yet ===

        // Click on a port → start drawing (delegate to super for port1 setup)
        if (figure !== null && figure instanceof draw2d.Port) {
            super.onClick(figure, x, y, shiftKey, ctrlKey);
            return;
        }

        // Click on empty canvas → check for line endpoint extension first
        if (figure === null) {
            const nearestLine = this.findNearbyLineEndpoint(x, y);
            if (nearestLine) {
                this.startExtending(nearestLine.line, nearestLine.end, nearestLine.point, x, y);
                return;
            }
            // Start a new standalone line from canvas
            this.startStandaloneDrawing(x, y);
            return;
        }

        // Click on some other figure → ignore for connection creation
    }

    onMouseMove(canvas: any, x: number, y: number, shiftKey: boolean, ctrlKey: boolean) {
        super.onMouseMove(canvas, x, y, shiftKey, ctrlKey);
        if (this.isDrawingStandalone && (this as any).beeline !== null) {
            (this as any).beeline.setEndPosition(x, y);
        }
    }

    onKeyDown(canvas: any, keyCode: number, shiftKey: boolean, ctrlKey: boolean) {
        const KEYCODE_ESC = 27;
        if (keyCode === KEYCODE_ESC && this.isDrawingStandalone) {
            this.cleanupDrawingState();
            return;
        }
        super.onKeyDown(canvas, keyCode, shiftKey, ctrlKey);
    }

    createConnection() {
        const connection = super.createConnection();
        if (connection.getRouter() instanceof draw2d.layout.connection.VertexRouter) {
            connection.setVertices((this as any).vertices.reverse());
        } else {
            connection.setRouter(new draw2d.layout.connection.VertexRouter());
        }
        connection.installEditPolicy(new DisconnectableConnectionPolicy());
        return connection;
    }

    private startStandaloneDrawing(x: number, y: number) {
        const self = this as any;
        const canvas = self.canvas;
        this.isDrawingStandalone = true;
        this.standaloneStartPoint = new draw2d.geo.Point(x, y);
        this.extendingLine = null;
        this.extendEnd = null;

        // Create visual feedback (beeline)
        self.beeline = new draw2d.shape.basic.Line({
            start: this.standaloneStartPoint,
            end: this.standaloneStartPoint,
            dasharray: "- ",
            color: "#2C70FF"
        });
        const beeline = self.beeline;
        beeline.hide = function () { beeline.setCanvas(null); };
        beeline.show = function (c: any) { beeline.setCanvas(c); beeline.shape.toFront(); };
        beeline.show(canvas);

        this.ripple(x, y, 0);
    }

    private startExtending(line: any, end: "start" | "end", point: any, x: number, y: number) {
        this.isDrawingStandalone = true;
        this.standaloneStartPoint = new draw2d.geo.Point(point.x, point.y);
        this.extendingLine = line;
        this.extendEnd = end;

        const self = this as any;
        const canvas = self.canvas;

        self.beeline = new draw2d.shape.basic.Line({
            start: this.standaloneStartPoint,
            end: this.standaloneStartPoint,
            dasharray: "- ",
            color: "#2C70FF"
        });
        const beeline = self.beeline;
        beeline.hide = function () { beeline.setCanvas(null); };
        beeline.show = function (c: any) { beeline.setCanvas(c); beeline.shape.toFront(); };
        beeline.show(canvas);

        this.ripple(x, y, 0);
    }

    private extendExistingLine(newPoint: any) {
        const vertices = this.extendingLine.getVertices().clone();
        if (this.extendEnd === "end") {
            vertices.add(newPoint);
        } else {
            vertices.insertElementAt(newPoint, 0);
        }
        this.extendingLine.setVertices(vertices);
        this.extendingLine.repaint();
    }

    private addStandalonePolyLine(startPoint: any, endPoint: any) {
        const self = this as any;
        const canvas = self.canvas;

        const polyline = new draw2d.shape.basic.PolyLine({
            stroke: 2,
            color: "#129CE4"
        });
        polyline.setRouter(new draw2d.layout.connection.VertexRouter());
        polyline.setVertices([startPoint, endPoint]);
        polyline.installEditPolicy(new draw2d.policy.line.VertexSelectionFeedbackPolicy());
        polyline.setUserData({ type: "standalone-line" });

        canvas.add(polyline);
    }

    private findNearbyLineEndpoint(x: number, y: number): { line: any, end: "start" | "end", point: any } | null {
        const self = this as any;
        const canvas = self.canvas;
        if (!canvas) return null;

        const lines = canvas.getLines();
        let bestResult: { line: any, end: "start" | "end", point: any } | null = null;
        let bestDist = ENDPOINT_THRESHOLD;

        lines.each((_i: number, line: any) => {
            const userData = line.getUserData();
            if (!userData || userData.type !== "standalone-line") return;

            const vertices = line.getVertices();
            if (vertices.getSize() < 2) return;

            const startV = vertices.get(0);
            const endV = vertices.get(vertices.getSize() - 1);

            const distStart = Math.sqrt((x - startV.x) ** 2 + (y - startV.y) ** 2);
            const distEnd = Math.sqrt((x - endV.x) ** 2 + (y - endV.y) ** 2);

            if (distStart < bestDist) {
                bestDist = distStart;
                bestResult = { line, end: "start", point: startV };
            }
            if (distEnd < bestDist) {
                bestDist = distEnd;
                bestResult = { line, end: "end", point: endV };
            }
        });

        return bestResult;
    }

    private cleanupDrawingState() {
        const self = this as any;

        if (self.beeline) {
            self.beeline.hide();
            self.beeline = null;
        }
        if (self.tempConnection) {
            self.tempConnection.hide();
            self.tempConnection = null;
        }
        if (self.pulse) {
            self.pulse.remove();
            self.pulse = null;
        }

        self.port1 = null;
        self.vertices = [];
        this.isDrawingStandalone = false;
        this.standaloneStartPoint = null;
        this.extendingLine = null;
        this.extendEnd = null;
    }
}

class VertexDragConnectionPolicy extends draw2d.policy.connection.DragConnectionCreatePolicy {
    createConnection() {
        const con = new draw2d.Connection({ router: new draw2d.layout.connection.VertexRouter() });
        con.installEditPolicy(new DisconnectableConnectionPolicy());
        return con;
    }
}

export const connectionsPolicy = new draw2d.policy.connection.ComposedConnectionCreatePolicy([
    new VertexDragConnectionPolicy(),
    new VertexClickConnectionPolicy()
]);
