const express = require("express");
const path = require("path");
const app = express();
const port = 3000;

app.set("view engine", "ejs"); // Use EJS for templating
app.use(express.static("public")); // Serve static files
app.use(express.json()); // Middleware for JSON parsing

const parseChordPro = require("./public/script"); // Import parsing script

// Sample ChordPro Data (initial rendering)
const chordProText = `{title: No Longer Slaves - Capo Version}
{subtitle: Capo Version}
{key: B}
{artist: Bethel}

{start_of_verse: Verse 1}
You unra[B]vel me, with a melody
You surro[E]und me with [F#]a song[B]
Of deliv[B]erance from my enemies
Till [E]all my fears [F#]are gone[B]
{end_of_verse}

{start_of_chorus}
I'm no lon[E]ger a [F#]slave to fear[B]
I [G#m]am a [F#]child of God[B]
{end_of_chorus}
{c: chorus 2x}
`;

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
