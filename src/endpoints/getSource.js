function getSource({ url, proxy }) {
  const MAX_HTML_SIZE = 5 * 1024 * 1024; // 5MB
  return new Promise(async (resolve, reject) => {
    if (!url) return reject(new Error("Missing url parameter"));

    const context = await global.browser
      .createBrowserContext({
        proxyServer: proxy ? `http://${proxy.host}:${proxy.port}` : undefined,
      })
      .catch(() => null);

    if (!context) return reject(new Error("Failed to create browser context"));

    let isResolved = false;
    const cl = setTimeout(async () => {
      if (!isResolved) {
        await context.close();
        reject(new Error("Timeout Error"));
      }
    }, global.timeOut || 60000);

    try {
      const page = await context.newPage();

      if (proxy?.username && proxy?.password) {
        await page.authenticate({
          username: proxy.username,
          password: proxy.password,
        });
      }

      await page.setRequestInterception(true);
      page.on("request", (request) => {
        const type = request.resourceType();
        if (["stylesheet", "font", "media"].includes(type)) {
          return request.abort();
        }
        request.continue();
      });

      page.on("response", async (res) => {
        try {
          if ([200, 302].includes(res.status()) && [url, url + "/"].includes(res.url())) {
            await page.waitForNavigation({ waitUntil: "load", timeout: 5000 }).catch(() => {});
            const html = await page.content();
            if (html.length > MAX_HTML_SIZE) throw new Error("HTML too large");
            await context.close();
            isResolved = true;
            clearTimeout(cl);
            resolve(html);
          }
        } catch (e) {
          reject(e);
        }
      });

      await page.goto(url, { waitUntil: "domcontentloaded" });
    } catch (e) {
      if (!isResolved) {
        await context.close();
        clearTimeout(cl);
        reject(e);
      }
    }
  });
}

module.exports = getSource;
