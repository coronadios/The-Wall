(() => {

    const splash =
        document.getElementById("splash");

    const art =
        document.getElementById("splashArt");

    if (!splash || !art) {
        return;
    }


    /*
     * Create 8 × 8 pixel artwork.
     */

    const columns = 8;
    const rows = 8;
    const total = columns * rows;


    for (let i = 0; i < total; i++) {

        const pixel =
            document.createElement("div");

        pixel.className =
            "splash-pixel";


        /*
         * Pixel-by-pixel reveal.
         */

        pixel.style.animationDelay =
            `${i * 0.025}s`;


        art.appendChild(pixel);

    }


    /*
     * Start title animation after
     * the wall artwork has appeared.
     */

    const titleDelay =
        (total * 25) + 350;


    setTimeout(() => {

        splash.classList.add(
            "ready"
        );

    }, titleDelay);


    /*
     * Automatically dismiss the splash.
     *
     * It intentionally does NOT depend on
     * Supabase or app.js.
     */

    setTimeout(() => {

        splash.classList.add(
            "done"
        );


        /*
         * Remove it completely after
         * the fade animation.
         */

        setTimeout(() => {

            splash.remove();

        }, 700);

    }, 3000);


})();
