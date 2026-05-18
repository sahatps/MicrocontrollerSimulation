import draw2d from "draw2d";
import {orthogonalRoute} from "../utils/orthogonal-route";

type OrthogonalPoint = {x: number, y: number};

function verticesToPoints(vertices: any): OrthogonalPoint[] {
    const points: OrthogonalPoint[] = [];
    vertices.each((_i: number, vertex: any) => {
        points.push({x: vertex.x, y: vertex.y});
    });
    return points;
}

function clonePoints(points: OrthogonalPoint[]): OrthogonalPoint[] {
    return points.map((point) => ({x: point.x, y: point.y}));
}

function setLinePoints(line: any, points: OrthogonalPoint[]): void {
    line.setVertices(points.map((point) => new draw2d.geo.Point(point.x, point.y)));
}

function pointsEqual(a: OrthogonalPoint, b: OrthogonalPoint): boolean {
    return a.x === b.x && a.y === b.y;
}

function pointListsEqual(a: OrthogonalPoint[], b: OrthogonalPoint[]): boolean {
    if (a.length !== b.length) {
        return false;
    }
    return a.every((point, index) => pointsEqual(point, b[index]));
}

function hasDiagonalSegments(points: OrthogonalPoint[]): boolean {
    for (let i = 0; i < points.length - 1; i++) {
        if (points[i].x !== points[i + 1].x && points[i].y !== points[i + 1].y) {
            return true;
        }
    }
    return false;
}

function simplifyOrthogonalPoints(points: OrthogonalPoint[]): OrthogonalPoint[] {
    let simplified = clonePoints(points);
    let changed = true;

    while (changed) {
        changed = false;

        const withoutDuplicates: OrthogonalPoint[] = [];
        simplified.forEach((point) => {
            const lastPoint = withoutDuplicates[withoutDuplicates.length - 1];
            if (!lastPoint || !pointsEqual(lastPoint, point)) {
                withoutDuplicates.push({...point});
            } else {
                changed = true;
            }
        });

        if (withoutDuplicates.length <= 2) {
            simplified = withoutDuplicates;
            continue;
        }

        const withoutCollinear: OrthogonalPoint[] = [withoutDuplicates[0]];
        for (let i = 1; i < withoutDuplicates.length - 1; i++) {
            const prev = withoutCollinear[withoutCollinear.length - 1];
            const current = withoutDuplicates[i];
            const next = withoutDuplicates[i + 1];

            if ((prev.x === current.x && current.x === next.x)
                || (prev.y === current.y && current.y === next.y)) {
                changed = true;
                continue;
            }

            withoutCollinear.push({...current});
        }
        withoutCollinear.push(withoutDuplicates[withoutDuplicates.length - 1]);
        simplified = withoutCollinear;
    }

    return simplified;
}

function prepareSegmentForParallelMove(line: any, segmentIndex: number) {
    const originalPoints = verticesToPoints(line.getVertices());
    const sourceAnchored = line instanceof draw2d.Connection && line.getSource() !== null;
    const targetAnchored = line instanceof draw2d.Connection && line.getTarget() !== null;
    const pointA = originalPoints[segmentIndex];
    const pointB = originalPoints[segmentIndex + 1];
    const isHorizontal = Math.abs(pointA.y - pointB.y) <= Math.abs(pointA.x - pointB.x);

    const preparedPoints = clonePoints(originalPoints);
    let activeSegmentIndex = segmentIndex;
    const lastSegmentIndex = originalPoints.length - 2;

    if (segmentIndex === 0 && sourceAnchored) {
        preparedPoints.splice(1, 0, {...preparedPoints[0]});
        activeSegmentIndex += 1;
    }

    if (segmentIndex === lastSegmentIndex && targetAnchored) {
        preparedPoints.push({...preparedPoints[preparedPoints.length - 1]});
    }

    return {preparedPoints, activeSegmentIndex, isHorizontal};
}

