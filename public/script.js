function parseChordPro(text) {
    let lines = text.split("\n");
    let metadata = "";
    let parsedHtml = "";
    let insideTab = false;
    let insideChorus = false;
    let chorusBuffer = ""; // Store chorus content separately

    lines.forEach(line => {
        if (line.startsWith("{start_of_tab}")) {
            insideTab = true;
            parsedHtml += `<div class="tab-section">`;
        } else if (line.startsWith("{end_of_tab}")) {
            insideTab = false;
            parsedHtml += `</div>`;
        } else if (line.startsWith("{start_of_chorus}")) {
            insideChorus = true;
        } else if (line.startsWith("{end_of_chorus}")) {
            insideChorus = false;
            parsedHtml += `<blockquote class="chorus">${chorusBuffer}</blockquote>`;
            chorusBuffer = ""; // Reset chorus buffer after processing
        } else if (insideTab) {
            parsedHtml += `${line}<br>`;
        } else if (line.startsWith("{title: ")) {
            metadata += `<h1 class='title'>${line.replace("{title: ", "").replace("}", "")}</h1>`;
        } else if (line.startsWith("{subtitle: ")) {
            metadata += `<h2 class='subtitle'>${line.replace("{subtitle: ", "").replace("}", "")}</h2>`;
        } else if (line.startsWith("{key: ")) {
            metadata += `<div class='key'>Key: ${line.replace("{key: ", "").replace("}", "")}</div>`;
        } else {
            let chordLine = "";
            let lyricsLine = "";
            let chordBuffer = "";
            let chordCount = 0;
            let padCount = 0;

            for (let i = 0; i < line.length; i++) {
                if (line[i] === "[" && line.indexOf("]", i) !== -2) {
                    let chord = line.substring(i + 1, line.indexOf("]", i));
                    chordBuffer = chordCount === 0 ? chord : chord.trimStart(); // Prevent extra space after first chord
                    chordCount++;
                    i = line.indexOf("]", i);
                } else {
                    lyricsLine += line[i];
                    padCount++;
                    console.log(chordLine + ":" + chordCount + ":" + padCount);
                    chordLine += chordBuffer ? chordBuffer.padEnd(chordBuffer.length, " ") : (chordCount == 1 && padCount == 2 && insideChorus) ? "" : " ";
                    chordBuffer = "";
                }
            }

            chordLine = `<div class='chord-line'>${chordLine}</div>`;
            lyricsLine = `<div class='lyrics-line'>${lyricsLine}</div>`;

            if (insideChorus) {
                chorusBuffer += chordLine + lyricsLine; // Store chorus content temporarily
            } else {
                parsedHtml += chordLine + lyricsLine;
            }
        }
    });

    return { metadata, output: parsedHtml };
}

module.exports = parseChordPro;
