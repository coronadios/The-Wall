class Wall {

    constructor(
        canvas,
        container
    ) {

        this.canvas =
            canvas;

        this.container =
            container;

        this.ctx =
            canvas.getContext(
                "2d",
                {
                    alpha: false
                }
            );


        this.size =
            10000;


        this.zoom =
            1;

        this.minZoom =
            0.08;

        this.maxZoom =
            40;


        this.offsetX =
            0;

        this.offsetY =
            0;


        this.isDragging =
            false;


        this.dragStartX =
            0;

        this.dragStartY =
            0;


        this.startOffsetX =
            0;

        this.startOffsetY =
            0;


        /*
         * Touch pointers
         */

        this.pointers =
            new Map();


        this.lastPinchDistance =
            null;


        this.pixels =
            new Map();


        /*
         * Tool
         *
         * paint
         * eraser
         */

        this.tool =
            "paint";


        this.selectedColor =
            0;


        this.palette = [

            "#FFFFFF",
            "#000000",
            "#FF3B30",
            "#FF9500",
            "#FFCC00",
            "#34C759",
            "#00C7BE",
            "#007AFF",
            "#5856D6",
            "#AF52DE",
            "#FF2D55",
            "#8E8E93"

        ];


        this.resize();


        window.addEventListener(
            "resize",
            () => this.resize()
        );


        this.setupInput();


        this.render();

    }


    resize() {

        const rect =
            this.container
                .getBoundingClientRect();


        const dpr =
            window.devicePixelRatio ||
            1;


        this.canvas.width =
            rect.width * dpr;


        this.canvas.height =
            rect.height * dpr;


        this.canvas.style.width =
            `${rect.width}px`;


        this.canvas.style.height =
            `${rect.height}px`;


        this.ctx.setTransform(
            dpr,
            0,
            0,
            dpr,
            0,
            0
        );


        this.render();

    }


    setPixels(
        pixels
    ) {

        this.pixels.clear();


        for (
            const pixel
            of pixels
        ) {

            this.pixels.set(
                `${pixel.x},${pixel.y}`,
                pixel.color
            );

        }


        this.render();

    }


    updatePixel(
        pixel
    ) {

        this.pixels.set(
            `${pixel.x},${pixel.y}`,
            pixel.color
        );


        this.render();

    }


    deletePixel(
        pixel
    ) {

        this.pixels.delete(
            `${pixel.x},${pixel.y}`
        );


        this.render();

    }


    worldToScreen(
        x,
        y
    ) {

        const rect =
            this.container
                .getBoundingClientRect();


        return {

            x:
                rect.width / 2 +
                (
                    x -
                    this.size / 2
                ) *
                this.zoom +
                this.offsetX,


            y:
                rect.height / 2 +
                (
                    y -
                    this.size / 2
                ) *
                this.zoom +
                this.offsetY

        };

    }


    screenToWorld(
        screenX,
        screenY
    ) {

        const rect =
            this.container
                .getBoundingClientRect();


        return {

            x:
                Math.floor(
                    (
                        screenX -
                        rect.width / 2 -
                        this.offsetX
                    ) /
                    this.zoom +
                    this.size / 2
                ),


            y:
                Math.floor(
                    (
                        screenY -
                        rect.height / 2 -
                        this.offsetY
                    ) /
                    this.zoom +
                    this.size / 2
                )

        };

    }


    clampCoordinate(
        value
    ) {

        return Math.max(
            0,
            Math.min(
                this.size - 1,
                value
            )
        );

    }


    getWorldPoint(
        event
    ) {

        const rect =
            this.container
                .getBoundingClientRect();


        const world =
            this.screenToWorld(
                event.clientX -
                    rect.left,

                event.clientY -
                    rect.top
            );


        return {

            x:
                this.clampCoordinate(
                    world.x
                ),

            y:
                this.clampCoordinate(
                    world.y
                )

        };

    }


    render() {

        const rect =
            this.container
                .getBoundingClientRect();


        const width =
            rect.width;

        const height =
            rect.height;


        this.ctx.fillStyle =
            "#080808";


        this.ctx.fillRect(
            0,
            0,
            width,
            height
        );


        /*
         * Wall border
         */

        const topLeft =
            this.worldToScreen(
                0,
                0
            );


        const bottomRight =
            this.worldToScreen(
                this.size,
                this.size
            );


        this.ctx.strokeStyle =
            "rgba(255,255,255,0.12)";


        this.ctx.lineWidth =
            1;


        this.ctx.strokeRect(
            topLeft.x,
            topLeft.y,
            bottomRight.x -
                topLeft.x,
            bottomRight.y -
                topLeft.y
        );


        /*
         * Grid
         */

        if (
            this.zoom >= 4
        ) {

            const gridSize =
                this.zoom;


            const startX =
                Math.max(
                    0,
                    Math.floor(
                        (
                            0 -
                            topLeft.x
                        ) /
                        gridSize
                    )
                );


            const endX =
                Math.min(
                    this.size,
                    Math.ceil(
                        (
                            width -
                            topLeft.x
                        ) /
                        gridSize
                    )
                );


            const startY =
                Math.max(
                    0,
                    Math.floor(
                        (
                            0 -
                            topLeft.y
                        ) /
                        gridSize
                    )
                );


            const endY =
                Math.min(
                    this.size,
                    Math.ceil(
                        (
                            height -
                            topLeft.y
                        ) /
                        gridSize
                    )
                );


            this.ctx.beginPath();


            this.ctx.strokeStyle =
                "rgba(255,255,255,0.035)";


            for (
                let x = startX;
                x <= endX;
                x++
            ) {

                const sx =
                    topLeft.x +
                    x *
                    gridSize;


                this.ctx.moveTo(
                    sx,
                    0
                );


                this.ctx.lineTo(
                    sx,
                    height
                );

            }


            for (
                let y = startY;
                y <= endY;
                y++
            ) {

                const sy =
                    topLeft.y +
                    y *
                    gridSize;


                this.ctx.moveTo(
                    0,
                    sy
                );


                this.ctx.lineTo(
                    width,
                    sy
                );

            }


            this.ctx.stroke();

        }


        /*
         * Pixels
         */

        for (
            const [
                key,
                colorIndex
            ]
            of this.pixels
        ) {

            const [
                x,
                y
            ] =
                key
                    .split(",")
                    .map(Number);


            const screen =
                this.worldToScreen(
                    x,
                    y
                );


            const pixelSize =
                Math.max(
                    1,
                    this.zoom
                );


            if (
                screen.x +
                    pixelSize <
                    0 ||

                screen.y +
                    pixelSize <
                    0 ||

                screen.x >
                    width ||

                screen.y >
                    height
            ) {

                continue;

            }


            this.ctx.fillStyle =
                this.palette[
                    colorIndex
                ] ||
                "#FFFFFF";


            this.ctx.fillRect(
                screen.x,
                screen.y,
                pixelSize,
                pixelSize
            );

        }

    }


    zoomAt(
        factor,
        screenX,
        screenY
    ) {

        const before =
            this.screenToWorld(
                screenX,
                screenY
            );


        this.zoom =
            Math.max(
                this.minZoom,
                Math.min(
                    this.maxZoom,
                    this.zoom * factor
                )
            );


        const after =
            this.screenToWorld(
                screenX,
                screenY
            );


        this.offsetX +=
            (
                after.x -
                before.x
            ) *
            this.zoom;


        this.offsetY +=
            (
                after.y -
                before.y
            ) *
            this.zoom;


        this.render();


        updateZoomUI(
            this.zoom
        );

    }


    setupInput() {

        /*
         * Prevent browser
         * context menu.
         */

        this.canvas.addEventListener(
            "contextmenu",
            event => {

                event.preventDefault();

            }
        );


        /*
         * Pointer down
         */

        this.canvas.addEventListener(
            "pointerdown",
            event => {

                this.canvas.setPointerCapture(
                    event.pointerId
                );


                this.pointers.set(
                    event.pointerId,
                    {
                        x:
                            event.clientX,

                        y:
                            event.clientY
                    }
                );


                /*
                 * Two fingers:
                 * pinch mode
                 */

                if (
                    this.pointers.size >= 2
                ) {

                    const points =
                        [
                            ...this.pointers.values()
                        ];


                    this.lastPinchDistance =
                        Math.hypot(
                            points[0].x -
                                points[1].x,

                            points[0].y -
                                points[1].y
                        );


                    this.isDragging =
                        false;


                    return;

                }


                this.isDragging =
                    true;


                this.dragStartX =
                    event.clientX;


                this.dragStartY =
                    event.clientY;


                this.startOffsetX =
                    this.offsetX;


                this.startOffsetY =
                    this.offsetY;

            }
        );


        /*
         * Pointer move
         */

        this.canvas.addEventListener(
            "pointermove",
            event => {

                if (
                    this.pointers.has(
                        event.pointerId
                    )
                ) {

                    this.pointers.set(
                        event.pointerId,
                        {
                            x:
                                event.clientX,

                            y:
                                event.clientY
                        }
                    );

                }


                const rect =
                    this.container
                        .getBoundingClientRect();


                const x =
                    event.clientX -
                    rect.left;


                const y =
                    event.clientY -
                    rect.top;


                updateCoordinates(
                    this.screenToWorld(
                        x,
                        y
                    )
                );


                /*
                 * Pinch zoom
                 */

                if (
                    this.pointers.size >= 2
                ) {

                    const points =
                        [
                            ...this.pointers.values()
                        ];


                    const distance =
                        Math.hypot(
                            points[0].x -
                                points[1].x,

                            points[0].y -
                                points[1].y
                        );


                    if (
                        this.lastPinchDistance
                    ) {

                        const factor =
                            distance /
                            this.lastPinchDistance;


                        const centerX =
                            (
                                points[0].x +
                                points[1].x
                            ) /
                            2;


                        const centerY =
                            (
                                points[0].y +
                                points[1].y
                            ) /
                            2;


                        this.zoomAt(
                            factor,
                            centerX -
                                rect.left,
                            centerY -
                                rect.top
                        );

                    }


                    this.lastPinchDistance =
                        distance;


                    return;

                }


                if (
                    !this.isDragging
                ) {

                    return;

                }


                this.offsetX =
                    this.startOffsetX +
                    (
                        event.clientX -
                        this.dragStartX
                    );


                this.offsetY =
                    this.startOffsetY +
                    (
                        event.clientY -
                        this.dragStartY
                    );


                this.render();

            }
        );


        /*
         * Pointer up
         */

        const finishPointer =
            event => {

                this.pointers.delete(
                    event.pointerId
                );


                if (
                    this.pointers.size <
                    2
                ) {

                    this.lastPinchDistance =
                        null;

                }


                if (
                    this.pointers.size > 0
                ) {

                    return;

                }


                if (
                    !this.isDragging
                ) {

                    return;

                }


                const distance =
                    Math.hypot(
                        event.clientX -
                            this.dragStartX,

                        event.clientY -
                            this.dragStartY
                    );


                this.isDragging =
                    false;


                /*
                 * Was a drag.
                 */

                if (
                    distance >= 5
                ) {

                    return;

                }


                const point =
                    this.getWorldPoint(
                        event
                    );


                /*
                 * Right click:
                 * erase
                 */

                if (
                    event.button === 2
                ) {

                    this.onPixelErase?.(
                        point.x,
                        point.y
                    );


                    return;

                }


                /*
                 * Left click:
                 * current tool
                 */

                if (
                    this.tool ===
                    "eraser"
                ) {

                    this.onPixelErase?.(
                        point.x,
                        point.y
                    );

                } else {

                    this.onPixelClick?.(
                        point.x,
                        point.y
                    );

                }

            };


        this.canvas.addEventListener(
            "pointerup",
            finishPointer
        );


        this.canvas.addEventListener(
            "pointercancel",
            finishPointer
        );


        /*
         * Desktop wheel zoom
         */

        this.canvas.addEventListener(
            "wheel",
            event => {

                event.preventDefault();


                const rect =
                    this.container
                        .getBoundingClientRect();


                const factor =
                    event.deltaY < 0
                        ? 1.15
                        : 1 / 1.15;


                this.zoomAt(
                    factor,

                    event.clientX -
                        rect.left,

                    event.clientY -
                        rect.top
                );

            },
            {
                passive:
                    false
            }
        );

    }


    resetView() {

        this.zoom =
            1;


        this.offsetX =
            0;


        this.offsetY =
            0;


        this.render();


        updateZoomUI(
            this.zoom
        );

    }

}
