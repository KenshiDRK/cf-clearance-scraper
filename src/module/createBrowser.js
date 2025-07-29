const { connect } = require("puppeteer-real-browser");

let retries = 0;
const MAX_RETRIES = 5;

async function createBrowser() {
  try {
    if (global.finished === true) return;

    global.browser = null;

    const { browser } = await connect({
      headless: "false",
      turnstile: true,
      connectOption: { defaultViewport: null },
      disableXvfb: false,
    });

    global.browser = browser;
    retries = 0;

    browser.on("disconnected", async () => {
      if (global.finished === true) return;
      console.log("Browser disconnected");
      await new Promise((resolve) => setTimeout(resolve, 3000));
      createBrowser();
    });
  } catch (e) {
    console.error(e.message);
    if (global.finished === true || retries >= MAX_RETRIES) return;
    retries++;
    await new Promise((resolve) => setTimeout(resolve, 3000));
    createBrowser();
  }
}

createBrowser();