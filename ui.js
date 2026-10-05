const paletteElement =
    document.getElementById("palette");

const coordinatesElement =
    document.getElementById("coordinates");

const zoomValueElement =
    document.getElementById("zoomValue");

const pixelCountElement =
    document.getElementById("pixelCount");

const selectedPixelElement =
    document.getElementById("selectedPixel");

const pixelPreviewElement =
    document.getElementById("pixelPreview");

const pixelXElement =
    document.getElementById("pixelX");

const pixelYElement =
    document.getElementById("pixelY");

const pixelColorElement =
    document.getElementById("pixelColor");


function buildPalette(wall) {

    paletteElement.innerHTML = "";


    wall.palette.forEach(
        (color, index) => {

            const button =
                document.createElement("button");

            button.className =
                "palette-color";

            button.style.background =
                color;

            button.dataset.color =
                index;


            if (index === 0) {
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
                            element =>
                                element.classList.remove(
                                    "active"
                                )
                        );


                    button.classList.add(
                        "active"
                    );


                    wall.selectedColor =
                        index;

                }
            );


            paletteElement.appendChild(
                button
            );

        }
    );

}


function updateCoordinates(position) {

    coordinatesElement.textContent =
        `X: ${position.x} · Y: ${position.y}`;

}


function updateZoomUI(zoom) {

    zoomValueElement.textContent =
        `${Math.round(
            zoom * 100
        )}%`;

}


function updatePixelCount(count) {

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
