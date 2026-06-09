const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { JSDOM } = require("jsdom");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.post("/scrape", async (req, res) => {

    const url = req.body.url;

    if (!url) {
        return res.json({ status: "error", message: "URL missing" });
    }

    try {

        const { data: html } = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0"
            }
        });

        const dom = new JSDOM(html);
        const document = dom.window.document;

        const title =
            document.querySelector("h1")?.textContent?.trim() || "";

        let images = [];
        document.querySelectorAll("img").forEach(img => {
            let src = img.src || "";
            if (
                src &&
                !src.includes("logo") &&
                !src.includes("icon")
            ) {
                images.push(src);
            }
        });

        images = [...new Set(images)].slice(0, 10);

        let attributes = [];

        document.querySelectorAll("table tr").forEach(row => {
            let tds = row.querySelectorAll("td");

            if (tds.length >= 2) {
                let name = tds[0].textContent.trim();
                let value = tds[1].textContent.trim();

                if (!name || name.startsWith("pa_")) return;

                attributes.push({ name, value });
            }
        });

        res.json({
            status: "success",
            title,
            images,
            attributes
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
