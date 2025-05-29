function parseChordPro(text) {
    let lines = text.split("\n");
    let metadata = "";
    let parsedHtml = "";
    let insideTab = false;
    let insideChorus = false;
    let insideVerse = false;
    let verseLabel = "";
    let chorusBuffer = "";
    let verseBuffer = "";

    lines.forEach(line => {
        if (line.startsWith("{start_of_tab}")) {
            insideTab = true;
            parsedHtml += `<div class="verse-container"><div></div><div class="tab-section">`;
        } else if (line.startsWith("{end_of_tab}")) {
            insideTab = false;
            parsedHtml += `</div></div>`;
        } else if (line.startsWith("{start_of_chorus}")) {
            insideChorus = true;
            chorusBuffer = `<blockquote class="chorus">`;
        } else if (line.startsWith("{end_of_chorus}")) {
            insideChorus = false;
            chorusBuffer += `</blockquote>`;
            parsedHtml += `<div class="verse-container"><div></div><div class="verse-content">${chorusBuffer}</div></div>`;
            chorusBuffer = "";
        } else if (line.startsWith("{start_of_verse}")) {
            insideVerse = true;
            verseLabel = "Verse"; // Default label when none provided
            verseBuffer = `<div class="verse-container">
                              <div class="verse-label">${verseLabel}</div>
                              <div class="verse-content">`;
        } else if (line.startsWith("{start_of_verse:")) {
            insideVerse = true;
            verseLabel = line.replace("{start_of_verse:", "").replace("}", "").trim();
            verseLabel = verseLabel ? verseLabel : "Verse"; // Default to "Verse" if empty
            verseBuffer = `<div class="verse-container">
                              <div class="verse-label">${verseLabel}</div>
                              <div class="verse-content">`;
        } else if (line.startsWith("{end_of_verse}")) {
            insideVerse = false;
            verseBuffer += `</div></div>`;
            parsedHtml += verseBuffer;
            verseBuffer = "";
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
                    chordBuffer = chordCount === 0 ? chord : chord.trimStart();
                    chordCount++;
                    i = line.indexOf("]", i);
                } else {
                    lyricsLine += line[i];
                    padCount++;
                    chordLine += chordBuffer 
                        ? chordBuffer.padEnd(chordBuffer.length, " ") 
                        : (chordCount == 1 && padCount == 2 && insideChorus) ? "" : " ";
                    chordBuffer = "";
                }
            }

            chordLine = `<div class='chord-line'>${chordLine}</div>`;
            lyricsLine = `<div class='lyrics-line'>${lyricsLine}</div>`;

            if (insideChorus) {
                chorusBuffer += chordLine + lyricsLine;
            } else if (insideVerse) {
                verseBuffer += chordLine + lyricsLine;
            } else {
                parsedHtml += chordLine + lyricsLine;
            }
        }
    });

    return { metadata, output: parsedHtml };
}

module.exports = parseChordPro;
