/*
 * The Wall
 * Canvas engine: world rendering, camera, brush input and gestures.
 *
 * Dependencies loaded before this file:
 *   - world-core.js
 *
 * Public integration points used by app.js / ui.js:
 *   wall.pixels
 *   wall.palette
 *   wall.selectedColor
 *   wall.tool
 *   wall.brushSizes
 *   wall.brushSize
 *   wall.onPixelClick(points)
 *   wall.onPixelErase(points)
 *   wall.setPixels(pixels)
 *   wall.updatePixel(pixel)
 *   wall.deletePixel(pixel)
 *   wall.zoomAt(factor, x, y)
 *   wall.resetView()
 *   wall.render()
 */

const wallCore =
    window.TheWallCore || {};

const WORLD_WIDTH =
    Number.isFinite(wallCore.WORLD_WIDTH)
        ? wallCore.WORLD_WIDTH
        : 10000;

const WORLD_HEIGHT =
    Number.isFinite(wallCore.WORLD_HEIGHT)
        ? wallCore.WORLD_HEIGHT
        : 10000;

const MIN_ZOOM =
    Number.isFinite(wallCore.MIN_ZOOM)
        ? wallCore.MIN_ZOOM
        : 0.03;

const MAX_ZOOM =
    Number.isFinite(wallCore.MAX_ZOOM)
        ? wallCore.MAX_ZOOM
        : 40;

const clampWorldCoordinate =
    typeof wallCore.clampWorldCoordinate === "function"
        ? wallCore.clampWorldCoordinate
        : (
            value,
            width = WORLD_WIDTH
        ) => Math.max(
            0,
            Math.min(
                width - 1,
                Number(value) || 0
            )
        );

const buildBrushPoints =
    typeof wallCore.buildBrushPoints === "function"
        ? wallCore.buildBrushPoints
        : (
            centerX,
            centerY,
            brushSize = 1,
            worldWidth = WORLD_WIDTH,
            worldHeight = WORLD_HEIGHT
        ) => {

            const size =
                Math.max(
                    1,
                    Math.floor(
                        Number(brushSize) || 1
                    )
                );

            const radius =
                Math.floor(
                    (size - 1) / 2
                );

            const end =
                size - 1 - radius;

            const points = [];

            for (
                let dy = -radius;
                dy <= end;
                dy += 1
            ) {

                for (
                    let dx = -radius;
                    dx <= end;
                    dx += 1
                ) {

                    points.push({
                        x:
                            Math.max(
                                0,
                                Math.min(
                                    worldWidth - 1,
                                    centerX + dx
                                )
                            ),

                        y:
                            Math.max(
                                0,
                                Math.min(
                                    worldHeight - 1,
                                    centerY + dy
                                )
                            )
                    });

                }

            }

            return points;
        };

const buildLinePoints =
    typeof wallCore.buildLinePoints === "function"
        ? wallCore.buildLinePoints
        : (
            start,
            end
        ) => {

            if (
                !start ||
                !end
            ) {

                return [];

            }

            const points = [];

            let x0 =
                Math.round(
                    start.x
                );

            let y0 =
                Math.round(
                    start.y
                );

            const x1 =
                Math.round(
                    end.x
                );

            const y1 =
                Math.round(
                    end.y
                );

            const dx =
                Math.abs(
                    x1 - x0
                );

            const dy =
                Math.abs(
                    y1 - y0
                );

            const sx =
                x0 < x1
                    ? 1
                    : -1;

            const sy =
                y0 < y1
                    ? 1
                    : -1;

            let err =
                dx - dy;

            while (true) {

                points.push({
                    x: x0,
                    y: y0
                });

                if (
                    x0 === x1 &&
                    y0 === y1
                ) {

                    break;

                }

                const e2 =
                    err * 2;

                if (
                    e2 > -dy
                ) {

                    err -= dy;
                    x0 += sx;

                }

                if (
                    e2 < dx
                ) {

                    err += dx;
                    y0 += sy;

                }

            }

            return points;

        };


class Wall {

