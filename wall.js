const {
    WORLD_WIDTH,
    WORLD_HEIGHT,
    MIN_ZOOM,
    MAX_ZOOM,
    clampWorldCoordinate,
    buildBrushPoints,
    buildLinePoints
} = window.TheWallCore || {
    WORLD_WIDTH: 10000,
    WORLD_HEIGHT: 10000,
    MIN_ZOOM: 0.03,
    MAX_ZOOM: 40,
    clampWorldCoordinate: (value, width = 10000) => Math.max(0, Math.min((width || 10000) - 1, value)),
    buildBrushPoints: (centerX, centerY, brushSize = 1, worldWidth = 10000, worldHeight = 10000) => {
        const size = Math.max(1, Math.floor(Number(brushSize) || 1));
        const radius = Math.floor((size - 1) / 2);
        const end = size - 1 - radius;
        const points = [];
        for (let dy = -radius; dy <= end; dy += 1) {
            for (let dx = -radius; dx <= end; dx += 1) {
                points.push({
                    x: Math.max(0, Math.min((worldWidth || 10000) - 1, centerX + dx)),
                    y: Math.max(0, Math.min((worldHeight || 10000) - 1, centerY + dy))
                });
            }
        }
        return points;
    },
    buildLinePoints: (start, end) => {
        if (!start || !end) return [];
        const points = [];
        let x0 = Math.round(start.x);
        let y0 = Math.round(start.y);
        const x1 = Math.round(end.x);
        const y1 = Math.round(end.y);
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;
        while (true) {
            points.push({ x: x0, y: y0 });
            if (x0 === x1 && y0 === y1) break;
            const e2 = err * 2;
            if (e2 > -dy) { err -= dy; x0 += sx; }
            if (e2 < dx) { err += dx; y0 += sy; }
        }
        return points;
    }
};

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
            WORLD_WIDTH;

        this.worldWidth =
            WORLD_WIDTH;

        this.worldHeight =
            WORLD_HEIGHT;

        this.zoom =
            1;

        this.minZoom =
            MIN_ZOOM;

        this.maxZoom =
            MAX_ZOOM;


        this.offsetX =
            0;

        this.offsetY =
            0;


        this.isDragging =
            false;

        this.dragMode =
            "pan";

        this.spacePanActive =
            false;

        this.lastPaintPoint =
            null;

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


        /*
         * Pixels
         */

        this.pixels =
            new Map();


        /*
         * Tool
         */

        this.tool =
            "paint";


        this.selectedColor =
            0;


        /*
         * Brush
         */

        this.brushSizes =
            [
                1,
                2,
                3,
                5,
                10,
                25,
                50
            ];

        this.brushSize =
            1;


        /*
         * Cursor
         */

        this.cursor =
            null;


        /*
         * Palette
         */

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
                    this.worldWidth / 2
                ) *
                this.zoom +
                this.offsetX,


            y:
                rect.height / 2 +
                (
                    y -
                    this.size / 2
                    this.worldHeight / 2
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
                    this.worldWidth / 2
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
                    this.worldHeight / 2
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
        value,
        maxValue = this.worldWidth - 1
    ) {

        return clampWorldCoordinate(
            value,
            this.worldWidth,
            this.worldHeight
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


    /*
     * Generate every pixel
     * covered by the brush.
     */

    getBrushPoints(
        center
    ) {

        const points = [];

        const size =
            this.brushSize;


        const start =
            Math.floor(
                (size - 1) / 2
            );


        const end =
            size - 1 - start;


        for (
            let dy = -start;
            dy <= end;
            dy++
        ) {

            for (
                let dx = -start;
                dx <= end;
                dx++
            ) {

                const x =
                    center.x +
                    dx;

                const y =
                    center.y +
                    dy;


                if (
                    x < 0 ||
                    x >= this.size ||
                    y < 0 ||
                    y >= this.size
                ) {

                    continue;

                }


                points.push({
                    x,
                    y
                });
        return buildBrushPoints(
            center.x,
            center.y,
            this.brushSize,
            this.worldWidth,
            this.worldHeight
        );

    }

    interpolateBrushPoints(
        start,
        end
    ) {

        const linePoints =
            buildLinePoints(
                start,
                end
            );

        const points =
            new Map();

        for (
            const point
            of linePoints
        ) {

            for (
                const brushPoint
                of this.getBrushPoints(
                    point
                )
            ) {

                points.set(
                    `${brushPoint.x},${brushPoint.y}`,
                    brushPoint
                );

            }

        }


        return points;
        return [
            ...points.values()
        ];

    }

    paintBrushPoints(
        points,
        erase
    ) {

        if (
            !points?.length
        ) {

            return;

        }

        const unique =
            new Map();

        points.forEach(
            point => {

                unique.set(
                    `${point.x},${point.y}`,
                    point
                );

            }
        );

        const finalPoints =
            [
                ...unique.values()
            ];

        if (
            !finalPoints.length
        ) {

            return;

        }

        if (
            erase
        ) {

            this.onPixelErase?.(
                finalPoints
            );

            return;

        }

        this.onPixelClick?.(
            finalPoints
        );

    }


    /*
     * Faint identity when
     * viewing the whole Wall.
     */

    drawWallIdentity(
        width,
        height
    ) {

        if (
            this.zoom > 0.18
        ) {

            return;

        }


        const centerX =
            width / 2 +
            this.offsetX;


        const centerY =
            height / 2 +
            this.offsetY;


        const alpha =
            Math.max(
                0,
                Math.min(
                    0.13,
                    (
                        0.18 -
                        this.zoom
                    ) /
                    0.10 *
                    0.13
                )
            );


        this.ctx.save();


        this.ctx.globalAlpha =
            alpha;


        this.ctx.textAlign =
            "center";


        this.ctx.textBaseline =
            "middle";


        this.ctx.fillStyle =
            "#FFFFFF";


        this.ctx.font =
            "600 44px Inter, system-ui, sans-serif";


        this.ctx.fillText(
            "The Wall",
            centerX,
            centerY
        );


        this.ctx.font =
            "500 9px Inter, system-ui, sans-serif";


        this.ctx.fillText(
            "BUILT BY EVERYONE",
            centerX,
            centerY + 38
        );


        this.ctx.restore();

    }


    render() {

        const rect =
            this.container
                .getBoundingClientRect();


        const width =
            rect.width;

        const height =
            rect.height;


        /*
         * Background
         */

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


        /*
         * The Wall identity
         */

        this.drawWallIdentity(
            width,
            height
        );


        /*
         * Brush preview
         */

        if (
            this.cursor
        ) {

            const points =
                this.getBrushPoints(
                    this.cursor
                );


            if (
                points.length
            ) {

                const xs =
                    points.map(
                        point =>
                            point.x
                    );


                const ys =
                    points.map(
                        point =>
                            point.y
                    );


                const minX =
                    Math.min(
                        ...xs
                    );


                const maxX =
                    Math.max(
                        ...xs
                    );


                const minY =
                    Math.min(
                        ...ys
                    );


                const maxY =
                    Math.max(
                        ...ys
                    );


                const top =
                    this.worldToScreen(
                        minX,
                        minY
                    );


                const bottom =
                    this.worldToScreen(
                        maxX + 1,
                        maxY + 1
                    );


                this.ctx.save();


                this.ctx.strokeStyle =
                    this.tool ===
                    "eraser"

                        ? "rgba(255,255,255,.8)"

                        : "rgba(255,255,255,.65)";


                this.ctx.lineWidth =
                    1;


                this.ctx.setLineDash(
                    [3, 3]
                );


                this.ctx.strokeRect(
                    top.x,
                    top.y,
                    Math.max(
                        this.zoom,
                        bottom.x -
                            top.x
                    ),
                    Math.max(
                        this.zoom,
                        bottom.y -
                            top.y
                    )
                );


                this.ctx.restore();

            }

        }

    }


    zoomAt(
        factor,
        screenX,
        screenY
    ) {

        const rect =
            this.container
                .getBoundingClientRect();

        const before =
            this.screenToWorld(
                screenX,
                screenY
            );


        this.zoom =
        const nextZoom =
            Math.max(
                this.minZoom,
                Math.min(
                    this.maxZoom,
                    this.zoom *
                    factor
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


        this.zoom =
            nextZoom;

        this.offsetX =
            screenX -
            rect.width / 2 -
            (
                before.x -
                this.worldWidth / 2
            ) *
            this.zoom;

        this.offsetY =
            screenY -
            rect.height / 2 -
            (
                before.y -
                this.worldHeight / 2
            ) *
            this.zoom;

        this.render();


        updateZoomUI(
            this.zoom
        );

    }


    setupInput() {

        /*
         * No browser context menu.
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
                 * Pinch
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

                    this.dragMode =
                        "pan";

                    this.isDragging =
                        false;

                    this.lastPaintPoint =
                        null;

                    return;

                }

                const isPanGesture =
                    event.button === 1 ||
                    (
                        event.button === 0 &&
                        this.spacePanActive
                    );

                this.dragMode =
                    isPanGesture
                        ? "pan"
                        : (
                            event.button === 2 ||
                            this.tool === "eraser"
                        )
                            ? "erase"
                            : "paint";

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


                this.dragStartX =
                    event.clientX;

                this.dragStartY =
                    event.clientY;

                this.startOffsetX =
                    this.offsetX;

                this.startOffsetY =
                    this.offsetY;

                this.cursor =
                    this.getWorldPoint(
                        event
                    );

                if (
                    this.dragMode === "paint" ||
                    this.dragMode === "erase"
                ) {

                    const point =
                        this.getWorldPoint(
                            event
                        );

                    this.lastPaintPoint =
                        point;

                    const points =
                        this.dragMode === "erase"
                            ? this.getBrushPoints(
                                point
                            )
                            : this.getBrushPoints(
                                point
                            );

                    this.paintBrushPoints(
                        points,
                        this.dragMode === "erase"
                    );

                }

                this.render();

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


                const world =
                    this.screenToWorld(
                        x,
                        y
                    );


                const point = {

                    x:
                        this.clampCoordinate(
                            world.x
                        ),

                    y:
                        this.clampCoordinate(
                            world.y
                        )

                };


                this.cursor =
                    point;


                updateCoordinates(
                    point
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
                    this.dragMode === "paint" ||
                    this.dragMode === "erase"
                ) {

                    const point =
                        this.getWorldPoint(
                            event
                        );

                    if (
                        !this.lastPaintPoint ||
                        point.x !== this.lastPaintPoint.x ||
                        point.y !== this.lastPaintPoint.y
                    ) {

                        const strokePoints =
                            this.lastPaintPoint
                                ? this.interpolateBrushPoints(
                                    this.lastPaintPoint,
                                    point
                                )
                                : this.getBrushPoints(
                                    point
                                );

                        this.paintBrushPoints(
                            strokePoints,
                            this.dragMode === "erase"
                        );

                        this.lastPaintPoint =
                            point;

                    }

                    this.render();

                    return;

                }


                if (
                    !this.isDragging
                ) {

                    this.render();

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
                    this.pointers.size >
                    0
                ) {

                    return;

                }


                if (
                    this.dragMode === "paint" ||
                    this.dragMode === "erase"
                ) {

                    this.lastPaintPoint =
                        null;

                    this.isDragging =
                        false;

                    this.dragMode =
                        "pan";

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
                 * Actual drag
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


                const points =
                    this.getBrushPoints(
                        point
                    );


                /*
                 * Right click always
                 * acts as eraser.
                 */

                if (
                    event.button === 2 ||
                    this.tool ===
                    "eraser"
                ) {

                    this.onPixelErase?.(
                        points
                    );

                }

                else {

                    this.onPixelClick?.(
                        points
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
         * Cursor disappears
         * outside the Wall.
         */

        this.canvas.addEventListener(
            "pointerleave",
            () => {

                this.cursor =
                    null;

                this.render();

            }
        );


        /*
         * Wheel zoom
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

        window.addEventListener(
            "keydown",
            event => {

                if (
                    event.code === "Space" &&
                    ![
                        "INPUT",
                        "TEXTAREA"
                    ].includes(
                        document.activeElement?.tagName || ""
                    )
                ) {

                    event.preventDefault();
                    this.spacePanActive = true;

                }

                if (
                    event.key === "+" ||
                    event.key === "="
                ) {

                    event.preventDefault();
                    const rect = this.container.getBoundingClientRect();
                    this.zoomAt(1.15, rect.width / 2, rect.height / 2);

                }

                if (
                    event.key === "-"
                ) {

                    event.preventDefault();
                    const rect = this.container.getBoundingClientRect();
                    this.zoomAt(1 / 1.15, rect.width / 2, rect.height / 2);

                }

                if (
                    event.key === "0"
                ) {

                    event.preventDefault();
                    this.resetView();

                }

            }
        );

        window.addEventListener(
            "keyup",
            event => {

                if (
                    event.code === "Space"
                ) {

                    this.spacePanActive = false;

                }

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
