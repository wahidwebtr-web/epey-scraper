const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.post("/scrape", async (req, res) => {

    const url = req.body.url;

    if (!url) {
        return res.json({ error: "url missing" });
    }

    try {

        const browser = await puppeteer.launch({
            headless: "new",
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });

        const page = await browser.newPage();
        await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

        const data = await page.evaluate(() => {

            const title = document.querySelector("h1")?.innerText?.trim() || "";

            let images = [];
            document.querySelectorAll("img").forEach(img => {
                let src = img.src;
                if (src && !src.includes("logo") && !src.includes("icon")) {
                    images.push(src);
                }
            });

            images = [...new Set(images)].slice(0, 10);

            let attributes = [];

            document.querySelectorAll("table tr").forEach(row => {
                let tds = row.querySelectorAll("td");
                if (tds.length >= 2) {
                    attributes.push({
                        name: tds[0].innerText.trim(),
                        value: tds[1].innerText.trim()
                    });
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
