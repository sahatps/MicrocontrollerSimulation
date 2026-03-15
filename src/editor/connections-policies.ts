import draw2d from "draw2d";
import {orthogonalRoute} from "../utils/orthogonal-route";

const ENDPOINT_THRESHOLD = 15;

// Safety-net: scan all segments and insert L-bend vertices for any diagonal segments
export function ensureOrthogonalVertices(line: any): void {
    const vertices = line.getVertices();
    const count = vertices.getSize();
    if (count < 2) return;

    const newPoints: Array<{x: number, y: number}> = [];
    newPoints.push({x: vertices.get(0).x, y: vertices.get(0).y});

    for (let i = 0; i < count - 1; i++) {
        const curr = vertices.get(i);
        const next = vertices.get(i + 1);
        if (curr.x !== next.x && curr.y !== next.y) {
            // Diagonal — insert L-bend (horizontal first)
            newPoints.push({x: next.x, y: curr.y});
        }
        newPoints.push({x: next.x, y: next.y});
    }

    if (newPoints.length !== count) {
        line.setVertices(newPoints);
    }
}

// Add Connection-like stubs to a standalone PolyLine so draw2d's
// OrthogonalSelectionFeedbackPolicy.ResizeHandle can work with it
export function prepareOrthogonalLine(polyline: any): void {
    const computeDir = (from: any, to: any) => {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        if (Math.abs(dx) >= Math.abs(dy)) {
            return dx >= 0 ? draw2d.geo.Rectangle.DIRECTION_RIGHT
                           : draw2d.geo.Rectangle.DIRECTION_LEFT;
        }
        return dy >= 0 ? draw2d.geo.Rectangle.DIRECTION_DOWN
                       : draw2d.geo.Rectangle.DIRECTION_UP;
    };

    const fakePort = (isSource: boolean) => ({
        getConnectionDirection: () => {
            const v = polyline.getVertices();
            const n = v.getSize();
            if (n < 2) return draw2d.geo.Rectangle.DIRECTION_RIGHT;
            return isSource
                ? computeDir(v.get(0), v.get(1))
                : computeDir(v.get(n - 1), v.get(n - 2));
        }
    });

    polyline.getSource = () => fakePort(true);
    polyline.getTarget = () => fakePort(false);
    polyline.getStartPoint = () => polyline.getVertices().get(0);
    polyline.getEndPoint = () => {
        const v = polyline.getVertices();
        return v.get(v.getSize() - 1);
    };
    if (!polyline.getRouter().MINDIST) {
        const origRouter = polyline.getRouter();
        polyline.getRouter = () => {
            origRouter.MINDIST = 10;
            return origRouter;
        };
    }
    polyline._routingMetaData = {routedByUserInteraction: true, fromDir: -1, toDir: -1};
}

