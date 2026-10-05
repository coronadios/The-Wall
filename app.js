let wall;


const loading =
    document.getElementById(
        "loading"
    );


async function start() {

    try {

        await initializeAuth();


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


        const pixels =
            await loadPixels();


        wall.setPixels(
            pixels
        );


        updatePixelCount(
            wall.pixels.size
        );


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
         * Paint
         */

        wall.onPixelClick =
            async points => {

                try {

                    const pixelsToPlace =
                        points.map(
                            point => ({
                                x:
                                    point.x,

                                y:
                                    point.y,

                                color:
                                    wall.selectedColor
                            })
                        );


                    const placed =
                        await placePixels(
                            pixelsToPlace
                        );


                    placed.forEach(
                        pixel => {

                            wall.updatePixel(
                                pixel
                            );

                        }
                    );


                    updatePixelCount(
                        wall.pixels.size
                    );


                    const center =
                        points[
                            Math.floor(
                                points.length / 2
                            )
                        ];


                    if (center) {

                        showPixel(
                            center.x,
                            center.y,
                            wall.selectedColor
                        );

                    }

                }

                catch (error) {

                    console.error(
                        error
                    );

                    alert(
                        "Could not place pixels."
                    );

                }

            };


        /*
         * Eraser
         */

        wall.onPixelErase =
            async points => {

                try {

                    await erasePixels(
                        points
                    );


                    points.forEach(
                        point => {

                            wall.deletePixel(
                                point
                            );

                        }
                    );


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
                        "Could not erase pixels. Check your Supabase DELETE policy."
                    );

                }

            };


        /*
         * Zoom in
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


        /*
         * Zoom out
         */

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


        /*
         * Reset
         */

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


        /*
         * Close selected pixel
         */

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


        loading.classList.add(
            "hidden"
        );

    }

    catch (error) {

        console.error(
            error
        );


        loading.innerHTML = `
            <strong>Unable to enter The Wall.</strong>
            <span>Check your Supabase configuration.</span>
        `;

    }

}


start();
