(() => {
    const splash = document.getElementById("splash");
    const art = document.getElementById("splashArt");

    if (!splash || !art) return;

    let animationReady = false;
    let appReady = false;
    let finished = false;

    const total = 64;

    for (let i = 0; i < total; i++) {
        const pixel = document.createElement("div");
        pixel.className = "splash-pixel";
        pixel.style.animationDelay = `${i * 0.025}s`;
        art.appendChild(pixel);
    }

    const tryFinish = () => {
        if (finished || !animationReady || !appReady) return;

        finished = true;

        splash.classList.add("done");

        setTimeout(() => {
            splash.remove();
        }, 700);
    };

    setTimeout(() => {
        animationReady = true;
        splash.classList.add("ready");

        setTimeout(tryFinish, 500);
    }, total * 25 + 900);

    window.finishWallSplash = () => {
        appReady = true;
        tryFinish();
    };

    setTimeout(() => {
        if (!finished) {
            animationReady = true;
            appReady = true;
            tryFinish();
        }
    }, 5000);
})();
