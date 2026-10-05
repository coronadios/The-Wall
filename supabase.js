const supabaseClient = supabase.createClient(
    window.THE_WALL_CONFIG.SUPABASE_URL,
    window.THE_WALL_CONFIG.SUPABASE_ANON_KEY
);

let currentUser = null;


/**
 * Initialize anonymous authentication.
 */
async function initializeAuth() {

    const {
        data: {
            session
        },
        error: sessionError
    } = await supabaseClient.auth.getSession();

    if (sessionError) {
        console.error(sessionError);
    }

    if (session?.user) {
        currentUser = session.user;
        return currentUser;
    }

    const {
        data,
        error
    } = await supabaseClient.auth.signInAnonymously();

    if (error) {
        console.error("Anonymous authentication failed:", error);
        throw error;
    }

    currentUser = data.user;

    return currentUser;
}


/**
 * Get all pixels.
 */
async function loadPixels() {

    const {
        data,
        error
    } = await supabaseClient
        .from("pixels")
        .select("x,y,color");

    if (error) {
        console.error("Could not load pixels:", error);
        throw error;
    }

    return data || [];
}


/**
 * Place or update a pixel.
 */
async function placePixel(x, y, color) {

    if (!currentUser) {
        throw new Error("User is not authenticated.");
    }

    const {
        data,
        error
    } = await supabaseClient
        .from("pixels")
        .upsert(
            {
                x,
                y,
                color,
                user_id: currentUser.id
            },
            {
                onConflict: "x,y"
            }
        )
        .select()
        .single();

    if (error) {
        console.error("Pixel placement failed:", error);
        throw error;
    }

    return data;
}


/**
 * Subscribe to realtime pixel changes.
 */
function subscribeToPixels(callback) {

    return supabaseClient
        .channel("the-wall-pixels")

        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "pixels"
            },
            payload => {

                callback(payload);

            }
        )

        .subscribe(status => {

            console.log("Realtime:", status);

        });
}
