(function () {

    const splash =
        document.getElementById(
            "splash"
        );


    const art =
        document.getElementById(
            "splashArt"
        );


    /*
     * 8 × 8 mini wall
     */

    const size =
        8;


    const total =
        size * size;


    /*
     * Build pixels
     */

    for (
        let i = 0;
        i < total;
        i++
    ) {

        const pixel =
            document.createElement(
                "div"
            );


        pixel.className =
            "splash-pixel";


        /*
         * Tiny deterministic
         * delay for each pixel.
         */

        pixel.style.animationDelay =
            `${i * 0.028}s`;


        art.appendChild(
            pixel
        );

    }


    /*
     * Let the artwork
     * finish drawing.
     */

    const artworkDuration =
        total * 28 +
        180;


    setTimeout(
        () => {

            splash.classList.add(
                "ready"
            );

        },
        artworkDuration
    );


    /*
     * App can tell us when
     * Supabase + Wall are ready.
     */

    let appReady =
        false;


    let animationReady =
        false;


    window.finishWallSplash =
        function () {

            appReady =
                true;


            tryFinish();

        };


    setTimeout(
        () => {

            animationReady =
                true;


            tryFinish();

        },
        artworkDuration + 650
    );


    function tryFinish() {

        /*
         * Don't reveal the app until
         * both the intro and app are ready.
         */

        if (
            !appReady ||
            !animationReady
        ) {

            return;

        }


        setTimeout(
            () => {

                splash.classList.add(
                    "done"
                );

            },
            500
        );

    }

})();
