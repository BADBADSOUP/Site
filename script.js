/* ==========================================================================
   MAIN SCRIPT
   Barba.js + GSAP + Lenis
   ========================================================================== */


/* ==========================================================================
   GSAP
   ========================================================================== */

gsap.registerPlugin(ScrollTrigger);



/* ==========================================================================
   LENIS SMOOTH SCROLL
   ========================================================================== */


let lenis;


function initLenis() {

    if (lenis) {
        lenis.destroy();
    }


    lenis = new Lenis({

        duration: 1.1,

        smoothWheel: true,

        wheelMultiplier: 1,

        touchMultiplier: 1.5,

    });



    function raf(time) {

        lenis.raf(time);

        requestAnimationFrame(raf);

    }


    requestAnimationFrame(raf);

}



initLenis();





/* ==========================================================================
   PRELOADER
   ========================================================================== */


function hidePreloader() {


    const preloader = document.querySelector(".preloader");


    if (!preloader) return;


    gsap.to(preloader, {

        opacity:0,

        duration:.8,

        ease:"power2.out",

        onComplete(){

            preloader.classList.add("is-hidden");

            document.body.classList.remove("preloading");

        }

    });


}



window.addEventListener("load",()=>{

    hidePreloader();

});





/* ==========================================================================
   TEXT REVEAL
   ========================================================================== */


function animateText(){


    const lines = document.querySelectorAll(".line-child");


    if (!lines.length) return;



    gsap.set(lines,{

        y:"100%"

    });



    gsap.to(lines,{

        y:"0%",

        duration:1.2,

        stagger:.08,

        ease:"power4.out",

        delay:.2

    });


}





/* ==========================================================================
   PAGE CONTENT ANIMATION (generic, runs on any page)
   ========================================================================== */


function pageAnimation(){


    gsap.from(".animate-this",{

        y:40,

        opacity:0,

        duration:1,

        stagger:.12,

        ease:"power3.out"

    });


    animateText();


}





/* ==========================================================================
   TRUCO CASE ANIMATIONS
   Guarded so they safely no-op on pages without these elements,
   and re-run correctly after a Barba SPA transition (not just on
   a hard page load, where a page-local <script> wouldn't re-fire).
   ========================================================================== */


function heroAnimationTruco(){

    const label = document.querySelector(".hero-label");
    const title = document.querySelector(".hero-title");

    if (!label && !title) return;

    const tl = gsap.timeline();

    if (label){

        tl.from(label,{

            y:40,

            opacity:0,

            duration:0.8,

            ease:"power3.out"

        });

    }

    if (title){

        tl.from(title,{

            y:80,

            opacity:0,

            duration:1,

            ease:"power4.out"

        }, label ? "-=0.4" : 0);

    }

}



function scrollRevealTruco(){

    const sections = document.querySelectorAll(

        ".prototype-section, .mobile-first-section, .ui-section, .about-project"

    );

    if (!sections.length) return;

    sections.forEach(section => {

        gsap.from(section,{

            y:80,

            opacity:0,

            duration:1,

            ease:"power3.out",

            scrollTrigger:{

                trigger:section,

                start:"top 80%",

                once:true

            }

        });

    });


    const images = document.querySelectorAll(

        ".prototype-section__frame img, .ui-section__img, .phones-block img"

    );

    if (!images.length) return;

    images.forEach(img=>{

        gsap.from(img,{

            scale:1.05,

            opacity:0,

            duration:1.2,

            ease:"power3.out",

            scrollTrigger:{

                trigger:img,

                start:"top 85%",

                once:true

            }

        });

    });

}



function initTrucoAnimations(){

    // Kill any ScrollTriggers left over from the previous page
    // before creating new ones on the freshly-swapped container.
    ScrollTrigger.getAll().forEach(st => st.kill());

    heroAnimationTruco();
    scrollRevealTruco();

    ScrollTrigger.refresh();

}





/* ==========================================================================
   BARBA PAGE TRANSITION (the "шторка")
   Animates .transition-wrapper, which is what actually exists in the HTML.
   Starts hidden off-screen right (translateX(100%)).
   ========================================================================== */


function pageTransitionOut(){

    // Slide the curtain IN to fully cover the screen.
    return gsap.to(".transition-wrapper",{

        x:"0%",

        duration:.8,

        ease:"power4.inOut"

    });

}



function pageTransitionIn(){

    // Slide the curtain back OUT to reveal the new page, then
    // reset it off-screen to the right for the next transition.
    const tl = gsap.timeline();

    tl.to(".transition-wrapper",{

        x:"-100%",

        duration:.8,

        ease:"power4.inOut",

        delay:.1

    });

    tl.set(".transition-wrapper",{

        x:"100%"

    });

    return tl;

}





barba.init({

    sync:true,

    transitions:[{

        async leave(){

            await pageTransitionOut();

        },

        async enter(data){

            window.scrollTo(0,0);

            initLenis();

            pageAnimation();
            initTrucoAnimations();

            await pageTransitionIn();

        },

        once(){

            pageAnimation();
            initTrucoAnimations();

        }

    }]

});







/* ==========================================================================
   CUSTOM CURSOR
   ========================================================================== */


function initCursor(){


    const cursor=document.querySelector(".custom-cursor");


    if(!cursor) return;



    if(window.innerWidth < 768) return;




    document.addEventListener("mousemove",(e)=>{


        gsap.to(cursor,{


            x:e.clientX,

            y:e.clientY,


            duration:.35,


            ease:"power3.out"



        });



    });





    document.querySelectorAll(".project-card").forEach(card=>{


        card.addEventListener("mouseenter",()=>{


            cursor.classList.add("active");



        });



        card.addEventListener("mouseleave",()=>{


            cursor.classList.remove("active");



        });



    });



}



initCursor();







/* ==========================================================================
   SPLINE CLEANUP
   ========================================================================== */


document.addEventListener("DOMContentLoaded",()=>{


    const spline=document.querySelector("spline-viewer");


    if(!spline) return;



    spline.addEventListener("load",()=>{


        const logo=spline.shadowRoot?.querySelector("#logo");


        if(logo){

            logo.style.display="none";

        }



    });



});
