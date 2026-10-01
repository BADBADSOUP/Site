/* ==========================================================================
   MAIN SCRIPT  —  Barba.js + GSAP
   ========================================================================== */

gsap.registerPlugin(ScrollTrigger);

if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
}


/* ==========================================================================
   LENIS SMOOTH SCROLL
   Интеграция через gsap.ticker — единый RAF для Lenis и ScrollTrigger.
   ========================================================================== */

let lenis;

function initLenis() {
    // Инициализация Lenis один раз — переиспользуется между страницами
    if (lenis) return;

    lenis = new Lenis({
        duration:        0.8,
        easing:          t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel:     true,
        wheelMultiplier: 1,
    });

    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(lenisRaf);
    gsap.ticker.lagSmoothing(0);
}

// Сброс скролла на существующем инстансе Lenis (без пересоздания)
function resetLenisScroll() {
    if (lenis) {
        lenis.stop();
        lenis.scrollTo(0, { immediate: true });
        lenis.start();
    }
}

// ПРАВИЛЬНЫЙ ТИКЕР: С обязательной проверкой if(lenis), чтобы страница не ломалась
function lenisRaf(time) {
    if (lenis) {
        lenis.raf(time * 1000);
    }
}

// Запуск
initLenis();


// ==========================================================================
// CUSTOM SCROLLBAR — работает через Lenis scroll events
// ==========================================================================

let scrollbar = null;
let scrollbarThumb = null;
let scrollbarHideTimer = null;
let isScrollbarDragging = false;
let dragStartY = 0;
let thumbStartTop = 0;
let maxThumbTop = 0;

function updateScrollbar() {
    if (!scrollbar || !scrollbarThumb || isScrollbarDragging) return;

    const scrollTop = lenis ? lenis.scroll : window.scrollY;
    const viewportHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    const trackHeight = viewportHeight - 24;
    const thumbHeight = Math.max(40, trackHeight * (viewportHeight / documentHeight));
    const maxScroll = documentHeight - viewportHeight;

    if (maxScroll > 0) {
        maxThumbTop = trackHeight - thumbHeight;
        const thumbTop = (scrollTop / maxScroll) * maxThumbTop;
        scrollbarThumb.style.height = thumbHeight + "px";
        scrollbarThumb.style.transform = `translateY(${thumbTop}px)`;
    } else {
        scrollbarThumb.style.height = trackHeight + "px";
        scrollbarThumb.style.transform = "translateY(0)";
    }

    if (!scrollbar.classList.contains("is-scrolling")) {
        scrollbar.classList.add("is-scrolling");
    }
    clearTimeout(scrollbarHideTimer);
    scrollbarHideTimer = setTimeout(() => {
        scrollbar.classList.remove("is-scrolling");
    }, 800);
}

function initCustomScrollbar() {
    scrollbar = document.querySelector(".custom-scrollbar");
    if (!scrollbar) return;

    scrollbarThumb = scrollbar.querySelector(".custom-scrollbar-thumb");
    if (!scrollbarThumb) return;

    // Listen to Lenis scroll events (virtualized scroll position)
    if (lenis) {
        lenis.on("scroll", updateScrollbar);
    }
    // Fallback to native scroll for non-Lenis contexts
    window.addEventListener("scroll", updateScrollbar, { passive: true });
    window.addEventListener("resize", updateScrollbar);

    // Drag-to-scroll
    scrollbarThumb.addEventListener("mousedown", (e) => {
        isScrollbarDragging = true;
        dragStartY = e.clientY;
        thumbStartTop = parseFloat(scrollbarThumb.style.transform?.match(/[\d.-]+/)?.[0] || 0);
        document.body.style.userSelect = "none";
    });

    const onMouseMove = (e) => {
        if (!isScrollbarDragging) return;
        const deltaY = e.clientY - dragStartY;
        const viewportHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const maxScroll = documentHeight - viewportHeight;
        if (maxScroll <= 0) return;

        const trackHeight = viewportHeight - 24;
        const thumbHeight = Math.max(40, trackHeight * (viewportHeight / documentHeight));
        const currentMaxThumbTop = trackHeight - thumbHeight;

        let newTop = thumbStartTop + deltaY;
        newTop = Math.max(0, Math.min(currentMaxThumbTop, newTop));

        // Update thumb position visually while dragging
        scrollbarThumb.style.transform = `translateY(${newTop}px)`;

        const scrollRatio = newTop / currentMaxThumbTop;
        const targetScroll = scrollRatio * maxScroll;

        if (lenis) {
            lenis.scrollTo(targetScroll, { immediate: true, disableLerp: true });
        } else {
            window.scrollTo(0, targetScroll);
        }
    };

    const onMouseUp = () => {
        if (!isScrollbarDragging) return;
        isScrollbarDragging = false;
        document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);

    // Initial position update
    updateScrollbar();
}



/* ==========================================================================
   ANIMATION SETTINGS — все настройки анимаций здесь
   ========================================================================== */

const ANIM = {

    // Шторка перехода между страницами
    curtain: {
        duration:   1,   // длительность въезда/выезда шторки (сек)
        ease:       "power4.inOut",
    },

    // Задержка запуска анимаций после открытия шторки (мс)
    afterCurtain: 5,

    // Заголовки — анимация по словам
    // Никита Копытов
    headings: {
        h1: {
            duration:   0.85,
            stagger:    0.03,
            delay:      0.6,
            ease:       "expo.out",
        },
        h2: {
            duration:   0.8,
            stagger:    0.025,
            ease:       "power2.out",
            scrollStart: "top 88%",
        },
        h3: {
            duration:   0.7,
            stagger:    0.02,
            ease:       "power3.out",
            scrollStart: "top 85%",
        },
        label: {
            duration:   1.0,
            stagger:    0.04,
            delay:      0.4,
            ease:       "expo.out",
        },
        section: {
            duration:   2,
            stagger:    0.015,
            ease:       "expo.out",
            scrollStart: "top 88%",
        },
    },

    // Hero description — анимация по строкам
    description: {
        duration:   2,
        stagger:    0.08,
        gap:        0.3,   // задержка после h1 перед description (сек)
        ease:       "power3.out",
    },

    // Hero image reveal — for .hero_image blocks
    heroImage: {
        duration:   0.9,
        delay:      0.5,
        ease:       "power4.out",
        scrollStart: "top 82%",
    },

    // Custom reveal for .reveal-custom elements
    custom: {
        duration:   0.4,
        stagger:    0.1,
        delay:      0.02,
        ease:       "power3.out",
        scrollStart: "top 88%",
    },

    // UIUX дизайнер с 15+
    intro: {
        duration:   1.4,
        stagger:    0.06,
        delay:      0.7,   // небольшая задержка после начала перехода
        ease:       "expo.out",
    },

    // Portfolio card animations
    portfolio: {
        firstDelay: 1,
        duration: 2,
        ease: "power4.out",
    },

};


