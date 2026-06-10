const express = require("express");
const cors = require("cors");

const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

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
                "--disable-dev-shm-usage",
                "--disable-blink-features=AutomationControlled"
            ]
        });

        const page = await browser.newPage();

        await page.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
        );

        await page.setViewport({ width: 1366, height: 768 });

        await page.goto(url, {
            waitUntil: "networkidle2",
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

            images = [...new Set(images)].slice(0, 12);

            let attributes = [];

            document.querySelectorAll("table tr").forEach(row => {

                const tds = row.querySelectorAll("td");

                if (tds.length >= 2) {

                    const name = tds[0].innerText.trim();
                    const value = tds[1].innerText.trim();

                    if (!name || name.startsWith("pa_")) return;

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

app.listen(process.env.PORT || 3001, () => {
    console.log("SCRAPER RUNNING");
});
