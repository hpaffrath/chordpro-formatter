function extractMetadata(line) {
    if (line.startsWith("{title:")) {
        return `<h1 class='title'>${line.replace("{title:", "").replace("}", "")}</h1>`;
    } else if (line.startsWith("{subtitle:")) {
        return `<h2 class='subtitle'>${line.replace("{subtitle:", "").replace("}", "")}</h2>`;
    } else if (line.startsWith("{key:")) {
        return `<div class='key'>Key: ${line.replace("{key:", "").replace("}", "")}</div>`;
    } else if (line.startsWith("{artist:")) {
        return `<h2 class='artist'>${line.replace("{artist:", "").replace("}", "")}</h2>`;
    }
    return "";
}

function parseVerse(line, insideVerse, verseLabel, verseBuffer, parsedHtml) {
    if (line.startsWith("{start_of_verse}") || line.startsWith("{start_of_part}")) {
        insideVerse = true;
        verseLabel = "Verse"; // Default label if no custom name is given
        verseBuffer = `<div class="verse-container"><div class="verse-label">${verseLabel}</div><div class="verse-content">`;
        return { insideVerse, verseLabel, verseBuffer, parsedHtml, output: "" };
    } else if (line.startsWith("{start_of_verse:") || line.startsWith("{start_of_part:")) {
        insideVerse = true;

        // Extract label correctly
        verseLabel = line.match(/\{start_of_(?:verse|part):(.*?)\}/)?.[1]?.trim() || "Verse";

        verseBuffer = `<div class="verse-container"><div class="verse-label">${verseLabel}</div><div class="verse-content">`;
        return { insideVerse, verseLabel, verseBuffer, parsedHtml, output: "" };
    } else if (line.startsWith("{end_of_verse}") || line.startsWith("{end_of_part}")) {
        insideVerse = false;
        verseBuffer += `</div></div>`;
        parsedHtml += verseBuffer;
        verseBuffer = "";
        return { insideVerse, verseLabel, verseBuffer, parsedHtml, output: "" };
    }
    return { insideVerse, verseLabel, verseBuffer, parsedHtml, output: line };
}

function parseChorus(line, insideChorus, chorusLabel, chorusBuffer, parsedHtml) {
    if (line.startsWith("{start_of_chorus}")) {
        insideChorus = true;
        chorusLabel = "Chorus";
        chorusBuffer = `<div class="chorus-container"><div class="chorus-label">${chorusLabel}</div><div class="chorus-content">`;
        return { insideChorus, chorusLabel, chorusBuffer, parsedHtml, output: "" };
    } else if (line.startsWith("{start_of_chorus:")) {
        insideChorus = true;
        chorusLabel = line.replace("{start_of_chorus:", "").replace("}", "").trim();
        chorusBuffer = `<div class="chorus-container"><div class="chorus-label">${chorusLabel}</div><div class="chorus-content">`;
        return { insideChorus, chorusLabel, chorusBuffer, parsedHtml, output: "" };
    } else if (line.startsWith("{end_of_chorus}")) {
        insideChorus = false;
        chorusBuffer += `</div></div>`;
        parsedHtml += chorusBuffer;
        chorusBuffer = "";
        return { insideChorus, chorusLabel, chorusBuffer, parsedHtml, output: "" };
    }
    return { insideChorus, chorusLabel, chorusBuffer, parsedHtml, output: line };
}

function parseTab(line, insideTab, tabBuffer, parsedHtml) {
    if (line.startsWith("{start_of_tab}")) {
        insideTab = true;
        tabBuffer = `<div class="verse-container"><div></div><div class="tab-section">`;
        return { insideTab, tabBuffer, parsedHtml, output: "" };
    } else if (line.startsWith("{end_of_tab}")) {
        insideTab = false;
        tabBuffer += `</div></div>`;
        parsedHtml += tabBuffer;
        tabBuffer = "";
        return { insideTab, tabBuffer, parsedHtml, output: "" };
    } else if (insideTab) {
        let formattedLine = line.replace(/-/g, "─").replace(/\|/g, "┼");

        if (/^[e]/.test(line)) {
            formattedLine = formattedLine.replace(/^([eE]\s*)┼/, "$1┌").replace(/┼$/, "┐").replace(/─┼─/g, "─┬─");
        } else if (/^[E]/.test(line)) {
            formattedLine = formattedLine.replace(/^([E]\s*)┼/, "$1└").replace(/┼$/, "┘").replace(/─┼─/g, "─┴─");
        } else if (/^[BGDA]/.test(line)) {
            formattedLine = formattedLine.replace(/^([BDGA]\s*)┼/, "$1├").replace(/[BDGA]┼/g, "$1├").replace(/┼$/, "┤");
        }

        tabBuffer += `<div class="tab-line">${formattedLine}</div>`;
        return { insideTab, tabBuffer, parsedHtml, output: "" };
    }
    return { insideTab, tabBuffer, parsedHtml, output: line };
}