function movePreparedSegment(points: OrthogonalPoint[], segmentIndex: number, isHorizontal: boolean,
                             dx: number, dy: number): OrthogonalPoint[] {
    const movedPoints = clonePoints(points);

    if (isHorizontal) {
        const newY = movedPoints[segmentIndex].y + dy;
        movedPoints[segmentIndex].y = newY;
        movedPoints[segmentIndex + 1].y = newY;
    } else {
        const newX = movedPoints[segmentIndex].x + dx;
        movedPoints[segmentIndex].x = newX;
        movedPoints[segmentIndex + 1].x = newX;
    }

    return movedPoints;
}

function refreshLineSelection(line: any): void {
    const canvas = line.getCanvas();
    if (canvas) {
        canvas.setCurrentSelection(line);
    }
}

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
            // Diagonal - insert L-bend (horizontal first)
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
        // Drag horizontal segment -> moves up/down.
        // Drag vertical segment -> moves left/right.
        this.SegmentMidpointHandle = BaseResizeHandle.extend({
            NAME: "SegmentMidpointHandle",

            init: function(owner: any, segmentIndex: number) {
                this._super(owner, segmentIndex);
                this.segmentIndex = segmentIndex;
                this._originalVertices = null;
                this._originalPoints = null;
                this._preparedPoints = null;
                this._activeSegmentIndex = segmentIndex;
                this._isHoriz = false;
                this._didDrag = false;
            },

            relocate: function() {
                const vertices = this.owner.getVertices();
                const v1 = vertices.get(this._activeSegmentIndex);
                const v2 = vertices.get(this._activeSegmentIndex + 1);
                if (!v1 || !v2) return this;
                const midX = (v1.x + v2.x) / 2;
                const midY = (v1.y + v2.y) / 2;
                this.setPosition(midX - this.getWidth() / 2, midY - this.getHeight() / 2);
                return this;
            },

            // Do NOT call _super - it sets up a single-vertex move command.
            onDragStart: function(_x: number, _y: number, _shiftKey: boolean, _ctrlKey: boolean) {
                ensureOrthogonalVertices(this.owner);
                const vertices = this.owner.getVertices();
                const v1 = vertices.get(this.segmentIndex);
                const v2 = vertices.get(this.segmentIndex + 1);
                if (!v1 || !v2) return false;

                this._originalVertices = vertices.clone(true);
                this._originalPoints = verticesToPoints(vertices);
                const prepared = prepareSegmentForParallelMove(this.owner, this.segmentIndex);
                this._preparedPoints = prepared.preparedPoints;
                this._activeSegmentIndex = prepared.activeSegmentIndex;
                this._isHoriz = prepared.isHorizontal;
                this._didDrag = false;
                this.setAlpha(0.5);
                return true;
            },

            // dx, dy = cumulative delta from drag start (canvas coords)
            onDrag: function(dx: number, dy: number, _dx2: number, _dy2: number,
                             _shiftKey: boolean, _ctrlKey: boolean) {
                if (!this._preparedPoints) return;
                if (dx === 0 && dy === 0) {
                    return;
                }

                const movedPoints = movePreparedSegment(
                    this._preparedPoints,
                    this._activeSegmentIndex,
                    this._isHoriz,
                    dx,
                    dy
                );
                setLinePoints(this.owner, movedPoints);
                if (this.owner._routingMetaData) {
                    this.owner._routingMetaData.routedByUserInteraction = true;
                }
                this._didDrag = true;
                this.relocate();
            },

            onDragEnd: function(_x: number, _y: number, _shiftKey: boolean, _ctrlKey: boolean) {
                if (this._didDrag) {
                    let finalPoints = simplifyOrthogonalPoints(verticesToPoints(this.owner.getVertices()));
                    setLinePoints(this.owner, finalPoints);

                    if (hasDiagonalSegments(finalPoints)) {
                        ensureOrthogonalVertices(this.owner);
                        finalPoints = simplifyOrthogonalPoints(verticesToPoints(this.owner.getVertices()));
                        setLinePoints(this.owner, finalPoints);
                    }

                    if (this.owner._routingMetaData) {
                        this.owner._routingMetaData.routedByUserInteraction = true;
                    }

                    if (this._originalVertices && this._originalPoints
                        && !pointListsEqual(this._originalPoints, finalPoints)) {
                        const command = new draw2d.command.CommandReplaceVertices(
                            this.owner,
                            this._originalVertices,
                            this.owner.getVertices().clone(true)
                        );
                        this.owner.getCanvas().getCommandStack().execute(command);
                    }

                    refreshLineSelection(this.owner);
                }

                this.setAlpha(1);
                this._originalVertices = null;
                this._originalPoints = null;
                this._preparedPoints = null;
                this._activeSegmentIndex = this.segmentIndex;
                this._didDrag = false;
            }
        });
    },

    onSelect: function(canvas: any, figure: any, _isPrimarySelection: boolean) {
        const isFullyConnected = figure instanceof draw2d.Connection
            && figure.getSource() !== null
            && figure.getTarget() !== null;

        if (!isFullyConnected) {
            // Standalone lines: orthogonal endpoint handles.
            figure.selectionHandles.add(new OrthogonalStartHandle(figure));
            figure.selectionHandles.add(new OrthogonalEndHandle(figure));
        } else {
            // Connected lines: keep disconnectable endpoint handles.
            figure.selectionHandles.add(new DisconnectableStartHandle(figure));
            figure.selectionHandles.add(new DisconnectableEndHandle(figure));
        }

        // Add orthogonal midpoint handles for all segments.
        // This keeps midpoint availability consistent on both horizontal and vertical segments.
        const points = figure.getVertices();
        const segCount = points.getSize() - 1;
        for (let i = 0; i < segCount; i++) {
            figure.selectionHandles.add(new this.SegmentMidpointHandle(figure, i));
        }

        figure.selectionHandles.each(function(_i: number, e: any) {
            // Connections are not "resizeable" figures, but these handles must stay draggable
            // for orthogonal segment editing and endpoint reconnect/disconnect.
            e.setDraggable(true);
            e.show(canvas);
        });
        this.moved(canvas, figure);
    }
});

