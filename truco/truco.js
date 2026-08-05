/**
 * ИНТЕРАКТИВНАЯ ЛОГИКА СТРАНИЦЫ КЕЙСА TRUCOREAL
 */
function initTrucoPage() {
    console.log("[Page Init] Скрипты кейса TrucoReal успешно запущены.");

    // 1. Анимация мягкого проявления текстовых блоков и картинок кейса
    if (typeof gsap !== 'undefined') {
        gsap.from('.hero-title, .about-project-grid, .reveal-image', {
            duration: 1,
            opacity: 0,
            y: 30,
            stagger: 0.2,
            ease: 'power3.out'
        });
    }

    // 2. Принудительный перезапуск и запуск видеофайлов (desc.webm и mob.webm)
    // В AJAX-системах браузер часто блокирует видео, этот код оживляет плееры
    const caseVideos = document.querySelectorAll('.video-showcase video');
    caseVideos.forEach(video => {
        // Сбрасываем видео на начало, включаем беззвучный режим и запускаем поток
        video.muted = true;
        video.currentTime = 0;
        
        const playPromise = video.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.warn("[Video] Автоплей видео заблокирован политикой браузера, ожидает клика.", error);
            });
        }
    });
}
