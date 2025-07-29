const { connect } = require("puppeteer-real-browser")
async function createBrowser() {
    try {
        if (global.finished == true) return

        global.browser = null

        // console.log('Launching the browser...');

        const { browser } = await connect({
            headless: false,
            args: [
                "--disable-dev-shm-usage",           // Evita uso intensivo de /dev/shm
                "--disable-gpu",                     // Desactiva GPU (no necesaria en server)
                "--disable-setuid-sandbox",          // Menos aislamiento, menos memoria
                "--no-sandbox",                      // Desactiva sandboxing
                "--no-zygote",                       // Desactiva procesos intermedios
                "--disable-software-rasterizer",     // Evita carga de renderizado extra
                "--disable-accelerated-2d-canvas",   // Menos carga en el renderizado
                "--disable-dev-tools",               // DevTools innecesarios
                "--no-first-run",                    // Evita configuraciones iniciales
                "--mute-audio",                      // Silencia todo, menos carga
                "--disable-background-networking",
                "--disable-background-timer-throttling",
                "--disable-breakpad",
                "--disable-client-side-phishing-detection",
                "--disable-default-apps",
                "--disable-features=site-per-process",
                "--disable-hang-monitor",
                "--disable-popup-blocking",
                "--disable-prompt-on-repost",
                "--disable-renderer-backgrounding",
                "--disable-sync",
                "--metrics-recording-only",
                "--no-default-browser-check",
                "--safebrowsing-disable-auto-update",
                "--password-store=basic",
                "--use-mock-keychain",
                "--disable-notifications",
                "--disable-extensions",
                "--hide-scrollbars",
                //"--blink-settings=imagesEnabled=false", // ⚠️ Desactiva imágenes (hace fallar)
                //"--enable-automation",...............// (hace fallar)
                //"--single-process",                  // No forks (hace Fallar)
                "--js-flags=--no-expose-wasm,--jitless", // Desactiva JIT y WebAssembly
            ],
            turnstile: true,
            connectOption: { defaultViewport: null },
            disableXvfb: false,
        })

        // console.log('Browser launched');

        global.browser = browser;

        browser.on('disconnected', async () => {
            if (global.finished == true) return
            console.log('Browser disconnected');
            await new Promise(resolve => setTimeout(resolve, 6000));
            await createBrowser();
        })

    } catch (e) {
        console.log(e.message);
        if (global.finished == true) return
        await new Promise(resolve => setTimeout(resolve, 6000));
        await createBrowser();
    }
}
createBrowser()