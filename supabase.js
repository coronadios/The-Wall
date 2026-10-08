/*
 * The Wall
 * Supabase client + authentication + realtime
 */

const SUPABASE_URL =
    window.THE_WALL_CONFIG?.SUPABASE_URL;

const SUPABASE_ANON_KEY =
    window.THE_WALL_CONFIG?.SUPABASE_ANON_KEY;


if (
    !SUPABASE_URL ||
    !SUPABASE_ANON_KEY
) {

    throw new Error(
        "The Wall Supabase configuration is missing."
    );

}


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );


let currentUser = null;


/*
 * Anonymous authentication
 */

async function initializeAuth() {

    const {
        data: sessionData
    } =
        await supabaseClient
            .auth
            .getSession();


    if (
        sessionData?.session?.user
    ) {

        currentUser =
            sessionData.session.user;

        return currentUser;

    }


    const {
        data,
        error
    } =
        await supabaseClient
            .auth
            .signInAnonymously();


    if (
        error
    ) {

        console.error(
            "Anonymous authentication failed:",
            error
        );

        throw error;

    }


    currentUser =
        data.user;


    return currentUser;

}


/*
 * Load all existing pixels
 */

async function loadPixels() {

    const pageSize = 1000;
    let from = 0;

    const allPixels = [];


    while (true) {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("pixels")
                .select(
                    "x,y,color,user_id,created_at"
                )
                .order(
                    "x",
                    {
                        ascending: true
                    }
                )
                .order(
                    "y",
                    {
                        ascending: true
                    }
                )
                .range(
                    from,
                    from + pageSize - 1
                );


        if (
            error
        ) {

            console.error(
                "Pixel loading failed:",
                error
            );

            throw error;

        }


        if (
            !data ||
            data.length === 0
        ) {

            break;

        }


        allPixels.push(
            ...data
        );


        /*
         * Less than one complete page means
         * we reached the end.
         */

        if (
            data.length < pageSize
        ) {

            break;

        }


        from += pageSize;

    }


    console.log(
        `The Wall loaded ${allPixels.length} pixels.`
    );


    return allPixels;

}

/*
 * Realtime pixel updates
 */

function subscribeToPixels(
    callback
) {

    return supabaseClient
        .channel(
            "the-wall-pixels"
        )
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "pixels"
            },
            callback
        )
        .subscribe();

}


/*
 * Paint one pixel
 */

async function placePixel(
    x,
    y,
    color
) {

    if (
        !currentUser
    ) {

        throw new Error(
            "User is not authenticated."
        );

    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from("pixels")
            .upsert(
                {
                    x,
                    y,
                    color,
                    user_id:
                        currentUser.id
                },
                {
                    onConflict:
                        "x,y"
                }
            )
            .select()
            .single();


    if (
        error
    ) {

        console.error(
            "Pixel placement failed:",
            error
        );

        throw error;

    }


    return data;

}


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
        !pixels?.length
    ) {

        return [];

    }


    const unique =
        new Map();


    pixels.forEach(
        pixel => {

            if (
                pixel.x < 0 ||
                pixel.x >= 10000 ||
                pixel.y < 0 ||
                pixel.y >= 10000
            ) {

                return;

            }


            unique.set(
                `${pixel.x},${pixel.y}`,
                pixel
            );

        }
    );


    const rows =
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
        );


    if (
        !rows.length
    ) {

        return [];

    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from("pixels")
            .upsert(
                rows,
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
 * Erase one pixel
 */

async function erasePixel(
    x,
    y
) {

    if (
        !currentUser
    ) {

        throw new Error(
            "User is not authenticated."
        );

    }


    const {
        error
    } =
        await supabaseClient
            .from("pixels")
            .delete()
            .eq(
                "x",
                x
            )
            .eq(
                "y",
                y
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
        !pixels?.length
    ) {

        return;

    }


    const unique =
        new Map();


    pixels.forEach(
        pixel => {

            if (
                pixel.x < 0 ||
                pixel.x >= 10000 ||
                pixel.y < 0 ||
                pixel.y >= 10000
            ) {

                return;

            }


            unique.set(
                `${pixel.x},${pixel.y}`,
                pixel

            );

        }
    );


    /*
     * Delete exact coordinates.
     *
     * We intentionally do individual deletes
     * because x IN (...) AND y IN (...)
     * would affect every combination.
     */

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
