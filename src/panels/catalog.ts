import {ComponentElement, ComponentType, wokwiComponents, wokwiComponentById} from "./component";
import { Canvas } from "../editor/canvas";
import { ComponentFigure } from "../editor/component-figure";

const catalogFilterOptions = [
    { type: -1, label: "All", visible: true },
    { type: ComponentType.CUSTOM, label: "Actuator", visible: true },
    { type: ComponentType.BFARM, label: "Sensor", visible: true },
    { type: ComponentType.BFARM_SENSOR, label: "BFarm Sensors", visible: true },
    { type: ComponentType.LED, label: "LED", visible: false },
    { type: ComponentType.MOTOR, label: "Moteur", visible: false },
    { type: ComponentType.TRANSMITTER, label: "Emmeteur", visible: false },
    { type: ComponentType.BUTTON, label: "Bouton", visible: false },
    { type: ComponentType.SENSOR, label: "Capteur", visible: false },
    { type: ComponentType.OTHER, label: "Autre", visible: false },
];

const LED_EMITTING_DIODE_COMPONENT_ID = 1;

export class Catalog {

    readonly elements: ComponentElement[] = []
    private readonly catalog;
    private readonly sorter: HTMLSelectElement | undefined;
    private readonly searchInput: HTMLInputElement | undefined;
    private readonly scrollLeftButton: HTMLButtonElement | undefined;
    private readonly scrollRightButton: HTMLButtonElement | undefined;
    private canvas: Canvas | null = null;
    private pendingPlacement: ComponentFigure | null = null;
    private readonly handlePendingPlacementMoveBound = (event: MouseEvent) => this.handlePendingPlacementMove(event);
    private readonly handlePendingPlacementMouseDownBound = (event: MouseEvent) => this.handlePendingPlacementMouseDown(event);
    private readonly handlePendingPlacementKeyDownBound = (event: KeyboardEvent) => this.handlePendingPlacementKeyDown(event);

    constructor() {

        this.elements = wokwiComponents().filter((c) => c.type != ComponentType.CARD).map((c) => {
            return new ComponentElement(c);
        });

        const root = document.querySelector(".hackCable-catalog-list")
        if(root instanceof HTMLDivElement){
            this.catalog = root;

            const sorter = document.querySelector(".hackCable-catalog-sorter")
            if(sorter instanceof HTMLSelectElement){
                this.sorter = sorter;
            }else console.error("[HackCable] Unable to find element .hackCable-catalog-sorter")

            const searchInput = document.querySelector(".hackCable-catalog-search")
            if(searchInput instanceof HTMLInputElement){
                this.searchInput = searchInput;
            }else console.error("[HackCable] Unable to find element .hackCable-catalog-search")

            const scrollLeftButton = document.querySelector(".hackCable-catalog-scroll-left")
            if(scrollLeftButton instanceof HTMLButtonElement){
                this.scrollLeftButton = scrollLeftButton;
            }else console.error("[HackCable] Unable to find element .hackCable-catalog-scroll-left")

            const scrollRightButton = document.querySelector(".hackCable-catalog-scroll-right")
            if(scrollRightButton instanceof HTMLButtonElement){
                this.scrollRightButton = scrollRightButton;
            }else console.error("[HackCable] Unable to find element .hackCable-catalog-scroll-right")

            this.build();
        }else console.error("[HackCable] Unable to find element .hackCable-catalog-list")
    }

    public setCanvas(canvas: Canvas) {
        this.canvas = canvas;
    }

    private isActuatorComponent(component: ComponentElement) {
        return component.type == ComponentType.CUSTOM || component.componentId == LED_EMITTING_DIODE_COMPONENT_ID;
    }

    private isSensorComponent(component: ComponentElement) {
        return component.type == ComponentType.BFARM;
    }

    private isBfarmPluginSensorComponent(component: ComponentElement) {
        return component.type == ComponentType.BFARM_SENSOR;
    }

    private isAllCatalogComponent(component: ComponentElement) {
        return this.isActuatorComponent(component)
            || this.isSensorComponent(component)
            || this.isBfarmPluginSensorComponent(component);
    }

