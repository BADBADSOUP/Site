/* ==========================================================
   TRUCO CASE ANIMATIONS
   GSAP
========================================================== */


gsap.registerPlugin(ScrollTrigger);



/* ==========================================================
   HERO INTRO
========================================================== */


function heroAnimation(){


    const tl = gsap.timeline();



    tl.from(".hero-label",{

        y:40,

        opacity:0,

        duration:0.8,

        ease:"power3.out"

    })



    .from(".hero-title",{

        y:80,

        opacity:0,

        duration:1,

        ease:"power4.out"

    },"-=0.4");



}



heroAnimation();





/* ==========================================================
   SCROLL REVEAL
========================================================== */


const sections = document.querySelectorAll(
    
    ".prototype-section, \
     .mobile-first-section, \
     .ui-section, \
     .about-project"

);



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





/* ==========================================================
   IMAGE REVEAL
========================================================== */


const images = document.querySelectorAll(

    ".prototype-section__frame img, \
     .ui-section__img, \
     .phones-block img"

);



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