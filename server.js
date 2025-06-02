const express = require("express");
const path = require("path");
const app = express();
const port = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const parseChordPro = require("./public/script");

const renderCache = new Map();
const CACHE_SIZE = 10;
const CACHE_EXPIRATION = 5 * 60 * 1000;

app.get("/", (req, res) => {
    try {
        const exampleChordPro = ``;

        const formattedData = parseChordPro(exampleChordPro);
        
        console.log("Initial Render Debug:", formattedData); // Debugging step

        res.render("index", { 
            metadata: formattedData.metadata, 
            output: formattedData.output
        });
    } catch (error) {
        console.error("Initial render error:", error);
        res.status(500).render("error", { 
            message: "Failed to initialize the formatter",
            error: error.message
        });
    }
});

app.post("/render", (req, res) => {
    try {
        const chordPro = req.body.chordPro || "";

        if (!chordPro.trim()) {
            return res.status(400).json({ error: "Empty ChordPro input" });
        }
        
        if (renderCache.has(chordPro)) {
            const cached = renderCache.get(chordPro);
            if (Date.now() - cached.timestamp < CACHE_EXPIRATION) {
                return res.json(cached.data);
            }
            renderCache.delete(chordPro);
        }

        const formattedData = parseChordPro(chordPro);
        const result = { 
            metadata: formattedData.metadata, 
            output: formattedData.output 
        };

        console.log("Render Debug:", result); // Debugging step

        if (chordPro.length > 0) {
            renderCache.set(chordPro, {
                data: result,
                timestamp: Date.now()
            });

            if (renderCache.size > CACHE_SIZE) {
                const oldestKey = [...renderCache.keys()][0];
                renderCache.delete(oldestKey);
            }
        }
        
        res.json(result);
    } catch (error) {
        console.error("Rendering error:", error);
        res.status(500).json({
            error: "Failed to process ChordPro text",
            details: error.message
        });
    }
});

app.use((err, req, res, next) => {
    console.error("Server error:", err);
    res.status(500).render("error", {
        message: "An unexpected error occurred",
        error: process.env.NODE_ENV === 'development' ? err.stack : 'Internal Server Error'
    });
});

app.use((req, res) => {
    res.status(404).render("error", {
        message: "Page not found",
        error: "The requested resource could not be found"
    });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