/* ==========================================================================
   STYLES LOADER
   ========================================================================== */

const loadedStyles = new Set();
let initialPageLoaded = false;
let pageInitDone = false;

function loadPageStyles(namespace) {
    return new Promise(resolve => {
        if (namespace === "truco" && !loadedStyles.has("truco")) {
            const link = document.createElement("link");
            link.rel  = "stylesheet";
            link.href = "/trucotest/trucotest.css";
            link.onload  = () => { loadedStyles.add("truco"); resolve(); };
            link.onerror = () => resolve();
            document.head.appendChild(link);
        } else if (namespace === "foresight" && !loadedStyles.has("foresight")) {
            const link = document.createElement("link");
            link.rel  = "stylesheet";
            link.href = "/foresight/foresight.css";
            link.onload  = () => { loadedStyles.add("foresight"); resolve(); };
            link.onerror = () => resolve();
            document.head.appendChild(link);
        } else if (namespace === "pg3d" && !loadedStyles.has("pg3d")) {
            const link = document.createElement("link");
            link.rel  = "stylesheet";
            link.href = "/pg3d/pg3d.css";
            link.onload  = () => { loadedStyles.add("pg3d"); resolve(); };
            link.onerror = () => resolve();
            document.head.appendChild(link);
        } else {
            resolve();
        }
    });
}


/* ==========================================================================
   SPLIT TEXT ANIMATION
   Каждый заголовок разбивается на визуальные строки.
   Каждая строка оборачивается в .line-wrapper (overflow:hidden) > .line-inner.
   .line-inner въезжает снизу вверх.
   ========================================================================== */

function splitLines(container) {
    const els = container.querySelectorAll("h1, h2, h3, .hero-label");

    els.forEach(el => {
        // Skip project-name headings — no text animation
        if (el.classList.contains("project-name")) return;

        // Skip project-title headings — no text animation
        if (el.classList.contains("project-title")) return;

        // Skip hero-intro — handled by initTextReveal (line-by-line animation)
        if (el.classList.contains("hero-intro")) return;

        // Если уже был split — восстанавливаем оригинальный HTML
        if (el.dataset.split) {
            el.innerHTML = el.dataset.original || el.textContent;
            el.removeAttribute("data-split");
            el.style.opacity = "0";
        }

        // Сохраняем оригинальный HTML перед split
        if (!el.dataset.original) {
            el.dataset.original = el.innerHTML;
        }

        el.dataset.split = "true";
        el.style.opacity = "";  // Clear any inline opacity from restore step

        const html = el.dataset.original;
        // Разбиваем на части: слова, пробелы, <br> и HTML-теги (чтобы не ломать теги с атрибутами)
        const parts = html.split(/(<br\s*\/?>|<[^>]+>|\s+)/gi);

        // Каждое слово оборачываем в .line-wrapper > .line-inner
        el.innerHTML = parts
            .filter(part => part.length > 0)
            .map(part => {
                if (/^<br/i.test(part)) return part; // <br> оставляем как есть
                if (/^\s+$/.test(part)) return part; // пробелы тоже
                if (/^<[a-zA-Z]/.test(part)) return part; // HTML-теги оставляем как есть
                // Слово → обёртка
                return `<span class="line-wrapper"><span class="line-inner">${part}</span></span>`;
            })
            .join("");
    });
}

function initHeadingAnimations(container) {
    splitLines(container);

    const inners = container.querySelectorAll(".line-inner");
    if (!inners.length) return;

    // Группируем строки по родительскому заголовку
    const groups = new Map();
    inners.forEach(inner => {
        const heading = inner.closest("h1, h2, h3, .hero-label");
        if (!heading) return;
        if (!groups.has(heading)) groups.set(heading, []);
        groups.get(heading).push(inner);
    });

    groups.forEach((lines, heading) => {
        const tagName = heading.tagName.toLowerCase();
        const isSection = heading.matches("h2, h3");
        let cfg;

        if (tagName === "h1") {
            cfg = ANIM.headings.h1;
        } else if (tagName === "h2") {
            cfg = ANIM.headings.h2;
        } else if (tagName === "h3") {
            cfg = ANIM.headings.h3;
        } else if (heading.classList.contains("hero-label")) {
            cfg = ANIM.headings.label;
        } else {
            cfg = ANIM.headings.section;
        }

        const isImmediate = !isSection;

        gsap.fromTo(lines,
            { y: "110%" },
            {
                y: "0%",
                duration: cfg.duration,
                stagger:  cfg.stagger,
                ease:     cfg.ease,
                delay:    isImmediate ? (cfg.delay || 0) : 0,
                scrollTrigger: isImmediate ? null : {
                    trigger: heading,
                    start:   cfg.scrollStart || ANIM.headings.section.scrollStart,
                    once:    true
                }
            }
        );
    });

     // Анимация hero-description по строкам — после h1
    initDescriptionAnimation(container);

    // Анимация star-badge — появляется после фамилии
    initStarBadgeAnimation(container);
}

function initStarBadgeAnimation(container) {
    const badge = container.querySelector(".star-badge");
    if (!badge || badge.dataset.starBadgeInit) return;
    badge.dataset.starBadgeInit = "true";

    gsap.set(badge, { opacity: 0, scale: 0, rotate: 0 });
    gsap.to(badge, {
        opacity: 1,
        scale: 1,
        rotate: 0,
        duration: 0.8,
        delay: ANIM.headings.h1.delay + 0.4,
        ease: "expo.out"
    });
}

function initDescriptionAnimation(container) {
    const desc = container.querySelector(".hero-description--animated");
    if (!desc) return;

    // Сохраняем оригинальный текст
    if (!desc.dataset.original) {
        desc.dataset.original = desc.textContent;
    }

    // Сбрасываем если уже был split
    desc.style.opacity = "0";
    desc.innerHTML = desc.dataset.original;

    // Split into visual lines using the same logic as splitTextIntoLines
    splitTextIntoLines(desc);

    // Mark as having its own animation — initTextReveal should skip this element
    desc.dataset.revealOwnAnim = "true";

    // Показываем контейнер
    desc.style.opacity = "1";

    // Анимируем строки после завершения h1
    const delay = (ANIM.headings.h1.delay + ANIM.headings.h1.duration) + ANIM.description.gap;
    gsap.set(desc.querySelectorAll(".reveal-line-inner"), { yPercent: 110, opacity: 0 });
    gsap.to(desc.querySelectorAll(".reveal-line-inner"), {
        yPercent: 0,
        opacity: 1,
        duration: ANIM.description.duration,
        stagger:  ANIM.description.stagger,
        ease:     ANIM.description.ease,
        delay
    });
}


