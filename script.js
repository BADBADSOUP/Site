/**
 * ИНТЕРАКТИВНАЯ ЛОГИКА ГЛАВНОЙ СТРАНИЦЫ
 */
function initHomePage() {
    console.log("[Page Init] Скрипты главной страницы успешно запущены.");

    // 1. Пример анимации появления элементов (Эффект Only.digital)
    // Так как библиотека GSAP уже подключена в HTML, мы можем сразу её использовать
    if (typeof gsap !== 'undefined') {
        gsap.from('.animate-this', {
            duration: 0.8,
            opacity: 0,
            y: 40,
            stagger: 0.15,
            ease: 'power2.out',
            delay: 0.2
        });
    }

    // 2. Обработчик наведения или интерактива для карточек проектов
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            // Ваша логика при наведении (например, микромасштабирование)
            card.style.transform = 'scale(1.01)';
            card.style.transition = 'transform 0.3s ease';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'scale(1)';
        });
    });
}
