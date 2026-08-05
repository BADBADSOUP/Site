function pageTransition() {
    const tl = gsap.timeline();
    tl.to(".loading-screen", {
        duration: 0.8,
        x: "0%",
        ease: "power4.inOut"
    });
    return tl;
}

function pageReveal() {
    const tl = gsap.timeline();
    tl.to(".loading-screen", {
        duration: 0.8,
        x: "100%",
        ease: "power4.inOut"
    });
    return tl;
}

function contentAnimation(container) {
    const els = container.querySelectorAll(".animate-this");
    gsap.from(els, {
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power3.out"
    });
}

barba.init({
    transitions: [{
        name: "page-transition",

        leave(data) {
            return pageTransition();
        },

        enter(data) {
            window.scrollTo(0, 0);
            return pageReveal().then(() => {
                contentAnimation(data.next.container);
            });
        },

        once(data) {
            contentAnimation(data.next.container);
        }
    }]
});