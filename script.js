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
    if (lenis) {
        lenis.destroy();
        gsap.ticker.remove(lenisRaf);
    }

    lenis = new Lenis({
        duration:        1.2,
        easing:          t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel:     true,
        wheelMultiplier: 1,
    });

    gsap.ticker.add(lenisRaf);
    gsap.ticker.lagSmoothing(0);

    // Синхронизируем ScrollTrigger с Lenis
    lenis.on("scroll", ScrollTrigger.update);
}

function lenisRaf(time) {
    lenis.raf(time * 1000);
}

initLenis();


/* ==========================================================================
   ANIMATION SETTINGS — все настройки анимаций здесь
   ========================================================================== */

const ANIM = {

    // Шторка перехода между страницами
    curtain: {
        duration:   0.55,   // длительность въезда/выезда шторки (сек)
        ease:       "power3.inOut",
    },

    // Задержка запуска анимаций после открытия шторки (мс)
    afterCurtain: 0,

    // Заголовки h1, h2, h3, .hero-label — анимация по словам
    headings: {
        hero: {
            duration:   2,      // длительность анимации одного слова
            stagger:    0.08,   // задержка между словами
            delay:      0.1,    // начальная задержка
            ease:       "expo.out",
        },
        section: {
            duration:   2,
            stagger:    0.015,
            ease:       "expo.out",
            scrollStart: "top 88%", // точка запуска при скролле
        },
    },

    // Hero description — анимация по строкам
    description: {
        duration:   2,
        stagger:    0.08,
        gap:        0.3,   // задержка после h1 перед description (сек)
        ease:       "expo.out",
    },

};


/* ==========================================================================
   STYLES LOADER
   ========================================================================== */

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
   SPLIT TEXT ANIMATION
   Каждый заголовок разбивается на визуальные строки.
   Каждая строка оборачивается в .line-wrapper (overflow:hidden) > .line-inner.
   .line-inner въезжает снизу вверх.
   ========================================================================== */

