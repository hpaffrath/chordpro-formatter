const express = require("express");
const path = require("path");
const app = express();
const port = 3000;

app.set("view engine", "ejs"); // Use EJS for templating
app.use(express.static("public")); // Serve static files
app.use(express.json()); // Middleware for JSON parsing

const parseChordPro = require("./public/script"); // Import parsing script

// Sample ChordPro Data (initial rendering)
const chordProText = ``;

app.get("/", (req, res) => {
    const formattedData = parseChordPro(chordProText);
    res.render("index", { metadata: formattedData.metadata, output: formattedData.output });
});

// API endpoint for rendering ChordPro input dynamically
app.post("/render", (req, res) => {
    const formattedData = parseChordPro(req.body.chordPro);
    res.json({ metadata: formattedData.metadata, output: formattedData.output });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