    constructor(
        canvas,
        container
    ) {

        if (
            !canvas
        ) {

            throw new Error(
                "The Wall canvas element is missing."
            );

        }

        if (
            !container
        ) {

            throw new Error(
                "The Wall container element is missing."
            );

        }

        const ctx =
            canvas.getContext(
                "2d",
                {
                    alpha: false
                }
            );

        if (
            !ctx
        ) {

            throw new Error(
                "The Wall could not create a 2D canvas context."
            );

        }

        this.canvas =
            canvas;

        this.container =
            container;

        this.ctx =
            ctx;

        /*
         * World
         */

        this.worldWidth =
            WORLD_WIDTH;

        this.worldHeight =
            WORLD_HEIGHT;

        /*
         * Compatibility alias for the
         * original square-world architecture.
         */

        this.size =
            WORLD_WIDTH;

        /*
         * Camera
         */

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

        /*
         * Pointer / gesture state
         */

        this.isDragging =
            false;

        this.dragMode =
            "pan";

        this.spacePanActive =
            false;

        this.dragStartX =
            0;

        this.dragStartY =
            0;

        this.startOffsetX =
            0;

        this.startOffsetY =
            0;

        this.activePointerId =
            null;

        this.pointers =
            new Map();

        this.lastPinchDistance =
            null;

        /*
         * Painting state
         */

        this.lastPaintPoint =
            null;

        this.isStrokeActive =
            false;

        this.strokeVisited =
            new Set();

        /*
         * Pixel storage
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

        this.palette =
            [
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

        /*
         * Application callbacks.
         */

        this.onPixelClick =
            null;

        this.onPixelErase =
            null;

        /*
         * Render scheduling.
         */

        this.renderQueued =
            false;

        this.destroyed =
            false;

        /*
         * Bound global listeners.
         */

        this.boundResize =
            () =>
                this.resize();

        this.boundKeyDown =
            event =>
                this.handleKeyDown(
                    event
                );

        this.boundKeyUp =
            event =>
                this.handleKeyUp(
                    event
                );

        /*
         * ResizeObserver.
         */

        this.resizeObserver =
            typeof ResizeObserver === "function"
                ? new ResizeObserver(
                    () =>
                        this.resize()
                )
                : null;

        /*
         * Initial setup.
         */

        this.resize();

        this.setupInput();

        window.addEventListener(
            "resize",
            this.boundResize
        );

        window.addEventListener(
            "keydown",
            this.boundKeyDown
        );

        window.addEventListener(
            "keyup",
            this.boundKeyUp
        );

        if (
            this.resizeObserver
        ) {

            this.resizeObserver.observe(
                this.container
            );

        }

    }


    resize() {

        if (
            this.destroyed
        ) {

            return;

        }

        const rect =
            this.container
                .getBoundingClientRect();

        const width =
            Math.max(
                1,
                Math.floor(
                    rect.width
                )
            );

        const height =
            Math.max(
                1,
                Math.floor(
                    rect.height
                )
            );

        const dpr =
            Math.max(
                1,
                window.devicePixelRatio || 1
            );

        const backingWidth =
            Math.max(
                1,
                Math.floor(
                    width * dpr
                )
            );

        const backingHeight =
            Math.max(
                1,
                Math.floor(
                    height * dpr
                )
            );

        if (
            this.canvas.width !==
                backingWidth ||

            this.canvas.height !==
                backingHeight
        ) {

            this.canvas.width =
                backingWidth;

            this.canvas.height =
                backingHeight;

        }

        this.canvas.style.width =
            `${width}px`;

        this.canvas.style.height =
            `${height}px`;

        this.ctx.setTransform(
            dpr,
            0,
            0,
            dpr,
            0,
            0
        );

        this.ctx.imageSmoothingEnabled =
            false;

        this.render();

    }


    setPixels(
        pixels
    ) {

        this.pixels.clear();

        for (
            const pixel
            of pixels || []
        ) {

            if (
                !this.isValidPixel(
                    pixel
                )
            ) {

                continue;

            }

            this.pixels.set(
                this.pixelKey(
                    pixel.x,
                    pixel.y
                ),
                pixel.color
            );

        }

        this.requestRender();

    }


    updatePixel(
        pixel
    ) {

        if (
            !this.isValidPixel(
                pixel
            )
        ) {

            return;

        }

        this.pixels.set(
            this.pixelKey(
                pixel.x,
                pixel.y
            ),
            pixel.color
        );

        this.requestRender();

    }


    deletePixel(
        pixel
    ) {

        if (
            !pixel
        ) {

            return;

        }

        const x =
            Number(
                pixel.x
            );

        const y =
            Number(
                pixel.y
            );

        if (
            !Number.isInteger(x) ||
            !Number.isInteger(y)
        ) {

            return;

        }

        this.pixels.delete(
            this.pixelKey(
                x,
                y
            )
        );

        this.requestRender();

    }