    build(){

        // Actions
        if(this.sorter){
            this.sorter.innerHTML = catalogFilterOptions
                .filter((option) => option.visible)
                .map((option) => `<option value="${option.type}">${option.label}</option>`)
                .join("\n");

            this.sorter.addEventListener("change", (e) => {
                console.log(e)
                this.updateCatalogList()
            })
        }
        this.searchInput?.addEventListener("input", () => this.updateCatalogList())
        this.scrollLeftButton?.addEventListener("click", () => this.scrollCatalogList(-1))
        this.scrollRightButton?.addEventListener("click", () => this.scrollCatalogList(1))
        this.catalog?.addEventListener("scroll", () => this.updateScrollButtons())
        window.addEventListener("resize", () => this.updateScrollButtons())
        this.updateCatalogList()
    }

    private scrollCatalogList(direction: -1 | 1) {
        if(!this.catalog) {
            return;
        }
        this.catalog.scrollBy({
            top: direction * Math.max(this.catalog.clientHeight * 0.8, 180),
            behavior: "smooth",
        });
    }

    private updateScrollButtons() {
        if(!this.catalog || !this.scrollLeftButton || !this.scrollRightButton) {
            return;
        }

        const maxScrollTop = this.catalog.scrollHeight - this.catalog.clientHeight;
        const canScroll = maxScrollTop > 1;
        const atStart = this.catalog.scrollTop <= 1;
        const atEnd = this.catalog.scrollTop >= maxScrollTop - 1;

        this.scrollLeftButton.disabled = !canScroll || atStart;
        this.scrollRightButton.disabled = !canScroll || atEnd;
    }

    private getCanvasPositionFromMouse(event: MouseEvent, figure: ComponentFigure): { x: number; y: number } {
        if(!this.canvas) {
            return { x: 0, y: 0 };
        }

        const point = this.canvas.fromDocumentToCanvasCoordinate(event.clientX, event.clientY);
        const width = Number(figure.getWidth?.() ?? 0);
        const height = Number(figure.getHeight?.() ?? 0);

        return {
            x: point.x - (Number.isFinite(width) ? width / 2 : 0),
            y: point.y - (Number.isFinite(height) ? height / 2 : 0),
        };
    }

    private movePendingPlacement(event: MouseEvent) {
        if(!this.pendingPlacement) {
            return;
        }

        const position = this.getCanvasPositionFromMouse(event, this.pendingPlacement);
        this.pendingPlacement.setPosition(position.x, position.y);
    }

    private isCanvasPlacementTarget(event: MouseEvent) {
        const target = event.target as HTMLElement | null;
        if(!target) {
            return false;
        }
        if(target.closest(".hackCable-catalog-overlay, .hackCable-canvas-toolbar, .hackCable-canvas-view-controls, .handysense-real-board-controls")) {
            return false;
        }
        return Boolean(target.closest(".hackCable-editor, #hackCable-canvas, .hackCable-canvas-overlay-container"));
    }

    private startComponentPlacement(componentId: number, event: MouseEvent) {
        if(!this.canvas) {
            return;
        }

        this.cancelPendingPlacement(true);

        const figure = new ComponentFigure(wokwiComponentById[componentId]);
        this.pendingPlacement = figure;
        figure.componentElement.classList.add("hackCable-component-placement-preview");
        figure.setDraggable(false);

        const position = this.getCanvasPositionFromMouse(event, figure);
        this.canvas.add(figure.setX(position.x).setY(position.y));
        this.canvas.setCurrentSelection(figure);

        requestAnimationFrame(() => this.movePendingPlacement(event));
        document.body.classList.add("hackCable-is-placing-component");
        window.addEventListener("mousemove", this.handlePendingPlacementMoveBound);
        window.addEventListener("mousedown", this.handlePendingPlacementMouseDownBound, true);
        window.addEventListener("keydown", this.handlePendingPlacementKeyDownBound);
    }

