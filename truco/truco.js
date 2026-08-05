// truco/truco.js
function initTrucoPage() {
    console.log("Специфичные анимации и плееры для страницы Truco запущены!");
    
    // Пример автоплея видео после загрузки страницы роутером
    const video = document.querySelector('video');
    if (video) {
        video.play().catch(error => console.log("Автоплей ожидает взаимодействия"));
    }
}
