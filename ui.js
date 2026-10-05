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

    const brushButton =
        document.createElement(
            "button"
        );


    brushButton.className =
        "palette-color brush-control";


    brushButton.innerHTML = `
        <span class="brush-minus">−</span>
        <span class="brush-size">1×1</span>
        <span class="brush-plus">+</span>
    `;


    brushButton.title =
        "Tamaño del pincel";


    brushButton.setAttribute(
        "aria-label",
        "Tamaño del pincel"
    );


    const updateBrushLabel =
        () => {

            brushButton
                .querySelector(
                    ".brush-size"
                )
                .textContent =
                    `${wall.brushSize}×${wall.brushSize}`;

        };


    brushButton.addEventListener(
        "click",
        event => {

            const sizes =
                wall.brushSizes;


            let index =
                sizes.indexOf(
                    wall.brushSize
                );


            if (
                event.target.classList.contains(
                    "brush-minus"
                )
            ) {

                index--;

            }

            else if (
                event.target.classList.contains(
                    "brush-plus"
                )
            ) {

                index++;

            }

            else {

                index++;

            }


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

        }
    );


    paletteElement.appendChild(
        brushButton
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