    private handlePendingPlacementMove(event: MouseEvent) {
        this.movePendingPlacement(event);
    }

    private handlePendingPlacementMouseDown(event: MouseEvent) {
        if(!this.pendingPlacement || !this.isCanvasPlacementTarget(event)) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        this.movePendingPlacement(event);
        this.commitPendingPlacement();
    }

    private handlePendingPlacementKeyDown(event: KeyboardEvent) {
        if(event.key !== "Escape") {
            return;
        }

        this.cancelPendingPlacement(true);
    }

    private commitPendingPlacement() {
        if(!this.pendingPlacement) {
            return;
        }

        this.pendingPlacement.componentElement.classList.remove("hackCable-component-placement-preview");
        this.pendingPlacement.setDraggable(true);
        this.pendingPlacement = null;
        this.removePendingPlacementListeners();
    }

    private cancelPendingPlacement(removeFigure: boolean) {
        if(!this.pendingPlacement) {
            this.removePendingPlacementListeners();
            return;
        }

        if(removeFigure && this.canvas) {
            this.canvas.remove(this.pendingPlacement);
        } else {
            this.pendingPlacement.componentElement.classList.remove("hackCable-component-placement-preview");
            this.pendingPlacement.setDraggable(true);
        }
        this.pendingPlacement = null;
        this.removePendingPlacementListeners();
    }

    private removePendingPlacementListeners() {
        document.body.classList.remove("hackCable-is-placing-component");
        window.removeEventListener("mousemove", this.handlePendingPlacementMoveBound);
        window.removeEventListener("mousedown", this.handlePendingPlacementMouseDownBound, true);
        window.removeEventListener("keydown", this.handlePendingPlacementKeyDownBound);
    }

    updateCatalogList(){

        if(this.catalog) {
            this.catalog.innerHTML = ""
            this.catalog.scrollTop = 0
        }

        let filterType: number = -1
        if(this.sorter){
            filterType = parseInt(this.sorter.value, 10)
        }
        const searchTerm = this.searchInput?.value.trim().toLowerCase() || "";

        const filtered = this.elements.filter((e) => {
            const matchesSearch = e.name.toLowerCase().includes(searchTerm);
            if (filterType == -1) {
                return this.isAllCatalogComponent(e) && matchesSearch;
            }
            if (filterType == ComponentType.CUSTOM) {
                return this.isActuatorComponent(e) && matchesSearch;
            }
            if (filterType == ComponentType.BFARM) {
                return this.isSensorComponent(e) && matchesSearch;
            }
            if (filterType == ComponentType.BFARM_SENSOR) {
                return this.isBfarmPluginSensorComponent(e) && matchesSearch;
            }
            return false;
        });
        this.addComponentsToSection(null, filtered);
        requestAnimationFrame(() => this.updateScrollButtons());
    }

    private addComponentsToSection(container: HTMLElement | null, components: ComponentElement[]) {
        components.forEach((e) => {
            //console.log(e.pinInfo)

            const div = document.createElement('div');
            div.setAttribute("class", "hackCable-catalog-element")
            div.setAttribute("title", e.description)
            div.innerHTML = "<h3>" + e.name + "</h3>";

            const targetContainer = container || this.catalog;
            targetContainer?.appendChild(div);

            // Click to pick up a component, then click the canvas to place it.
            div.addEventListener("click", (event) => {
                this.startComponentPlacement(e.componentId, event);

                // Hide the catalog bar after adding
                const bar = document.querySelector('.hackCable-catalog-bar') as HTMLElement;
                const toggleBtn = document.querySelector('.hackCable-toggle-catalog') as HTMLButtonElement;
                if (bar) bar.classList.add('hidden');
                if (toggleBtn) toggleBtn.classList.remove('active');
                localStorage.setItem('hackCable-catalog-visible', 'false');
            });

            setTimeout(() => {
                const svg = e.wokwiComponent.shadowRoot?.querySelector("svg");
                if(svg) svg.setAttribute("style", "max-width: 100%; height: auto")
            })
            div.appendChild(e.wokwiComponent);
        })
    }
}
