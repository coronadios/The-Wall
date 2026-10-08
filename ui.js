const paletteElement =
    document.getElementById(
        "palette"
    );


const coordinatesElement =
    document.getElementById(
        "coordinates"
    );


const zoomValueElement =
    document.getElementById(
        "zoomValue"
    );


const pixelCountElement =
    document.getElementById(
        "pixelCount"
    );


const selectedPixelElement =
    document.getElementById(
        "selectedPixel"
    );


const pixelPreviewElement =
    document.getElementById(
        "pixelPreview"
    );


const pixelXElement =
    document.getElementById(
        "pixelX"
    );


const pixelYElement =
    document.getElementById(
        "pixelY"
    );


const pixelColorElement =
    document.getElementById(
        "pixelColor"
    );


function buildPalette(
    wall
) {

    paletteElement.innerHTML =
        "";


/*
 * Brush control
 */

const brushControl =
    document.createElement(
        "div"
    );

brushControl.className =
    "brush-control";

brushControl.setAttribute(
    "role",
    "group"
);

brushControl.setAttribute(
    "aria-label",
    "Tamaño del pincel"
);


const brushMinus =
    document.createElement(
        "button"
    );

brushMinus.className =
    "brush-minus";

brushMinus.type =
    "button";

brushMinus.textContent =
    "−";

brushMinus.setAttribute(
    "aria-label",
    "Reducir tamaño del pincel"
);


const brushSize =
    document.createElement(
        "span"
    );

brushSize.className =
    "brush-size";

brushSize.textContent =
    `${wall.brushSize}×${wall.brushSize}`;


const brushPlus =
    document.createElement(
        "button"
    );

brushPlus.className =
    "brush-plus";

brushPlus.type =
    "button";

brushPlus.textContent =
    "+";

brushPlus.setAttribute(
    "aria-label",
    "Aumentar tamaño del pincel"
);


const updateBrushLabel =
    () => {

        brushSize.textContent =
            `${wall.brushSize}×${wall.brushSize}`;

    };


const changeBrushSize =
    direction => {

        const sizes =
            wall.brushSizes;

        let index =
            sizes.indexOf(
                wall.brushSize
            );

        index +=
            direction;

        index =
            Math.max(
                0,
                Math.min(
                    sizes.length - 1,
                    index
                )
            );

        wall.brushSize =
            sizes[index];

        updateBrushLabel();

        wall.render();

    };


brushMinus.addEventListener(
    "click",
    event => {

        event.stopPropagation();

        changeBrushSize(
            -1
        );

    }
);


brushPlus.addEventListener(
    "click",
    event => {

        event.stopPropagation();

        changeBrushSize(
            1
        );

    }
);


brushControl.appendChild(
    brushMinus
);

brushControl.appendChild(
    brushSize
);

brushControl.appendChild(
    brushPlus
);


paletteElement.appendChild(
    brushControl
);

    /*
     * Colors
     */

    wall.palette.forEach(
        (
            color,
            index
        ) => {

            const button =
                document.createElement(
                    "button"
                );


            button.className =
                "palette-color";


            button.style.background =
                color;


            button.dataset.color =
                index;


            button.setAttribute(
                "aria-label",
                `Color ${color}`
            );


            if (
                index === 0
            ) {

                button.classList.add(
                    "active"
                );

            }


            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".palette-color"
                        )
                        .forEach(
                            element => {

                                element.classList.remove(
                                    "active"
                                );

                            }
                        );


                    button.classList.add(
                        "active"
                    );


                    wall.tool =
                        "paint";


                    wall.selectedColor =
                        index;


                    wall.render();

                }
            );


            paletteElement.appendChild(
                button
            );

        }
    );


    /*
     * Eraser
     */

    const eraser =
        document.createElement(
            "button"
        );


    eraser.className =
        "palette-color eraser";


    eraser.innerHTML =
        "<span>⌫</span>";


    eraser.title =
        "Borrador";


    eraser.setAttribute(
        "aria-label",
        "Borrador"
    );


    eraser.addEventListener(
        "click",
        () => {

            document
                .querySelectorAll(
                    ".palette-color"
                )
                .forEach(
                    element => {

                        element.classList.remove(
                            "active"
                        );

                    }
                );


            eraser.classList.add(
                "active"
            );


            wall.tool =
                "eraser";


            wall.render();

        }
    );


    paletteElement.appendChild(
        eraser
    );

}


function updateCoordinates(
    position
) {

    coordinatesElement.textContent =
        `X: ${position.x} · Y: ${position.y}`;

}


function updateZoomUI(
    zoom
) {

    zoomValueElement.textContent =
        `${Math.round(
            zoom * 100
        )}%`;

}


function updatePixelCount(
    count
) {

    pixelCountElement.textContent =
        count.toLocaleString();

}


function showPixel(
    x,
    y,
    color
) {

    const hex =
        wall.palette[color] ||
        "#FFFFFF";


    pixelPreviewElement.style.background =
        hex;


    pixelXElement.textContent =
        x;


    pixelYElement.textContent =
        y;


    pixelColorElement.textContent =
        hex;


    selectedPixelElement.classList.add(
        "visible"
    );

}


function hidePixel() {

    selectedPixelElement.classList.remove(
        "visible"
    );

}
