import {ComponentElement, ComponentType, wokwiComponents, wokwiComponentById} from "./component";
import { Canvas } from "../editor/canvas";
import { ComponentFigure } from "../editor/component-figure";

// Custom component IDs
const CUSTOM_COMPONENT_IDS = [29, 30, 31, 32, 33]; // pH Sensor, Air Humidity Sensor, Misting Pump, Water Pump, Fan

export class Catalog {

    readonly elements: ComponentElement[] = []
    private readonly catalog;
    private readonly sorter: HTMLSelectElement | undefined;
    private canvas: Canvas | null = null;
    private customComponentsExpanded: boolean = true; // Default to show

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
                this.build();
            }else console.error("[HackCable] Unable to find element .hackCable-catalog-sorter")
        }else console.error("[HackCable] Unable to find element .hackCable-catalog-list")
    }

    public setCanvas(canvas: Canvas) {
        this.canvas = canvas;
    }

    build(){

        // Actions
        if(this.sorter){
            this.sorter.innerHTML = "<option value=\"-1\">Tout afficher</option>\n" +
                "<option value=" + ComponentType.LED + ">LED</option>\n" +
                "<option value=" + ComponentType.MOTOR + ">Moteur</option>\n" +
                "<option value=" + ComponentType.TRANSMITTER + ">Émmeteur</option>\n" +
                "<option value=" + ComponentType.BUTTON + ">Bouton</option>\n" +
                "<option value=" + ComponentType.SENSOR + ">Capteur</option>\n" +
                "<option value=" + ComponentType.OTHER + ">Autre</option>\n";

            this.sorter.addEventListener("change", (e) => {
                console.log(e)
                this.updateCatalogList()
            })
        }
        this.updateCatalogList()
    }

    updateCatalogList(){

        if(this.catalog) this.catalog.innerHTML = ""

        let filterType: number = -1
        if(this.sorter){
            filterType = parseInt(this.sorter.value, 10)
        }

        // Separate custom and standard components
        const customComponents = this.elements.filter((e) => CUSTOM_COMPONENT_IDS.includes(e.componentId) && (ComponentType[e.type] == ComponentType[filterType] || filterType == -1));
        const standardComponents = this.elements.filter((e) => !CUSTOM_COMPONENT_IDS.includes(e.componentId) && (ComponentType[e.type] == ComponentType[filterType] || filterType == -1));

        // Add custom components section first
        if (customComponents.length > 0) {
            this.addSectionWithToggle("Custom Components", customComponents, this.customComponentsExpanded);
        }

        // Add standard components section
        if (standardComponents.length > 0) {
            this.addComponentsToSection(null, standardComponents);
        }
    }

    private addSectionWithToggle(sectionTitle: string, components: ComponentElement[], initiallyExpanded: boolean) {
        // Create section container
        const sectionDiv = document.createElement('div');
        sectionDiv.setAttribute("class", "hackCable-catalog-section");

        // Create header with toggle
        const headerDiv = document.createElement('div');
        headerDiv.setAttribute("class", "hackCable-catalog-section-header");

        const toggleIcon = document.createElement('span');
        toggleIcon.setAttribute("class", "hackCable-section-toggle-icon");
        toggleIcon.textContent = initiallyExpanded ? '▼' : '▶';

        const titleSpan = document.createElement('span');
        titleSpan.textContent = sectionTitle;

        headerDiv.appendChild(toggleIcon);
        headerDiv.appendChild(titleSpan);

        // Create content container
        const contentDiv = document.createElement('div');
        contentDiv.setAttribute("class", "hackCable-catalog-section-content");
        contentDiv.style.display = initiallyExpanded ? 'block' : 'none';

        // Add toggle functionality
        headerDiv.addEventListener('click', () => {
            const isVisible = contentDiv.style.display !== 'none';
            contentDiv.style.display = isVisible ? 'none' : 'block';
            toggleIcon.textContent = isVisible ? '▶' : '▼';
            this.customComponentsExpanded = !isVisible;
            localStorage.setItem('hackCable-custom-components-expanded', this.customComponentsExpanded.toString());
        });

        // Restore state from localStorage
        const savedState = localStorage.getItem('hackCable-custom-components-expanded');
        if (savedState !== null) {
            const isExpanded = savedState === 'true';
            contentDiv.style.display = isExpanded ? 'block' : 'none';
            toggleIcon.textContent = isExpanded ? '▼' : '▶';
            this.customComponentsExpanded = isExpanded;
        }

        sectionDiv.appendChild(headerDiv);
        sectionDiv.appendChild(contentDiv);
        this.catalog?.appendChild(sectionDiv);

        // Add components to content
        this.addComponentsToSection(contentDiv, components);
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

            // Click to add component to canvas
            div.addEventListener("click", () => {
                if (this.canvas) {
                    const figure = new ComponentFigure(wokwiComponentById[e.componentId]);
                    const x = 300;
                    const y = 200;
                    this.canvas.add(figure.setX(x).setY(y));
                }
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