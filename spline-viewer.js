/**
 * Исправленный автономный Spline Viewer Компоgнент
 * Напрямую открывает корректную embed-версию сцены
 */
class AutonomousSplineViewer extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._url = '';
    }

    static get observedAttributes() {
        return ['url'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'url' && oldValue !== newValue) {
            this._url = newValue;
            this.render();
        }
    }

    connectedCallback() {
        this.render();
    }

    render() {
        if (!this._url) return;

        // Формируем чистую ссылку на полноэкранный интерактивный плеер
        const finalEmbedUrl = "https://spline.design";

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                    height: 100%;
                    margin: 0;
                    padding: 0;
                    position: relative;
                    overflow: hidden;
                }
                iframe {
                    display: block;
                    width: 100%;
                    height: 100%;
                    border: none;
                    background: transparent;
                }
            </style>
            <iframe 
                src="${finalEmbedUrl}" 
                allow="autoplay; fullscreen" 
                loading="lazy">
            </iframe>
        `;
    }
}

if (!customElements.get('spline-viewer')) {
    customElements.define('spline-viewer', AutonomousSplineViewer);
}
