/*
 * Paint multiple pixels
 */

async function placePixels(
    pixels
) {

    if (
        !currentUser
    ) {

        throw new Error(
            "User is not authenticated."
        );

    }


    if (
        !pixels.length
    ) {

        return [];

    }


    /*
     * Remove duplicates.
     */

    const unique =
        new Map();


    pixels.forEach(
        pixel => {

            unique.set(
                `${pixel.x},${pixel.y}`,
                pixel
            );

        }
    );


    const {
        data,
        error
    } =
        await supabaseClient
            .from("pixels")
            .upsert(
                [
                    ...unique.values()
                ].map(
                    pixel => ({

                        x:
                            pixel.x,

                        y:
                            pixel.y,

                        color:
                            pixel.color,

                        user_id:
                            currentUser.id

                    })
                ),
                {
                    onConflict:
                        "x,y"
                }
            )
            .select();


    if (
        error
    ) {

        console.error(
            "Pixel placement failed:",
            error
        );

        throw error;

    }


    return data || [];

}


/*
 * Erase multiple pixels
 */

async function erasePixels(
    pixels
) {

    if (
        !currentUser
    ) {

        throw new Error(
            "User is not authenticated."
        );

    }


    if (
        !pixels.length
    ) {

        return;

    }


    /*
     * Supabase .in(x).in(y)
     * would erase a rectangle instead
     * of the exact brush shape.
     *
     * Since our brush is rectangular,
     * calculate the exact unique coordinates.
     */

    const unique =
        new Map();


    pixels.forEach(
        pixel => {

            unique.set(
                `${pixel.x},${pixel.y}`,
                pixel
            );

        }
    );


    for (
        const pixel
        of unique.values()
    ) {

        const {
            error
        } =
            await supabaseClient
                .from("pixels")
                .delete()
                .eq(
                    "x",
                    pixel.x
                )
                .eq(
                    "y",
                    pixel.y
                );


        if (
            error
        ) {

            console.error(
                "Pixel deletion failed:",
                error
            );

            throw error;

        }

    }

}
