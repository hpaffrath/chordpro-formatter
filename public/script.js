function parseChordPro(text) {
    let lines = text.split("\n");
    let metadata = "";
    let parsedHtml = "";
    let insideTab = false;
    let insideChorus = false;
    let insideVerse = false;
    let verseLabel = "";
    let chorusLabel = "";
    let chorusBuffer = "";
    let verseBuffer = "";

    lines.forEach(line => {
        if (line.startsWith("{start_of_tab}")) {
            insideTab = true;
            parsedHtml += `<div class="verse-container"><div></div><div class="tab-section">`;
        } else if (line.startsWith("{end_of_tab}")) {
            insideTab = false;
            parsedHtml += `</div></div>`;
        } else if (insideTab) {
            let formattedLine = line.replace(/-/g, "─").replace(/\|/g, "┼"); // Replace dashes & pipes

            // If the line starts with 'e' or 'E', adjust top corners
            if (/^[e]/.test(line)) {
                formattedLine = formattedLine.replace(/^([eE]\s*)┼/, "$1┌")
                formattedLine = formattedLine.replace(/┼$/, "┐")
                formattedLine = formattedLine.replace(/─┼─/g, "─┬─")
            }
            else if (/^[E]/.test(line)) {
                formattedLine = formattedLine.replace(/^([E]\s*)┼/, "$1└")
                formattedLine = formattedLine.replace(/┼$/, "┘")
                formattedLine = formattedLine.replace(/─┼─/g, "─┴─")
            } else if (/^[BGDA]/.test(line)) {
                formattedLine = formattedLine.replace(/^([BDGA]\s*)┼/, "$1├")
                formattedLine = formattedLine.replace(/[BDGA]┼/g, "$1├"); // Replace "B┼" with "B├" (rotated T facing left)
                formattedLine = formattedLine.replace(/┼$/, "┤")
            }

            parsedHtml += `${formattedLine}<br>`;
        } else if (line.startsWith("{start_of_chorus}")) {
            insideChorus = true;
            chorusLabel = "Chorus";
            chorusBuffer = `<div class="chorus-container">
                              <div class="chorus-label">${chorusLabel}</div>
                              <div class="chorus-content"><blockquote class="chorus">`;
        } else if (line.startsWith("{start_of_chorus:")) {
            insideChorus = true;
            chorusLabel = line.replace("{start_of_chorus:", "").replace("}", "").trim();
            chorusLabel = chorusLabel ? chorusLabel : "Chorus";
            chorusBuffer = `<div class="chorus-container">
                              <div class="chorus-label">${chorusLabel}</div>
                              <div class="chorus-content"><blockquote class="chorus">`;
        } else if (line.startsWith("{end_of_chorus}")) {
            insideChorus = false;
            chorusBuffer += `</blockquote></div></div>`;
            parsedHtml += chorusBuffer;
            chorusBuffer = "";
        } else if (line.startsWith("{start_of_verse}")) {
            insideVerse = true;
            verseLabel = "Verse";
            verseBuffer = `<div class="verse-container">
                              <div class="verse-label">${verseLabel}</div>
                              <div class="verse-content">`;
        } else if (line.startsWith("{start_of_verse:")) {
            insideVerse = true;
            verseLabel = line.replace("{start_of_verse:", "").replace("}", "").trim();
            verseLabel = verseLabel ? verseLabel : "Verse";
            verseBuffer = `<div class="verse-container">
                              <div class="verse-label">${verseLabel}</div>
                              <div class="verse-content">`;
        } else if (line.startsWith("{end_of_verse}")) {
            insideVerse = false;
            verseBuffer += `</div></div>`;
            parsedHtml += verseBuffer;
            verseBuffer = "";
        } else if (line.startsWith("{title: ")) {
            metadata += `<h1 class='title'>${line.replace("{title: ", "").replace("}", "")}</h1>`;
        } else if (line.startsWith("{subtitle: ")) {
            metadata += `<h2 class='subtitle'>${line.replace("{subtitle: ", "").replace("}", "")}</h2>`;
        } else if (line.startsWith("{key: ")) {
            metadata += `<div class='key'>Key: ${line.replace("{key: ", "").replace("}", "")}</div>`;
        } else if (line.startsWith("{artist: ")) {
            metadata += `<div class='artist'>Artist: ${line.replace("{artist: ", "").replace("}", "")}</div>`;
        } else {
            // Apply inline comment formatting before parsing chords and lyrics
            line = line.replace(/\{comment:\s*(.*?)\}/g, "<em class='comment'>$1</em>");
            line = line.replace(/\{c:\s*(.*?)\}/g, "<em class='comment'>$1</em>");
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
    chorusBuffer += `<div class="chorus-container">
                        <div class="chorus-content">${chordLine}${lyricsLine}</div>
                     </div>`;
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
