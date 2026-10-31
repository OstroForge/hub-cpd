(function () {
  const CHOICES = [
    { id: "title", label: "Title" },
    { id: "poll", label: "Poll" },
    { id: "score", label: "Score a patient" },
    { id: "columns", label: "Two columns" },
    { id: "steps", label: "Three columns" },
    { id: "pathway", label: "Numbered path" },
    { id: "photo", label: "Text and photo" },
    { id: "quote", label: "Quote" },
    { id: "banners", label: "Banner list" },
    { id: "split", label: "Yes or no" },
    { id: "pairs", label: "Think again" },
    { id: "table", label: "Comparison table" },
    { id: "scales", label: "Two scales" },
    { id: "reveal", label: "Picture after a question" },
    { id: "rows", label: "Picture rows" },
    { id: "doses", label: "Picture and steps" },
    { id: "quotes", label: "Two quotes" },
    { id: "shock", label: "Critically ill" },
    { id: "aims", label: "Session aims" },
    { id: "feedback", label: "Feedback" },
    { id: "certificate", label: "Certificate" }
  ];

  const TONES = [["red", "Red"], ["green", "Green"], ["dark", "Navy"], ["gold", "Gold"], ["teal", "Teal"]];
  const CARD_TONES = [["normal", "Normal"], ["warn", "Warning"], ["fact", "Fact"], ["myth", "Myth"]];

  function owns(template) {
    return ["score", "pathway", "split", "pairs", "table", "scales", "reveal", "rows", "doses", "quotes", "shock", "aims", "feedback", "certificate"].indexOf(template) !== -1;
  }

  function prepare(slide) {
    if (slide.template === "columns" || slide.template === "quote") {
      slide.leftTone = slide.leftTone || "normal";
      slide.rightTone = slide.rightTone || (slide.template === "quote" ? "warn" : "normal");
      slide.leftProse = !!slide.leftProse;
      slide.rightProse = !!slide.rightProse;
      slide.leftTable = !!slide.leftTable;
      slide.rightTable = !!slide.rightTable;
      slide.leftNote = slide.leftNote || "";
      slide.rightNote = slide.rightNote || "";
      slide.callout = slide.callout || "";
      slide.calloutReveal = !!slide.calloutReveal;
    }
    if (slide.template === "photo") {
      slide.cardTitle = slide.cardTitle || "";
      slide.cardBody = slide.cardBody || "";
      slide.cardTone = slide.cardTone || "warn";
    }
    if (slide.template === "score") {
      slide.kicker = slide.kicker || "Your turn";
      slide.title = slide.title || "Score this patient";
      slide.prompt = slide.prompt || "Score this patient on the NEWS2 chart.";
      slide.sceneText = slide.sceneText || "";
      slide.image = slide.image || "";
      slide.imageAlt = slide.imageAlt || "";
      slide.hx = slide.hx || "";
      slide.rr = slide.rr || "";
      slide.spo2 = slide.spo2 || "";
      slide.o2 = slide.o2 || "";
      slide.sbp = slide.sbp || "";
      slide.pulse = slide.pulse || "";
      slide.con = slide.con || "Alert";
      slide.temp = slide.temp || "";
      slide.expectedScale = slide.expectedScale || 1;
      slide.expectedTotal = slide.expectedTotal || 0;
      slide.teach = slide.teach || "";
      slide.resultsTitle = slide.resultsTitle || "How the room scored";
      slide.pollId = slide.pollId || "";
      slide.detail = slide.detail || "";
    }
    if (slide.template === "pathway") {
      slide.kicker = "On the job";
      slide.title = slide.title || "Three steps";
      slide.oneTitle = "On scene";
      slide.oneBody = "";
      slide.twoTitle = "When to convey";
      slide.twoBody = "";
      slide.threeTitle = "What to say";
      slide.threeBody = "";
      slide.reveal = true;
    }
    if (slide.template === "split") {
      slide.kicker = "On scene";
      slide.title = slide.title || "Which path?";
      slide.scene = "The patient in front of you";
      slide.question = "Are they critically ill?";
      slide.yesTitle = "Yes";
      slide.yesBody = "";
      slide.noTitle = "No";
      slide.noBody = "";
      slide.footTitle = "Both paths";
      slide.footBody = "";
    }
    if (slide.template === "pairs") {
      slide.kicker = "Look again";
      slide.title = slide.title || "Or something else?";
      slide.leftTitle = "Supports this";
      slide.leftBody = "";
      slide.rightTitle = "Think again if you find";
      slide.pairsText = "";
    }
    if (slide.template === "table") {
      slide.kicker = "Compare";
      slide.title = slide.title || "Side by side";
      slide.intro = "";
      slide.tableText = " | Column A | Column B\nRow |  | ";
      slide.closing = "";
    }
    if (slide.template === "scales") {
      slide.kicker = "Worked example";
      slide.title = slide.title || "Same patient, two scales";
      slide.scene = "";
      slide.image = "";
      slide.imageAlt = "";
      slide.scoreHead = "SpO2";
      slide.row1Label = "Scale 1";
      slide.row1Score = "3";
      slide.row1Tone = "bad";
      slide.row1Text = "";
      slide.row2Label = "Scale 2";
      slide.row2Score = "0";
      slide.row2Tone = "good";
      slide.row2Text = "";
      slide.callout = "";
      slide.calloutReveal = true;
    }
    if (slide.template === "reveal") {
      slide.kicker = "A question from the room";
      slide.title = slide.title || "What does the document say?";
      slide.question = "";
      slide.image = "";
      slide.imageAlt = "";
      slide.caption = "";
      slide.cardTitle = "What it means";
      slide.cardBody = "";
      slide.banner = "";
      slide.bannerTone = "teal";
    }
    if (slide.template === "rows") {
      slide.kicker = "Equipment";
      slide.title = slide.title || "Which one to use";
      ["one", "two", "three"].forEach((name) => {
        slide[name + "Image"] = "";
        slide[name + "Alt"] = "";
        slide[name + "Title"] = "";
        slide[name + "Text"] = "";
        slide[name + "Step"] = "";
        slide[name + "StepText"] = "";
        slide[name + "StepTone"] = name === "one" ? "dark" : name === "two" ? "gold" : "red";
      });
    }
    if (slide.template === "doses") {
      slide.kicker = "Treatment";
      slide.title = slide.title || "Doses and the steps";
      slide.image = "";
      slide.imageAlt = "";
      slide.leftTitle = "Doses";
      slide.leftBody = "";
      slide.rightTitle = "The limit";
      slide.rightBody = "";
      ["one", "two", "three", "four"].forEach((name, index) => {
        slide[name + "Title"] = "";
        slide[name + "Text"] = "";
        slide[name + "Tone"] = ["green", "gold", "dark", "green"][index];
      });
    }
    if (slide.template === "quotes") {
      slide.kicker = "The wording";
      slide.title = slide.title || "What the guidance says";
      slide.oneTitle = "";
      slide.oneBody = "";
      slide.oneNote = "";
      slide.twoTitle = "";
      slide.twoBody = "";
      slide.twoNote = "";
    }
    if (slide.template === "shock") {
      slide.kicker = "Critically unwell";
      slide.title = slide.title || "High-flow oxygen now";
      slide.image = "";
      slide.imageAlt = "";
      slide.scene = "";
      slide.v1 = "";
      slide.v1Label = "SpO2";
      slide.v2 = "";
      slide.v2Label = "BP";
      slide.v3 = "";
      slide.v3Label = "Pulse";
      slide.v4 = "";
      slide.v4Label = "RR";
      slide.actions = "";
      slide.banner = "";
    }
    if (slide.template === "aims") {
      slide.kicker = "Core messages";
      slide.title = slide.title || "By the end of this session";
      slide.leadTitle = "By the end you will have refreshed how to:";
      slide.leadBody = "";
      slide.leftTitle = "";
      slide.leftBody = "";
      slide.leftNote = "";
      slide.rightTitle = "";
      slide.rightBody = "";
      slide.rightNote = "";
      slide.banner1 = "";
      slide.banner2 = "";
      slide.callout = "";
    }
    if (slide.template === "feedback") {
      slide.kicker = "Feedback";
      slide.title = slide.title || "Help shape the next session";
      slide.line1 = "Please provide feedback on this session";
      slide.line2 = "Any suggestions for a future session?";
      slide.feedback = true;
    }
    if (slide.template === "certificate") {
      slide.kicker = "";
      slide.title = slide.title || "Record attendance for a CPD certificate";
      slide.image = "";
      slide.guide = "";
      slide.hostedOnly = true;
      slide.self = false;
    }
  }

  function sample(id) {
    const samples = {
      title: { title: "Session title", subtitle: "One line on what this hour is for", kicker: "Ambulance Clinical Refreshers" },
      poll: { title: "Check", prompt: "What is the default?", optionsText: "Scale 1\nScale 2", teach: "Scale 1, unless type 2 failure is already documented." },
      score: { title: "Score this patient", sceneText: "Known COPD\nNo alert card\nSpO2 90% on air", rr: "22 /min", spo2: "90% on air", prompt: "Tap one cell on each row." },
      columns: { title: "Two sides", leftTitle: "Do this", leftBody: "First point\nSecond point", rightTitle: "Not this", rightBody: "The wrong habit\nWhy it misleads", banner: "The line you want them to remember", bannerTone: "red", bannerReveal: true },
      steps: { title: "Three parts", oneTitle: "Ask", oneBody: "Baseline saturations\nAlert card", twoTitle: "Examine", twoBody: "Work of breathing\nSpO2 and respiratory rate", threeTitle: "Red flags", threeBody: "Exhaustion\nSilent chest" },
      pathway: { title: "Three steps", oneTitle: "On scene", oneBody: "Follow the alert card\nWatch for tiring", twoTitle: "Hospital if", twoBody: "Cannot cope at home\nSevere breathlessness", threeTitle: "Then say", threeBody: "NEWS total and the parts\nWhich scale, and why" },
      photo: { title: "Picture and explanation", body: "What to notice\nWhat it does not prove", caption: "Caption under the picture", cardTitle: "The trap", cardBody: "One sentence under the picture." },
      quote: { title: "The wording", quote: "Some patients — not all.", leftTitle: "What that says", leftBody: "The word is some\nIt does not diagnose type 2", rightTitle: "What it does not say", rightBody: "It does not say every patient is Scale 2.", rightProse: true, rightTone: "warn" },
      banners: { title: "Key points", lines: "First line to remember\nteal | Second line\ngreen | Third line\nnavy | Fourth line\nred | Fifth line", reveal: true },
      split: { title: "Which path?", scene: "Breathless patient. Known or suspected COPD.", question: "Are they critically ill or tiring?", yesTitle: "Yes — time-critical", yesBody: "Do not withhold high-flow oxygen\nTIME-CRITICAL transfer", noTitle: "No — controlled oxygen", noBody: "Target 88–92%\nVenturi, then review", footTitle: "Both paths", footBody: "Scale 1 unless type 2 failure is already documented." },
      pairs: { title: "Or something else?", leftTitle: "Supports an exacerbation", leftBody: "More breathless\nMore sputum", rightTitle: "Think again if you find", pairsText: "Chest pain | ACS, PE, pneumothorax\nFever | Pneumonia" },
      table: { title: "Two types", tableText: " | Type 1 | Type 2\nBlood gas | Low oxygen | Low oxygen and high CO2\nNEWS2 | Scale 1 | Scale 1 unless type 2 is documented" },
      scales: { title: "Same patient, two scales", scene: "Known COPD. No alert card. SpO2 90% on air.", scoreHead: "SpO2 90% on air", row1Label: "Scale 1 — correct default", row1Score: "3", row1Text: "This person is hypoxic.", row2Label: "Scale 2 — incorrect habit", row2Score: "0", row2Text: "The hypoxia has been hidden.", callout: "The wrong scale can hide a hypoxic patient." },
      reveal: { title: "What does the notice say?", question: "Does one red score mean I pre-alert every time?", cardTitle: "Read the line", cardBody: "The criterion is on oxygen\nOn air is a different decision", banner: "Read the words on the page", caption: "The extract, with the line marked" },
      rows: { oneTitle: "Start here", oneText: "The first device and the target.", twoTitle: "Step up", twoText: "If the first is not enough.", threeTitle: "High flow", threeText: "When they are critically ill.", oneStep: "First device", oneStepText: "Where you start.", twoStep: "Not enough", twoStepText: "What you change.", threeStep: "The limit", threeStepText: "What the timer is for." },
      doses: { title: "Doses and the steps", leftTitle: "Adult doses", leftBody: "Salbutamol 5 mg\nIpratropium once", rightTitle: "What the timer limits", rightBody: "How long oxygen drives the neb\nNot a cap on the number of doses", oneTitle: "1. Give it", oneText: "Six minutes", twoTitle: "2. Stop", twoText: "Back to the target", threeTitle: "3. Still needed?", threeText: "Another six minutes", fourTitle: "Once only", fourText: "Ipratropium" },
      quotes: { title: "Where it is written", oneTitle: "The guideline", oneBody: "The sentence you want read aloud.", twoTitle: "The monograph", twoBody: "The same limit, said again.", twoNote: "A short note under the second quote." },
      shock: { title: "High-flow oxygen now", scene: "Exhausted, cyanosed, barely responding.", v1: "80%", v2: "86/50", v3: "128", v4: "32", actions: "Do not withhold oxygen\nReservoir mask now", banner: "The timer is the nebuliser, not the oxygen" },
      aims: { title: "By the end of this session", leadBody: "Recognise the emergency\nUse the right oxygen\nHand over a score the hospital can trust", leftTitle: "Treatment", leftBody: "The oxygen target.", leftNote: "Where that decision comes from.", rightTitle: "The score", rightBody: "Which scale, and when.", rightNote: "The record you need first.", banner1: "These are separate decisions", banner2: "They do not travel together", callout: "Say both out loud." },
      feedback: { line1: "Please provide feedback on this session", line2: "Any suggestions for a future session?" },
      certificate: { title: "Record attendance for a CPD certificate" }
    };
    return samples[id] || null;
  }

  function fields(template) {
    const text = (name, label, box) => ({ name: name, label: label, kind: "text", box: box || "" });
    const area = (name, label, box) => ({ name: name, label: label, kind: "textarea", box: box || "" });
    const tone = (name, label) => ({ name: name, label: label, kind: "select", options: TONES });
    if (template === "score") {
      return [
        { kind: "hint", label: "The preview shows a stand-in for the live QR code, with the response count. Drag it to move it. Drag the dark square to change its size. Double-click to put it back." },
        area("prompt", "Question"),
        area("sceneText", "Scene lines, one per line"),
        text("image", "Monitor picture path"),
        text("imageAlt", "Picture description"),
        area("hx", "History line"),
        text("rr", "Respiratory rate"),
        text("spo2", "SpO2"),
        text("o2", "Oxygen"),
        text("sbp", "Blood pressure"),
        text("pulse", "Pulse"),
        text("con", "Consciousness"),
        text("temp", "Temperature"),
        text("expectedScale", "Correct scale (1 or 2)"),
        text("expectedTotal", "Correct total"),
        area("teach", "Teaching point"),
        text("resultsTitle", "Results slide title")
      ];
    }
    if (template === "pathway") {
      return [
        text("oneTitle", "Step 1 heading"), area("oneBody", "Step 1 bullets, one per line", "one"),
        text("twoTitle", "Step 2 heading"), area("twoBody", "Step 2 bullets, one per line", "two"),
        text("threeTitle", "Step 3 heading"), area("threeBody", "Step 3 bullets, one per line", "three"),
        { name: "reveal", label: "Bring in steps 2 and 3 on a click", kind: "check" }
      ];
    }
    if (template === "split") {
      return [
        text("scene", "Scene line", "scene"),
        text("question", "Question", "question"),
        text("yesTitle", "Yes heading"), area("yesBody", "Yes bullets, one per line", "yes"),
        text("noTitle", "No heading"), area("noBody", "No bullets, one per line", "no"),
        text("footTitle", "Closing bar heading"), area("footBody", "Closing bar text", "foot")
      ];
    }
    if (template === "pairs") {
      return [
        text("leftTitle", "Left heading"), area("leftBody", "Left bullets, one per line", "left"),
        text("rightTitle", "Right heading"),
        area("pairsText", "Clue, then a | then the other diagnosis. One pair per line", "right")
      ];
    }
    if (template === "table") {
      return [
        area("intro", "Line above the table", "intro"),
        area("tableText", "First line is the headings, separated by |. Then one row per line. A cell can start bad: good: or mid:", "table"),
        area("closing", "Line under the table", "closing")
      ];
    }
    if (template === "scales") {
      return [
        area("scene", "The patient", "scene"),
        text("image", "Monitor picture path"),
        text("imageAlt", "Picture description"),
        { kind: "hint", label: "Drag the picture in the preview to move it. Drag the dark square on its corner to make it larger or smaller. Double-click the picture to put it back." },
        text("scoreHead", "Middle column heading"),
        text("row1Label", "First scale"), text("row1Score", "First score"),
        { name: "row1Tone", label: "First score colour", kind: "select", options: [["bad", "Red"], ["good", "Green"], ["mid", "Amber"]] },
        area("row1Text", "What that score means"),
        text("row2Label", "Second scale"), text("row2Score", "Second score"),
        { name: "row2Tone", label: "Second score colour", kind: "select", options: [["bad", "Red"], ["good", "Green"], ["mid", "Amber"]] },
        area("row2Text", "What that score means", "table"),
        area("callout", "Closing line", "callout"),
        { name: "calloutReveal", label: "Bring the closing line in on a click", kind: "check" }
      ];
    }
    if (template === "reveal") {
      return [
        area("question", "Question shown first", "question"),
        text("image", "Picture path"),
        text("imageAlt", "Picture description"),
        { kind: "hint", label: "Drag the picture in the preview to move it. Drag the dark square on its corner to make it larger or smaller. Double-click the picture to put it back." },
        text("caption", "Caption"),
        text("cardTitle", "Card heading"),
        area("cardBody", "Card bullets, one per line", "card"),
        text("banner", "Banner", "banner"),
        tone("bannerTone", "Banner colour")
      ];
    }
    if (template === "rows") {
      const block = (name, label) => [
        text(name + "Image", label + " picture path"),
        text(name + "Alt", label + " picture description"),
        text(name + "Title", label + " heading"),
        area(name + "Text", label + " text", name),
        text(name + "Step", label + " step heading"),
        area(name + "StepText", label + " step text", name + "Step"),
        tone(name + "StepTone", label + " step colour")
      ];
      return [{ kind: "hint", label: "Drag a picture in the preview to move it. Drag the dark square on its corner to make it larger or smaller. Double-click the picture to put it back." }].concat(block("one", "First")).concat(block("two", "Second")).concat(block("three", "Third"));
    }
    if (template === "doses") {
      return [
        text("image", "Picture path"), text("imageAlt", "Picture description"),
        { kind: "hint", label: "Drag the picture in the preview to move it. Drag the dark square on its corner to make it larger or smaller. Double-click the picture to put it back." },
        text("leftTitle", "First card heading"), area("leftBody", "First card bullets, one per line", "left"),
        text("rightTitle", "Second card heading"), area("rightBody", "Second card bullets, one per line", "right"),
        text("oneTitle", "Step 1 heading"), text("oneText", "Step 1 text", "one"), tone("oneTone", "Step 1 colour"),
        text("twoTitle", "Step 2 heading"), text("twoText", "Step 2 text", "two"), tone("twoTone", "Step 2 colour"),
        text("threeTitle", "Step 3 heading"), text("threeText", "Step 3 text", "three"), tone("threeTone", "Step 3 colour"),
        text("fourTitle", "Step 4 heading"), text("fourText", "Step 4 text", "four"), tone("fourTone", "Step 4 colour")
      ];
    }
    if (template === "quotes") {
      return [
        text("oneTitle", "First heading"), area("oneBody", "First quote", "one"), text("oneNote", "Note under the first quote"),
        text("twoTitle", "Second heading"), area("twoBody", "Second quote", "two"), text("twoNote", "Note under the second quote")
      ];
    }
    if (template === "shock") {
      return [
        text("image", "Monitor picture path"), text("imageAlt", "Picture description"),
        { kind: "hint", label: "Drag the picture in the preview to move it. Drag the dark square on its corner to make it larger or smaller. Double-click the picture to put it back." },
        area("scene", "Scene line", "scene"),
        text("v1", "First number"), text("v1Label", "First label"),
        text("v2", "Second number"), text("v2Label", "Second label"),
        text("v3", "Third number"), text("v3Label", "Third label"),
        text("v4", "Fourth number"), text("v4Label", "Fourth label"),
        area("actions", "Actions, one per line", "actions"),
        text("banner", "Red banner", "banner")
      ];
    }
    if (template === "aims") {
      return [
        text("leadTitle", "Intro heading"), area("leadBody", "Intro bullets, one per line", "lead"),
        text("leftTitle", "Left heading"), area("leftBody", "Left text", "left"), text("leftNote", "Left note"),
        text("rightTitle", "Right heading"), area("rightBody", "Right text", "right"), area("rightNote", "Right notes, one paragraph per line"),
        text("banner1", "First banner", "banner1"), text("banner2", "Second banner", "banner2"),
        area("callout", "Closing line", "callout")
      ];
    }
    if (template === "feedback") return [text("line1", "First line", "line1"), text("line2", "Second line", "line2")];
    if (template === "certificate") return [text("image", "QR picture path"), text("guide", "Instructions picture path")];
    return null;
  }

  function selectOptions(template, name) {
    const list = fields(template) || [];
    const found = list.filter((item) => item.name === name)[0];
    if (found && found.options) return found.options;
    if (name === "leftTone" || name === "rightTone" || name === "cardTone") return CARD_TONES;
    return TONES;
  }

  function body(slide, ctx, forPlayer, h) {
    const img = (src, alt, cls, key) => {
      if (!src) return "";
      const spot = key && slide.place && slide.place[key];
      const x = spot ? Math.round(Number(spot.x) || 0) : 0;
      const y = spot ? Math.round(Number(spot.y) || 0) : 0;
      const scale = spot ? Math.round((Number(spot.scale) || 1) * 100) / 100 : 1;
      const nudge = key ? ` data-nudge="${h.esc(key)}"${x || y || scale !== 1 ? ` style="transform:translate(${x}%,${y}%) scale(${scale})"` : ""}` : "";
      return `<img${cls ? ` class="${cls}"` : ""}${nudge} src="${h.esc(h.imageSrc(src, ctx, forPlayer))}" alt="${h.esc(alt)}">`;
    };
    const step = (key, tone, title, text) => h.wrap(key, "step " + (tone || "dark"), `<h3>${h.rich(title)}</h3><p>${h.rich(text)}</p>`);
    if (slide.template === "score") {
      const scene = h.lines(slide.sceneText).map((line) => "<li>" + h.rich(line) + "</li>").join("");
      const detail = String(slide.detail || "").replace('<div class="n2-chart-slot"></div>', typeof news2OfficialChart === "function" ? news2OfficialChart() : "");
      return `<div class="body">
        <p class="poll-prompt">${slide.prompt || ""}</p>
        ${scene ? `<ul class="n2-hx">${scene}</ul>` : ""}
        ${detail}
      </div>`;
    }
    if (slide.template === "pathway") {
      const later = slide.reveal !== false;
      const block = (key, num, title, body, extra) => h.wrap(key, "job-step" + (extra || ""), `<div class="job-num">${num}</div><h3>${h.esc(title)}</h3>${h.list(body)}`, "", "section");
      return `<div class="job-flow">
        ${block("one", "1", slide.oneTitle, slide.oneBody, "")}
        <div class="job-arrow" aria-hidden="true"></div>
        ${block("two", "2", slide.twoTitle, slide.twoBody, " decide" + (later ? " build" : ""))}
        <div class="job-arrow" aria-hidden="true"></div>
        ${block("three", "3", slide.threeTitle, slide.threeBody, " hand" + (later ? " build" : ""))}
      </div>`;
    }
    if (slide.template === "split") {
      return `${h.wrap("scene", "card", `<p style="font-weight:750;color:var(--navy);margin:0;text-align:center">${h.rich(slide.scene)}</p>`, "margin-bottom:12px;text-align:center")}
        ${h.wrap("question", "ask-line", `<p style="text-align:center;font-weight:750;margin:0;color:var(--navy)">${h.rich(slide.question)}</p>`, "margin:0 0 10px")}
        <div class="diagram-row two">
          ${h.wrap("yes", "step red", `<h3>${h.esc(slide.yesTitle)}</h3>${h.list(slide.yesBody)}`)}
          ${h.wrap("no", "step green", `<h3>${h.esc(slide.noTitle)}</h3>${h.list(slide.noBody)}`)}
        </div>
        ${h.wrap("foot", "step dark", `<h3>${h.esc(slide.footTitle)}</h3><p>${h.rich(slide.footBody)}</p>`, "margin-top:12px")}`;
    }
    if (slide.template === "pairs") {
      const pairs = h.lines(slide.pairsText).map((line) => {
        const bits = line.split("|");
        return `<li><span>${h.rich((bits[0] || "").trim())}</span><em>${h.rich((bits.slice(1).join("|") || "").trim())}</em></li>`;
      }).join("");
      return `<div class="body two">
        ${h.wrap("left", "card", `<h3>${h.esc(slide.leftTitle)}</h3>${h.list(slide.leftBody)}`)}
        ${h.wrap("right", "card myth", `<h3>${h.esc(slide.rightTitle)}</h3><ul class="think-again">${pairs}</ul>`)}
      </div>`;
    }
    if (slide.template === "table") {
      const rows = String(slide.tableText || "").split(/\n/).map((line) => line.trim()).filter((line) => line);
      const cells = (line) => line.split("|").map((cell) => cell.trim());
      const paint = (cell, tag) => {
        const mark = /^(bad|good|mid)\s*:\s*([\s\S]*)$/.exec(cell);
        const cls = mark ? ' class="score ' + mark[1] + '"' : "";
        return `<${tag}${cls}>${h.rich(mark ? mark[2] : cell)}</${tag}>`;
      };
      const head = rows.length ? `<thead><tr>${cells(rows[0]).map((cell) => paint(cell, "th")).join("")}</tr></thead>` : "";
      const bodyRows = rows.slice(1).map((line) => `<tr>${cells(line).map((cell) => paint(cell, "td")).join("")}</tr>`).join("");
      return `${slide.intro ? h.wrap("intro", "lead-line", `<p>${h.rich(slide.intro)}</p>`, "margin-bottom:12px") : ""}
        ${h.wrap("table", "table-fit", `<table>${head}<tbody>${bodyRows}</tbody></table>`)}
        ${slide.closing ? h.wrap("closing", "lead-line", `<p>${h.rich(slide.closing)}</p>`, "margin-top:14px") : ""}`;
    }
    if (slide.template === "scales") {
      const chart = typeof news2OfficialChart === "function" ? news2OfficialChart() : "";
      const row = (label, score, tone, text) => `<tr><td><strong>${h.rich(label)}</strong></td><td class="score ${tone || "mid"}">${h.rich(score)}</td><td>${h.rich(text)}</td></tr>`;
      return `<div class="body two scale-pair">${h.wrap("scene", "scale-scene", `<p>${h.rich(slide.scene)}</p>${slide.image ? `<div class="photo-frame cutout">${img(slide.image, slide.imageAlt, "", "image")}</div>` : ""}`)}${chart}</div>
        ${h.wrap("table", "table-fit", `<table class="scale-score"><thead><tr><th>Scale</th><th>${h.rich(slide.scoreHead)}</th><th>What the score tells the next clinician</th></tr></thead><tbody>
          ${row(slide.row1Label, slide.row1Score, slide.row1Tone, slide.row1Text)}
          ${row(slide.row2Label, slide.row2Score, slide.row2Tone, slide.row2Text)}
        </tbody></table>`)}
        ${slide.callout ? h.wrap("callout", "callout" + (slide.calloutReveal ? " build" : ""), h.rich(slide.callout), "margin-top:12px") : ""}`;
    }
    if (slide.template === "reveal") {
      const tone = ["teal", "green", "dark", "red"].indexOf(slide.bannerTone) !== -1 ? slide.bannerTone : "teal";
      return `${h.wrap("question", "callout", h.rich(slide.question), "margin-bottom:14px")}
        <div class="build"><div class="body two" style="align-items:stretch">
          <div>${img(slide.image, slide.imageAlt, "cn-extract", "image")}<p class="photo-caption">${h.rich(slide.caption)}</p></div>
          ${h.wrap("card", "card fact", `<h3>${h.esc(slide.cardTitle)}</h3>${h.list(slide.cardBody)}`)}
        </div>${slide.banner ? h.wrap("banner", "banner " + tone, h.rich(slide.banner), "margin-top:12px") : ""}</div>`;
    }
    if (slide.template === "rows") {
      const articles = ["one", "two", "three"].map((name) => h.wrap(name, "o2-row", `${img(slide[name + "Image"], slide[name + "Alt"], "", name + "Image")}<div><h3>${h.esc(slide[name + "Title"])}</h3><p>${h.rich(slide[name + "Text"])}</p></div>`, "", "article")).join("");
      const steps = ["one", "two", "three"].map((name) => step(name + "Step", slide[name + "StepTone"], slide[name + "Step"], slide[name + "StepText"])).join("");
      return `<div class="o2-methods"><div class="o2-rows">${articles}</div><div class="diagram-row three">${steps}</div></div>`;
    }
    if (slide.template === "doses") {
      const steps = ["one", "two", "three", "four"].map((name) => step(name, slide[name + "Tone"], slide[name + "Title"], slide[name + "Text"])).join("");
      return `<div class="body two neb-hero neb-wide" style="flex:1"><div class="photo-frame cutout">${img(slide.image, slide.imageAlt, "", "image")}</div>
        <div>${h.wrap("left", "card", `<h3>${h.esc(slide.leftTitle)}</h3>${h.list(slide.leftBody)}`)}
        ${h.wrap("right", "card warn", `<h3>${h.esc(slide.rightTitle)}</h3>${h.list(slide.rightBody)}`)}</div></div>
        <div class="diagram-row" style="margin-top:12px">${steps}</div>`;
    }
    if (slide.template === "quotes") {
      const card = (key, title, body, note) => h.wrap(key, "card", `<h3>${h.esc(title)}</h3><p>${h.rich(body)}</p>${note ? `<p class="small" style="margin-top:8px">${h.rich(note)}</p>` : ""}`);
      return `<div class="body">${card("one", slide.oneTitle, slide.oneBody, slide.oneNote)}<div style="height:10px"></div>${card("two", slide.twoTitle, slide.twoBody, slide.twoNote)}</div>`;
    }
    if (slide.template === "shock") {
      const vital = (value, label) => `<div><strong>${h.rich(value)}</strong><span>${h.esc(label)}</span></div>`;
      return `<div class="shock-layout">${img(slide.image, slide.imageAlt, "shock-monitor", "image")}<div>
          ${h.wrap("scene", "shock-scene-line", h.rich(slide.scene))}
          <div class="shock-vitals">${vital(slide.v1, slide.v1Label)}${vital(slide.v2, slide.v2Label)}${vital(slide.v3, slide.v3Label)}${vital(slide.v4, slide.v4Label)}</div>
          ${h.wrap("actions", "shock-actions", h.lines(slide.actions).map((line) => "<li>" + h.rich(line) + "</li>").join(""), "", "ul")}
        </div></div>${slide.banner ? h.wrap("banner", "banner red", h.rich(slide.banner), "margin-top:12px") : ""}`;
    }
    if (slide.template === "aims") {
      const notes = (value) => h.lines(value).map((line) => `<p class="small" style="margin-top:6px">${h.rich(line)}</p>`).join("");
      return `${h.wrap("lead", "card", `<h3>${h.esc(slide.leadTitle)}</h3><ul style="columns:2;column-gap:28px">${h.lines(slide.leadBody).map((line) => "<li>" + h.rich(line) + "</li>").join("")}</ul>`, "margin-bottom:8px")}
        <div class="body two">
          ${h.wrap("left", "card", `<h3>${h.esc(slide.leftTitle)}</h3><p>${h.rich(slide.leftBody)}</p>${notes(slide.leftNote)}`, "padding:12px 16px")}
          ${h.wrap("right", "card", `<h3>${h.esc(slide.rightTitle)}</h3><p>${h.rich(slide.rightBody)}</p>${notes(slide.rightNote)}`, "padding:12px 16px;line-height:1.28")}
        </div>
        ${slide.banner1 ? h.wrap("banner1", "banner build", h.rich(slide.banner1), "margin-top:8px") : ""}
        ${slide.banner2 ? h.wrap("banner2", "banner teal build", h.rich(slide.banner2), "margin-top:6px") : ""}
        ${slide.callout ? h.wrap("callout", "callout build", h.rich(slide.callout), "margin-top:8px") : ""}`;
    }
    if (slide.template === "feedback") {
      return `<div class="body two feedback-layout"><div>
          ${h.wrap("line1", "banner teal", h.rich(slide.line1))}
          ${h.wrap("line2", "banner", h.rich(slide.line2), "margin-top:12px")}
        </div><aside class="poll-join feedback-join"><img class="feedback-qr" alt="Open the feedback form" width="132" height="132" hidden /><p class="poll-url"></p></aside></div>
        <div class="feedback-brand"><img class="feedback-logo" src="assets/hub-cpd-logo.png" alt="Hub CPD. Ambulance clinical refreshers."><p class="feedback-home"></p></div>`;
    }
    if (slide.template === "certificate") {
      const qr = slide.image ? img(slide.image, "CPD certificate QR code") : "";
      const guide = slide.guide ? img(slide.guide, "How to complete the certificate form") : "";
      return `<div class="body trust-attend has-guide"><div class="trust-qr">${qr}</div><figure class="trust-guide">${guide}</figure></div>`;
    }
    return null;
  }

  function walk(node, visit) {
    if (!node || node.nodeType !== 1) return;
    visit(node);
    Array.from(node.children || []).forEach((child) => walk(child, visit));
  }

  function textOf(el) {
    let out = "";
    el.childNodes.forEach((child) => {
      if (child.nodeType === 3) out += child.nodeValue;
      else if (child.nodeType === 1) {
        const name = child.tagName.toLowerCase();
        if (name === "a") out += '<a href="' + (child.getAttribute("href") || "") + '">' + textOf(child) + "</a>";
        else if (name === "br") out += "<br>";
        else if ({ sub: 1, sup: 1, strong: 1, em: 1, b: 1, i: 1 }[name] && !child.attributes.length) out += "<" + name + ">" + textOf(child) + "</" + name + ">";
        else out += textOf(child);
      }
    });
    return out.replace(/\s+/g, " ").trim();
  }

  function bullets(ul) {
    if (!ul) return "";
    return Array.from(ul.children).filter((item) => item.tagName === "LI").map((item) => textOf(item)).filter(Boolean).join("\n");
  }

  function first(nodes, selector) {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].matches && nodes[i].matches(selector)) return nodes[i];
      const found = nodes[i].querySelector && nodes[i].querySelector(selector);
      if (found) return found;
    }
    return null;
  }

  function bannerLine(node) {
    const names = Array.from(node.classList);
    const tone = ["teal", "green", "dark", "red"].filter((name) => names.indexOf(name) !== -1)[0] || "plain";
    const word = tone === "dark" ? "navy" : tone;
    return word + " | " + textOf(node);
  }

  function parse(nodes) {
    if (!nodes || !nodes.length) return null;
    const root = nodes.length === 1 ? nodes[0] : null;
    if (root && root.classList.contains("trust-attend")) {
      const images = root.querySelectorAll("img");
      return { template: "certificate", self: false, hostedOnly: true, image: images[0] ? images[0].getAttribute("src") || "" : "", guide: images[1] ? images[1].getAttribute("src") || "" : "" };
    }
    if (first(nodes, ".feedback-layout")) {
      const banners = Array.from(first(nodes, ".feedback-layout").querySelectorAll(".banner")).map((node) => textOf(node));
      return { template: "feedback", feedback: true, line1: banners[0] || "", line2: banners[1] || "" };
    }
    if (first(nodes, ".shock-layout")) {
      const box = first(nodes, ".shock-layout");
      const picture = box.querySelector("img");
      const vitals = Array.from(box.querySelectorAll(".shock-vitals > div"));
      const actions = box.querySelector(".shock-actions");
      const banner = nodes.filter((node) => node.classList.contains("banner"))[0] || box.querySelector(".banner");
      const out = { template: "shock", image: picture ? picture.getAttribute("src") || "" : "", imageAlt: picture ? picture.getAttribute("alt") || "" : "", scene: textOf(box.querySelector(".shock-scene-line") || box), actions: bullets(actions), banner: banner ? textOf(banner) : "" };
      vitals.slice(0, 4).forEach((vital, index) => {
        const strong = vital.querySelector("strong");
        const span = vital.querySelector("span");
        out["v" + (index + 1)] = strong ? textOf(strong) : "";
        out["v" + (index + 1) + "Label"] = span ? textOf(span) : "";
      });
      return out;
    }
    if (root && root.classList.contains("o2-methods")) {
      const articles = Array.from(root.querySelectorAll(".o2-row"));
      const steps = Array.from(root.querySelectorAll(".diagram-row .step"));
      if (articles.length >= 1) {
        const out = { template: "rows" };
        ["one", "two", "three"].forEach((name, index) => {
          const article = articles[index];
          const stepNode = steps[index];
          const picture = article && article.querySelector("img");
          out[name + "Image"] = picture ? picture.getAttribute("src") || "" : "";
          out[name + "Alt"] = picture ? picture.getAttribute("alt") || "" : "";
          out[name + "Title"] = article && article.querySelector("h3") ? textOf(article.querySelector("h3")) : "";
          out[name + "Text"] = article && article.querySelector("p") ? textOf(article.querySelector("p")) : "";
          out[name + "Step"] = stepNode && stepNode.querySelector("h3") ? textOf(stepNode.querySelector("h3")) : "";
          out[name + "StepText"] = stepNode && stepNode.querySelector("p") ? textOf(stepNode.querySelector("p")) : "";
          out[name + "StepTone"] = stepNode ? (Array.from(stepNode.classList).filter((item) => item !== "step")[0] || "dark") : "dark";
        });
        return out;
      }
    }
    if (first(nodes, ".neb-hero")) {
      const hero = first(nodes, ".neb-hero");
      const picture = hero.querySelector("img");
      const cards = hero.querySelectorAll(".card");
      const steps = Array.from((nodes.filter((node) => node.classList.contains("diagram-row"))[0] || hero).querySelectorAll(".step"));
      const out = {
        template: "doses",
        image: picture ? picture.getAttribute("src") || "" : "",
        imageAlt: picture ? picture.getAttribute("alt") || "" : "",
        leftTitle: cards[0] && cards[0].querySelector("h3") ? textOf(cards[0].querySelector("h3")) : "",
        leftBody: cards[0] ? bullets(cards[0].querySelector("ul")) : "",
        rightTitle: cards[1] && cards[1].querySelector("h3") ? textOf(cards[1].querySelector("h3")) : "",
        rightBody: cards[1] ? bullets(cards[1].querySelector("ul")) : ""
      };
      ["one", "two", "three", "four"].forEach((name, index) => {
        const stepNode = steps[index];
        out[name + "Title"] = stepNode && stepNode.querySelector("h3") ? textOf(stepNode.querySelector("h3")) : "";
        out[name + "Text"] = stepNode && stepNode.querySelector("p") ? textOf(stepNode.querySelector("p")) : "";
        const tone = stepNode ? (Array.from(stepNode.classList).filter((item) => item !== "step")[0] || "dark") : "dark";
        const ink = stepNode && /green/.test(stepNode.getAttribute("style") || "") ? "green" : tone;
        out[name + "Tone"] = ink;
      });
      return out;
    }
    if (nodes.some((node) => node.classList.contains("card")) && nodes.some((node) => node.classList.contains("banner")) && first(nodes, "ul")) {
      const lead = nodes.filter((node) => node.classList.contains("card"))[0];
      const grid = nodes.filter((node) => node.classList.contains("two"))[0];
      const cards = grid ? Array.from(grid.querySelectorAll(":scope > .card")) : [];
      if (lead && cards.length === 2 && lead.querySelector("ul")) {
        const banners = nodes.filter((node) => node.classList.contains("banner"));
        const callout = nodes.filter((node) => node.classList.contains("callout"))[0];
        const smalls = (card) => Array.from(card.querySelectorAll(":scope > p.small")).map((node) => textOf(node)).join("\n");
        const prose = (card) => { const node = card.querySelector(":scope > p:not(.small)"); return node ? textOf(node) : ""; };
        return {
          template: "aims",
          leadTitle: lead.querySelector("h3") ? textOf(lead.querySelector("h3")) : "",
          leadBody: bullets(lead.querySelector("ul")),
          leftTitle: cards[0].querySelector("h3") ? textOf(cards[0].querySelector("h3")) : "",
          leftBody: prose(cards[0]),
          leftNote: smalls(cards[0]),
          rightTitle: cards[1].querySelector("h3") ? textOf(cards[1].querySelector("h3")) : "",
          rightBody: prose(cards[1]),
          rightNote: smalls(cards[1]),
          banner1: banners[0] ? textOf(banners[0]) : "",
          banner2: banners[1] ? textOf(banners[1]) : "",
          callout: callout ? textOf(callout) : ""
        };
      }
    }
    if (nodes[0] && nodes[0].classList.contains("callout") && nodes[1] && nodes[1].classList.contains("build")) {
      const block = nodes[1];
      const picture = block.querySelector("img");
      const card = block.querySelector(".card");
      const banner = block.querySelector(".banner");
      const tone = banner ? (["teal", "green", "dark", "red"].filter((name) => banner.classList.contains(name))[0] || "") : "teal";
      return {
        template: "reveal",
        question: textOf(nodes[0]),
        image: picture ? picture.getAttribute("src") || "" : "",
        imageAlt: picture ? picture.getAttribute("alt") || "" : "",
        caption: block.querySelector(".photo-caption") ? textOf(block.querySelector(".photo-caption")) : "",
        cardTitle: card && card.querySelector("h3") ? textOf(card.querySelector("h3")) : "",
        cardBody: card ? bullets(card.querySelector("ul")) : "",
        banner: banner ? textOf(banner) : "",
        bannerTone: tone
      };
    }
    if (first(nodes, ".scale-score") || first(nodes, ".scale-pair")) {
      const table = first(nodes, ".scale-score");
      const picture = first(nodes, "img");
      const heads = table ? Array.from(table.querySelectorAll("thead th")).map((node) => textOf(node)) : [];
      const rows = table ? Array.from(table.querySelectorAll("tbody tr")) : [];
      const cell = (row, index) => row && row.children[index] ? row.children[index] : null;
      const toneOf = (node) => node ? (["bad", "good", "mid"].filter((name) => node.classList.contains(name))[0] || "mid") : "mid";
      const callout = nodes.filter((node) => node.classList.contains("callout"))[0] || first(nodes, ".callout");
      return {
        template: "scales",
        scene: textOf((first(nodes, ".scale-pair p") || nodes[0])),
        image: picture ? picture.getAttribute("src") || "" : "",
        imageAlt: picture ? picture.getAttribute("alt") || "" : "",
        scoreHead: heads[1] || "",
        row1Label: cell(rows[0], 0) ? textOf(cell(rows[0], 0)) : "",
        row1Score: cell(rows[0], 1) ? textOf(cell(rows[0], 1)) : "",
        row1Tone: toneOf(cell(rows[0], 1)),
        row1Text: cell(rows[0], 2) ? textOf(cell(rows[0], 2)) : "",
        row2Label: cell(rows[1], 0) ? textOf(cell(rows[1], 0)) : "",
        row2Score: cell(rows[1], 1) ? textOf(cell(rows[1], 1)) : "",
        row2Tone: toneOf(cell(rows[1], 1)),
        row2Text: cell(rows[1], 2) ? textOf(cell(rows[1], 2)) : "",
        callout: callout ? textOf(callout) : "",
        calloutReveal: !!(callout && callout.classList.contains("build"))
      };
    }
    if (first(nodes, ".diagram-row.two") && first(nodes, ".step.red") && first(nodes, ".step.green")) {
      const yes = first(nodes, ".step.red");
      const no = first(nodes, ".step.green");
      const foot = first(nodes, ".step.dark");
      const scene = nodes.filter((node) => node.classList.contains("card"))[0];
      const question = nodes.filter((node) => node.tagName === "P")[0];
      return {
        template: "split",
        scene: scene ? textOf(scene) : "",
        question: question ? textOf(question) : "",
        yesTitle: yes.querySelector("h3") ? textOf(yes.querySelector("h3")) : "",
        yesBody: bullets(yes.querySelector("ul")),
        noTitle: no.querySelector("h3") ? textOf(no.querySelector("h3")) : "",
        noBody: bullets(no.querySelector("ul")),
        footTitle: foot && foot.querySelector("h3") ? textOf(foot.querySelector("h3")) : "",
        footBody: foot && foot.querySelector("p") ? textOf(foot.querySelector("p")) : ""
      };
    }
    if (first(nodes, ".think-again")) {
      const grid = first(nodes, ".body.two") || nodes[0];
      const cards = Array.from(grid.children).filter((node) => node.classList.contains("card"));
      const list = first(nodes, ".think-again");
      const pairs = Array.from(list.children).map((item) => {
        const clue = item.querySelector("span");
        const other = item.querySelector("em");
        return (clue ? textOf(clue) : "") + " | " + (other ? textOf(other) : "");
      }).join("\n");
      return {
        template: "pairs",
        leftTitle: cards[0] && cards[0].querySelector("h3") ? textOf(cards[0].querySelector("h3")) : "",
        leftBody: cards[0] ? bullets(cards[0].querySelector("ul")) : "",
        rightTitle: cards[1] && cards[1].querySelector("h3") ? textOf(cards[1].querySelector("h3")) : "",
        pairsText: pairs
      };
    }
    if (first(nodes, ".job-flow")) {
      const steps = Array.from(first(nodes, ".job-flow").querySelectorAll(".job-step"));
      const read = (node) => ({
        title: node && node.querySelector("h3") ? textOf(node.querySelector("h3")) : "",
        body: node ? bullets(node.querySelector("ul")) : ""
      });
      const one = read(steps[0]);
      const two = read(steps[1]);
      const three = read(steps[2]);
      return { template: "pathway", oneTitle: one.title, oneBody: one.body, twoTitle: two.title, twoBody: two.body, threeTitle: three.title, threeBody: three.body, reveal: steps.slice(1).some((node) => node.classList.contains("build")) };
    }
    if (nodes.length >= 1 && nodes.every((node) => node.classList.contains("card")) && nodes.length <= 2 && !first(nodes, "ul") && !first(nodes, "img")) {
      const read = (card) => ({
        title: card && card.querySelector("h3") ? textOf(card.querySelector("h3")) : "",
        body: card && card.querySelector("p:not(.small)") ? textOf(card.querySelector("p:not(.small)")) : "",
        note: card && card.querySelector("p.small") ? textOf(card.querySelector("p.small")) : ""
      });
      const one = read(nodes[0]);
      const two = read(nodes[1]);
      return { template: "quotes", oneTitle: one.title, oneBody: one.body, oneNote: one.note, twoTitle: two.title, twoBody: two.body, twoNote: two.note };
    }
    if (first(nodes, ".photo-frame") && first(nodes, ".fill-side")) {
      const picture = first(nodes, ".photo-frame img");
      const caption = first(nodes, ".photo-caption");
      const card = first(nodes, ".card");
      const list = first(nodes, "ul");
      return {
        template: "photo",
        body: bullets(list),
        image: picture ? picture.getAttribute("src") || "" : "",
        imageAlt: picture ? picture.getAttribute("alt") || "" : "",
        caption: caption ? textOf(caption) : "",
        imageSide: "right",
        cardTitle: card && card.querySelector("h3") ? textOf(card.querySelector("h3")) : "",
        cardBody: card && card.querySelector("p") ? textOf(card.querySelector("p")) : "",
        cardTone: card && card.classList.contains("warn") ? "warn" : "normal"
      };
    }
    if (nodes[0] && nodes[0].classList.contains("banner") && nodes[0].classList.contains("dark") && first(nodes, ".body.two")) {
      const cards = Array.from(first(nodes, ".body.two").children).filter((node) => node.classList.contains("card"));
      const read = (card) => {
        const tone = ["warn", "fact", "myth"].filter((name) => card && card.classList.contains(name))[0] || "normal";
        const list = card && card.querySelector(":scope > ul");
        const prose = card && card.querySelector(":scope > p");
        return {
          title: card && card.querySelector("h3") ? textOf(card.querySelector("h3")) : "",
          body: list ? bullets(list) : prose ? textOf(prose) : "",
          prose: !list,
          tone: tone
        };
      };
      const left = read(cards[0]);
      const right = read(cards[1]);
      return {
        template: "quote",
        quote: textOf(nodes[0]),
        leftTitle: left.title, leftBody: left.body, leftProse: left.prose, leftTone: left.tone,
        rightTitle: right.title, rightBody: right.body, rightProse: right.prose, rightTone: right.tone
      };
    }
    if (nodes.length && nodes.every((node) => node.classList.contains("banner"))) {
      return { template: "banners", lines: nodes.map(bannerLine).join("\n"), reveal: nodes.some((node) => node.classList.contains("build")) };
    }
    const table = nodes.filter((node) => node.tagName === "TABLE")[0];
    if (table && nodes.every((node) => node.tagName === "TABLE" || node.tagName === "P")) {
      const rowText = (row) => Array.from(row.children).map((cell) => {
        const tone = ["bad", "good", "mid"].filter((name) => cell.classList.contains(name))[0];
        const value = textOf(cell);
        return tone ? tone + ": " + value : value;
      }).join(" | ");
      const head = table.querySelector("thead tr");
      const bodyRows = Array.from(table.querySelectorAll("tbody tr"));
      const lines = [];
      if (head) lines.push(rowText(head));
      bodyRows.forEach((row) => lines.push(rowText(row)));
      const paras = nodes.filter((node) => node.tagName === "P");
      const before = paras.filter((node) => table.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_PRECEDING);
      const after = paras.filter((node) => table.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING);
      return { template: "table", intro: before.map(textOf).join("\n\n"), tableText: lines.join("\n"), closing: after.map(textOf).join("\n\n") };
    }
    return null;
  }

  window.HubLayouts = { choices: CHOICES, owns: owns, prepare: prepare, sample: sample, fields: fields, selectOptions: selectOptions, body: body, parse: parse };
})();
