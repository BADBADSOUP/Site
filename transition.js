/**
 * СВЕРХСТАБИЛЬНЫЙ AJAX-РОУТЕР С АВАРИЙНЫМ РЕЖИМОМ
 */

async function fetchNewPage(url) {
    try {
        const controller = new AbortController();
        // Если страница не отвечает за 1.5 секунды — отменяем AJAX
        const timeoutId = setTimeout(() => controller.abort(), 1500);

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`Статус: ${response.status}`);
        const htmlText = await response.text();
        
        const parser = new DOMParser();
        const nextDoc = parser.parseFromString(htmlText, 'text/html');
        
        const container = nextDoc.querySelector('.page-container');
        const title = nextDoc.querySelector('title') ? nextDoc.querySelector('title').innerText : '';
        
        return { container, title };
    } catch (err) {
        console.warn("[Router] AJAX не удался. Переключаюсь на стандартный переход.", err);
        return null;
    }
}

function reinitPageLogic(namespace) {
    console.log(`[Router] Страница: ${namespace}`);
    if (namespace === 'truco' && typeof initTrucoPage === 'function') initTrucoPage();
    if (namespace === 'home' && typeof initHomePage === 'function') initHomePage();
}

async function performTransition(targetPath, fullHref) {
    if (targetPath === window.location.pathname || fullHref === window.location.href) return;

    const overlay = document.querySelector('.transition-overlay');
    if (!overlay) {
        window.location.href = fullHref;
        return;
    }

    const tl = gsap.timeline();

    // 🎬 Шторка закрывает экран
    tl.to(overlay, {
        duration: 0.4,
        translateY: '0%',
        ease: 'power2.inOut',
        onComplete: async () => {
            
            // 🌐 Скачиваем контент
            const newPage = await fetchNewPage(fullHref);
            const currentContainer = document.querySelector('.page-container');
            
            if (newPage && newPage.container && currentContainer) {
                currentContainer.replaceWith(newPage.container);
                document.title = newPage.title;
                window.history.pushState(null, null, fullHref);
                window.scrollTo(0, 0);
                
                reinitPageLogic(newPage.container.getAttribute('data-namespace'));
                
                // Открываем экран
                gsap.to(overlay, {
                    duration: 0.4,
                    translateY: '-100%',
                    ease: 'power2.inOut',
                    onComplete: () => gsap.set(overlay, { translateY: '100%' })
                });
            } else {
                // 🔥 ЕСЛИ СЕРВЕР ОТДАЛ 404 ИЛИ AJAX ЗАВИС — ПЕРЕХОДИМ ОБЫЧНЫМ ПУТЕМ
                window.location.href = fullHref;
            }
        }
    });
}

document.addEventListener('click', (e) => {
    const targetLink = e.target.closest('a');
    if (targetLink && targetLink.href.includes(window.location.origin)) {
        if (targetLink.getAttribute('href').match(/\.(pdf|mp4|webm|png|jpg|zip)$/i)) return;
        
        e.preventDefault();
        performTransition(targetLink.pathname, targetLink.href);
    }
});

window.addEventListener('popstate', () => window.location.reload());

document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.page-container');
    if (container) reinitPageLogic(container.getAttribute('data-namespace'));
});