    isValidPixel(
        pixel
    ) {

        if (
            !pixel
        ) {

            return false;

        }

        const x =
            Number(
                pixel.x
            );

        const y =
            Number(
                pixel.y
            );

        const color =
            Number(
                pixel.color
            );

        return (

            Number.isInteger(
                x
            ) &&

            Number.isInteger(
                y
            ) &&

            x >= 0 &&

            x < this.worldWidth &&

            y >= 0 &&

            y < this.worldHeight &&

            Number.isInteger(
                color
            ) &&

            color >= 0 &&

            color < this.palette.length

        );

    }


    pixelKey(
        x,
        y
    ) {

        return `${x},${y}`;

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
                    this.worldWidth / 2
                ) *
                this.zoom +

                this.offsetX,

            y:
                rect.height / 2 +

                (
                    y -
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
                (
                    screenX -
                    rect.width / 2 -
                    this.offsetX
                ) /
                this.zoom +

                this.worldWidth / 2,

            y:
                (
                    screenY -
                    rect.height / 2 -
                    this.offsetY
                ) /
                this.zoom +

                this.worldHeight / 2

        };

    }


    clampCoordinate(
        value,
        axis = "x"
    ) {

        const numeric =
            Number(
                value
            );

        const safeValue =
            Number.isFinite(
                numeric
            )
                ? numeric
                : 0;

        const dimension =
            axis === "y"
                ? this.worldHeight
                : this.worldWidth;

        return clampWorldCoordinate(
            Math.max(
                0,
                Math.min(
                    dimension - 1,
                    safeValue
                )
            ),
            dimension,
            dimension
        );

    }


    getWorldPoint(
        event
    ) {

        const rect =
            this.container
                .getBoundingClientRect();

        const screenX =
            event.clientX -
            rect.left;

        const screenY =
            event.clientY -
            rect.top;

        const world =
            this.screenToWorld(
                screenX,
                screenY
            );

        return {

            x:
                this.clampCoordinate(
                    Math.floor(
                        world.x
                    ),
                    "x"
                ),

            y:
                this.clampCoordinate(
                    Math.floor(
                        world.y
                    ),
                    "y"
                )

        };

    }


    getBrushPoints(
        center
    ) {

        if (
            !center
        ) {

            return [];

        }

        const rawPoints =
            buildBrushPoints(
                center.x,
                center.y,
                this.brushSize,
                this.worldWidth,
                this.worldHeight
            );

        const unique =
            new Map();

        for (
            const point
            of rawPoints
        ) {

            const x =
                this.clampCoordinate(
                    point.x,
                    "x"
                );

            const y =
                this.clampCoordinate(
                    point.y,
                    "y"
                );

            unique.set(
                this.pixelKey(
                    x,
                    y
                ),
                {
                    x,
                    y
                }
            );

        }

        return [
            ...unique.values()
        ];

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

        const unique =
            new Map();

        for (
            const point
            of linePoints
        ) {

            const brushPoints =
                this.getBrushPoints(
                    point
                );

            for (
                const brushPoint
                of brushPoints
            ) {

                unique.set(
                    this.pixelKey(
                        brushPoint.x,
                        brushPoint.y
                    ),
                    brushPoint
                );

            }

        }

        return [
            ...unique.values()
        ];

    }


    paintBrushPoints(
        points,
        erase = false
    ) {

        if (
            !Array.isArray(
                points
            ) ||
            points.length === 0
        ) {

            return;

        }

        const unique =
            new Map();

        for (
            const point
            of points
        ) {

            if (
                !point
            ) {

                continue;

            }

            const x =
                this.clampCoordinate(
                    Math.floor(
                        point.x
                    ),
                    "x"
                );

            const y =
                this.clampCoordinate(
                    Math.floor(
                        point.y
                    ),
                    "y"
                );

            unique.set(
                this.pixelKey(
                    x,
                    y
                ),
                {
                    x,
                    y
                }
            );

        }

        let finalPoints =
            [
                ...unique.values()
            ];

        /*
         * Avoid sending the same coordinate
         * multiple times during one stroke.
         */

        if (
            this.isStrokeActive
        ) {

            finalPoints =
                finalPoints.filter(
                    point => {

                        const key =
                            this.pixelKey(
                                point.x,
                                point.y
                            );

                        if (
                            this.strokeVisited.has(
                                key
                            )
                        ) {

                            return false;

                        }

                        this.strokeVisited.add(
                            key
                        );

                        return true;

                    }
                );

        }

        if (
            finalPoints.length === 0
        ) {

            return;

        }

        if (
            erase
        ) {

            if (
                typeof this.onPixelErase ===
                "function"
            ) {

                this.onPixelErase(
                    finalPoints
                );

            }

            return;

        }

        if (
            typeof this.onPixelClick ===
            "function"
        ) {

            this.onPixelClick(
                finalPoints
            );

        }

    }


    setTool(
        tool
    ) {

        this.tool =
            tool === "eraser"
                ? "eraser"
                : "paint";

        this.render();

    }


    setBrushSize(
        size
    ) {

        const numeric =
            Number(
                size
            );

        const target =
            Number.isFinite(
                numeric
            )
                ? numeric
                : 1;

        let nearest =
            this.brushSizes[0];

        let bestDistance =
            Math.abs(
                nearest -
                target
            );

        for (
            const candidate
            of this.brushSizes
        ) {

            const distance =
                Math.abs(
                    candidate -
                    target
                );

            if (
                distance <
                bestDistance
            ) {

                nearest =
                    candidate;

                bestDistance =
                    distance;

            }

        }

        this.brushSize =
            nearest;

        this.render();

    }


    drawWallIdentity(
        width,
        height
    ) {

        const identityMaxZoom =
            0.18;

        if (
            this.zoom >
            identityMaxZoom
        ) {

            return;

        }

        const fadeRange =
            0.10;

        const alpha =
            Math.max(
                0,

                Math.min(
                    0.13,

                    (
                        identityMaxZoom -
                        this.zoom
                    ) /
                    fadeRange *
                    0.13
                )
            );

        if (
            alpha <= 0
        ) {

            return;

        }

        const centerX =
            width / 2 +
            this.offsetX;

        const centerY =
            height / 2 +
            this.offsetY;

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

        if (
            this.destroyed
        ) {

            return;

        }

        this.renderQueued =
            false;

        const rect =
            this.container
                .getBoundingClientRect();

        const width =
            Math.max(
                1,
                rect.width
            );

        const height =
            Math.max(
                1,
                rect.height
            );

        const dpr =
            Math.max(
                1,
                window.devicePixelRatio || 1
            );

        this.ctx.setTransform(
            dpr,
            0,
            0,
            dpr,
            0,
            0
        );

        this.ctx.imageSmoothingEnabled =
            false;

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
         * World border
         */

        const topLeft =
            this.worldToScreen(
                0,
                0
            );

        const bottomRight =
            this.worldToScreen(
                this.worldWidth,
                this.worldHeight
            );

        this.ctx.strokeStyle =
            "rgba(255,255,255,0.12)";

        this.ctx.lineWidth =
            1;

        this.ctx.strokeRect(
            topLeft.x + 0.5,
            topLeft.y + 0.5,
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

            this.drawGrid(
                topLeft,
                width,
                height
            );

        }

        /*
         * Pixels
         */

        this.drawPixels(
            topLeft,
            width,
            height
        );

        /*
         * Wall identity
         */

        this.drawWallIdentity(
            width,
            height
        );

        /*
         * Brush preview
         */

        this.drawBrushPreview();

    }


    requestRender() {

        if (
            this.destroyed ||
            this.renderQueued
        ) {

            return;

        }

        this.renderQueued =
            true;

        if (
            typeof requestAnimationFrame ===
            "function"
        ) {

            requestAnimationFrame(
                () =>
                    this.render()
            );

            return;

        }

        setTimeout(
            () =>
                this.render(),
            0
        );

    }


    drawGrid(
        topLeft,
        width,
        height
    ) {

        const gridSize =
            this.zoom;

        const startX =
            Math.max(
                0,
                Math.floor(
                    (
                        -topLeft.x
                    ) /
                    gridSize
                )
            );

        const endX =
            Math.min(
                this.worldWidth,
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
                        -topLeft.y
                    ) /
                    gridSize
                )
            );

        const endY =
            Math.min(
                this.worldHeight,
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

        this.ctx.lineWidth =
            1;

        for (
            let x = startX;
            x <= endX;
            x += 1
        ) {

            const screenX =
                topLeft.x +
                x *
                gridSize;

            this.ctx.moveTo(
                screenX,
                0
            );

            this.ctx.lineTo(
                screenX,
                height
            );

        }

        for (
            let y = startY;
            y <= endY;
            y += 1
        ) {

            const screenY =
                topLeft.y +
                y *
                gridSize;

            this.ctx.moveTo(
                0,
                screenY
            );

            this.ctx.lineTo(
                width,
                screenY
            );

        }

        this.ctx.stroke();

    }


    drawPixels(
        topLeft,
        width,
        height
    ) {

        const zoom =
            this.zoom;

        const inverseZoom =
            1 / zoom;

        const visibleLeft =
            (
                -topLeft.x
            ) *
            inverseZoom -
            1;

        const visibleTop =
            (
                -topLeft.y
            ) *
            inverseZoom -
            1;

        const visibleRight =
            (
                width -
                topLeft.x
            ) *
            inverseZoom +
            1;

        const visibleBottom =
            (
                height -
                topLeft.y
            ) *
            inverseZoom +
            1;

        for (
            const [
                key,
                colorIndex
            ]
            of this.pixels
        ) {

            const comma =
                key.indexOf(
                    ","
                );

            const x =
                Number(
                    key.slice(
                        0,
                        comma
                    )
                );

            const y =
                Number(
                    key.slice(
                        comma + 1
                    )
                );

            if (
                x < visibleLeft ||
                x > visibleRight ||
                y < visibleTop ||
                y > visibleBottom
            ) {

                continue;

            }

            const screenX =
                topLeft.x +
                x *
                zoom;

            const screenY =
                topLeft.y +
                y *
                zoom;

            this.ctx.fillStyle =
                this.palette[
                    colorIndex
                ] ||
                "#FFFFFF";

            this.ctx.fillRect(
                screenX,
                screenY,
                zoom,
                zoom
            );

        }

    }


    drawBrushPreview() {

        if (
            !this.cursor
        ) {

            return;

        }

        const points =
            this.getBrushPoints(
                this.cursor
            );

        if (
            points.length === 0
        ) {

            return;

        }

        let minX =
            points[0].x;

        let maxX =
            points[0].x;

        let minY =
            points[0].y;

        let maxY =
            points[0].y;

        for (
            let index = 1;
            index < points.length;
            index += 1
        ) {

            const point =
                points[index];

            minX =
                Math.min(
                    minX,
                    point.x
                );

            maxX =
                Math.max(
                    maxX,
                    point.x
                );

            minY =
                Math.min(
                    minY,
                    point.y
                );

            maxY =
                Math.max(
                    maxY,
                    point.y
                );

        }

        const top =
            this.worldToScreen(
                minX,
                minY
            );

        const right =
            this.worldToScreen(
                maxX + 1,
                minY
            );

        const bottom =
            this.worldToScreen(
                minX,
                maxY + 1
            );

        const previewWidth =
            Math.max(
                1,
                right.x -
                top.x
            );

        const previewHeight =
            Math.max(
                1,
                bottom.y -
                top.y
            );

        this.ctx.save();

        this.ctx.strokeStyle =
            this.tool === "eraser"

                ? "rgba(255,255,255,0.85)"

                : "rgba(255,255,255,0.68)";

        this.ctx.lineWidth =
            1;

        this.ctx.setLineDash(
            [
                3,
                3
            ]
        );

        this.ctx.strokeRect(
            Math.round(
                top.x
            ) + 0.5,

            Math.round(
                top.y
            ) + 0.5,

            previewWidth,

            previewHeight
        );

        this.ctx.restore();

    }


    zoomAt(
        factor,
        screenX,
        screenY
    ) {

        if (
            !Number.isFinite(
                factor
            ) ||
            factor <= 0
        ) {

            return;

        }

        const rect =
            this.container
                .getBoundingClientRect();

        const before =
            this.screenToWorld(
                screenX,
                screenY
            );

        const nextZoom =
            Math.max(
                this.minZoom,

                Math.min(
                    this.maxZoom,

                    this.zoom *
                    factor
                )
            );

        if (
            nextZoom ===
            this.zoom
        ) {

            return;

        }

        this.zoom =
            nextZoom;

        /*
         * Keep the world position beneath
         * the zoom point fixed.
         */

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

        if (
            typeof updateZoomUI ===
            "function"
        ) {

            updateZoomUI(
                this.zoom
            );

        }

    }


    resetView() {

        this.zoom =
            1;

        this.offsetX =
            0;

        this.offsetY =
            0;

        this.render();

        if (
            typeof updateZoomUI ===
            "function"
        ) {

            updateZoomUI(
                this.zoom
            );

        }

    }


    setupInput() {

        /*
         * Disable the browser context menu.
         */

        this.canvas.addEventListener(
            "contextmenu",
            event => {

                event.preventDefault();

            }
        );

        /*
         * Pointer input.
         */

        this.canvas.addEventListener(
            "pointerdown",
            event =>
                this.handlePointerDown(
                    event
                )
        );

        this.canvas.addEventListener(
            "pointermove",
            event =>
                this.handlePointerMove(
                    event
                )
        );

        this.canvas.addEventListener(
            "pointerup",
            event =>
                this.handlePointerUp(
                    event
                )
        );

        this.canvas.addEventListener(
            "pointercancel",
            event =>
                this.handlePointerUp(
                    event
                )
        );

        /*
         * If capture disappears unexpectedly,
         * make sure the internal state resets.
         */

        this.canvas.addEventListener(
            "lostpointercapture",
            event =>
                this.handlePointerUp(
                    event
                )
        );

        /*
         * Cursor preview disappears while
         * no pointer is actively captured.
         */

        this.canvas.addEventListener(
            "pointerleave",
            () => {

                if (
                    this.activePointerId ===
                    null
                ) {

                    this.cursor =
                        null;

                    this.requestRender();

                }

            }
        );

        /*
         * Wheel zoom.
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


    handlePointerDown(
        event
    ) {

        if (
            this.destroyed
        ) {

            return;

        }

        event.preventDefault();

        try {

            this.canvas.setPointerCapture(
                event.pointerId
            );

        }

        catch {

            /*
             * Pointer capture can fail if
             * the browser has already cancelled
             * the pointer.
             */

        }

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
         * Two pointers start / continue pinch.
         */

        if (
            this.pointers.size >= 2
        ) {

            this.lastPinchDistance =
                this.getPointerDistance();

            this.dragMode =
                "pan";

            this.isDragging =
                false;

            this.lastPaintPoint =
                null;

            this.isStrokeActive =
                false;

            this.strokeVisited.clear();

            return;

        }

        this.activePointerId =
            event.pointerId;

        const isPanGesture =
            event.button === 1 ||

            (
                event.button === 0 &&
                this.spacePanActive
            );

        if (
            isPanGesture
        ) {

            this.dragMode =
                "pan";

        }

        else if (
            event.button === 2 ||
            this.tool === "eraser"
        ) {

            this.dragMode =
                "erase";

        }

        else {

            this.dragMode =
                "paint";

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

        const point =
            this.getWorldPoint(
                event
            );

        this.cursor =
            point;

        /*
         * Paint / erase immediately.
         */

        if (
            this.dragMode === "paint" ||
            this.dragMode === "erase"
        ) {

            this.isStrokeActive =
                true;

            this.strokeVisited.clear();

            this.lastPaintPoint =
                point;

            this.paintBrushPoints(

                this.getBrushPoints(
                    point
                ),

                this.dragMode === "erase"

            );

        }

        this.render();

    }


    handlePointerMove(
        event
    ) {

        if (
            this.destroyed
        ) {

            return;

        }

        /*
         * Update tracked pointer.
         */

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

        const localX =
            event.clientX -
            rect.left;

        const localY =
            event.clientY -
            rect.top;

        const world =
            this.screenToWorld(
                localX,
                localY
            );

        const point =
            {
                x:
                    this.clampCoordinate(
                        Math.floor(
                            world.x
                        ),
                        "x"
                    ),

                y:
                    this.clampCoordinate(
                        Math.floor(
                            world.y
                        ),
                        "y"
                    )
            };

        this.cursor =
            point;

        if (
            typeof updateCoordinates ===
            "function"
        ) {

            updateCoordinates(
                point
            );

        }

        /*
         * Pinch zoom.
         */

        if (
            this.pointers.size >= 2
        ) {

            const distance =
                this.getPointerDistance();

            if (
                this.lastPinchDistance &&
                distance > 0
            ) {

                const factor =
                    distance /
                    this.lastPinchDistance;

                const center =
                    this.getPointerCenter(
                        rect
                    );

                this.zoomAt(
                    factor,
                    center.x,
                    center.y
                );

            }

            this.lastPinchDistance =
                distance;

            this.render();

            return;

        }

        /*
         * Continuous painting / erasing.
         */

        if (
            this.dragMode === "paint" ||
            this.dragMode === "erase"
        ) {

            if (
                this.lastPaintPoint &&

                (
                    point.x !==
                        this.lastPaintPoint.x ||

                    point.y !==
                        this.lastPaintPoint.y
                )
            ) {

                const strokePoints =
                    this.interpolateBrushPoints(
                        this.lastPaintPoint,
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

        /*
         * Pan.
         */

        if (
            !this.isDragging
        ) {

            this.requestRender();

            return;

        }

        this.offsetX =
            this.startOffsetX +

            event.clientX -
            this.dragStartX;

        this.offsetY =
            this.startOffsetY +

            event.clientY -
            this.dragStartY;

        this.render();

    }


    handlePointerUp(
        event
    ) {

        this.pointers.delete(
            event.pointerId
        );

        if (
            this.pointers.size < 2
        ) {

            this.lastPinchDistance =
                null;

        }

        /*
         * Another pointer is still active.
         */

        if (
            this.pointers.size > 0
        ) {

            return;

        }

        try {

            this.canvas.releasePointerCapture(
                event.pointerId
            );

        }

        catch {

            /*
             * Capture may already be gone.
             */

        }

        this.lastPaintPoint =
            null;

        this.activePointerId =
            null;

        this.isStrokeActive =
            false;

        this.strokeVisited.clear();

        this.isDragging =
            false;

        this.dragMode =
            "pan";

        this.cursor =
            null;

        this.render();

    }


    getPointerDistance() {

        const values =
            [
                ...this.pointers.values()
            ];

        if (
            values.length < 2
        ) {

            return 0;

        }

        return Math.hypot(

            values[0].x -
                values[1].x,

            values[0].y -
                values[1].y

        );

    }


    getPointerCenter(
        rect
    ) {

        const values =
            [
                ...this.pointers.values()
            ];

        if (
            values.length < 2
        ) {

            return {

                x:
                    rect.width / 2,

                y:
                    rect.height / 2

            };

        }

        return {

            x:
                (
                    values[0].x +
                    values[1].x
                ) /
                2 -
                rect.left,

            y:
                (
                    values[0].y +
                    values[1].y
                ) /
                2 -
                rect.top

        };

    }


    handleKeyDown(
        event
    ) {

        const target =
            event.target;

        const tagName =
            target?.tagName ||
            "";

        /*
         * Do not capture keyboard shortcuts
         * from editable controls.
         */

        if (

            [
                "INPUT",
                "TEXTAREA",
                "SELECT"
            ].includes(
                tagName
            ) ||

            target?.isContentEditable

        ) {

            return;

        }

        /*
         * Space = temporary pan.
         */

        if (
            event.code === "Space"
        ) {

            event.preventDefault();

            this.spacePanActive =
                true;

            return;

        }

        const rect =
            this.container
                .getBoundingClientRect();

        /*
         * Zoom in.
         */

        if (
            event.key === "+" ||
            event.key === "="
        ) {

            event.preventDefault();

            this.zoomAt(
                1.15,

                rect.width / 2,

                rect.height / 2
            );

            return;

        }

        /*
         * Zoom out.
         */

        if (
            event.key === "-"
        ) {

            event.preventDefault();

            this.zoomAt(
                1 / 1.15,

                rect.width / 2,

                rect.height / 2
            );

            return;

        }

        /*
         * Reset view.
         */

        if (
            event.key === "0"
        ) {

            event.preventDefault();

            this.resetView();

        }

    }


    handleKeyUp(
        event
    ) {

        if (
            event.code === "Space"
        ) {

            this.spacePanActive =
                false;

        }

    }


    destroy() {

        if (
            this.destroyed
        ) {

            return;

        }

        this.destroyed =
            true;

        this.pointers.clear();

        this.isStrokeActive =
            false;

        this.strokeVisited.clear();

        if (
            this.resizeObserver
        ) {

            this.resizeObserver.disconnect();

        }

        window.removeEventListener(
            "resize",
            this.boundResize
        );

        window.removeEventListener(
            "keydown",
            this.boundKeyDown
        );

        window.removeEventListener(
            "keyup",
            this.boundKeyUp
        );

    }

}


/*
 * Classic-script export.
 */

window.Wall =
    Wall;