/* ==========================================================================
   PAGE INIT & SCROLLTRIGGER CLEANUP
   ========================================================================== */

function destroyContainerScrollTriggers(container) {
    if (!container) return;

    ScrollTrigger.getAll().forEach(trigger => {
        const el = trigger.trigger;
        if (el instanceof Element && container.contains(el)) {
            trigger.kill();
        }
    });
}



function initHomeEntrance() {
    const isHomePage = document.querySelector("[data-barba-namespace=\"home\"]");
    if (!isHomePage) return;
    if (document.body.dataset.homeEntranceDone) return;
    document.body.dataset.homeEntranceDone = "true";

    const logo = document.querySelector(".site-logo");
    const menuTrigger = document.querySelector("#trigger");
    const elements = [logo, menuTrigger].filter(Boolean);

    if (!elements.length) return;

    document.body.classList.add("home-entrance-hidden");

    elements.forEach(el => {
        gsap.set(el, { opacity: 0, y: -20 });
    });

    gsap.delayedCall(ANIM.afterCurtain / 1000 || 0, () => {
        document.body.classList.remove("home-entrance-hidden");
        gsap.fromTo(elements,
            { opacity: 0, y: 20 },
            {
                opacity: 1, y: 0, duration: 1, stagger: 0.1, ease: "expo.out",
                onComplete() {
                    if (logo) gsap.set(logo, { clearProps: "transform" });
                }
            }
        );
    });
}


function initProjectsFilter(container = document) {
    const filterSection = container.querySelector(".projects-filter-section");
    if (!filterSection || filterSection.dataset.projectsFilterInit) return;
    filterSection.dataset.projectsFilterInit = "true";

    const buttons = filterSection.querySelectorAll(".projects-filter-btn");
    const cards = container.querySelectorAll(".project-link, .project-item");

    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            const filter = btn.dataset.filter;
            buttons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            cards.forEach(card => {
                const category = card.dataset.category;
                const shouldShow = filter === "all" || category === filter;

                gsap.killTweensOf(card);

                if (shouldShow) {
                    card.style.display = "";
                    gsap.fromTo(card,
                        { opacity: 0, y: 20 },
                        { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }
                    );
                } else {
                    gsap.to(card, {
                        opacity: 0,
                        y: 20,
                        duration: 0.3,
                        ease: "power3.in",
                        onComplete: () => {
                            card.style.display = "none";
                        }
                    });
                }
            });
        });
    });
}


function initPage(container) {
    initHeadingAnimations(container);
    initVisualParallax(container);
    initTextReveal(container);
    initPortfolioCards(container);
    initProjectsFilter(container);
    initComparisonSliders(container);
    initComparisonSliderAnimation(container);
    initAutoplayVideos(container);
    initUserflowBelt(container);
    pageInitDone = true;
}

/* ==========================================================================
   USERFLOW BELT — бесшовная лента
   ========================================================================== */

function initUserflowBelt(container) {
    const track = container.querySelector(".userflow-track");
    if (!track) return;

    const firstImg = track.querySelector(".userflow-img");
    if (!firstImg) return;

    function setup() {
        const imgW = firstImg.offsetWidth;
        if (!imgW) return;

        while (track.children.length > 1) {
            track.removeChild(track.lastChild);
        }

        const needed = Math.ceil(window.innerWidth / imgW) + 2;
        for (let i = 0; i < needed; i++) {
            const clone = firstImg.cloneNode(true);
            clone.removeAttribute("id");
            clone.setAttribute("aria-hidden", "true");
            clone.alt = "";
            track.appendChild(clone);
        }

        track.style.setProperty("--userflow-shift", `-${imgW}px`);
        track.style.animation = `userflow-loop ${imgW / 80}s linear infinite`;
    }

    if (firstImg.complete && firstImg.naturalWidth) {
        setup();
    } else {
        firstImg.addEventListener("load", setup, { once: true });
    }

    window.addEventListener("resize", () => {
        clearTimeout(window._userflowResizeTimer);
        window._userflowResizeTimer = setTimeout(setup, 200);
    });
}

function initAutoplayVideos(container) {
    const videos = container.querySelectorAll("video[autoplay]");
    videos.forEach(video => {
        video.load();
        video.play().catch(() => {});
    });
}

/* ==========================================================================
   CONCEPT STICKY SCROLL
   ========================================================================== */

function initConceptScroll(container) {
    const wrapper = container.querySelector(".concept-scroll-wrapper");
    if (!wrapper) return;

    const section = wrapper.querySelector(".ui-section--concept");
    const showcase = wrapper.querySelector(".ui-section--concept .ui-section__showcase");
    const img = wrapper.querySelector(".ui-section__img--concept");
    if (!section || !showcase || !img) return;

    if (wrapper._conceptST) {
        wrapper._conceptST.kill();
        wrapper._conceptST = null;
    }

    function setup() {
        if (window.innerWidth <= 768) {
            wrapper.style.height = "";
            gsap.set(img, { clearProps: "y" });
            if (wrapper._conceptST) { wrapper._conceptST.kill(); wrapper._conceptST = null; }
            return;
        }

        const vh = window.innerHeight;
        const showcaseWidth = showcase.offsetWidth;
        const naturalW = img.naturalWidth;
        const naturalH = img.naturalHeight;

        if (!naturalW || !naturalH || !showcaseWidth) {
            requestAnimationFrame(setup);
            return;
        }

        const imgH = (showcaseWidth / naturalW) * naturalH;
        const scrollDistance = imgH - vh;
        if (scrollDistance <= 0) return;

        wrapper.style.height = (vh + scrollDistance) + "px";

        gsap.set(img, { y: 0 });

        if (wrapper._conceptST) { wrapper._conceptST.kill(); }

        wrapper._conceptST = ScrollTrigger.create({
            trigger: wrapper,
            start: "top top",
            end: "+=" + scrollDistance,
            pin: section,
            pinSpacing: false,
            scrub: true,
            anticipatePin: 1,
            onUpdate: self => {
                gsap.set(img, { y: -(scrollDistance * self.progress) });
            },
            onRefresh: self => {
                const sw = showcase.offsetWidth;
                const nw = img.naturalWidth;
                const nh = img.naturalHeight;
                if (!sw || !nw || !nh) return;
                const newImgH = (sw / nw) * nh;
                const newDist = newImgH - window.innerHeight;
                if (newDist > 0) {
                    wrapper.style.height = (window.innerHeight + newDist) + "px";
                    self.end = self.start + newDist;
                }
            },
            invalidateOnRefresh: true,
        });
    }

    function init() {
        requestAnimationFrame(() => requestAnimationFrame(setup));
    }

    if (img.complete && img.naturalWidth) {
        init();
    } else {
        img.addEventListener("load", init, { once: true });
    }

    wrapper._conceptInit = init;

    window._conceptResizeHandler && window.removeEventListener("resize", window._conceptResizeHandler);
    window._conceptResizeHandler = () => {
        clearTimeout(window._conceptResizeTimer);
        window._conceptResizeTimer = setTimeout(init, 200);
    };
    window.addEventListener("resize", window._conceptResizeHandler);
}


