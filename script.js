/* ==========================================================================
   BARBA HOOKS & INIT (ТОЧНЫЕ ОРИГИНАЛЬНЫЕ ТАЙМИНГИ ШТОРКИ)
   ========================================================================== */

function isHomeUrl(url) {
    if (!url) return false;
    try {
        const href = typeof url === "string" ? url : url.href;
        const path = new URL(href, window.location.origin).pathname;
        return path === "/" || /\/index\.html?$/.test(path);
    } catch (e) {
        return false;
    }
}

// 1. ПЕРЕД ПЕРЕХОДОМ: Шторка выезжает снизу вверх и ЗАКРЫВАЕТ экран
barba.hooks.before((data) => {
    const cursor = document.getElementById("main-cursor");
    const menuTrigger = document.querySelector("#trigger");

    if (lenis) lenis.stop();

    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    if (menuTrigger && menuTrigger.getAttribute("aria-expanded") === "true") {
        const menu = document.querySelector("#menu");
        if (menu) gsap.set(menu, { opacity: 0, pointerEvents: "none" });
        menuTrigger.setAttribute("aria-expanded", "false");
    }

    const menu = document.querySelector("#menu");
    const logo = document.querySelector(".site-logo");
    if (menu) gsap.set(menu, { opacity: 0 });
    if (logo) gsap.set(logo, { opacity: 0 });

    if (!isHomeUrl(data.next.url)) {
        delete document.body.dataset.homeEntranceDone;
    }

    destroyContainerScrollTriggers(data.current ? data.current.container : data.next.container);

    if (cursor) {
        cursor.classList.remove("active");
        document.documentElement.classList.remove("cursor-hidden");
        cursor.style.display = "none";
    }

    if (scrollbar) {
        scrollbar.classList.remove("is-scrolling");
        scrollbar.style.opacity = "0";
    }

    // Въезд шторки снизу (100% -> 0%)
    const dark = document.querySelector(".dark-curtain");
    if (dark) {
        gsap.killTweensOf(dark);
        gsap.fromTo(dark,
            { y: "100%" },
            { y: "0%", duration: ANIM.curtain.duration, ease: ANIM.curtain.ease }
        );
    }
});

barba.hooks.afterLeave(async (data) => {
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.width = "";
    document.body.style.overflow = "";

    data.next.container.style.visibility = "hidden";
    await loadPageStyles(data.next.container.dataset.barbaNamespace || data.next.namespace);
    window.scrollTo(0, 0);
});

// 2. ПОСЛЕ СМЕНЫ СТРАНИЦЫ: Шторка УЕЗЖАЕТ ВВЕРХ (0% -> -100%)
barba.hooks.after((data) => {
    data.next.container.style.visibility = "visible";

    const cursor = document.getElementById("main-cursor");
    if (cursor) {
        const isHome = (data.next.container.dataset.barbaNamespace || data.next.namespace) === "home";
        if (isHome) {
            cursor.classList.remove("active");
            document.documentElement.classList.remove("cursor-hidden");
            initCursor();
        } else {
            cursor.style.display = "none";
            cursor.classList.remove("active");
            cursor._xTo = null;
            cursor._yTo = null;
            document.documentElement.classList.remove("cursor-hidden");
            document.removeEventListener("mousemove", onCursorMouseMove);
            document.removeEventListener("mouseover", onCursorMouseOver);
            document.removeEventListener("mouseout", onCursorMouseOut);
        }
    }

    const finalize = () => {
        resetLenisScroll();
        ScrollTrigger.refresh();

        if (scrollbar) scrollbar.style.opacity = "";
        if (scrollbarThumb) scrollbarThumb.style.opacity = "";
        updateScrollbar();

        menuState = "closed";
        const menu = document.querySelector("#menu");
        const menuTrigger = document.querySelector("#trigger");
        const logo = document.querySelector(".site-logo");
        if (menu && menuTrigger) {
            if (typeof menu._reset === "function") menu._reset();
            gsap.set(menu, { opacity: 0 });
            gsap.to(menu, { opacity: 1, duration: 0.5, ease: "expo.out", delay: 0.1 });
            if (logo) gsap.to(logo, { opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.1 });
        }

        // Шторка ушла — плавно показываем первую карточку
        const firstCard = document.querySelector(".project-item--first");
        if (firstCard && typeof firstCard._playReveal === "function") {
            firstCard._playReveal();
        }
    };

    // Запускаем расчёт DOM и текстов
    initPage(data.next.container);

    // Подъём шторки вверх
    const dark = document.querySelector(".dark-curtain");
    if (dark) {
        gsap.killTweensOf(dark);
        gsap.to(dark, {
            y: "-100%",
            duration: ANIM.curtain.duration,
            ease: ANIM.curtain.ease,
            onComplete: () => {
                gsap.set(dark, { y: "100%" }); // сброс в исходную для следующего перехода
                setTimeout(finalize, ANIM.afterCurtain);
            }
        });
    } else {
        setTimeout(finalize, ANIM.afterCurtain);
    }
});

