document.addEventListener("DOMContentLoaded", function() {
    gsap.registerPlugin(ScrollTrigger);

    // Sticky Title that remains overlayed
    ScrollTrigger.create({
        trigger: "#flag",
        start: "top top",
        pin: ".title-wrapper",
        pinSpacing: false,
    });
});
