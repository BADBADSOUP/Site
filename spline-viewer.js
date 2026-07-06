/**
 * Автономный Spline Viewer Компонент
 * Работает без внешних сетевых импортов и CORS-блокировок
 */
class AutonomousSplineViewer extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._url = '';
        this._iframe = null;
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

        // Преобразуем стандартную ссылку просмотра в чистый полноэкранный плеер Spline Sandbox,
        // который легально разрешен к показу внутри тегов и не блокируется защитой CORS
        let embedUrl = this._url;
        if (embedUrl.includes('prod.spline.design')) {
            embedUrl = embedUrl.replace('prod.spline.design', 'my.spline.design');
            embedUrl = embedUrl.replace('/scene.splinecode', '/');
        }

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
                src="${embedUrl}?embed=true" 
                allow="autoplay; fullscreen; vr" 
                loading="lazy">
             iframe>
        `;
    }
}

// Запускаем кастомный HTML-тег в систему
if (!customElements.get('spline-viewer')) {
    customElements.define('spline-viewer', AutonomousSplineViewer);
}