// 3. BARBA INIT С ВОЗВРАЩЁННЫМИ PROMISE В LEAVE
barba.init({
    transitions: [
        {
            name: "home-to-internal",
            from: { namespace: ["home"] },
            once(data) {
                initialPageLoaded = true;
                const nextNS = data.next.container.dataset.barbaNamespace || data.next.namespace;
                if (nextNS === "truco") loadedStyles.add("truco");
                if (nextNS === "foresight") loadedStyles.add("foresight");
                if (nextNS === "pg3d") loadedStyles.add("pg3d");
                data.next.container.style.visibility = "visible";

                const dark = document.querySelector(".dark-curtain");
                if (dark) {
                    gsap.set(dark, { y: "0%" });

                    // Задержка перед стартовым открытием — ровно 0.4 сек, как было в оригинале
                    gsap.delayedCall(0.4, () => {
                        initPage(data.next.container);

                        gsap.to(dark, {
                            y: "-100%",
                            duration: ANIM.curtain.duration,
                            ease: ANIM.curtain.ease,
                            onComplete: () => {
                                gsap.set(dark, { y: "100%" });
                                setTimeout(() => {
                                    resetLenisScroll();
                                    ScrollTrigger.refresh();
                                    updateScrollbar();
                                    initCursor();
                                    const menu = document.querySelector("#menu");
                                    const logo = document.querySelector(".site-logo");
                                    if (menu && typeof menu._reset === "function") menu._reset();
                                    if (menu) gsap.to(menu, { opacity: 1, duration: 0.5, ease: "expo.out", delay: 0.1 });
                                    if (logo) gsap.to(logo, { opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.1 });

                                    // ЗАПУСК ПЕРВОЙ КАРТОЧКИ СТРОГО ПОСЛЕ ОТКРЫТИЯ
                                    const firstCard = document.querySelector(".project-item--first");
                                    if (firstCard && typeof firstCard._playReveal === "function") {
                                        firstCard._playReveal();
                                    }
                                }, ANIM.afterCurtain);
                            }
                        });
                    });
                } else {
                    initPage(data.next.container);
                }
            },
            leave(data) {
                // Блокируем смену контейнера ровно на время заезда шторки
                return new Promise(resolve => {
                    setTimeout(resolve, ANIM.curtain.duration * 1000);
                });
            }
        },
        {
            name: "default",
            once(data) {
                initialPageLoaded = true;
                data.next.container.style.visibility = "visible";

                const dark = document.querySelector(".dark-curtain");
                if (dark) {
                    gsap.set(dark, { y: "0%" });

                    gsap.delayedCall(0.4, () => {
                        initPage(data.next.container);

                        gsap.to(dark, {
                            y: "-100%",
                            duration: ANIM.curtain.duration,
                            ease: ANIM.curtain.ease,
                            onComplete: () => {
                                gsap.set(dark, { y: "100%" });
                                setTimeout(() => {
                                    resetLenisScroll();
                                    ScrollTrigger.refresh();
                                    updateScrollbar();
                                    initCursor();
                                    const menu = document.querySelector("#menu");
                                    const logo = document.querySelector(".site-logo");
                                    if (menu && typeof menu._reset === "function") menu._reset();
                                    if (menu) gsap.to(menu, { opacity: 1, duration: 0.5, ease: "expo.out", delay: 0.1 });
                                    if (logo) gsap.to(logo, { opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.1 });

                                    const firstCard = document.querySelector(".project-item--first");
                                    if (firstCard && typeof firstCard._playReveal === "function") {
                                        firstCard._playReveal();
                                    }
                                }, ANIM.afterCurtain);
                            }
                        });
                    });
                } else {
                    initPage(data.next.container);
                }
            },
            leave(data) {
                return new Promise(resolve => {
                    setTimeout(resolve, ANIM.curtain.duration * 1000);
                });
            }
        }
    ]
});
