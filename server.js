const express = require("express");
const path = require("path");
const app = express();
const port = 3000;

app.set("view engine", "ejs"); // Use EJS for templating
app.use(express.static("public")); // Serve static files

// Sample ChordPro Data
const chordProText = `{title: My Song}
{subtitle: A Beautiful Melody}
{key: C Major}
{start_of_verse: Verse 1}
[C]Hello [G]world
{end_of_verse}
{start_of_chorus: Chorus 1}
[Am]This [F]is [C]a test
{end_of_chorus}
{start_of_tab}
E|----11-------8--------6----|----6--------5------6------|
B|----11-------10-------6----|----8--------6------6------|
G|----12-------8--------7----|----7--------5------7------|
D|---------------------------|---------------------------|
A|---------------------------|---------------------------|
E|---------------------------|---------------------------|
{end_of_tab}
{start_of_verse}
[D]Another [G]line
{end_of_verse}
{start_of_chorus}
[Am]This [F]is a te[C]st 2
{end_of_chorus}
`;

const parseChordPro = require("./public/script"); // Import script

app.get("/", (req, res) => {
    const formattedData = parseChordPro(chordProText);
    res.render("index", { metadata: formattedData.metadata, output: formattedData.output });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
