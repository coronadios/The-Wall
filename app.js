let wall;


const connectionDot =
    document.getElementById(
        "connectionDot"
    );

const connectionText =
    document.getElementById(
        "connectionText"
    );

const loading =
    document.getElementById(
        "loading"
    );


async function start() {

    try {

        /*
         * Authenticate anonymously.
         */

        await initializeAuth();


        /*
         * Create renderer.
         */

        const canvas =
            document.getElementById(
                "wallCanvas"
            );

        const container =
            document.getElementById(
                "wallContainer"
            );


        wall =
            new Wall(
                canvas,
                container
            );


        buildPalette(
            wall
        );


        /*
         * Load existing pixels.
         */

        const pixels =
            await loadPixels();


        wall.setPixels(
            pixels
        );


        updatePixelCount(
            wall.pixels.size
        );


        /*
         * Realtime.
         */

        subscribeToPixels(
            payload => {

                if (
                    payload.eventType ===
                    "INSERT"
                ) {

                    wall.updatePixel(
                        payload.new
                    );

                }


                if (
                    payload.eventType ===
                    "UPDATE"
                ) {

                    wall.updatePixel(
                        payload.new
                    );

                }


                if (
                    payload.eventType ===
                    "DELETE"
                ) {

                    wall.deletePixel(
                        payload.old
                    );

                }


                updatePixelCount(
                    wall.pixels.size
                );

            }
        );


        /*
         * Pixel placement.
         */

        wall.onPixelClick =
            async (
                x,
                y
            ) => {

                try {

                    const pixel =
                        await placePixel(
                            x,
                            y,
                            wall.selectedColor
                        );


                    wall.updatePixel(
                        pixel
                    );


                    updatePixelCount(
                        wall.pixels.size
                    );


                    showPixel(
                        x,
                        y,
                        wall.selectedColor
                    );

                }

                catch (error) {

                    console.error(
                        error
                    );

                    alert(
                        "Could not place pixel."
                    );

                }

            };


        /*
         * Pixel erasing.
         */

        wall.onPixelErase =
            async (
                x,
                y
            ) => {

                try {

                    await erasePixel(
                        x,
                        y
                    );


                    wall.deletePixel({
                        x,
                        y
                    });


                    updatePixelCount(
                        wall.pixels.size
                    );


                    hidePixel();

                }

                catch (error) {

                    console.error(
                        error
                    );

                    alert(
                        "Could not erase pixel. Check your Supabase DELETE policy."
                    );

                }

            };


        /*
         * Controls.
         */

        document
            .getElementById(
                "zoomIn"
            )
            .addEventListener(
                "click",
                () => {

                    const rect =
                        container.getBoundingClientRect();

                    wall.zoomAt(
                        1.25,
                        rect.width / 2,
                        rect.height / 2
                    );

                }
            );


        document
            .getElementById(
                "zoomOut"
            )
            .addEventListener(
                "click",
                () => {

                    const rect =
                        container.getBoundingClientRect();

                    wall.zoomAt(
                        1 / 1.25,
                        rect.width / 2,
                        rect.height / 2
                    );

                }
            );


        document
            .getElementById(
                "resetView"
            )
            .addEventListener(
                "click",
                () => {

                    wall.resetView();

                }
            );


        document
            .getElementById(
                "closePixel"
            )
            .addEventListener(
                "click",
                () => {

                    hidePixel();

                }
            );


        /*
         * Connected.
         */

        connectionDot.classList.add(
            "connected"
        );

        connectionText.textContent =
            "Live";


        loading.classList.add(
            "hidden"
        );

    }

    catch (error) {

        console.error(
            error
        );


        connectionText.textContent =
            "Offline";


        connectionDot.classList.add(
            "offline"
        );


        loading.innerHTML = `
            <strong>Unable to enter The Wall.</strong>
            <span>Check your Supabase configuration.</span>
        `;

    }

}


start();
