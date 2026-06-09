const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.post("/scrape", async (req, res) => {

    const url = req.body.url;

    if (!url) {
        return res.json({ status: "error", message: "URL missing" });
    }

    let browser;

    try {

        browser = await puppeteer.launch({
            headless: "new",
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage"
            ]
        });

        const page = await browser.newPage();

        await page.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
        );

        await page.goto(url, {
            waitUntil: "domcontentloaded",
            timeout: 60000
        });

        const data = await page.evaluate(() => {

            const title = document.querySelector("h1")?.innerText?.trim() || "";

            let images = [];
            document.querySelectorAll("img").forEach(img => {
                if (img.src &&
                    !img.src.includes("logo") &&
                    !img.src.includes("icon")) {
                    images.push(img.src);
                }
            });

            images = [...new Set(images)].slice(0, 10);

            let attributes = [];

            document.querySelectorAll("table tr").forEach(row => {
                const cols = row.querySelectorAll("td");

                if (cols.length >= 2) {
                    const name = cols[0].innerText.trim();
                    const value = cols[1].innerText.trim();

                    if (name.startsWith("pa_")) return;

                    attributes.push({ name, value });
                }
            });

            return { title, images, attributes };
        });

        await browser.close();

        res.json({
            status: "success",
            ...data
        });

    } catch (err) {

        if (browser) await browser.close();

        res.json({
            status: "error",
            message: err.message
        });
    }
});

app.get("/", (req, res) => {
    res.send("SCRAPER OK");
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log("SCRAPER RUNNING " + PORT);
});