export class VertexClickConnectionPolicy extends draw2d.policy.connection.ClickConnectionCreatePolicy {
    onClick(figure: any, x: number, y: number, shiftKey: boolean, ctrlKey: boolean) {
        const self = this as any;
        const clickedPort = figure !== null && figure instanceof draw2d.Port;

        // Not currently drawing: only a port click can start a wire.
        if (self.port1 === null) {
            if (!clickedPort) {
                return;
            }
            super.onClick(figure, x, y, shiftKey, ctrlKey);

            // Replace parent's diagonal Line beeline with orthogonal PolyLine preview.
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

        // Already started from a port: second click must also be a port.
        if (clickedPort) {
            super.onClick(figure, x, y, shiftKey, ctrlKey);
            return;
        }

        // Second click not on a port: cancel pending draw and do not create line.
        this.cleanupDrawingState();
    }

    onMouseMove(canvas: any, x: number, y: number, shiftKey: boolean, ctrlKey: boolean) {
        const self = this as any;
        if (self.port1 === null) return;

        super.onMouseMove(canvas, x, y, shiftKey, ctrlKey);

        // Keep wire preview orthogonal while choosing target port.
        if (self.beeline !== null && typeof self.beeline.setVertices === "function") {
            const portPos = self.port1.getAbsolutePosition();
            const route = orthogonalRoute(portPos.x, portPos.y, x, y, {startHorizontal: true, cornerRadius: 0});
            self.beeline.setVertices(route.points);
        }
    }

    onKeyDown(canvas: any, keyCode: number, shiftKey: boolean, ctrlKey: boolean) {
        const KEYCODE_ESC = 27;
        const self = this as any;
        if (keyCode === KEYCODE_ESC && self.port1 !== null) {
            this.cleanupDrawingState();
            return;
        }
        super.onKeyDown(canvas, keyCode, shiftKey, ctrlKey);
    }

    createConnection() {
        const connection = super.createConnection();
        connection.setRouter(new draw2d.layout.connection.InteractiveManhattanConnectionRouter());
        connection.installEditPolicy(new DisconnectableConnectionPolicy());
        return connection;
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
    }
}

export const connectionsPolicy = new draw2d.policy.connection.ComposedConnectionCreatePolicy([
    new VertexClickConnectionPolicy()
]);
