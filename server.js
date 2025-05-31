const express = require("express");
const path = require("path");
const app = express();
const port = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import parsing script
const parseChordPro = require("./public/script");

// Sample ChordPro Data for initial rendering
const chordProText = `{title: Hotel California}
{artist: Eagles}
{key: Bm}

{start_of_chorus}
[Am]Welcome to the [E7]Hotel Cali[G]fornia
[D]Such a lovely [F]place, [C]such a lovely [E7]face
{end_of_chorus}

{start_of_verse: Verse 1}
[G]On a dark desert highway, [D]cool wind in my hair
[Em]Warm smell of colitas, [F]rising up through the air
{end_of_verse}

{comment: Guitar Solo}
{start_of_tab}
e|-----0-----0-----0-----0-----|
B|---1---1-----1-----1-----1---|
G|-----2-----0-----0-----0-----|
D|-----------------------------|
A|-----------------------------|
E|-----------------------------|
{end_of_tab}`;

// Cache for storing recently rendered songs
const renderCache = new Map();
const CACHE_SIZE = 10;
const CACHE_EXPIRATION = 5 * 60 * 1000; // 5 minutes

app.get("/", (req, res) => {
    try {
        const formattedData = parseChordPro(chordProText);
        res.render("index", { 
            metadata: formattedData.metadata, 
            output: formattedData.output,
            initialContent: chordProText
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
        
        // Check cache first
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
        
        // Update cache
        if (chordPro.length > 0) {
            renderCache.set(chordPro, {
                data: result,
                timestamp: Date.now()
            });
            
            // Enforce cache size limit
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

// Error handling middleware
app.use((err, req, res, next) => {
    console.error("Server error:", err);
    res.status(500).render("error", {
        message: "An unexpected error occurred",
        error: process.env.NODE_ENV === 'development' ? err.stack : 'Internal Server Error'
    });
});

// 404 handler
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