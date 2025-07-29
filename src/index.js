const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const bodyParser = require("body-parser");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const reqValidate = require("./module/reqValidate");

const getSource = require("./endpoints/getSource");
const solveTurnstileMin = require("./endpoints/solveTurnstile.min");
const solveTurnstileMax = require("./endpoints/solveTurnstile.max");
const wafSession = require("./endpoints/wafSession");

const authToken = process.env.authToken || null;
global.browserLength = 0;
global.browserLimit = Number(process.env.browserLimit) || 20;
global.timeOut = Number(process.env.timeOut || 60000);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { code: 429, message: "Too many requests, try again later." },
  })
);

if (process.env.NODE_ENV !== "development") {
  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
  server.timeout = global.timeOut;
}

if (process.env.SKIP_LAUNCH !== "true") require("./module/createBrowser");

app.post("/cf-clearance-scraper", async (req, res) => {
  const data = req.body;
  const check = reqValidate(data);
  if (check !== true) return res.status(400).json({ code: 400, message: "Bad Request", schema: check });
  if (authToken && data.authToken !== authToken) return res.status(401).json({ code: 401, message: "Unauthorized" });
  if (global.browserLength >= global.browserLimit)
    return res.status(429).json({ code: 429, message: "Too Many Requests" });
  if (process.env.SKIP_LAUNCH !== "true" && !global.browser)
    return res.status(500).json({ code: 500, message: "Scanner not ready" });

  let result = { code: 500 };
  global.browserLength++;

  try {
    switch (data.mode) {
      case "source":
        result = await getSource(data).then((res) => ({ source: res, code: 200 })).catch((err) => ({ code: 500, message: err.message }));
        break;
      case "turnstile-min":
        result = await solveTurnstileMin(data).then((res) => ({ token: res, code: 200 })).catch((err) => ({ code: 500, message: err.message }));
        break;
      case "turnstile-max":
        result = await solveTurnstileMax(data).then((res) => ({ token: res, code: 200 })).catch((err) => ({ code: 500, message: err.message }));
        break;
      case "waf-session":
        result = await wafSession(data).then((res) => ({ ...res, code: 200 })).catch((err) => ({ code: 500, message: err.message }));
        break;
    }
  } finally {
    global.browserLength--;
  }

  res.status(result.code ?? 500).json(result);
});

app.use((req, res) => {
  res.status(404).json({ code: 404, message: "Not Found" });
});

if (process.env.NODE_ENV === "development") module.exports = app;