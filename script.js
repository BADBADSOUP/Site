/* ==========================================================================
   MAIN SCRIPT  —  Barba.js + GSAP
   ========================================================================== */

gsap.registerPlugin(ScrollTrigger);

// Отключаем автоматическое восстановление позиции скролла браузером.
// Иначе при нажатии "назад" браузер прокручивает страницу до старой позиции
// до того как Barba успевает запустить переход.
if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
}

const loadedStyles = new Set();

function loadPageStyles(namespace) {
    return new Promise(resolve => {
        if (namespace === "truco" && !loadedStyles.has("truco")) {
            const link = document.createElement("link");
            link.rel  = "stylesheet";
            link.href = "/truco/truco.css";
            link.onload  = () => { loadedStyles.add("truco"); resolve(); };
            link.onerror = () => resolve();
            document.head.appendChild(link);
        } else {
            resolve();
        }
    });
}

/* ==========================================================================
   BARBA
   Хуки в правильном порядке (sync: false):
   before → beforeLeave → leave → afterLeave → beforeEnter → enter → afterEnter → after

   Используем глобальные хуки barba.hooks чтобы точно управлять
   шторкой независимо от порядка transition-хуков.
   ========================================================================== */

// before: запускаем шторку сразу при клике + фиксируем позицию скролла
barba.hooks.before(() => {
    // Запоминаем текущую позицию и фиксируем body
    // чтобы браузер не прыгал при смене истории
    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    const el = document.querySelector(".loading-screen");
    if (!el) return;
    gsap.killTweensOf(el);
    gsap.fromTo(el,
        { x: "100%" },
        { x: "0%", duration: 0.55, ease: "power3.inOut" }
    );
});

// afterLeave: leave завершён, next container уже в DOM
barba.hooks.afterLeave(async (data) => {
    // Снимаем фиксацию body
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.width = "";

    data.next.container.style.visibility = "hidden";
    await loadPageStyles(data.next.namespace);
    window.scrollTo(0, 0);
});

// after: всё завершено — показываем контейнер и открываем шторку влево
barba.hooks.after((data) => {
    data.next.container.style.visibility = "visible";
    const el = document.querySelector(".loading-screen");
    if (!el) return;
    gsap.killTweensOf(el);
    gsap.set(el, { x: "0%" });
    gsap.to(el, {
        x: "-100%",
        duration: 0.55,
        ease: "power3.inOut",
        onComplete: () => {
            gsap.set(el, { x: "100%" });
        }
    });
});

barba.init({

    transitions: [{

        // Пустые leave/enter — анимация управляется глобальными хуками.
        // Нужны чтобы Barba не делал мгновенный переход.
        async leave() {
            await new Promise(resolve => setTimeout(resolve, 600));
        },

        once(data) {
            if (data.next.namespace === "truco") loadedStyles.add("truco");
            data.next.container.style.visibility = "visible";
        }

    }]

});


/* ==========================================================================
   CURSOR
   ========================================================================== */

function initCursor() {
    const cursor = document.querySelector(".custom-cursor");
    if (!cursor || window.innerWidth < 768) return;

    document.addEventListener("mousemove", e => {
        gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: .35, ease: "power3.out" });
    });

    document.addEventListener("mouseenter", e => {
        if (e.target.closest(".project-card")) cursor.classList.add("active");
    }, true);

    document.addEventListener("mouseleave", e => {
        if (e.target.closest(".project-card")) cursor.classList.remove("active");
    }, true);
}

initCursor();


/* ==========================================================================
   SPLINE CLEANUP
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    const spline = document.querySelector("spline-viewer");
    if (!spline) return;
    spline.addEventListener("load", () => {
        const logo = spline.shadowRoot?.querySelector("#logo");
        if (logo) logo.style.display = "none";
    });
});
