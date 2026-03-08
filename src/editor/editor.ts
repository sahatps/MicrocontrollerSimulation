import {Canvas} from "./canvas";
import {ComponentFigure, FigureData, WiringData} from "./component-figure";
import {wokwiComponentById} from "../panels/component";
import {Port} from "draw2d-types";
import * as draw2d from "draw2d";
import {DisconnectableConnectionPolicy} from "./connections-policies";

export declare type StandaloneLineData = {id: string, vertices: Array<{x: number, y: number}>}
export declare type EditorSaveData = {figures: FigureData[], connections: WiringData[], standaloneLines?: StandaloneLineData[]}

export class Editor{

    private readonly _canvas;

    constructor() {
        this._canvas = new Canvas('hackCable-canvas');
    }

    public getEditorSaveData(): EditorSaveData{

        let data: EditorSaveData = {figures: [], connections: [], standaloneLines: []};

        this._canvas.getFigures().data.forEach((figure: any) => {
            if(figure instanceof ComponentFigure){
                data.figures.push(figure.getFigureData());
                data.connections.push(...figure.getWiringData())
            }
        });

        // Save standalone lines (non-port PolyLines)
        this._canvas.getLines().each((_index: number, line: any) => {
            const userData = line.getUserData();
            if (userData && userData.type === "standalone-line") {
                const vertices: Array<{x: number, y: number}> = [];
                line.getVertices().each((_i: number, v: any) => {
                    vertices.push({x: v.x, y: v.y});
                });
                data.standaloneLines!.push({id: line.getId(), vertices});
            }
        });

        return data;
    }
    public loadEditorSaveData(data: EditorSaveData){
        this._canvas.clear()

        // Create each figures
        data.figures.forEach((figureData) => {
            let figure = new ComponentFigure(wokwiComponentById[figureData.componentId]);
            figure.setId(figureData.figureId) // So the connections can find this figure
            this._canvas.add(figure.setX(figureData.x).setY(figureData.y))
        })
        // Add all connections
        data.connections.forEach((connectionData) => {
            const sourceFigure: ComponentFigure = this._canvas.getFigure(connectionData.fromFigure)
            const targetFigure: ComponentFigure = this._canvas.getFigure(connectionData.targetFigure)
            if(sourceFigure && targetFigure){
                const sourcePort: Port = sourceFigure.getPortByName(connectionData.fromPortName)
                const targetPort: Port = targetFigure.getPortByName(connectionData.targetPortName)
                if(sourcePort && targetPort){
                    let con = new draw2d.Connection();
                    con.setRouter(new draw2d.layout.connection.VertexRouter());
                    con.setSource(sourcePort)
                    con.setTarget(targetPort)
                    con.setVertices(connectionData.svgPath)
                    con.installEditPolicy(new DisconnectableConnectionPolicy())
                    this._canvas.add(con)
                }
            }
        })

        // Restore standalone lines
        if (data.standaloneLines) {
            data.standaloneLines.forEach((lineData) => {
                const polyline = new draw2d.shape.basic.PolyLine({stroke: 2, color: "#129CE4"});
                polyline.setRouter(new draw2d.layout.connection.VertexRouter());
                polyline.setId(lineData.id);
                polyline.setVertices(lineData.vertices);
                polyline.installEditPolicy(new draw2d.policy.line.VertexSelectionFeedbackPolicy());
                polyline.setUserData({type: "standalone-line"});
                this._canvas.add(polyline);
            });
        }
    }

    get canvas(){
        return this._canvas;
    }
}