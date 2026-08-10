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
let initialPageLoaded = false;
let pageInitDone = false;

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
        // Skip project-name headings — no text animation
        if (el.classList.contains("project-name")) return;

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
        // Разбиваем на части: слова, пробелы и <br>
        const parts = html.split(/(<br\s*\/?>|\s+)/gi);

        // Каждое слово оборачиваем в .line-wrapper > .line-inner
        el.innerHTML = parts
            .filter(part => part.length > 0)
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

    groups.forEach((lines, heading) => {
        const isHero = heading.matches("h1, .hero-label");
        const cfg = isHero ? ANIM.headings.hero : ANIM.headings.section;

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
    initDescriptionAnimation(container);

    // Анимация filter-section
    initFilterSectionAnimation(container);
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
    const delay = ANIM.headings.hero.delay + ANIM.description.gap;
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

function initPage(container) {
    initHeadingAnimations(container);
    initNavbarWordAnimation();
    initNavigationTheme();
    initVisualParallax(container);
    initTextReveal(container);
    initPortfolioFilter(container);
    pageInitDone = true;
}


/* ==========================================================================
   BARBA HOOKS
   ========================================================================== */

barba.hooks.before((data) => {
    const navbar = document.querySelector(".navbar");

    if (lenis) lenis.stop();

    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    // Отключаем наблюдатель за темами навбара
    destroyNavigationTheme();

    destroyContainerScrollTriggers(data.current.container);
    destroyVisualParallax();

    // Скрываем navbar — предотвращает видимость во время перехода
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

    // Переподключаем navbar scroll listener к новому Lenis
    initNavbarScrollHide();

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
                initPage(data.next.container);
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
            initialPageLoaded = true;
            if (data.next.namespace === "truco") loadedStyles.add("truco");
            data.next.container.style.visibility = "visible";
            setTimeout(() => {
                initPage(data.next.container);
            }, ANIM.afterCurtain);
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
        gsap.set(cursor, { x: e.clientX, y: e.clientY });
    });

    document.addEventListener("mouseover", e => {
        const img = e.target.closest(".project-image");
        if (img) cursor.classList.add("active");
    });

    document.addEventListener("mouseout", e => {
        const img = e.target.closest(".project-image");
        if (img && !img.contains(e.relatedTarget)) {
            cursor.classList.remove("active");
        }
    });
}

initCursor();




/* ==========================================================================
    PORTFOLIO FILTER
    ========================================================================== */


function initPortfolioFilter(container = document) {

    const filterSection = container.querySelector(".filter-section");

    if (!filterSection || filterSection.dataset.filterInit) return;

    filterSection.dataset.filterInit = "true";

    const buttons = filterSection.querySelectorAll(".filter-btn");

    const cards = container.querySelectorAll(".project-card");

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


/* ==========================================================================
   TEXT REVEAL ANIMATION (line-by-line)
   Elements with .animate-this split into visual lines and revealed
   line-by-line via ScrollTrigger, similar to hero-description animation.
   ========================================================================== */

function splitTextIntoLines(el) {
    if (el.dataset.revealSplit) return;
    el.dataset.revealSplit = "true";

    // Skip elements with complex children (images, headings, other blocks)
    if (el.querySelector("img, video, h1, h2, h3, h4, h5, h6, .project-image, .project-name, .project-desc, .project-tags")) {
        el.dataset.revealSimple = "true";
        return;
    }

    // Skip elements already handled by heading animation
    if (el.tagName === "H1" || el.tagName === "H2" || el.tagName === "H3" ||
        el.classList.contains("hero-title") || el.classList.contains("hero-title-main") ||
        el.classList.contains("hero-label")) {
        el.dataset.revealSkip = "true";
        return;
    }

    const original = el.innerHTML;
    el.dataset.revealOriginal = original;

    // Create a temporary clone to measure line breaks without affecting layout
    const clone = el.cloneNode(false);
    clone.style.visibility = "hidden";
    clone.style.position = "absolute";
    clone.style.pointerEvents = "none";
    clone.style.height = "auto";
    clone.style.width = el.offsetWidth + "px";
    clone.style.whiteSpace = "normal";
    clone.style.wordWrap = "break-word";
    clone.style.boxSizing = "border-box";

    // Copy computed styles that affect text layout
    const computed = window.getComputedStyle(el);
    clone.style.fontFamily = computed.fontFamily;
    clone.style.fontSize = computed.fontSize;
    clone.style.fontWeight = computed.fontWeight;
    clone.style.lineHeight = computed.lineHeight;
    clone.style.letterSpacing = computed.letterSpacing;
    clone.style.padding = computed.padding;
    clone.style.paddingBox = computed.padding;
    clone.style.textAlign = computed.textAlign;
    clone.style.display = "block";

    // Preserve inner HTML structure for measurement
    clone.innerHTML = el.innerHTML;
    document.body.appendChild(clone);

    // Split text content into words while preserving whitespace
    const text = el.textContent;
    const words = text.split(/\s+/).filter(Boolean);
    if (!words.length) {
        document.body.removeChild(clone);
        return;
    }

    // Build measurement spans in the clone
    clone.innerHTML = words
        .map(w => `<span class="word-measure" style="display:inline">${w} </span>`)
        .join("");

    // Force reflow
    clone.offsetHeight;

    const spans = Array.from(clone.querySelectorAll(".word-measure"));
    const lineMap = new Map();

    spans.forEach(span => {
        const top = Math.round(span.getBoundingClientRect().top);
        if (!lineMap.has(top)) lineMap.set(top, []);
        lineMap.get(top).push(span.textContent.trim());
    });

    // Remove clone
    document.body.removeChild(clone);

    const lines = Array.from(lineMap.values());

    // Replace real element content with reveal-line-wrapper > reveal-line-inner
    el.innerHTML = lines
        .map(line =>
            `<span class="reveal-line-wrapper"><span class="reveal-line-inner">${line.join(" ")}</span></span>`
        )
        .join("");
}

function initTextReveal(container) {
    const els = container.querySelectorAll(".animate-this:not([data-reveal-init])");
    if (!els.length) return;

    els.forEach(el => {
        el.dataset.revealInit = "true";
        splitTextIntoLines(el);
        // Make the parent visible — CSS .animate-this sets opacity:0 on parent,
        // which hides the entire subtree regardless of child opacity.
        // Also clear the CSS transform so it doesn't offset the element.
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

         ScrollTrigger.create({
             trigger: el,
             start: "top 85%",
             onEnter: () => {
                 gsap.to(lines, {
                     yPercent: 0,
                     opacity: 1,
                     duration: ANIM.description.duration,
                     stagger: ANIM.description.stagger,
                     ease: ANIM.description.ease
                 });
             },
             once: true
         });
    });

    ScrollTrigger.refresh();
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

    let lastScrollY = window.scrollY || 0;

    const threshold = 80;

    const surfaceThreshold = 120;

    let showTimeout = null;

    const showDelay = 200;

    // Initial state: transparent surface, no scroll yet
    navbar.classList.add("navbar--transparent");

    function updateNavbar() {

        const currentScrollY = lenis ? lenis.scroll : (window.scrollY || 0);

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

    }





    if (lenis) {

        lenis.off("scroll", updateNavbar);

        lenis.on("scroll", updateNavbar);

    } else {

        window.removeEventListener("scroll", updateNavbar);

        window.addEventListener("scroll", updateNavbar);

    }

}

initNavbarScrollHide();


/* ==========================================================================
    NAVIGATION THEME (Scroll-based)
    Switches body.nav-light / body.nav-dark based on which section
    is currently overlapping the fixed navbar.
    ========================================================================== */


let navThemeSections = [];
let currentNavTheme = null;
let navThemeScrollHandler = null;


function updateNavTheme(theme) {

    if (!theme) {

        document.body.classList.remove("nav-light", "nav-dark");
        document.body.classList.add("nav-light");
        currentNavTheme = "light";
        return;

    }

    if (theme === currentNavTheme) return;

    document.body.classList.remove("nav-light", "nav-dark");
    document.body.classList.add(`nav-${theme}`);
    currentNavTheme = theme;

}


function detectNavTheme() {

    const scrollY = lenis ? lenis.scroll : (window.scrollY || 0);

    const navbarPos = scrollY + 86;

    let activeTheme = null;

    navThemeSections.forEach(section => {

        const rect = section.getBoundingClientRect();

        const sectionTop = scrollY + rect.top;

        if (sectionTop <= navbarPos) {

            activeTheme = section.dataset.navTheme;

        }

    });

    if (!activeTheme) {

        if (navThemeSections.length) {
            activeTheme = navThemeSections[0].dataset.navTheme;
        } else {
            activeTheme = "light";
        }

    }

    updateNavTheme(activeTheme);

}


function initNavigationTheme() {

    navThemeSections = Array.from(document.querySelectorAll("[data-nav-theme]"));

    if (navThemeSections.length === 0) return;

    detectNavTheme();

    navThemeScrollHandler = () => detectNavTheme();

    if (lenis) {
        lenis.off("scroll", navThemeScrollHandler);
        lenis.on("scroll", navThemeScrollHandler);
    }

}


function destroyNavigationTheme() {

    if (navThemeScrollHandler && lenis) {
        lenis.off("scroll", navThemeScrollHandler);
    }

    navThemeScrollHandler = null;
    navThemeSections = [];
    currentNavTheme = null;

    document.body.classList.remove("nav-light", "nav-dark");
    document.body.classList.add("nav-light");

}


/* ==========================================================================
    VISUAL PARALLAX CONTROLLER
    Parallax for images inside .visual-card on truco page.
    Each image moves independently using GSAP ScrollTrigger with scrub.
    ========================================================================== */


let visualParallaxTriggers = [];


function initVisualParallax(container) {

    if (typeof container === "undefined") return;

    const grid = container.querySelector(".visual-grid");
    if (!grid) return;

    const cards = grid.querySelectorAll(".visual-card");
    if (!cards.length) return;

    cards.forEach(card => {

        const img = card.querySelector("img");
        if (!img) return;

        // Set initial scale and position for parallax effect
        gsap.set(img, { transform: "translateZ(0)" });

        const tween = gsap.fromTo(img,
            { y: -15, x: -5 },
            {
                y: 15,
                x: 5,
                ease: "none",
                scrollTrigger: {
                    trigger: card,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: true
                }
            }
        );

        visualParallaxTriggers.push(tween.scrollTrigger);

    });

    ScrollTrigger.refresh();

}


function destroyVisualParallax() {

    visualParallaxTriggers.forEach(trigger => {
        if (trigger) trigger.kill();
    });
    visualParallaxTriggers = [];

    // Reset images — clear all GSAP inline styles, let CSS handle the rest
    const images = document.querySelectorAll(".visual-card img");
    gsap.set(images, { clear: "all" });

}


/* ==========================================================================
    SPLINE CLEANUP
    ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {

    // If Barba's `once` hook hasn't fired yet, initialize page animations.
    // If Barba's `once` has already fired (initialPageLoaded = true), it handles
    // initialization via its own setTimeout, so we skip to avoid double init.
    if (!initialPageLoaded) {
        const container = document.querySelector("[data-barba=\"container\"]") || document.body;
        initPage(container);
    }

    const spline = document.querySelector("spline-viewer");
    if (!spline) return;
    spline.addEventListener("load", () => {
        const logo = spline.shadowRoot?.querySelector("#logo");
        if (logo) logo.style.display = "none";
    });
});

