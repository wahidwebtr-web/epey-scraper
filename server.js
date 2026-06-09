const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.post("/scrape", async (req, res) => {

    const url = req.body.url;

    if (!url) {
        return res.json({ status: "error", message: "URL missing" });
    }

    try {

        const response = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0"
            },
            timeout: 20000
        });

        const html = response.data;

        // TITLE
        const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
        const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, "").trim() : "";

        // IMAGES
        const imgRegex = /https?:\/\/[^"']+\.(jpg|jpeg|png|webp)/gi;
        let images = html.match(imgRegex) || [];

        images = images
            .filter(i => !i.includes("logo") && !i.includes("icon"))
            .slice(0, 10);

        // ATTRIBUTES (basit tablo parse)
        let attributes = [];
        const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
        let row;

        while ((row = rowRegex.exec(html)) !== null) {

            const cols = row[1].match(/<td[^>]*>([\s\S]*?)<\/td>/gi);

            if (cols && cols.length >= 2) {

                const name = cols[0].replace(/<[^>]*>/g, "").trim();
                const value = cols[1].replace(/<[^>]*>/g, "").trim();

                if (!name || name.startsWith("pa_")) continue;

                attributes.push({ name, value });
            }
        }

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