// Helper to convert a Connection to a standalone PolyLine, preserving vertices
function connectionToPolyLine(connection: any, vertices: any, canvas: any) {
    canvas.remove(connection);
    const polyline = new draw2d.shape.basic.PolyLine({stroke: 2, color: "#129CE4"});
    polyline.setRouter(new draw2d.layout.connection.VertexRouter());
    polyline.setVertices(vertices);
    polyline.installEditPolicy(new DisconnectableConnectionPolicy());
    polyline.setUserData({type: "standalone-line"});
    canvas.add(polyline);
    prepareOrthogonalLine(polyline);
    ensureOrthogonalVertices(polyline);
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

// Orthogonal-constrained start endpoint handle for standalone lines (drag to extend)
const OrthogonalStartHandle = DisconnectableStartHandle.extend({
    NAME: "OrthogonalStartHandle",
    onDrag: function(dx: number, dy: number, dx2: number, dy2: number, shiftKey: boolean, ctrlKey: boolean) {
        this._super(dx, dy, dx2, dy2, shiftKey, ctrlKey);
    },
    onDragEnd: function(x: number, y: number, shiftKey: boolean, ctrlKey: boolean) {
        // Let parent execute its command FIRST (moves vertex to raw mouse pos)
        this._super(x, y, shiftKey, ctrlKey);
        // THEN fix any diagonal segments created by the move
        const owner = this.owner;
        if (owner && owner.getCanvas() && !(owner instanceof draw2d.Connection)) {
            ensureOrthogonalVertices(owner);
        }
    }
});

// Orthogonal-constrained end endpoint handle for standalone lines (drag to extend)
const OrthogonalEndHandle = DisconnectableEndHandle.extend({
    NAME: "OrthogonalEndHandle",
    onDrag: function(dx: number, dy: number, dx2: number, dy2: number, shiftKey: boolean, ctrlKey: boolean) {
        this._super(dx, dy, dx2, dy2, shiftKey, ctrlKey);
    },
    onDragEnd: function(x: number, y: number, shiftKey: boolean, ctrlKey: boolean) {
        // Let parent execute its command FIRST (moves vertex to raw mouse pos)
        this._super(x, y, shiftKey, ctrlKey);
        // THEN fix any diagonal segments created by the move
        const owner = this.owner;
        if (owner && owner.getCanvas() && !(owner instanceof draw2d.Connection)) {
            ensureOrthogonalVertices(owner);
        }
    }
});

// Selection policy that shows draggable endpoint handles on connections
export const DisconnectableConnectionPolicy = draw2d.policy.line.OrthogonalSelectionFeedbackPolicy.extend({
    NAME: "DisconnectableConnectionPolicy",

    init: function(attr: any, setter: any, getter: any) {
        this._super(attr, setter, getter);

        const BaseResizeHandle = this.ResizeHandle;

        // Handle placed at the midpoint of each wire segment.
        // Drag horizontal segment → moves up/down (Y only).
        // Drag vertical segment → moves left/right (X only).
        this.SegmentMidpointHandle = BaseResizeHandle.extend({
            NAME: "SegmentMidpointHandle",

            init: function(owner: any, segmentIndex: number) {
                this._super(owner, segmentIndex);
                this.segmentIndex = segmentIndex;
                this._v1Start = null;
                this._v2Start = null;
                this._isHoriz = false;
            },

            relocate: function() {
                const vertices = this.owner.getVertices();
                const v1 = vertices.get(this.segmentIndex);
                const v2 = vertices.get(this.segmentIndex + 1);
                if (!v1 || !v2) return this;
                const midX = (v1.x + v2.x) / 2;
                const midY = (v1.y + v2.y) / 2;
                this.setPosition(midX - this.getWidth() / 2, midY - this.getHeight() / 2);
                return this;
            },

            // Do NOT call _super — it sets up a single-vertex move command.
            onDragStart: function(_x: number, _y: number, _shiftKey: boolean, _ctrlKey: boolean) {
                const vertices = this.owner.getVertices();
                const v1 = vertices.get(this.segmentIndex);
                const v2 = vertices.get(this.segmentIndex + 1);
                if (!v1 || !v2) return false;
                this._v1Start = { x: v1.x, y: v1.y };
                this._v2Start = { x: v2.x, y: v2.y };
                this._isHoriz = Math.abs(v1.y - v2.y) <= Math.abs(v1.x - v2.x);
                this.setAlpha(0.5);
                return true;
            },

            // dx, dy = cumulative delta from drag start (canvas coords)
            onDrag: function(dx: number, dy: number, _dx2: number, _dy2: number,
                             _shiftKey: boolean, _ctrlKey: boolean) {
                if (!this._v1Start || !this._v2Start) return;
                const vertices = this.owner.getVertices().clone();
                if (this._isHoriz) {
                    const newY = this._v1Start.y + dy;
                    vertices.overwriteElementAt(new draw2d.geo.Point(this._v1Start.x, newY), this.segmentIndex);
                    vertices.overwriteElementAt(new draw2d.geo.Point(this._v2Start.x, newY), this.segmentIndex + 1);
                } else {
                    const newX = this._v1Start.x + dx;
                    vertices.overwriteElementAt(new draw2d.geo.Point(newX, this._v1Start.y), this.segmentIndex);
                    vertices.overwriteElementAt(new draw2d.geo.Point(newX, this._v2Start.y), this.segmentIndex + 1);
                }
                if (this.owner._routingMetaData) {
                    this.owner._routingMetaData.routedByUserInteraction = true;
                }
                this.owner.setVertices(vertices);
            },

            onDragEnd: function(_x: number, _y: number, _shiftKey: boolean, _ctrlKey: boolean) {
                this.setAlpha(1);
                this._v1Start = null;
                this._v2Start = null;
            }
        });
    },

    onSelect: function(canvas: any, figure: any, _isPrimarySelection: boolean) {
        // Only add vertex editing handles for standalone lines, not fully-connected connections
        const isFullyConnected = figure instanceof draw2d.Connection
            && figure.getSource() !== null
            && figure.getTarget() !== null;

        if (!isFullyConnected) {
            // Standalone lines: orthogonal endpoint handles + draw2d's built-in orthogonal middle-vertex handles
            figure.selectionHandles.add(new OrthogonalStartHandle(figure));
            figure.selectionHandles.add(new OrthogonalEndHandle(figure));

            const points = figure.getVertices();
            const segCount = points.getSize() - 1;
            for (let i = 0; i < segCount; i++) {
                figure.selectionHandles.add(new this.SegmentMidpointHandle(figure, i));
            }
        } else {
            // Fully connected lines keep the disconnectable handles (no vertex editing)
            figure.selectionHandles.add(new DisconnectableStartHandle(figure));
            figure.selectionHandles.add(new DisconnectableEndHandle(figure));
        }

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
            // Replace parent's diagonal Line beeline with orthogonal PolyLine
            if (self.port1 !== null && self.beeline !== null) {
                const portPos = self.port1.getAbsolutePosition();
                self.beeline.hide();
                const beeline = new draw2d.shape.basic.PolyLine({
                    stroke: 2, dasharray: "- ", color: "#2C70FF"
                });
                beeline.setRouter(new draw2d.layout.connection.VertexRouter());
                beeline.setVertices([{x: portPos.x, y: portPos.y}, {x: portPos.x, y: portPos.y}]);
                beeline.hide = function() { beeline.setCanvas(null); };
                beeline.show = function(c: any) { beeline.setCanvas(c); beeline.shape.toFront(); };
                beeline.setStartPosition = function() {};
                beeline.setEndPosition = function() {};
                self.beeline = beeline;
                beeline.show(self.canvas);
            }
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
        const self = this as any;

        // In standalone/extending mode we own the beeline entirely — skip the parent's
        // setEndPosition call which would create a diagonal 2-point path on the beeline.
        if (!this.isDrawingStandalone) {
            super.onMouseMove(canvas, x, y, shiftKey, ctrlKey);
        }

        // Update orthogonal preview for both standalone and port-based drawing
        if (self.beeline !== null && typeof self.beeline.setVertices === 'function') {
            let startX: number, startY: number;
            if (this.isDrawingStandalone) {
                startX = this.standaloneStartPoint.x;
                startY = this.standaloneStartPoint.y;
            } else if (self.port1 !== null) {
                const portPos = self.port1.getAbsolutePosition();
                startX = portPos.x;
                startY = portPos.y;
            } else {
                return;
            }
            const route = orthogonalRoute(startX, startY, x, y, {startHorizontal: true, cornerRadius: 0});
            self.beeline.setVertices(route.points);
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
        connection.setRouter(new draw2d.layout.connection.ManhattanConnectionRouter());
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

        // Create orthogonal preview (PolyLine instead of diagonal Line)
        const beeline = new draw2d.shape.basic.PolyLine({
            stroke: 2,
            dasharray: "- ",
            color: "#2C70FF"
        });
        beeline.setRouter(new draw2d.layout.connection.VertexRouter());
        beeline.setVertices([
            {x: x, y: y},
            {x: x, y: y}
        ]);
        beeline.hide = function () { beeline.setCanvas(null); };
        beeline.show = function (c: any) { beeline.setCanvas(c); beeline.shape.toFront(); };
        self.beeline = beeline;
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

        // Create orthogonal preview (PolyLine instead of diagonal Line)
        const beeline = new draw2d.shape.basic.PolyLine({
            stroke: 2,
            dasharray: "- ",
            color: "#2C70FF"
        });
        beeline.setRouter(new draw2d.layout.connection.VertexRouter());
        beeline.setVertices([
            {x: point.x, y: point.y},
            {x: point.x, y: point.y}
        ]);
        beeline.hide = function () { beeline.setCanvas(null); };
        beeline.show = function (c: any) { beeline.setCanvas(c); beeline.shape.toFront(); };
        self.beeline = beeline;
        beeline.show(canvas);

        this.ripple(x, y, 0);
    }

    private extendExistingLine(newPoint: any) {
        const vertices = this.extendingLine.getVertices().clone();
        if (this.extendEnd === "end") {
            const lastVertex = vertices.get(vertices.getSize() - 1);
            const route = orthogonalRoute(
                lastVertex.x, lastVertex.y,
                newPoint.x, newPoint.y,
                { startHorizontal: true, cornerRadius: 0 }
            );
            // Append route points (skip first which is the existing endpoint)
            for (let i = 1; i < route.points.length; i++) {
                vertices.add(new draw2d.geo.Point(route.points[i].x, route.points[i].y));
            }
        } else {
            const firstVertex = vertices.get(0);
            const route = orthogonalRoute(
                newPoint.x, newPoint.y,
                firstVertex.x, firstVertex.y,
                { startHorizontal: true, cornerRadius: 0 }
            );
            // Prepend route points (skip last which is the existing start)
            for (let i = route.points.length - 2; i >= 0; i--) {
                vertices.insertElementAt(new draw2d.geo.Point(route.points[i].x, route.points[i].y), 0);
            }
        }
        this.extendingLine.setVertices(vertices);
        this.extendingLine.repaint();
    }

    private addStandalonePolyLine(startPoint: any, endPoint: any) {
        const self = this as any;
        const canvas = self.canvas;

        // Compute orthogonal (Manhattan-style) route between the two points
        const route = orthogonalRoute(
            startPoint.x, startPoint.y,
            endPoint.x, endPoint.y,
            { startHorizontal: true, cornerRadius: 0 }
        );

        const polyline = new draw2d.shape.basic.PolyLine({
            stroke: 2,
            color: "#129CE4"
        });
        polyline.setRouter(new draw2d.layout.connection.VertexRouter());
        polyline.setVertices(route.points);
        polyline.installEditPolicy(new DisconnectableConnectionPolicy());
        polyline.setUserData({ type: "standalone-line" });

        canvas.add(polyline);
        prepareOrthogonalLine(polyline);
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
        const con = new draw2d.Connection({ router: new draw2d.layout.connection.ManhattanConnectionRouter() });
        con.installEditPolicy(new DisconnectableConnectionPolicy());
        return con;
    }
}

export const connectionsPolicy = new draw2d.policy.connection.ComposedConnectionCreatePolicy([
    new VertexDragConnectionPolicy(),
    new VertexClickConnectionPolicy()
]);