/* ==========================================================================
   BARBA HOOKS
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
        if (menu) {
            gsap.set(menu, { opacity: 0, pointerEvents: "none" });
        }
        if (menuTrigger) menuTrigger.setAttribute("aria-expanded", "false");
    }

    const menu = document.querySelector("#menu");
    const logo = document.querySelector(".site-logo");
    if (menu) gsap.set(menu, { opacity: 0 });
    if (logo) gsap.set(logo, { opacity: 0 });

    if (!isHomeUrl(data.next.url)) {
        delete document.body.dataset.homeEntranceDone;
    }

    destroyContainerScrollTriggers(data.current ? data.current.container : data.next.container);
    destroyVisualParallax();

     if (cursor) {
        cursor.classList.remove("active");
        document.documentElement.classList.remove("cursor-hidden");
        cursor.style.display = "none";
    }

    if (scrollbar) {
        scrollbar.classList.remove("is-scrolling");
        scrollbar.style.opacity = "0";
    }

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

        if (scrollbar) {
            scrollbar.style.opacity = "";
        }
        if (scrollbarThumb) {
            scrollbarThumb.style.opacity = "";
        }
        updateScrollbar();

        menuState = "closed";
        const menu = document.querySelector("#menu");
        const menuTrigger = document.querySelector("#trigger");
        const logo = document.querySelector(".site-logo");
        if (menu && menuTrigger) {
            if (typeof menu._reset === "function") {
                menu._reset();
            } else {
                gsap.set(menu, { pointerEvents: "auto", scale: window.innerWidth < 1900 ? 0.8 : 1 });
                menuTrigger.setAttribute("aria-expanded", "false");
                gsap.set(menu.querySelector("#surface"), { width: 208, height: 77 });
                gsap.set(menu.querySelector("#trigger"), { width: 208, height: 77 });
                gsap.set(menu.querySelector("#items"), { opacity: 0, pointerEvents: "none" });
            }
            gsap.set(menu, { opacity: 0 });

            gsap.to(menu, { opacity: 1, duration: 0.5, ease: "expo.out", delay: 0.1 });
            if (logo) gsap.to(logo, { opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.1 });
        }
    };

    initPage(data.next.container);

    const dark = document.querySelector(".dark-curtain");
    if (dark) {
        gsap.killTweensOf(dark);
        gsap.to(dark, {
            y: "-100%",
            duration: ANIM.curtain.duration,
            ease: ANIM.curtain.ease,
            onComplete: () => {
                gsap.set(dark, { y: "100%" });
                setTimeout(finalize, ANIM.afterCurtain);
            }
        });
    } else {
        setTimeout(finalize, ANIM.afterCurtain);
    }
});


/* ==========================================================================
   BARBA INIT
   ========================================================================== */

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
                                    const menuTrigger = document.querySelector("#trigger");
                                    const logo = document.querySelector(".site-logo");
                                    if (menu && menuTrigger) {
                                        if (typeof menu._reset === "function") menu._reset();
                                        gsap.set(menu, { opacity: 0 });
                                        gsap.to(menu, { opacity: 1, duration: 0.5, ease: "expo.out", delay: 0.1 });
                                        if (logo) gsap.to(logo, { opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.1 });
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
                                    const menuTrigger = document.querySelector("#trigger");
                                    const logo = document.querySelector(".site-logo");
                                    if (menu && menuTrigger) {
                                        if (typeof menu._reset === "function") menu._reset();
                                        gsap.set(menu, { opacity: 0 });
                                        gsap.to(menu, { opacity: 1, duration: 0.5, ease: "expo.out", delay: 0.1 });
                                        if (logo) gsap.to(logo, { opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.1 });
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


/* ==========================================================================
   CURSOR
   ========================================================================== */

function initCursor() {
    const cursor = document.getElementById("main-cursor");
    if (!cursor || window.innerWidth < 768) return;

    cursor.style.display = "";
    gsap.set(cursor, { xPercent: -50, yPercent: -50 });

    cursor._xTo = gsap.quickTo(cursor, "x", { duration: 0.6, ease: "power3" });
    cursor._yTo = gsap.quickTo(cursor, "y", { duration: 0.6, ease: "power3" });

    document.removeEventListener("mousemove", onCursorMouseMove);
    document.removeEventListener("mouseover", onCursorMouseOver);
    document.removeEventListener("mouseout", onCursorMouseOut);

    document.addEventListener("mousemove", onCursorMouseMove);
    document.addEventListener("mouseover", onCursorMouseOver);
    document.addEventListener("mouseout", onCursorMouseOut);
}

function onCursorMouseMove(e) {
    const cursor = document.getElementById("main-cursor");
    if (!cursor) return;
    if (cursor._xTo && cursor._yTo) {
        cursor._xTo(e.clientX);
        cursor._yTo(e.clientY);
    } else {
        gsap.set(cursor, { x: e.clientX, y: e.clientY });
    }
}

function onCursorMouseOver(e) {
    const img = e.target.closest(".project-image, .portfolio-img");
    if (img) {
        const cursor = document.getElementById("main-cursor");
        if (cursor) cursor.classList.add("active");
        document.documentElement.classList.add("cursor-hidden");
    }
}

function onCursorMouseOut(e) {
    const img = e.target.closest(".project-image, .portfolio-img");
    if (img && !img.contains(e.relatedTarget)) {
        const cursor = document.getElementById("main-cursor");
        if (cursor) cursor.classList.remove("active");
        document.documentElement.classList.remove("cursor-hidden");
    }
}

initCursor();

/* ==========================================================================
   WORD SPLIT & REVEAL
   ========================================================================== */

function splitWords(element) {
    if (element.dataset.splitWords) return;
    element.dataset.splitWords = "true";

    const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );

    const textNodes = [];
    let node;

    while (node = walker.nextNode()) {
        if (node.parentNode.tagName === "SPAN") continue;
        if (node.textContent.trim()) { textNodes.push(node); }
    }

    textNodes.forEach(textNode => {
        const words = textNode.textContent.split(/\s+/).filter(Boolean);
        const fragment = document.createDocumentFragment();

        words.forEach((word, i) => {
            const wrapper = document.createElement("span");
            wrapper.className = "line-wrapper";

            const inner = document.createElement("span");
            inner.className = "line-inner";
            inner.textContent = word;

            wrapper.appendChild(inner);
            fragment.appendChild(wrapper);

            if (i < words.length - 1) {
                fragment.appendChild(document.createTextNode(" "));
            }
        });

        textNode.parentNode.replaceChild(fragment, textNode);
    });
}


/* ==========================================================================
   TEXT REVEAL ANIMATION (line-by-line)
   ========================================================================== */

function splitTextIntoLines(el) {
    if (el.dataset.revealSplit) return;
    el.dataset.revealSplit = "true";

    if (el.querySelector("img, video, h1, h2, h3, h4, h5, h6, .project-image, .project-name, .project-desc, .project-tags")) {
        el.dataset.revealSimple = "true";
        return;
    }

    if ((el.tagName === "H1" || el.tagName === "H2" || el.tagName === "H3" ||
        el.classList.contains("hero-title") || el.classList.contains("hero-title-main") ||
        el.classList.contains("hero-label")) && !el.classList.contains("hero-intro")) {
        el.dataset.revealSkip = "true";
        return;
    }

    const original = el.innerHTML;
    el.dataset.revealOriginal = original;

    const clone = el.cloneNode(false);
    clone.style.visibility = "hidden";
    clone.style.position = "absolute";
    clone.style.pointerEvents = "none";
    clone.style.height = "auto";
    clone.style.width = el.offsetWidth + "px";
    clone.style.whiteSpace = "normal";
    clone.style.wordWrap = "break-word";
    clone.style.boxSizing = "border-box";

    const computed = window.getComputedStyle(el);
    clone.style.fontFamily = computed.fontFamily;
    clone.style.fontSize = computed.fontSize;
    clone.style.fontWeight = computed.fontWeight;
    clone.style.lineHeight = computed.lineHeight;
    clone.style.letterSpacing = computed.letterSpacing;
    clone.style.padding = computed.padding;
    clone.style.textAlign = computed.textAlign;
    clone.style.display = "block";

    clone.innerHTML = el.innerHTML;
    document.body.appendChild(clone);

    const text = el.textContent;
    const words = text.split(/\s+/).filter(Boolean);
    if (!words.length) {
        document.body.removeChild(clone);
        return;
    }

    clone.innerHTML = words
        .map(w => `<span class="word-measure" style="display:inline">${w} </span>`)
        .join("");

    clone.offsetHeight;

    const spans = Array.from(clone.querySelectorAll(".word-measure"));
    const lineMap = new Map();

    spans.forEach(span => {
        const top = Math.round(span.getBoundingClientRect().top);
        if (!lineMap.has(top)) lineMap.set(top, []);
        lineMap.get(top).push(span.textContent.trim());
    });

    document.body.removeChild(clone);

    const lines = Array.from(lineMap.values());

    el.innerHTML = lines
        .map(line =>
            `<span class="reveal-line-wrapper"><span class="reveal-line-inner">${line.join(" ")}</span></span>`
        )
        .join("");
}

function initTextReveal(container) {
    const els = container.querySelectorAll(".animate-this:not([data-reveal-init]):not(.project-item):not(.reveal-custom)");
    const allCustom = container.querySelectorAll(".reveal-custom");
    if (!els.length && !allCustom.length) return;

    els.forEach(el => {
        el.dataset.revealInit = "true";
        splitTextIntoLines(el);
        if (el.dataset.revealSimple || el.dataset.revealSkip || el.dataset.revealOwnAnim) return;
        if (el.querySelector(".reveal-line-inner")) {
            gsap.set(el, { opacity: 1, transform: "none" });
        }
    });

    const inners = container.querySelectorAll(".animate-this:not([data-reveal-own-anim]) .reveal-line-inner");
    if (inners.length) {
        gsap.set(inners, { yPercent: 110, opacity: 0 });
    }

    const simpleEls = container.querySelectorAll(".animate-this[data-reveal-simple]:not([data-anim-init])");
    simpleEls.forEach((el, i) => {
        el.dataset.animInit = "true";
        const isFirst = i === 0 && !pageInitDone;
        gsap.set(el, { opacity: 0, y: 60 });

        if (isFirst) {
            gsap.to(el, {
                y: 0,
                opacity: 1,
                duration: 1,
                delay: 1,
                ease: "sine.out"
            });
        } else {
            ScrollTrigger.create({
                trigger: el,
                start: "top 85%",
                onEnter: () => {
                    gsap.to(el, {
                        y: 0,
                        opacity: 1,
                        duration: 0.5,
                        delay: 0.05,
                        ease: "sine.out"
                    });
                },
                once: true
            });
        }
    });

    els.forEach(el => {
        if (el.dataset.revealSimple) return;
        if (el.dataset.revealSkip) return;
        if (el.dataset.revealOwnAnim) return;

        const lines = el.querySelectorAll(".reveal-line-inner");
        if (!lines.length) return;

        const isHeroIntro = el.classList.contains("hero-intro");

        if (isHeroIntro) {
            gsap.to(lines, {
                yPercent: 0,
                opacity: 1,
                delay:   ANIM.intro.delay,
                duration: ANIM.intro.duration,
                stagger: ANIM.intro.stagger,
                ease: ANIM.intro.ease,
                force3D: true
            });
        } else {
            ScrollTrigger.create({
                trigger: el,
                start: "top 85%",
                onEnter: () => {
                    gsap.to(lines, {
                        yPercent: 0,
                        opacity: 1,
                        delay:   0.07,
                        duration: ANIM.description.duration,
                        stagger: ANIM.description.stagger,
                        ease: ANIM.description.ease
                    });
                },
                once: true
            });
        }
    });

    const customEls = container.querySelectorAll(".reveal-custom:not([data-reveal-own-anim])");
    if (customEls.length) {
        customEls.forEach(el => {
            if (!el.dataset.revealInit) {
                el.dataset.revealInit = "true";
                splitTextIntoLines(el);
                if (el.querySelector(".reveal-line-inner")) {
                    gsap.set(el, { opacity: 1, transform: "none" });
                }
            }

            const lines = el.querySelectorAll(".reveal-line-inner");
            if (!lines.length) return;

            gsap.set(lines, { yPercent: 110, opacity: 0 });
            gsap.to(lines, {
                yPercent: 0,
                opacity: 1,
                delay:   ANIM.custom.delay,
                duration: ANIM.custom.duration,
                stagger: ANIM.custom.stagger,
                ease:    ANIM.custom.ease,
                scrollTrigger: {
                    trigger: el,
                    start:   ANIM.custom.scrollStart,
                    once:    true
                }
            });
        });
    }

    const heroImage = container.querySelector(".hero_image");
    if (heroImage && !heroImage.dataset.heroImageInit) {
        heroImage.dataset.heroImageInit = "true";
        const heroImg = heroImage.querySelector("img");
        if (heroImg) {
            gsap.set(heroImg, { opacity: 1, y: 500 });
            ScrollTrigger.create({
                trigger: heroImage,
                start: ANIM.heroImage.scrollStart,
                onEnter: () => {
                    gsap.to(heroImg, {
                        opacity: 1,
                        y: 0,
                        duration: ANIM.heroImage.duration,
                        delay: ANIM.heroImage.delay,
                        ease: ANIM.heroImage.ease
                    });
                },
                once: true
            });
        }
    }

    ScrollTrigger.refresh();
}


function initPortfolioCards(container) {
    const cards = container.querySelectorAll(".project-item.animate-this:not([data-portfolio-init])");
    if (!cards.length) return;

    const imagePromises = [];
    cards.forEach((card) => {
        const imgs = card.querySelectorAll("img");
        imgs.forEach((img) => {
            if (img.complete) {
                if (typeof img.decode === "function") {
                    imagePromises.push(img.decode().catch(() => {}));
                }
            } else {
                imagePromises.push(
                    new Promise((resolve) => {
                        img.addEventListener("load", resolve, { once: true });
                        img.addEventListener("error", resolve, { once: true });
                    })
                );
            }
        });
    });

    Promise.race([
        Promise.all(imagePromises),
        new Promise(resolve => setTimeout(resolve, 1500))
    ]).then(() => {
        cards.forEach((card) => {
            card.dataset.portfolioInit = "true";

            gsap.set(card, { opacity: 0, y: 30, scale: 0.96, force3D: true });

            const playReveal = () => {
                gsap.to(card, {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 1.4,
                    ease: "power4.out",
                    overwrite: "auto",
                    force3D: true
                });
            };

             if (card.classList.contains("project-item--first")) {
                 gsap.delayedCall(ANIM.portfolio.firstDelay, playReveal);
             } else {
                ScrollTrigger.create({
                    trigger: card,
                    start: "top 85%",
                    onEnter: playReveal,
                    once: true
                });
            }

            const imgWrapper = card.querySelector(".portfolio-image-wrapper");
            const video = card.querySelector(".portfolio-video");
            if (imgWrapper) {
                card.addEventListener("mouseenter", () => {
                    gsap.to(imgWrapper, {
                        scale: 1.02,
                        duration: 0.4,
                        ease: "cubic-bezier(0.25, 1, 0.5, 1)",
                        force3D: true
                    });
                    if (video) video.play().catch(() => {});
                });
                card.addEventListener("mouseleave", () => {
                    gsap.to(imgWrapper, {
                        scale: 1,
                        duration: 0.5,
                        ease: "cubic-bezier(0.25, 1, 0.5, 1)",
                        force3D: true
                    });
                    if (video) {
                        video.pause();
                        video.currentTime = 0;
                    }
                });
            }

        });

        ScrollTrigger.refresh();
    });
}




window.addEventListener("resize", () => {
    clearTimeout(window._resizeTimer);
    window._resizeTimer = setTimeout(() => {
        ScrollTrigger.refresh();
        if (typeof lenis !== "undefined" && lenis) lenis.update();

        const menu = document.querySelector("#menu");
        if (menu && menuState === "closed") {
            gsap.set(menu, { scale: window.innerWidth < 1900 ? 0.8 : 1 });
        }
    }, 250);
});


/* ==========================================================================
   VISUAL PARALLAX CONTROLLER (disabled)
   ========================================================================== */

function initVisualParallax(container) {}
function destroyVisualParallax() {}


/* ==========================================================================
   NAVIGATION MENU COMPONENT
   ========================================================================== */

let menuState = "closed";

function initNavMenu() {
    const menu = document.querySelector("#menu");
    if (!menu) return;
    if (menu.dataset.navMenuInit) return;
    menu.dataset.navMenuInit = "true";
    const surface = menu.querySelector("#surface");
    const trigger = menu.querySelector("#trigger");
    const label = menu.querySelector("#label");
    const circle = menu.querySelector("#circle");
    const burgerEls = menu.querySelectorAll(".burger");
    const circleTitle = menu.querySelector("#circleTitle");
    const itemsWrap = menu.querySelector("#items");
    const items = [...menu.querySelectorAll(".menu__item")];
    const indicator = menu.querySelector("#indicator");

    if (!surface || !trigger || !label || !circle || !circleTitle || !itemsWrap || !indicator) return;

    const burgerEl = burgerEls[0];

    let state = menuState;
    let menuTl = null;
    let leaveTimer = null;

    function clearLeaveTimer() {
        if (leaveTimer) {
            clearTimeout(leaveTimer);
            leaveTimer = null;
        }
    }

    function killMenuTl() {
        if (menuTl) {
            menuTl.kill();
            menuTl = null;
        }
    }

    const RED = "#F93E4E";
    const MENU_CLOSED = 208;
    const MENU_OPEN = 269;
    const CIRCLE_SIZE = 59;
    const ITEM_HEIGHT = 59;
    const ROW_GAP = 6;
    const ROW_HEIGHT = ITEM_HEIGHT + ROW_GAP;
    const CLOSED_CIRCLE_LEFT = MENU_CLOSED - 9 - CIRCLE_SIZE;
    const HOVER_CIRCLE_LEFT = (MENU_OPEN - CIRCLE_SIZE) / 2;
    const SPEED = 0.65;
    const EASE_SWIFT = "expo.out";
    const EASE_SWIFT_INOUT = "expo.inOut";
    const EASE_POP_SOFT = "back.out(1.1)";
    const EASE_PRESS = "power2.out";
    const EASE_RELEASE = "back.out(1.6)";
    const LABEL_ENTER_X = 34;
    const LABEL_HIDE_X_OPEN = -12;

    gsap.set(menu, { transformOrigin: "top right" });
    gsap.set(menu, { scale: window.innerWidth < 1900 ? 0.8 : 1 });
    gsap.set(circle, { left: CLOSED_CIRCLE_LEFT, x: 0, backgroundColor: RED });
    gsap.set(surface, { width: MENU_CLOSED, height: 77 });
    gsap.set(trigger, { width: MENU_CLOSED, height: 77 });
    gsap.set(label, { opacity: 1, x: 0, y: 0 });
    gsap.set(circleTitle, { opacity: 0, y: 11 });
    gsap.set(itemsWrap, { opacity: 0, pointerEvents: "none" });
    gsap.set(items.slice(1), { opacity: 0, y: 18 });
    gsap.set(indicator, { opacity: 0, y: 0, scaleY: 1 });

    menu._reset = function() {
        killMenuTl();
        clearLeaveTimer();
        state = "closed";
        menuState = "closed";
        gsap.set(circle, { left: CLOSED_CIRCLE_LEFT, x: 0, backgroundColor: RED, width: CIRCLE_SIZE, height: CIRCLE_SIZE, borderRadius: 30 });
        gsap.set(surface, { width: MENU_CLOSED, height: 77 });
        gsap.set(trigger, { width: MENU_CLOSED, height: 77 });
        gsap.set(label, { opacity: 1, x: 0, y: 0 });
        gsap.set(circleTitle, { opacity: 0, y: 11 });
        gsap.set(itemsWrap, { opacity: 0, pointerEvents: "none" });
        gsap.set(items.slice(1), { opacity: 0, y: 18 });
        gsap.set(indicator, { opacity: 0, y: 0, scaleY: 1 });
        gsap.set(burgerEl, { opacity: 1, scale: 1 });
        gsap.set(menu, { scale: window.innerWidth < 1900 ? 0.8 : 1 });
        trigger.setAttribute("aria-expanded", "false");
    };

    trigger.addEventListener("mousedown", () => {
        const baseScale = window.innerWidth < 1900 ? 0.8 : 1;
        gsap.to(menu, { scale: baseScale * 0.975, duration: 0.14 * SPEED, ease: EASE_PRESS });
    });
    ["mouseup", "mouseleave"].forEach(evt => {
        trigger.addEventListener(evt, () => {
            const baseScale = window.innerWidth < 1900 ? 0.8 : 1;
            gsap.to(menu, { scale: baseScale, duration: 0.4 * SPEED, ease: EASE_RELEASE });
        });
    });

    function hoverIn() {
        if (state !== "closed") return;
        state = "preview";
        clearLeaveTimer();
        killMenuTl();
        menuTl = gsap.timeline({ defaults: { ease: EASE_SWIFT_INOUT } })
            .to(surface, { width: 269, duration: 0.6 * SPEED }, 0)
            .to(trigger, { width: 269, duration: 0.6 * SPEED }, 0)
            .to(label, { opacity: 0, x: LABEL_HIDE_X_OPEN, y: 0, duration: 0.32 * SPEED }, 0)
            .to(circle, { left: HOVER_CIRCLE_LEFT, duration: 0.6 * SPEED, ease: EASE_POP_SOFT }, 0);
    }

    function hoverOut() {
        if (state !== "preview") return;
        state = "closed";
        killMenuTl();
        menuTl = gsap.timeline({ defaults: { ease: EASE_SWIFT_INOUT } })
            .to(circle, { left: CLOSED_CIRCLE_LEFT, duration: 0.5 * SPEED }, 0)
            .to(surface, { width: 208, duration: 0.55 * SPEED }, 0)
            .to(trigger, { width: 208, duration: 0.55 * SPEED }, 0)
            .to(label, { opacity: 1, x: 0, y: 0, duration: 0.32 * SPEED }, 0.12 * SPEED);
    }

    function openMenu() {
        if (state === "open" || state === "opening") return;
        state = "opening";
        trigger.setAttribute("aria-expanded", "true");
        clearLeaveTimer();
        killMenuTl();
        gsap.set(itemsWrap, { pointerEvents: "auto" });
        gsap.set(indicator, { opacity: 0, y: 0 });
        gsap.set(label, { opacity: 0, x: LABEL_HIDE_X_OPEN, y: 0 });
        menuTl = gsap.timeline({
            defaults: { ease: EASE_SWIFT_INOUT },
            onComplete() { state = "open"; menuState = "open"; menuTl = null; }
        });
        menuTl.to(surface, { width: 269, duration: 0.46 * SPEED }, 0)
            .to(trigger, { width: 269, duration: 0.46 * SPEED }, 0)
            .to(surface, { height: 344, duration: 0.55 * SPEED, ease: EASE_POP_SOFT }, 0.1 * SPEED)
            .to(trigger, { height: 344, duration: 0.55 * SPEED, ease: EASE_POP_SOFT }, 0.1 * SPEED)
            .to(circle, {
                left: 19, width: 230, height: 59, borderRadius: 30,
                duration: 0.55 * SPEED, ease: EASE_POP_SOFT
            }, 0.1 * SPEED)
            .to(burgerEl, { opacity: 0, scale: 0.4, duration: 0.18 * SPEED, ease: EASE_PRESS }, 0.22 * SPEED)
            .to(circleTitle, { opacity: 1, y: 0, duration: 0.34 * SPEED, ease: EASE_SWIFT }, 0.34 * SPEED)
            .to(itemsWrap, { opacity: 1, duration: 0.18 * SPEED }, 0.3 * SPEED)
            .to(items.slice(1), {
                opacity: 1, y: 0, duration: 0.45 * SPEED, stagger: 0.06 * SPEED, ease: EASE_SWIFT
            }, 0.32 * SPEED)
            .set(circle, { backgroundColor: "rgba(249, 62, 78, 0)" }, 0.54 * SPEED)
            .set(indicator, { opacity: 1 }, 0.54 * SPEED);
    }

    function highlightRow(rowIndex) {
        if (state !== "open") return;
        gsap.timeline()
            .to(indicator, { y: rowIndex * ROW_HEIGHT, duration: 0.34 * SPEED, ease: EASE_SWIFT }, 0)
            .to(indicator, { scaleY: 0.94, duration: 0.1 * SPEED, ease: EASE_PRESS }, 0)
            .to(indicator, { scaleY: 1, duration: 0.24 * SPEED, ease: EASE_POP_SOFT }, 0.1 * SPEED);
    }

    circle.addEventListener("mouseenter", () => highlightRow(0));
    items.slice(1).forEach((item, i) => {
        item.addEventListener("mouseenter", () => highlightRow(i + 1));
    });

    menu.addEventListener("mouseleave", () => {
        clearLeaveTimer();
        leaveTimer = setTimeout(() => {
            leaveTimer = null;
            if (state === "preview") hoverOut();
            if (state === "open") {
                highlightRow(0);
                closeMenu();
            }
        }, 120);
    });

    itemsWrap.addEventListener("mouseleave", (e) => {
        if (state !== "open") return;
        if (!circle.contains(e.relatedTarget)) highlightRow(0);
    });

    function closeMenu() {
        if (state === "closed" || state === "closing") return;
        state = "closing";
        trigger.setAttribute("aria-expanded", "false");
        clearLeaveTimer();
        killMenuTl();
        menuTl = gsap.timeline({
            defaults: { ease: EASE_SWIFT_INOUT },
            onComplete() {
                state = "closed";
                menuState = "closed";
                menuTl = null;
                gsap.set(items.slice(1), { opacity: 0, y: 18 });
                gsap.set(itemsWrap, { opacity: 0, pointerEvents: "none" });
                gsap.set(indicator, { opacity: 0, y: 0, scaleY: 1 });
                gsap.set(circle, { backgroundColor: RED });
                gsap.set(menu, { scale: window.innerWidth < 1900 ? 0.8 : 1 });
            }
        })
            .to(items.slice(1), {
                opacity: 0, y: 14, duration: 0.22 * SPEED, stagger: 0.03 * SPEED, ease: EASE_PRESS
            }, 0)
            .set(indicator, { opacity: 0 }, 0)
            .set(circle, { backgroundColor: RED }, 0)
            .to(circleTitle, { opacity: 0, y: 10, duration: 0.2 * SPEED, ease: EASE_PRESS }, 0.16 * SPEED)
            .to(circle, {
                left: HOVER_CIRCLE_LEFT, width: CIRCLE_SIZE, height: CIRCLE_SIZE, borderRadius: 30,
                duration: 0.44 * SPEED, ease: EASE_SWIFT_INOUT
            }, 0.2 * SPEED)
            .to(burgerEl, { opacity: 1, scale: 1, duration: 0.24 * SPEED, ease: EASE_POP_SOFT }, 0.36 * SPEED)
            .to(surface, { height: 77, duration: 0.46 * SPEED, ease: EASE_SWIFT_INOUT }, 0.16 * SPEED)
            .to(circle, { left: CLOSED_CIRCLE_LEFT, duration: 0.42 * SPEED, ease: EASE_SWIFT_INOUT }, 0.42 * SPEED)
            .to(surface, { width: MENU_CLOSED, duration: 0.42 * SPEED, ease: EASE_SWIFT_INOUT }, 0.42 * SPEED)
            .to(trigger, { width: MENU_CLOSED, height: 77, duration: 0.42 * SPEED, ease: EASE_SWIFT_INOUT }, 0.42 * SPEED)
            .set(label, { x: LABEL_ENTER_X, y: 0 }, 0.4 * SPEED)
            .to(label, {
                opacity: 1, x: 0, duration: 0.5 * SPEED, ease: EASE_SWIFT
            }, 0.44 * SPEED);
    }

    menu.addEventListener("mouseenter", () => {
        clearLeaveTimer();
        if (state === "closed") hoverIn();
    });

    trigger.addEventListener("click", (event) => {
        const clickedCircle = event.target.closest("#circle");

        if ((state === "open" || state === "closing") && clickedCircle) {
            const homeLink = itemsWrap.querySelector(".menu__item:first-child a");
            if (homeLink) {
                if (window.barba && barba.cache && typeof barba.cache.clear === "function") {
                    barba.cache.clear();
                }
                homeLink.click();
            }
            if (state === "open") closeMenu();
            return;
        }

        event.preventDefault();

        if (state === "closed" || state === "preview" || state === "closing") {
            openMenu();
        } else if (state === "open") {
            closeMenu();
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && state === "open") closeMenu();
    });

    items.slice(1).forEach(item => {
        const link = item.querySelector("a");
        if (link) {
            link.addEventListener("click", () => {
                if (window.barba && barba.cache && typeof barba.cache.clear === "function") {
                    barba.cache.clear();
                }
                if (state === "open") closeMenu();
            });
        }
    });

    const logo = document.querySelector(".site-logo");
    if (logo) {
        logo.addEventListener("click", () => {
            if (state === "open") closeMenu();
        });
    }
}

/* ==========================================================================
    SPLINE CLEANUP
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    initNavMenu();
    initCustomScrollbar();

    if (!initialPageLoaded) {
        const container = document.querySelector("[data-barba=\"container\"]") || document.body;
        initPage(container);
        ScrollTrigger.refresh();
    }

    const spline = document.querySelector("spline-viewer");
    if (!spline) return;
    spline.addEventListener("load", () => {
        const logo = spline.shadowRoot?.querySelector("#logo");
        if (logo) logo.style.display = "none";
    });
});

function initComparisonSliders(container) {
    const sliders = container.querySelectorAll("[data-comparison-slider]");
    if (!sliders.length) return;

    let activeSlider = null;

    const setPosition = (slider, clientX) => {
        const afterLayer = slider.querySelector(".comparison-slider__after");
        const handle = slider.querySelector("[data-comparison-handle]");
        if (!afterLayer || !handle) return;
        const rect = slider.getBoundingClientRect();
        let x = clientX - rect.left;
        x = Math.max(0, Math.min(x, rect.width));
        const pct = (x / rect.width) * 100;
        afterLayer.style.clipPath = `inset(0 0 0 ${pct}%)`;
        handle.style.left = `${pct}%`;
    };

    sliders.forEach(slider => {
        slider.addEventListener("mousedown", (e) => {
            activeSlider = slider;
            setPosition(slider, e.clientX);
        });
        slider.addEventListener("touchstart", (e) => {
            activeSlider = slider;
            setPosition(slider, e.touches[0].clientX);
        }, { passive: true });
    });

    if (!window._comparisonSlidersBound) {
        window._comparisonSlidersBound = true;
        window.addEventListener("mousemove", (e) => {
            if (activeSlider) setPosition(activeSlider, e.clientX);
        });
        window.addEventListener("mouseup", () => { activeSlider = null; });
        window.addEventListener("touchmove", (e) => {
            if (activeSlider) setPosition(activeSlider, e.touches[0].clientX);
        }, { passive: true });
        window.addEventListener("touchend", () => { activeSlider = null; });
    }
}

function initComparisonSliderAnimation(container) {
    const sliders = container.querySelectorAll("[data-comparison-slider]");

    sliders.forEach(slider => {
        const afterLayer = slider.querySelector(".comparison-slider__after");
        const handle = slider.querySelector("[data-comparison-handle]");

        if (!afterLayer || !handle) return;

        const state = { value: 35 };

        const setPosition = (pct) => {
            afterLayer.style.clipPath = `inset(0 0 0 ${pct}%)`;
            handle.style.left = `${pct}%`;
        };

        setPosition(35);

        ScrollTrigger.create({
            trigger: slider,
            start: "top 75%",
            once: true,
            onEnter: () => {
                gsap.timeline({ delay: 0.3 })
                .to(state, {
                    value: 50,
                    duration: 0.7,
                    ease: "power3.out",
                    onUpdate: () => setPosition(state.value)
                });
            }
        });
    });
}