function splitLines(container) {
    const els = container.querySelectorAll("h1, h2, h3, .hero-label");

    els.forEach(el => {
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

        const html = el.dataset.original;
        // Разбиваем на части: слова, пробелы и <br>
        const parts = html.split(/(<br\s*\/?>|\s+)/gi);

        // Каждое слово оборачиваем в .line-wrapper > .line-inner
        el.innerHTML = parts
            .map(part => {
                if (/^<br/i.test(part)) return part; // <br> оставляем как есть
                if (/^\s+$/.test(part)) return part; // пробелы тоже
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

    let heroTotalDuration = 0;

    groups.forEach((lines, heading) => {
        const isHero = heading.matches("h1, .hero-label");
        const cfg = isHero ? ANIM.headings.hero : ANIM.headings.section;

        if (isHero) {
            heroTotalDuration = cfg.duration + cfg.stagger * (lines.length - 1);
        }

        gsap.fromTo(lines,
            { y: "110%" },
            {
                y: "0%",
                duration: cfg.duration,
                stagger:  cfg.stagger,
                ease:     cfg.ease,
                delay:    isHero ? cfg.delay : 0,
                scrollTrigger: isHero ? null : {
                    trigger: heading,
                    start:   ANIM.headings.section.scrollStart,
                    once:    true
                }
            }
        );
    });

    // Анимация hero-description по строкам — после h1
    initDescriptionAnimation(container, heroTotalDuration);

    // Анимация filter-section
    initFilterSectionAnimation(container);
}

function initDescriptionAnimation(container, afterDelay) {
    const desc = container.querySelector(".hero-description--animated");
    if (!desc) return;

    // Сохраняем оригинальный текст
    if (!desc.dataset.original) {
        desc.dataset.original = desc.textContent;
    }

    // Сбрасываем если уже был split
    desc.style.opacity = "0";
    desc.innerHTML = desc.dataset.original;

    // Измеряем строки через span-обёртки
    const words = desc.textContent.split(/\s+/).filter(Boolean);
    desc.innerHTML = words
        .map(w => `<span class="word-measure" style="display:inline">${w} </span>`)
        .join("");

    // Группируем по строкам
    const spans = Array.from(desc.querySelectorAll(".word-measure"));
    const lineMap = new Map();

    spans.forEach(span => {
        const top = Math.round(span.getBoundingClientRect().top);
        if (!lineMap.has(top)) lineMap.set(top, []);
        lineMap.get(top).push(span.textContent.trim());
    });

    const lines = Array.from(lineMap.values());

    // Строим HTML — каждая строка в .line-wrapper > .line-inner
    desc.innerHTML = lines
        .map(line =>
            `<span class="desc-line-wrapper"><span class="desc-line-inner">${line.join(" ")}</span></span>`
        )
        .join(" ");

    // Показываем контейнер
    desc.style.opacity = "1";

    // Анимируем строки после завершения h1
    // gap: 0 — description стартует вместе с h1
    // gap: > 0 — description стартует через gap секунд после h1
    const delay = ANIM.headings.hero.delay + ANIM.description.gap;
    gsap.fromTo(
        desc.querySelectorAll(".desc-line-inner"),
        { y: "110%", opacity: 0 },
        {
            y:        "0%",
            opacity:  1,
            duration: ANIM.description.duration,
            stagger:  ANIM.description.stagger,
            ease:     ANIM.description.ease,
            delay
        }
    );
}


/* ==========================================================================
   BARBA HOOKS
   ========================================================================== */

barba.hooks.before(() => {
    // Останавливаем скролл на время перехода
    if (lenis) lenis.stop();

    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    // Отключаем наблюдатель за темами навбара
    destroyNavigationTheme();

    // Скрываем navbar — предотвращает видимость во время перехода
    const navbar = document.querySelector(".navbar");
    if (navbar) {
        navbar.classList.add("navbar--hidden");
        navbar.classList.add("navbar--transparent");
    }

    // Скрываем navbar слова до того как анимация пройдёт —
    // предотвращает видимость уже-анимированных слов во время перехода
    const navbarInners = document.querySelectorAll(".navbar .line-inner");
    if (navbarInners.length) {
        gsap.set(navbarInners, { y: "110%", opacity: 0 });
    }

    const el = document.querySelector(".loading-screen");
    if (!el) return;
    gsap.killTweensOf(el);
    gsap.fromTo(el,
        { x: "100%" },
        { x: "0%", duration: ANIM.curtain.duration, ease: ANIM.curtain.ease }
    );
});

barba.hooks.afterLeave(async (data) => {
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.width = "";

    data.next.container.style.visibility = "hidden";
    await loadPageStyles(data.next.namespace);
    window.scrollTo(0, 0);
});

barba.hooks.after((data) => {
    data.next.container.style.visibility = "visible";

    // Сбрасываем поверхность navbar в прозрачное состояние для новой страницы
    const navbar = document.querySelector(".navbar");
    if (navbar) {
        navbar.classList.remove("navbar--hidden");
        navbar.classList.add("navbar--transparent");
    }

    // Перезапускаем Lenis для новой страницы
    initLenis();

    const el = document.querySelector(".loading-screen");
    if (!el) return;
    gsap.killTweensOf(el);
    gsap.set(el, { x: "0%" });
    gsap.to(el, {
        x: "-100%",
        duration: ANIM.curtain.duration,
        ease: ANIM.curtain.ease,
        onComplete: () => {
            gsap.set(el, { x: "100%" });
            setTimeout(() => {
                initHeadingAnimations(data.next.container);
                initNavbarWordAnimation();
                initNavigationTheme();
            }, ANIM.afterCurtain);
        }
    });
});


/* ==========================================================================
   BARBA INIT
   ========================================================================== */

barba.init({
    transitions: [{
        async leave() {
            await new Promise(resolve => setTimeout(resolve, ANIM.curtain.duration * 1000));
        },
        once(data) {
            if (data.next.namespace === "truco") loadedStyles.add("truco");
            data.next.container.style.visibility = "visible";
            setTimeout(() => initHeadingAnimations(data.next.container), ANIM.afterCurtain);
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
    PORTFOLIO FILTER
    ========================================================================== */


function initPortfolioFilter() {

    const filterSection = document.querySelector(".filter-section");

    if (!filterSection) return;



    const buttons = filterSection.querySelectorAll(".filter-btn");

    const cards = document.querySelectorAll(".project-card");



    buttons.forEach(btn => {

        btn.addEventListener("click", () => {

            const filter = btn.dataset.filter;



            buttons.forEach(b => b.classList.remove("active"));

            btn.classList.add("active");



            cards.forEach(card => {

                const category = card.dataset.category;

                const shouldShow = filter === "all" || category === filter;



                if (shouldShow) {

                    card.style.display = "";

                    card.style.opacity = "0";

                    card.style.transform = "translateY(20px)";

                    gsap.to(card, {

                        opacity: 1,

                        y: 0,

                        duration: 0.4,

                        ease: "power3.out",

                        clearProps: "transform"

                    });

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



initPortfolioFilter();


/* ==========================================================================
    WORD SPLIT & REVEAL — navbar, filter-section
    Reuses the existing .line-wrapper > .line-inner pattern and ANIM settings.
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


function initNavbarWordAnimation() {

    const navbar = document.querySelector(".navbar");
    if (!navbar) return;

    const brandName  = navbar.querySelector(".navbar__brand-name");
    const navLinks   = navbar.querySelectorAll(".navbar__link");

    if (brandName && !brandName.dataset.splitWords) splitWords(brandName);
    navLinks.forEach(link => {
        if (!link.dataset.splitWords) splitWords(link);
    });

    const inners = navbar.querySelectorAll(".line-inner");
    if (!inners.length) return;

    gsap.set(inners, { y: "110%", opacity: 0 });

    gsap.to(inners, {
        y: "0%",
        opacity: 1,
        duration: ANIM.headings.hero.duration,
        stagger: 0.03,
        ease: ANIM.headings.hero.ease,
        delay: ANIM.headings.hero.delay
    });

}


function initFilterSectionAnimation(container) {

    const section = container.querySelector(".filter-section");
    if (!section) return;

    const buttons = section.querySelectorAll(".filter-btn");
    buttons.forEach(splitWords);

    // Скрываем кнопки до анимации
    gsap.set(buttons, { opacity: 0 });

    // Анимируем каждую кнопку по очереди
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: section,
            start: ANIM.headings.section.scrollStart,
            once: true
        },
        delay: 0.7
    });

    buttons.forEach((btn, i) => {
        const inners = btn.querySelectorAll(".line-inner");

        tl.to(btn, {
            opacity: 1,
            duration: 0.5,
            ease: "power2.out"
        }, i * 0.05);

        if (inners.length) {
            gsap.set(inners, { y: "110%", opacity: 0 });
            tl.to(inners, {
                y: "0%",
                opacity: 1,
                duration: ANIM.headings.section.duration,
                stagger: 0.01,
                ease: ANIM.headings.section.ease
            }, i * 0.05);
        }
    });

}



/* ==========================================================================
    NAVBAR SCROLL HIDE
    Hide on scroll down, show on scroll up.
    Plus: transparent → frosted glass surface transition.
    ========================================================================== */

function initNavbarScrollHide() {

    const navbar = document.querySelector(".navbar");

    if (!navbar) return;

    let lastScrollY = window.scrollY;

    let ticking = false;

    const threshold = 80;

    const surfaceThreshold = 20;

    let showTimeout = null;

    const showDelay = 200; // ms delay before showing navbar on scroll up

    // Initial state: transparent surface, no scroll yet
    navbar.classList.add("navbar--transparent");

    function updateNavbar() {

        const currentScrollY = window.scrollY;

        const scrollDelta = currentScrollY - lastScrollY;



        // Surface: transparent when at top, frosted when scrolled > 20px
        if (currentScrollY > surfaceThreshold) {

            navbar.classList.remove("navbar--transparent");

        } else {

            navbar.classList.add("navbar--transparent");

        }


        if (currentScrollY > threshold) {

            if (scrollDelta > 0) {

                navbar.classList.add("navbar--hidden");

                if (showTimeout) {

                    clearTimeout(showTimeout);

                    showTimeout = null;

                }

            } else {

                if (!showTimeout) {

                    showTimeout = setTimeout(() => {

                        navbar.classList.remove("navbar--hidden");

                        showTimeout = null;

                    }, showDelay);

                }

            }

        } else {

            navbar.classList.remove("navbar--hidden");

            if (showTimeout) {

                clearTimeout(showTimeout);

                showTimeout = null;

            }

        }



        lastScrollY = currentScrollY;
        ticking = false;

    }



    window.addEventListener("scroll", () => {

        if (!ticking) {

            requestAnimationFrame(updateNavbar);

            ticking = true;

        }

    });

}

initNavbarScrollHide();


/* ==========================================================================
    NAVIGATION THEME (Intersection Observer)
    Switches body.nav-light / body.nav-dark based on which section
    is currently overlapping the fixed navbar.
    ========================================================================== */


let navObserver = null;

const NAV_THEME_OPTIONS = {
    root: null,
    rootMargin: "-80px 0px -90% 0px",
    threshold: 0
};


function updateNavTheme(theme) {

    if (!theme) {

        document.body.classList.remove("nav-light", "nav-dark");
        document.body.classList.add("nav-light");
        return;

    }

    document.body.classList.remove("nav-light", "nav-dark");
    document.body.classList.add(`nav-${theme}`);

}


function initNavigationTheme() {

    if (!navObserver) {

        navObserver = new IntersectionObserver((entries) => {

            let activeTheme = null;

            entries.forEach(entry => {

                if (entry.isIntersecting) {

                    const theme = entry.target.dataset.navTheme;
                    if (theme) activeTheme = theme;

                }

            });

            // Если никакая секция не активна — используем светлую тему по умолчанию
            if (!activeTheme) {

                const sections = document.querySelectorAll("[data-nav-theme]");
                if (sections.length) {
                    activeTheme = sections[0].dataset.navTheme;
                } else {
                    activeTheme = "light";
                }

            }

            updateNavTheme(activeTheme);

        }, NAV_THEME_OPTIONS);

    }

    const sections = document.querySelectorAll("[data-nav-theme]");
    sections.forEach(section => navObserver.observe(section));

}


function destroyNavigationTheme() {

    if (navObserver) {

        navObserver.disconnect();
        navObserver = null;

    }

    document.body.classList.remove("nav-light", "nav-dark");
    document.body.classList.add("nav-light");

}


/* ==========================================================================
    SPLINE CLEANUP
    ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {

    initNavbarWordAnimation();
    initNavigationTheme();

    const spline = document.querySelector("spline-viewer");
    if (!spline) return;
    spline.addEventListener("load", () => {
        const logo = spline.shadowRoot?.querySelector("#logo");
        if (logo) logo.style.display = "none";
    });
});
