// Функция AJAX-загрузки кода новой страницы
async function fetchNewPage(url) {
    try {
        const response = await fetch(url);
        const htmlText = await response.text();
        
        // Превращаем текст в виртуальный HTML-документ
        const parser = new DOMParser();
        const nextDoc = parser.parseFromString(htmlText, 'text/html');
        
        const container = nextDoc.querySelector('.page-container');
        const title = nextDoc.querySelector('title') ? nextDoc.querySelector('title').innerText : '';
        
        return { container, title };
    } catch (err) {
        console.error("Не удалось загрузить страницу: ", err);
        return null;
    }
}

// Умный перезапуск интерактива страниц в зависимости от data-namespace
function reinitPageLogic(namespace) {
    console.log(`Текущая активная страница: ${namespace}`);
    
    if (namespace === 'truco') {
        // Если в файле /truco/truco.js есть функция инициализации, запускаем её
        if (typeof initTrucoPage === 'function') {
            initTrucoPage();
        }
    }
    
    if (namespace === 'home') {
        // Перезапуск скриптов для главной из файла script.js
        if (typeof initHomePage === 'function') {
            initHomePage();
        }
    }
}

// Основная функция бесшовной смены страниц
async function performTransition(url) {
    if (url === window.location.pathname) return;

    const tl = gsap.timeline();

    // 🎬 Шаг 1: Анимация шторки Only.digital (закрываем экран)
    tl.to('.transition-overlay', {
        duration: 0.6,
        translateY: '0%',
        ease: 'power3.inOut',
        onComplete: async () => {
            
            // 🌐 Шаг 2: Пока экран закрыт, скачиваем контент в фоне
            const newPage = await fetchNewPage(url);
            
            if (newPage && newPage.container) {
                // Производим замену контента в DOM
                const currentContainer = document.querySelector('.page-container');
                currentContainer.replaceWith(newPage.container);
                
                // Обновляем мета-данные в браузере
                document.title = newPage.title;
                window.history.pushState(null, null, url);
                
                // Прокручиваем окно в самый верх к началу новой страницы
                window.scrollTo(0, 0);
                
                // Перезапускаем скрипты для нового контента
                const nextNamespace = newPage.container.getAttribute('data-namespace');
                reinitPageLogic(nextNamespace);
            }

            // 🚀 Шаг 3: Открываем экран (уводим шторку наверх)
            gsap.timeline()
                .to('.transition-overlay', {
                    duration: 0.6,
                    translateY: '-100%',
                    ease: 'power3.inOut'
                })
                .set('.transition-overlay', { translateY: '100%' }); // Сброс позиции в самый низ
        }
    });
}

// Глобальный перехватчик кликов на внутренние ссылки
document.addEventListener('click', (e) => {
    const targetLink = e.target.closest('a');
    
    // Проверяем, что ссылка ведет на этот же сайт (не внешняя на TG/VK/Behance)
    if (targetLink && targetLink.href.includes(window.location.origin)) {
        // Исключаем скачивание файлов (например .pdf pitch или .mp4)
        if (targetLink.getAttribute('href').match(/\.(pdf|mp4|webm|png|zip)$/i)) return;
        
        e.preventDefault();
        const targetUrl = targetLink.pathname; 
        performTransition(targetUrl);
    }
});

// Слушатель системных кнопок браузера «Назад» и «Вперед»
window.addEventListener('popstate', async () => {
    const savedPage = await fetchNewPage(window.location.pathname);
    if (savedPage && savedPage.container) {
        document.querySelector('.page-container').replaceWith(savedPage.container);
        document.title = savedPage.title;
        reinitPageLogic(savedPage.container.getAttribute('data-namespace'));
    }
});

// Первичный триггер при входе пользователя на сайт
document.addEventListener('DOMContentLoaded', () => {
    const initialNamespace = document.querySelector('.page-container').getAttribute('data-namespace');
    reinitPageLogic(initialNamespace);
});
