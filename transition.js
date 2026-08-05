/**
 * БЕСШОВНЫЙ AJAX-РОУТЕР ДЛЯ ПРЕМИАЛЬНЫХ ПЕРЕХОДОВ (ЭФФЕКТ ONLY.DIGITAL)
 */

// Функция фоновой AJAX-загрузки кода новой страницы
async function fetchNewPage(url) {
    try {
        // Устанавливаем таймаут на запрос (3 секунды), чтобы сайт не зависал при слабом интернете
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`Сервер вернул статус: ${response.status}`);
        const htmlText = await response.text();
        
        // Создаем виртуальный DOM для извлечения контента
        const parser = new DOMParser();
        const nextDoc = parser.parseFromString(htmlText, 'text/html');
        
        const container = nextDoc.querySelector('.page-container');
        const title = nextDoc.querySelector('title') ? nextDoc.querySelector('title').innerText : '';
        
        return { container, title };
    } catch (err) {
        console.warn("Аварийное переключение: AJAX-загрузка не удалась, переход в стандартный режим.", err);
        return null;
    }
}

// Умный перезапуск интерактива страниц в зависимости от пространства имен (data-namespace)
function reinitPageLogic(namespace) {
    console.log(`[Router] Активная страница: ${namespace}`);
    
    if (namespace === 'truco') {
        // Инициализация скриптов для страницы Truco из файла truco.js
        if (typeof initTrucoPage === 'function') {
            initTrucoPage();
        }
    }
    
    if (namespace === 'home') {
        // Инициализация скриптов для Главной страницы из файла script.js
        if (typeof initHomePage === 'function') {
            initHomePage();
        }
    }
}

// Главная функция бесшовной смены страниц с анимацией шторки GSAP
async function performTransition(targetPath, fullHref) {
    // Если пользователь кликнул на ту же страницу, где уже находится — ничего не делаем
    if (targetPath === window.location.pathname || fullHref === window.location.href) {
        console.log("[Router] Вы уже находитесь на этой странице.");
        return;
    }

    const overlay = document.querySelector('.transition-overlay');
    
    // Если шторка физически отсутствует в DOM, делаем обычный переход
    if (!overlay) {
        window.location.href = fullHref;
        return;
    }

    const tl = gsap.timeline();

    // 🎬 ШАГ 1: Анимация шторки (закрываем экран вверх)
    tl.to(overlay, {
        duration: 0.5,
        translateY: '0%',
        ease: 'power2.inOut',
        onComplete: async () => {
            
            // 🌐 ШАГ 2: Пока экран закрыт, скачиваем контент по полному абсолютному URL
            const newPage = await fetchNewPage(fullHref);
            const currentContainer = document.querySelector('.page-container');
            
            if (newPage && newPage.container && currentContainer) {
                // Производим хирургическую замену контейнера контента в DOM
                currentContainer.replaceWith(newPage.container);
                
                // Обновляем мета-данные вкладки и URL в адресной строке браузера
                document.title = newPage.title;
                window.history.pushState(null, null, fullHref);
                
                // Скроллим окно в самый верх к началу новой страницы
                window.scrollTo(0, 0);
                
                // Запускаем специфичные JS-скрипты для новой страницы
                const nextNamespace = newPage.container.getAttribute('data-namespace');
                reinitPageLogic(nextNamespace);
                
                // 🚀 ШАГ 3: Открываем экран (уводим шторку дальше наверх)
                gsap.timeline()
                    .to(overlay, {
                        duration: 0.5,
                        translateY: '-100%',
                        ease: 'power2.inOut'
                    })
                    .set(overlay, { translateY: '100%' }); // Сбрасываем позицию шторки вниз для следующего клика
                    
            } else {
                // 🔥 АВАРИЙНЫЙ ВЫХОД: если fetch не сработал (404, CORS или таймаут),
                // просто перенаправляем браузер по ссылке классическим способом
                window.location.href = fullHref;
            }
        }
    });
}

// Глобальный перехватчик кликов на внутренние ссылки сайта
document.addEventListener('click', (e) => {
    const targetLink = e.target.closest('a');
    
    // Проверяем, что ссылка ведет на этот же сайт (не внешняя на TG/Behance)
    if (targetLink && targetLink.href.includes(window.location.origin)) {
        
        // Исключаем из обработки роутером скачивание файлов и медиа контента
        if (targetLink.getAttribute('href').match(/\.(pdf|mp4|webm|png|jpg|jpeg|zip)$/i)) return;
        
        e.preventDefault();
        
        // Берем нормализованный браузером абсолютный путь и полный URL
        const path = targetLink.pathname;
        const fullUrl = targetLink.href;
        
        performTransition(path, fullUrl);
    }
});

// Корректная обработка системных кнопок браузера «Назад» и «Вперед»
window.addEventListener('popstate', async () => {
    const savedPage = await fetchNewPage(window.location.href);
    const currentContainer = document.querySelector('.page-container');
    
    if (savedPage && savedPage.container && currentContainer) {
        currentContainer.replaceWith(savedPage.container);
        document.title = savedPage.title;
        reinitPageLogic(savedPage.container.getAttribute('data-namespace'));
    } else {
        window.location.reload();
    }
});

// Первичный запуск логики при самом первом заходе пользователя на сайт
document.addEventListener('DOMContentLoaded', () => {
    const initialContainer = document.querySelector('.page-container');
    if (initialContainer) {
        const initialNamespace = initialContainer.getAttribute('data-namespace');
        reinitPageLogic(initialNamespace);
    }
});