function parseComment(line) {
    return line.replace(/\{comment:\s*(.*?)\}/g, "<em class='comment'>$1</em>")
        .replace(/\{c:\s*(.*?)\}/g, "<em class='comment'>$1</em>");
}

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
    let tabBuffer = "";

    lines.forEach(line => {
        // Process metadata first
        let extractedMetadata = extractMetadata(line);
        if (extractedMetadata) {
            metadata += extractedMetadata;
            return; // Skip further processing
        }

        // Process blocks
        let verseData = parseVerse(line, insideVerse, verseLabel, verseBuffer, parsedHtml);
        insideVerse = verseData.insideVerse;
        verseLabel = verseData.verseLabel;
        verseBuffer = verseData.verseBuffer;
        parsedHtml = verseData.parsedHtml;
        if (verseData.output === "") return;

        let chorusData = parseChorus(line, insideChorus, chorusLabel, chorusBuffer, parsedHtml);
        insideChorus = chorusData.insideChorus;
        chorusLabel = chorusData.chorusLabel;
        chorusBuffer = chorusData.chorusBuffer;
        parsedHtml = chorusData.parsedHtml;
        if (chorusData.output === "") return;

        let tabData = parseTab(line, insideTab, tabBuffer, parsedHtml);
        insideTab = tabData.insideTab;
        tabBuffer = tabData.tabBuffer;
        parsedHtml = tabData.parsedHtml;
        if (tabData.output === "") return;

        // Handle empty lines
        if (line.trim() === "") {
            if (insideChorus) {
                chorusBuffer += "<br>";
            } else if (insideVerse) {
                verseBuffer += "<br>";
            } else {
                parsedHtml += "<br>";
            }
            return;
        }

        // Parse comments
        line = parseComment(line);

        // Process chords and lyrics with proper alignment
        let chordLine = "";
        let lyricsLine = "";
        let inChord = false;
        let chordBuffer = "";
        let chordStartIndex = -1;

        for (let i = 0; i < line.length; i++) {
            if (line[i] === '[') {
                inChord = true;
                chordBuffer = "";
                chordStartIndex = lyricsLine.length;  // Mark where the chord should start
                continue;
            } else if (line[i] === ']' && inChord) {
                inChord = false;
                
                // Place chord at the marked position
                while (chordLine.length < chordStartIndex) {
                    chordLine += " ";
                }
                chordLine += chordBuffer;
                
                continue;
            }
            
            if (inChord) {
                chordBuffer += line[i];
            } else {
                lyricsLine += line[i];
                
                // Add space to chord line if needed to maintain alignment
                if (chordLine.length < lyricsLine.length) {
                    chordLine += " ";
                }
            }
        }

        // Pad chord line to match lyrics line length
        chordLine = chordLine.padEnd(lyricsLine.length, " ");

        chordLine = `<div class='chord-line'>${chordLine}</div>`;
        lyricsLine = `<div class='lyrics-line'>${lyricsLine}</div>`;

        // Add to appropriate buffer
        if (insideChorus) {
            chorusBuffer += chordLine + lyricsLine;
        } else if (insideVerse) {
            verseBuffer += chordLine + lyricsLine;
        } else {
            parsedHtml += chordLine + lyricsLine;
        }
    });

    // Flush any remaining buffers
    if (insideVerse) {
        verseBuffer += `</div></div>`;
        parsedHtml += verseBuffer;
    }
    if (insideChorus) {
        chorusBuffer += `</div></div>`;
        parsedHtml += chorusBuffer;
    }
    if (insideTab) {
        tabBuffer += `</div></div>`;
        parsedHtml += tabBuffer;
    }

    return { metadata, output: parsedHtml };
}

module.exports = parseChordPro;