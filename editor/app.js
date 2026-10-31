(function () {
  window.NEWS2_CITE = "Reproduced from: Royal College of Physicians. <em>National Early Warning Score (NEWS) 2: Standardising the assessment of acute-illness severity in the NHS.</em> Updated report of a working party. London: RCP, 2017.";
  window.news2OfficialChart = function () {
    return `<figure class="n2-official"><div class="n2-form-scroll"><div class="n2-form-wrap"><img src="copd/assets/news2-chart-1.png" alt="NEWS2 Chart 1: The NEWS scoring system"></div></div><figcaption class="n2-cite">${window.NEWS2_CITE}</figcaption></figure>`;
  };

  const screen = document.getElementById("screen");
  const who = document.getElementById("who");
  const actions = document.getElementById("actions");
  const tagline = document.getElementById("tagline");
  const state = {
    status: null,
    source: "",
    folders: [],
    folder: null,
    deck: null,
    index: 0,
    dirty: false,
    error: "",
    authError: new URLSearchParams(location.search).get("auth_error") || ""
  };
  let previewReady = false;
  let hoverReady = false;
  let hoverHtml = "";

  if (state.authError) history.replaceState({}, "", "/");

  function escapeText(value) {
    return String(value == null ? "" : value).replace(/[&<>"]/g, (ch) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"
    }[ch]));
  }

  function rebuildCorrect() {
    const select = document.querySelector("[data-field=correct]");
    const slide = current();
    if (!select || !slide) return;
    const options = HubDeck.lines(slide.optionsText);
    const selected = String(slide.correct || 0);
    select.innerHTML = options.map((option, index) => `<option value="${index}">${escapeText(option)}</option>`).join("");
    select.value = Array.from(select.options).some((opt) => opt.value === selected) ? selected : "0";
    slide.correct = Number(select.value || 0);
  }

  async function api(path, options) {
    const res = await fetch(path, Object.assign({ headers: { "Content-Type": "application/json" } }, options || {}));
    const text = await res.text();
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch (err) { data = { error: text }; }
    if (!res.ok) throw new Error(data.error || "The editor could not complete that");
    return data;
  }

  function current() {
    return state.deck && state.deck.slides[state.index];
  }

  function ctx() {
    return {
      course: (state.deck && state.deck.course) || "copd",
      driveId: state.folder ? state.folder.driveId : "",
      itemId: state.folder ? state.folder.itemId : "",
      index: state.index,
      total: state.deck ? state.deck.slides.length : 1
    };
  }

  function paintChrome() {
    const user = state.status && state.status.user;
    who.textContent = user ? user.name + " · " + user.email : "";
    const buttons = [];
    if (state.deck) {
      buttons.push('<button type="button" id="saveBtn">Save draft</button>');
      if (state.deck.course && state.status && state.status.project && (state.source === "local" || state.source === "pc" || state.status.owner)) {
        buttons.push('<button type="button" class="primary" id="copyBtn">Copy into this project</button>');
      }
      buttons.push('<button type="button" class="quiet" id="foldersBtn">All sessions</button>');
    }
    if (state.status && state.status.signedIn) buttons.push('<button type="button" class="quiet" id="signOutBtn">Sign out</button>');
    actions.innerHTML = buttons.join("");
    const save = document.getElementById("saveBtn");
    if (save) save.textContent = state.dirty || !(state.deck && state.deck.updated) ? "Save draft" : "Saved";
  }

  function showHome() {
    state.source = "";
    state.folder = null;
    state.deck = null;
    sessionStorage.removeItem("hub-editor-source");
    tagline.textContent = "Pick where the work is saved. hub-cpd.co.uk updates after you copy a session into this project and push.";
    const status = state.status || {};
    const place = status.onedrive ? escapeText(status.onedrive) : "OneDrive, in a folder named CPD drafts";
    screen.innerHTML = `
      <div class="home">
        <h1>Where should this work be saved?</h1>
        <p>Choose one. You can switch later with <strong>Where to save</strong>.</p>
        ${state.authError ? `<div class="error">Microsoft sign-in is not used here. Open your OneDrive drafts instead.</div>` : ""}
        <section class="card-block">
          <h2>OneDrive</h2>
          <p>Use this for real sessions. The folders sync to your OneDrive, so you can open them on the OneDrive website and share one session with someone else.</p>
          <p class="hint">Saved in ${place}.</p>
          <button type="button" class="primary" id="usePc" ${status.onedrive ? "" : "disabled"}>Open OneDrive sessions</button>
          ${status.onedrive ? "" : `<p class="hint">The OneDrive app is not signed in on this computer.</p>`}
        </section>
        <section class="card-block">
          <h2>This computer only</h2>
          <p>Use this to try things out. Only this computer can open these folders.</p>
          <button type="button" id="useLocal">Open private sessions</button>
        </section>
        <details class="card-block">
          <summary>How to let someone else edit one session</summary>
          <ol>
            <li>Open <a href="https://onedrive.live.com" target="_blank" rel="noopener">onedrive.live.com</a> and sign in as jon.ski1382@gmail.com.</li>
            <li>Open <strong>CPD drafts</strong>, then the one session folder.</li>
            <li>Click <strong>Share</strong>, type their email, leave it as <strong>Can edit</strong>, and send.</li>
            <li>They open the email and choose <strong>Add shortcut to My files</strong>. That session then shows in this editor on their computer.</li>
          </ol>
          <p class="hint">Share the session folder. Leave the CPD drafts folder itself unshared, so each person only sees the sessions you send them.</p>
        </details>
      </div>`;
    paintChrome();
  }

  function showSharedFolders() {
    if (state.status && state.status.foreign) {
      tagline.textContent = "This page belongs to the account that started it.";
      screen.innerHTML = `
        <div class="folders">
          <h1>Open Hub CPD Editor on your account</h1>
          <p>This page was started by another account on this computer. It is not your session list, and it cannot open a session for you.</p>
          <p>Close this page. On your account, open <strong>Hub CPD Editor</strong> from the Start menu. A topic opens there only when that session folder was shared with you.</p>
        </div>`;
      paintChrome();
      return;
    }
    tagline.textContent = "You can edit a session only when its folder was shared with you.";
    const topics = (state.status && state.status.topics) || [];
    const known = new Set(topics.map((topic) => topic.id));
    const topicButtons = topics.map((topic) => {
      const mark = topic.published ? "" : " · Not on the public site yet";
      const folder = state.folders.find((item) => item.course === topic.id);
      if (folder) {
        return `<button type="button" data-action="open-folder" data-drive="${escapeText(folder.driveId)}" data-id="${escapeText(folder.itemId)}">${escapeText(topic.heading)}${mark}</button>`;
      }
      return `<button type="button" data-action="locked-topic" data-label="${escapeText(topic.heading)}">${escapeText(topic.heading)}${mark}</button>`;
    }).join("");
    const extra = state.folders.filter((folder) => !folder.course || !known.has(folder.course)).map((folder) => {
      return `<button type="button" data-action="open-folder" data-drive="${escapeText(folder.driveId)}" data-id="${escapeText(folder.itemId)}">${escapeText(folder.name)}</button>`;
    }).join("");
    const drive = state.status && state.status.onedrive;
    screen.innerHTML = `
      <div class="folders">
        <h1>Topics</h1>
        <p>Every topic is listed. A topic opens only when that session folder was shared with you.</p>
        ${state.error ? `<div class="error">${escapeText(state.error)}</div>` : ""}
        ${drive ? "" : `<div class="error">The OneDrive app is not signed in on this computer. Sign in to OneDrive, then open the editor again.</div>`}
        <section class="card-block">
          <h2>Topics on the site</h2>
          <div class="folder-list">${topicButtons || extra || `<p class="hint">No topics are set up yet.</p>`}</div>
        </section>
        ${extra && topicButtons ? `<section class="card-block"><h2>Other shared folders</h2><div class="folder-list">${extra}</div></section>` : ""}
        <p class="hint">If a session you were given is missing, open the share email and choose <strong>Add shortcut to My files</strong>. Wait until OneDrive has finished, then open the editor again.</p>
      </div>`;
    paintChrome();
  }

  async function showFolders() {
    state.folder = null;
    state.deck = null;
    state.dirty = false;
    if (state.status && state.status.shared) {
      try {
        const data = await api("/api/folders?source=pc");
        state.folders = data.folders || [];
        state.error = "";
      } catch (err) {
        state.folders = [];
        state.error = err.message;
      }
      showSharedFolders();
      return;
    }
    tagline.textContent = "Sessions are saved in editor-drafts inside this project. Share one session folder when someone else should edit it.";
    try {
      const data = await api("/api/folders?source=" + encodeURIComponent(state.source));
      state.folders = data.folders || [];
      state.error = "";
    } catch (err) {
      state.folders = [];
      state.error = err.message;
    }
    const topics = (state.status && state.status.topics) || [];
    const topicButtons = topics.map((topic) => {
      const mark = topic.published ? "" : " · Not on the public site yet";
      return `<button type="button" data-action="open-live" data-course="${escapeText(topic.id)}">${escapeText(topic.heading)}${mark}</button>`;
    }).join("");
    const place = state.status && state.status.onedrive
      ? `<p class="hint">Saved in ${escapeText(state.status.onedrive)}.</p>`
      : "";
    screen.innerHTML = `
      <div class="folders">
        <h1>Topics</h1>
        <p>Click the topic you were asked to edit. Edits from you and from anyone you share that folder with are saved in <strong>editor-drafts</strong>. A topic marked “Not on the public site yet” stays off hub-cpd.co.uk until it is published.</p>
        ${state.error ? `<div class="error">${escapeText(state.error)}</div>` : ""}
        <section class="card-block">
          <h2>Topics on the site</h2>
          <div class="folder-list">${topicButtons || `<p class="hint">No topics are set up on the site yet.</p>`}</div>
          ${place}
        </section>
        <details class="card-block">
          <summary>How to let someone else edit one session</summary>
          <ol>
            <li>Open <a href="https://onedrive.live.com" target="_blank" rel="noopener">onedrive.live.com</a> and sign in as jon.ski1382@gmail.com.</li>
            <li>Open <strong>Cursor Projects</strong>, then <strong>CPD</strong>, <strong>Hub-CPD</strong>, <strong>editor-drafts</strong>, then the one session folder.</li>
            <li>Click <strong>Share</strong>, type their email, leave it as <strong>Can edit</strong>, and send.</li>
            <li>They open the email and choose <strong>Add shortcut to My files</strong>. Their saves come back into that same folder.</li>
          </ol>
          <p class="hint">Share the session folder, such as COPD. Leave editor-drafts itself unshared, so each person only sees the sessions you send them.</p>
        </details>
      </div>`;
    paintChrome();
  }

  function showEditor() {
    tagline.textContent = state.status && state.status.shared
      ? "Save writes into the session folder that was shared with you."
      : "Saved in editor-drafts. Copy into this project, then push, when you want hub-cpd.co.uk to change.";
    previewReady = false;
    screen.innerHTML = `
      <div class="editor">
        <aside class="film">
          <div class="row">
            ${picker("add", state.addTemplate || "title")}
          </div>
          <button type="button" id="addSlide">Add slide</button>
          <div id="filmList"></div>
        </aside>
        <div class="preview-wrap">
          <div class="preview-tools">
            <button type="button" id="buildReset" title="Every part of this slide, including a poll answer">Show the whole slide</button>
            <button type="button" id="buildNext" title="The same step as a click in the room">Next click</button>
            <button type="button" id="buildPlay" title="Run those steps one after another">Play the clicks</button>
          </div>
          <iframe id="preview" title="Slide preview" src="/preview.html"></iframe>
          <iframe id="templateHover" title="Layout example" src="/preview.html" hidden></iframe>
        </div>
        <aside class="inspect" id="inspect"></aside>
      </div>`;
    renderFilm();
    renderInspector();
    paintChrome();
  }

  function renderFilm() {
    const list = document.getElementById("filmList");
    if (!list || !state.deck) return;
    list.innerHTML = state.deck.slides.map((slide, index) => {
      const where = [slide.live ? "Live" : "", slide.self ? "Self" : ""].filter(Boolean).join(" · ") || "Hidden";
      return `<button type="button" class="${index === state.index ? "active" : ""}" data-action="select" data-index="${index}">
        <small>${escapeText(HubDeck.LABELS[slide.template] || "Slide")} · ${where}</small><br>
        ${escapeText(slide.title || "Untitled")}
      </button>`;
    }).join("");
  }

  function currentThemeClass(overrideId) {
    const course = state.deck && state.deck.course;
    const chosen = overrideId || (state.deck && state.deck.theme);
    return HubDeck.themeClass(HubDeck.themeIdFor(course, chosen));
  }

  function themePicker() {
    const id = HubDeck.themeIdFor(state.deck.course, state.deck.theme);
    const current = HubDeck.THEMES.filter((item) => item.id === id)[0];
    const items = HubDeck.THEMES.map((item) => `<button type="button" data-theme="${escapeText(item.id)}">${escapeText(item.label)}</button>`).join("");
    return `<div class="picker" data-picker="theme">
      <button type="button" class="picker-open" title="Hover a theme to try it on this slide">${escapeText(current.label)}</button>
      <div class="picker-menu" hidden>${items}</div>
    </div>`;
  }

  function picker(which, value) {
    const choices = HubDeck.choices || [];
    const current = choices.filter((item) => item.id === value)[0] || choices[0];
    const items = choices.map((item) => `<button type="button" data-pick="${escapeText(item.id)}">${escapeText(item.label)}</button>`).join("");
    return `<div class="picker" data-picker="${escapeText(which)}">
      <button type="button" class="picker-open" title="Hover a layout to see an example">${escapeText(current ? current.label : "Layout")}</button>
      <div class="picker-menu" hidden>${items}</div>
    </div>`;
  }

  function toneField(name, label, options) {
    const slide = current();
    const value = slide[name] == null || slide[name] === "" ? (options[0] ? options[0][0] : "") : slide[name];
    const opts = options.map(([id, text]) => `<option value="${escapeText(id)}" ${String(value) === id ? "selected" : ""}>${escapeText(text)}</option>`).join("");
    return `<label>${escapeText(label)}</label><select data-field="${escapeText(name)}">${opts}</select>`;
  }

  function sizeField(key) {
    const slide = current();
    const value = slide && slide.boxSize && slide.boxSize[key] ? String(slide.boxSize[key]) : "fit";
    const options = [["fit", "Best fit"], ["18", "Small"], ["24", "Medium"], ["32", "Large"], ["40", "Extra large"]];
    const opts = options.map(([id, label]) => `<option value="${id}" ${value === id ? "selected" : ""}>${label}</option>`).join("");
    return `<label>Text size</label><select data-box-size="${escapeText(key)}" title="Best fit fills the box, and stays moderate when there is only a little text.">${opts}</select>`
      + `<label class="checks"><input type="checkbox" data-box-reveal="${escapeText(key)}" ${slide && slide.boxReveal && slide.boxReveal[key] ? "checked" : ""}> Bring this box in on a click</label>`;
  }

  function schemaFields(template) {
    const list = window.HubLayouts ? HubLayouts.fields(template) : null;
    if (!list) return "";
    return list.map((item) => {
      if (item.kind === "hint") return `<p class="hint">${item.label}</p>`;
      if (item.kind === "select") return toneField(item.name, item.label, item.options);
      if (item.kind === "check") return field(item.name, item.label, "check");
      const control = field(item.name, item.label, item.kind === "textarea" ? "textarea" : "text");
      return control + (item.box ? sizeField(item.box) : "");
    }).join("");
  }

  function field(name, label, kind) {
    const slide = current();
    const value = slide[name] == null ? "" : slide[name];
    if (kind === "textarea") {
      return `<label>${label}</label><textarea data-field="${name}">${escapeText(value)}</textarea>`;
    }
    if (kind === "check") {
      return `<label class="checks"><input type="checkbox" data-field="${name}" ${value ? "checked" : ""}> ${label}</label>`;
    }
    return `<label>${label}</label><input type="text" data-field="${name}" value="${escapeText(value)}">`;
  }

  function renderInspector() {
    const inspect = document.getElementById("inspect");
    const slide = current();
    if (!inspect || !slide || !state.deck) return;
    const course = state.deck.course || "";
    const topic = ((state.status && state.status.topics) || []).find((item) => item.id === course);
    let extra = "";
    if (slide.template === "title") {
      const tagged = String(slide.image || "").indexOf("upload:title-slide.") === 0;
      const taggedName = tagged ? String(slide.image).slice(7) : "";
      extra = field("subtitle", "Subtitle", "textarea") + field("meta", "Source line", "textarea")
        + `<label>Suggested title picture</label><input id="titleImageFile" type="file" accept="image/png,image/jpeg,image/webp,image/gif">
          <p class="hint">${tagged
            ? "Tagged in this session’s assets folder as " + escapeText(taggedName) + (state.status && state.status.shared ? "." : ". Copy into this project puts that same file in the topic’s assets folder.")
            : "No title picture tagged yet."}</p>
          <p class="hint">${state.status && state.status.shared
            ? "The preview shows this picture behind the title. The file stays in this session folder."
            : "The preview shows this picture behind the title. The title slide on the site keeps its current picture. The tagged file is how you spot the suggestion when the draft comes in."}</p>
          ${tagged ? `<img alt="Suggested title picture" src="${escapeText(mediaUrl(slide.image))}" style="width:100%;border-radius:6px;margin-top:8px"><button type="button" data-action="clearTitleImage">Remove this tag</button>` : ""}`;
    } else if (slide.template === "columns") {
      extra = field("leftTitle", "Left heading", "text") + field("leftBody", "Left bullets, one per line", "textarea") + sizeField("left")
        + field("leftTable", "Left side is a two-column table", "check")
        + field("rightTitle", "Right heading", "text") + field("rightBody", "Right bullets, one per line", "textarea") + sizeField("right")
        + field("rightTable", "Right side is a two-column table", "check")
        + `<p class="hint">For a table, one row per line. Type the left cell, then the solid bar | , then the right cell. The solid bar is Shift and the key just to the right of the left Shift key, before Z. That key is printed with \\ and |. The ¦ next to ¬ is a different key.</p>`
        + toneField("leftTone", "Left column style", [["normal", "Normal"], ["warn", "Warning"], ["fact", "Fact"], ["myth", "Myth"]])
        + field("leftProse", "Left side is a paragraph", "check")
        + field("leftNote", "Note under the left column", "textarea")
        + toneField("rightTone", "Right column style", [["normal", "Normal"], ["warn", "Warning"], ["fact", "Fact"], ["myth", "Myth"]])
        + field("rightProse", "Right side is a paragraph", "check")
        + field("rightNote", "Note under the right column", "textarea")
        + field("callout", "Line under the columns", "textarea") + sizeField("callout")
        + field("calloutReveal", "Bring that line in on a click", "check")
        + field("note", "Small print under the columns", "textarea") + sizeField("note")
        + field("banner", "Closing banner", "text") + sizeField("banner")
        + `<label>Banner colour</label><select data-field="bannerTone">
            <option value="" ${!slide.bannerTone ? "selected" : ""}>Plain</option>
            <option value="teal" ${slide.bannerTone === "teal" ? "selected" : ""}>Teal</option>
            <option value="green" ${slide.bannerTone === "green" ? "selected" : ""}>Green</option>
            <option value="dark" ${slide.bannerTone === "dark" ? "selected" : ""}>Navy</option>
            <option value="red" ${slide.bannerTone === "red" ? "selected" : ""}>Red</option>
          </select>`
        + field("bannerReveal", "Bring the banner in on a click", "check")
        + `<p class="hint">A small 2 stays written as &lt;sub&gt;2&lt;/sub&gt;. Leave the banner blank if this slide has none.</p>`;
    } else if (slide.template === "photo") {
      extra = field("body", "Bullets, one per line", "textarea") + sizeField("body")
        + `<label>Picture</label><input id="imageFile" type="file" accept="image/*"><p class="hint">${escapeText(slide.image || "No picture yet")}</p>`
        + field("image", "Or an existing picture path", "text")
        + field("imageAlt", "Picture description", "text")
        + field("caption", "Caption", "text")
        + `<label>Picture position</label><select data-field="imageSide"><option value="right" ${slide.imageSide !== "left" ? "selected" : ""}>Right</option><option value="left" ${slide.imageSide === "left" ? "selected" : ""}>Left</option></select>`
        + `<p class="hint">Drag the picture in the preview to move it. Drag the dark square on its corner to make it larger or smaller. Double-click the picture to put it back.</p>`
        + field("cardTitle", "Card under the picture", "text")
        + field("cardBody", "Card text", "textarea") + sizeField("card")
        + toneField("cardTone", "Card style", [["normal", "Normal"], ["warn", "Warning"], ["fact", "Fact"]]);
    } else if (slide.template === "quote") {
      extra = field("quote", "Quote", "textarea") + sizeField("quote")
        + field("leftTitle", "Left heading", "text") + field("leftBody", "Left text, one bullet per line", "textarea") + sizeField("left")
        + field("leftProse", "Left side is a paragraph", "check")
        + toneField("leftTone", "Left column style", [["normal", "Normal"], ["warn", "Warning"], ["fact", "Fact"], ["myth", "Myth"]])
        + field("rightTitle", "Right heading", "text") + field("rightBody", "Right text, one bullet per line", "textarea") + sizeField("right")
        + field("rightProse", "Right side is a paragraph", "check")
        + toneField("rightTone", "Right column style", [["normal", "Normal"], ["warn", "Warning"], ["fact", "Fact"], ["myth", "Myth"]]);
    } else if (slide.template === "steps") {
      const tone = (name, value) => `<label>Column colour</label><select data-field="${name}">
        <option value="plain" ${value === "plain" || !value ? "selected" : ""}>Plain</option>
        <option value="hand" ${value === "hand" ? "selected" : ""}>Navy</option>
        <option value="decide" ${value === "decide" ? "selected" : ""}>Red</option>
        <option value="amber" ${value === "amber" ? "selected" : ""}>Amber</option>
      </select>`;
      extra = field("oneTitle", "First heading", "text") + field("oneBody", "First bullets, one per line", "textarea") + sizeField("one") + tone("oneTone", slide.oneTone)
        + field("twoTitle", "Second heading", "text") + field("twoBody", "Second bullets, one per line", "textarea") + sizeField("two") + tone("twoTone", slide.twoTone)
        + field("threeTitle", "Third heading", "text") + field("threeBody", "Third bullets, one per line", "textarea") + sizeField("three") + tone("threeTone", slide.threeTone)
        + field("reveal", "Bring in the second and third columns on click", "check");
    } else if (slide.template === "banners") {
      extra = field("lines", "Lines, one per line", "textarea") + sizeField("lines")
        + `<p class="hint">A line can start with a colour and a bar: plain, teal, green, navy or red. For example red | Never leave them hypoxic.</p>`
        + field("reveal", "Reveal one line at a time", "check")
        + field("questions", "This is the questions slide, live room only", "check");
    } else if (slide.template === "poll") {
      const options = HubDeck.lines(slide.optionsText);
      const correct = options.map((option, index) => `<option value="${index}" ${Number(slide.correct) === index ? "selected" : ""}>${escapeText(option)}</option>`).join("");
      extra = field("prompt", "Question (simple HTML such as sub tags is allowed)", "textarea") + sizeField("prompt")
        + field("optionsText", "Options, one per line", "textarea") + sizeField("options")
        + `<label>Correct option</label><select data-field="correct">${correct}</select>`
        + field("teach", "Teaching point", "textarea") + sizeField("teach")
        + field("resultsTitle", "Results slide title", "text")
        + field("image", "Picture path, if this poll has one", "text")
        + `<p class="hint">The preview shows a stand-in for the live QR code, with the response count. Drag it to move it. Drag the dark square to change its size. Double-click to put it back.</p>`;
    } else if (window.HubLayouts && HubLayouts.fields(slide.template)) {
      extra = schemaFields(slide.template);
    } else if (slide.template === "special") {
      extra = `<p class="hint">This slide keeps its chart, photo, or vote layout.</p>`
        + field("prompt", "Question", "textarea")
        + field("teach", "Teaching point", "textarea");
    } else {
      const parts = HubDeck.textParts(slide.html || "");
      const partFields = parts.map((part, index) => `<label>${escapeText(part.label)}</label><textarea data-part="${index}">${escapeText(part.value)}</textarea>`).join("");
      extra = partFields + `<details><summary>Edit the layout HTML</summary>${field("html", "HTML", "textarea")}</details>`;
    }
    const imports = (state.status && state.status.imports) || [];
    const published = state.status && state.status.published && state.status.published[course];
    inspect.innerHTML = `
      <div class="inspect-head">
        <p class="template-name">Folder: ${escapeText(state.folder ? state.folder.name : "")} · ${state.index + 1} of ${state.deck.slides.length}</p>
        <label>Colour theme</label>
        ${themePicker()}
        <p class="hint">This colours the whole session. Hover a name to try it on this slide. Clay, Tide and Plum use the ambulance title picture for now.</p>
        <label>Layout</label>
        ${picker("layout", slide.template)}
        <p class="hint">Hover a layout to see an example. Choosing one keeps the title and the notes.</p>
      </div>
      <div class="inspect-body">
      ${state.status && state.status.shared
        ? ""
        : topic
        ? `<p class="hint">Topic: ${escapeText(topic.heading)}${topic.published ? "" : " · Not on the public site yet"}</p>`
        : `<p class="hint">This folder is not a topic on the site.</p>`}
      <div class="checks">
        <label><input type="checkbox" data-field="live" ${slide.live ? "checked" : ""}> Live room</label>
        <label><input type="checkbox" data-field="self" ${slide.self ? "checked" : ""}> Self-guided</label>
      </div>
      <p class="warn" id="audienceWarn">${!slide.live && !slide.self ? "This slide is hidden in both decks." : ""}</p>
      ${field("kicker", "Kicker", "text")}
      ${field("title", "Title", "text")}
      ${extra}
      ${field("notes", "Instructor notes", "textarea")}
      <div class="tool-row">
        <button type="button" data-action="up">Up</button>
        <button type="button" data-action="down">Down</button>
        <button type="button" data-action="duplicate">Duplicate</button>
        <button type="button" class="danger" data-action="delete">Delete</button>
      </div>
      ${course && imports.indexOf(course) !== -1 ? `<div class="card-block"><h2>Slides already in this project</h2><p class="hint">Replaces the slides in this folder with the copy stored for this topic.</p><button type="button" data-action="import" data-course="${escapeText(course)}">Load this topic’s slides</button></div>` : ""}
      ${published ? `<p class="hint">This session in the project is currently using an editor copy.</p><button type="button" data-action="restore">Use the original slides again</button>` : ""}
      <p class="hint" id="savedNote">${state.deck.updated ? "Last saved " + escapeText(state.deck.updated) + (state.deck.updatedBy ? " by " + escapeText(state.deck.updatedBy) : "") : "Not saved yet."}</p>
      </div>
    `;
    const notes = inspect.querySelector("[data-field=notes]");
    if (notes) notes.style.minHeight = "140px";
  }

  function refreshPreview() {
    const frame = document.getElementById("preview");
    const slide = current();
    if (!frame || !frame.contentWindow || !previewReady || !slide) return;
    frame.contentWindow.postMessage({
      html: HubDeck.previewHtml(slide, ctx()),
      theme: currentThemeClass()
    }, location.origin);
  }

  function rememberField(target) {
    const fieldName = target.getAttribute("data-field");
    const slide = current();
    if (!fieldName || !slide) return;
    if (target.type === "checkbox") slide[fieldName] = target.checked;
    else if (fieldName === "correct") slide.correct = Number(target.value);
    else slide[fieldName] = target.value;
    state.dirty = true;
    const warn = document.getElementById("audienceWarn");
    if (warn) warn.textContent = !slide.live && !slide.self ? "This slide is hidden in both decks." : "";
    if (fieldName === "questions" && target.checked) {
      slide.self = false;
      const selfBox = document.querySelector("[data-field=self]");
      if (selfBox) selfBox.checked = false;
    }
    if (fieldName === "optionsText") rebuildCorrect();
    renderFilm();
    refreshPreview();
    paintChrome();
  }

  async function saveDeck() {
    const data = await api("/api/deck", {
      method: "POST",
      body: JSON.stringify({
        driveId: state.folder.driveId,
        itemId: state.folder.itemId,
        deck: state.deck
      })
    });
    state.deck = data.deck || state.deck;
    state.dirty = false;
    const note = document.getElementById("savedNote");
    if (note) note.textContent = "Last saved " + (state.deck.updated || "") + (state.deck.updatedBy ? " by " + state.deck.updatedBy : "");
    paintChrome();
  }

  function mediaUrl(image) {
    if (!image || String(image).indexOf("upload:") !== 0 || !state.folder) return "";
    const query = new URLSearchParams({
      driveId: state.folder.driveId,
      itemId: state.folder.itemId,
      name: String(image).slice(7)
    });
    return "/media?" + query.toString();
  }

  async function uploadImage(file, role) {
    const headers = {
      "X-Filename": file.name,
      "X-Drive-Id": state.folder.driveId,
      "X-Item-Id": state.folder.itemId
    };
    if (role) headers["X-Role"] = role;
    const res = await fetch("/api/asset", { method: "POST", headers: headers, body: file });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not add that picture");
    current().image = data.image;
    state.dirty = true;
    renderInspector();
    refreshPreview();
    paintChrome();
    if (role === "title") await saveDeck();
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector('script[data-src="' + src + '"]')) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.dataset.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Could not load the current deck"));
      document.body.appendChild(script);
    });
  }

  async function openLive(course) {
    const topic = ((state.status && state.status.topics) || []).find((item) => item.id === course);
    if (!topic) throw new Error("That topic is not on the site.");
    const label = topic.heading || topic.folder || course;
    let folder = state.folders.find((item) => item.course === course);
    if (!folder) {
      const here = state.status && state.status.project && (state.source === "pc" || state.source === "local");
      if (!here) throw new Error("The " + label + " folder is not available here. It needs to be shared with you before it can be opened.");
      const data = await api("/api/folders", {
        method: "POST",
        body: JSON.stringify({ source: state.source, name: topic.folder || label })
      });
      folder = data.folder;
      state.folders.push(folder);
    }
    await openFolder(folder.driveId, folder.itemId);
    const fresh = !(state.deck && state.deck.updated);
    if (fresh && state.status && (state.status.imports || []).indexOf(course) !== -1) {
      await importCourse(course, true);
      await saveDeck();
    }
  }

  async function importCourse(course, skipConfirm) {
    if (!skipConfirm && state.deck.slides.length && !confirm("Replace the slides in this draft with the current project deck?")) return;
    const path = "/" + (course === "hf" ? "hf" : course) + "/slides.js";
    await loadScript(path);
    const fnName = course === "hf" ? "heartFailureSlides" : course + "Slides";
    const fn = window[fnName];
    if (typeof fn !== "function") throw new Error("The current deck did not load");
    state.deck.slides = fn().map(HubDeck.fromPlayer);
    state.deck.course = course;
    state.deck.kind = "hub-cpd-deck";
    state.deck.version = 1;
    state.index = 0;
    state.dirty = true;
    renderFilm();
    renderInspector();
    refreshPreview();
    paintChrome();
  }

  async function copyIntoProject() {
    const course = state.deck.course;
    if (!course) throw new Error("This folder is a draft, so it cannot be copied into the project.");
    if (!confirm("Copy this deck into the project on this computer? hub-cpd.co.uk does not change until you push.")) return;
    await saveDeck();
    const slides = state.deck.slides.map((slide) => HubDeck.toPlayer(slide, ctx()));
    await api("/api/project", {
      method: "POST",
      body: JSON.stringify({
        course: course,
        slides: slides,
        theme: state.deck.theme || "",
        uploads: HubDeck.uploadsIn(state.deck),
        driveId: state.folder.driveId,
        itemId: state.folder.itemId
      })
    });
    state.status = await api("/api/status");
    renderInspector();
    alert("Copied into this project. Open the deck to check it, then push when you want the live site to change.");
  }

  async function openFolder(driveId, itemId) {
    const folder = state.folders.find((item) => item.driveId === driveId && item.itemId === itemId);
    if (!folder) return;
    const data = await api("/api/deck?driveId=" + encodeURIComponent(driveId) + "&itemId=" + encodeURIComponent(itemId));
    state.folder = folder;
    state.deck = data.deck || HubDeck.blankDeck(folder.name, folder.course);
    state.deck.slides = (state.deck.slides || []).map((slide) => HubDeck.adopt(slide));
    if (!state.deck.course) state.deck.course = folder.course || "";
    state.deck.kind = "hub-cpd-deck";
    state.index = 0;
    state.dirty = false;
    showEditor();
  }

  async function pullNewerDraft() {
    if (!state.folder || !state.deck || state.dirty || document.hidden) return;
    if (!document.getElementById("filmList")) return;
    const folder = state.folder;
    const seen = state.deck.updated || "";
    const data = await api("/api/deck?driveId=" + encodeURIComponent(folder.driveId) + "&itemId=" + encodeURIComponent(folder.itemId));
    const next = data.deck;
    if (!next || !next.updated || next.updated === seen) return;
    if (state.folder !== folder || state.dirty) return;
    const index = state.index;
    state.deck = next;
    state.deck.slides = (state.deck.slides || []).map((slide) => HubDeck.adopt(slide));
    if (!state.deck.course) state.deck.course = folder.course || "";
    state.deck.kind = "hub-cpd-deck";
    state.index = Math.min(index, Math.max(0, state.deck.slides.length - 1));
    state.dirty = false;
    renderFilm();
    renderInspector();
    refreshPreview();
    paintChrome();
  }

  setInterval(() => {
    pullNewerDraft().catch(() => {});
  }, 8000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) pullNewerDraft().catch(() => {});
  });

  function rememberSize(target) {
    const key = target.getAttribute("data-box-size");
    const slide = current();
    if (!key || !slide) return;
    slide.boxSize = slide.boxSize || {};
    if (target.value === "fit") delete slide.boxSize[key];
    else slide.boxSize[key] = target.value;
    if (!Object.keys(slide.boxSize).length) delete slide.boxSize;
    state.dirty = true;
    refreshPreview();
    paintChrome();
  }

  function rememberReveal(target) {
    const key = target.getAttribute("data-box-reveal");
    const slide = current();
    if (!key || !slide) return;
    slide.boxReveal = slide.boxReveal || {};
    if (target.checked) slide.boxReveal[key] = true;
    else delete slide.boxReveal[key];
    if (!Object.keys(slide.boxReveal).length) delete slide.boxReveal;
    state.dirty = true;
    refreshPreview();
    paintChrome();
  }

  screen.addEventListener("input", (event) => {
    const target = event.target;
    if (!target) return;
    if (target.getAttribute("data-part") != null) {
      const slide = current();
      if (!slide) return;
      slide.html = HubDeck.writePart(slide.html || "", Number(target.getAttribute("data-part")), target.value);
      state.dirty = true;
      const htmlBox = document.querySelector("[data-field=html]");
      if (htmlBox && document.activeElement !== htmlBox) htmlBox.value = slide.html;
      refreshPreview();
      paintChrome();
      return;
    }
    if (target.getAttribute("data-box-size")) rememberSize(target);
    if (target.getAttribute("data-box-reveal")) rememberReveal(target);
    if (target.getAttribute("data-field")) rememberField(target);
  });
  screen.addEventListener("change", (event) => {
    const target = event.target;
    if (!target) return;
    if (target.id === "course" && state.deck) {
      state.deck.course = target.value;
      state.dirty = true;
      refreshPreview();
      renderFilm();
      paintChrome();
      return;
    }
    if (target.id === "imageFile" && target.files && target.files[0]) {
      uploadImage(target.files[0]).catch((err) => alert(err.message));
      return;
    }
    if (target.id === "titleImageFile" && target.files && target.files[0]) {
      uploadImage(target.files[0], "title").catch((err) => alert(err.message));
      return;
    }
    if (target.getAttribute("data-box-size")) rememberSize(target);
    if (target.getAttribute("data-box-reveal")) rememberReveal(target);
    if (target.getAttribute("data-field")) rememberField(target);
  });

  function closeMenus() {
    document.querySelectorAll(".picker-menu").forEach((menu) => { menu.hidden = true; });
    document.querySelectorAll(".picker-open").forEach((button) => button.setAttribute("aria-expanded", "false"));
  }

  function hideExample() {
    const frame = document.getElementById("templateHover");
    if (frame) frame.hidden = true;
  }

  function showExample(id, anchor) {
    const frame = document.getElementById("templateHover");
    if (!frame || !HubDeck.example) return;
    const box = anchor.getBoundingClientRect();
    const width = 460;
    let left = box.right + 12;
    if (left + width > window.innerWidth - 8) left = Math.max(8, box.left - width - 12);
    frame.style.width = width + "px";
    frame.style.height = "270px";
    frame.style.left = left + "px";
    frame.style.top = Math.max(8, Math.min(box.top, window.innerHeight - 286)) + "px";
    frame.hidden = false;
    hoverHtml = HubDeck.previewHtml(HubDeck.example(id), {
      course: state.deck && state.deck.course || "copd",
      driveId: "",
      itemId: "",
      index: 0,
      total: 1
    });
    if (hoverReady && frame.contentWindow) frame.contentWindow.postMessage({ html: hoverHtml, theme: currentThemeClass() }, location.origin);
  }

  function placeMenu(menu, opener) {
    const box = opener.getBoundingClientRect();
    menu.hidden = false;
    menu.style.position = "fixed";
    menu.style.left = box.left + "px";
    menu.style.width = Math.max(box.width, 220) + "px";
    const height = Math.min(menu.scrollHeight, 360);
    let top = box.bottom + 4;
    if (top + height > window.innerHeight - 8) top = Math.max(8, box.top - height - 4);
    menu.style.top = top + "px";
    menu.style.maxHeight = "360px";
  }

  function paintTheme(className) {
    const frame = document.getElementById("preview");
    if (!frame || !frame.contentWindow || !previewReady) return;
    frame.contentWindow.postMessage({ theme: className || "" }, location.origin);
  }

  screen.addEventListener("mouseover", (event) => {
    const themeItem = event.target.closest("[data-theme]");
    if (themeItem) {
      paintTheme(HubDeck.themeClass(themeItem.getAttribute("data-theme")));
      return;
    }
    const item = event.target.closest("[data-pick]");
    if (!item) return;
    showExample(item.getAttribute("data-pick"), item);
  });

  screen.addEventListener("mouseout", (event) => {
    const menu = event.target.closest('[data-picker="theme"] .picker-menu');
    if (!menu || menu.hidden) return;
    const next = event.relatedTarget;
    if (next && menu.contains(next)) return;
    paintTheme(currentThemeClass());
  });

  screen.addEventListener("click", (event) => {
    const themeItem = event.target.closest("[data-theme]");
    if (themeItem) {
      const id = themeItem.getAttribute("data-theme");
      closeMenus();
      if (state.deck && state.deck.theme !== id) {
        state.deck.theme = id;
        state.dirty = true;
        renderInspector();
        paintChrome();
      }
      paintTheme(currentThemeClass());
      return;
    }
    const item = event.target.closest("[data-pick]");
    const opener = event.target.closest(".picker-open");
    if (item) {
      const which = item.closest(".picker").getAttribute("data-picker");
      const id = item.getAttribute("data-pick");
      closeMenus();
      hideExample();
      if (which === "add") {
        state.addTemplate = id;
        const label = (HubDeck.choices || []).filter((choice) => choice.id === id)[0];
        const button = document.querySelector('[data-picker="add"] .picker-open');
        if (button && label) button.textContent = label.label;
        return;
      }
      const slide = current();
      if (!slide || id === slide.template) return;
      if ((slide.template === "custom" || slide.template === "special") && !confirm("Change this slide to a template? The existing layout will be replaced. Title, notes, and the audience ticks stay.")) return;
      state.deck.slides[state.index] = HubDeck.changeTemplate(slide, id);
      state.dirty = true;
      renderFilm();
      renderInspector();
      refreshPreview();
      paintChrome();
      return;
    }
    if (opener) {
      const menu = opener.parentElement.querySelector(".picker-menu");
      const open = menu.hidden;
      closeMenus();
      if (open) {
        placeMenu(menu, opener);
        opener.setAttribute("aria-expanded", "true");
      } else hideExample();
      return;
    }
    if (!event.target.closest(".picker")) {
      closeMenus();
      hideExample();
    }
    const button = event.target.closest("button");
    if (!button) return;
    const action = button.dataset.action || button.id;
    Promise.resolve(handleAction(action, button)).catch((err) => {
      alert(err.message || "That did not work");
    });
  });

  actions.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    Promise.resolve(handleAction(button.id, button)).catch((err) => alert(err.message || "That did not work"));
  });

  async function handleAction(action, button) {
    if (action === "saveConfig") {
      await api("/api/config", {
        method: "POST",
        body: JSON.stringify({
          clientId: document.getElementById("clientId").value,
          ownerEmail: document.getElementById("ownerEmail").value
        })
      });
      state.status = await api("/api/status");
      state.authError = "";
      showHome();
      return;
    }
    if (action === "signIn") {
      location.href = "/auth/start";
      return;
    }
    if (action === "usePc") {
      state.source = "pc";
      sessionStorage.setItem("hub-editor-source", "pc");
      await showFolders();
      return;
    }
    if (action === "useLocal") {
      state.source = "local";
      sessionStorage.setItem("hub-editor-source", "local");
      await showFolders();
      return;
    }
    if (action === "homeBtn") {
      showHome();
      return;
    }
    if (action === "signOutBtn") {
      await api("/api/logout", { method: "POST", body: "{}" });
      state.status = await api("/api/status");
      showHome();
      return;
    }
    if (action === "foldersBtn") {
      if (state.dirty && !confirm("Leave without saving?")) return;
      await showFolders();
      return;
    }
    if (action === "saveBtn") {
      await saveDeck();
      return;
    }
    if (action === "copyBtn") {
      await copyIntoProject();
      return;
    }
    if (action === "createFolder") {
      const name = document.getElementById("folderName").value.trim();
      if (!name) return;
      const data = await api("/api/folders", {
        method: "POST",
        body: JSON.stringify({ source: state.source, name: name })
      });
      state.folders.push(data.folder);
      await openFolder(data.folder.driveId, data.folder.itemId);
      return;
    }
    if (action === "open-folder") {
      await openFolder(button.dataset.drive, button.dataset.id);
      return;
    }
    if (action === "locked-topic") {
      const label = button.dataset.label || "That session";
      state.error = "You have not been given access to " + label + ". It stays closed until that session folder is shared with you.";
      showSharedFolders();
      return;
    }
    if (action === "open-live") {
      await openLive(button.dataset.course);
      return;
    }
    if (action === "buildReset" || action === "buildNext" || action === "buildPlay") {
      const frame = document.getElementById("preview");
      const mode = action === "buildReset" ? "reset" : action === "buildNext" ? "next" : "play";
      if (frame && frame.contentWindow) frame.contentWindow.postMessage({ builds: mode }, location.origin);
      return;
    }
    if (action === "addSlide") {
      const template = state.addTemplate || "title";
      state.deck.slides.splice(state.index + 1, 0, HubDeck.blank(template));
      state.index += 1;
      state.dirty = true;
      renderFilm();
      renderInspector();
      refreshPreview();
      paintChrome();
      return;
    }
    if (action === "select") {
      state.index = Number(button.dataset.index);
      renderFilm();
      renderInspector();
      refreshPreview();
      return;
    }
    if (action === "up" || action === "down") {
      const next = state.index + (action === "up" ? -1 : 1);
      if (next < 0 || next >= state.deck.slides.length) return;
      const moved = state.deck.slides.splice(state.index, 1)[0];
      state.deck.slides.splice(next, 0, moved);
      state.index = next;
      state.dirty = true;
      renderFilm();
      renderInspector();
      refreshPreview();
      paintChrome();
      return;
    }
    if (action === "duplicate") {
      const copy = JSON.parse(JSON.stringify(current()));
      copy.id = HubDeck.uid();
      if (copy.template === "poll") copy.pollId = "";
      if (copy.player && copy.player.pollId) copy.player.pollId = copy.player.pollId + "-copy";
      state.deck.slides.splice(state.index + 1, 0, copy);
      state.index += 1;
      state.dirty = true;
      renderFilm();
      renderInspector();
      refreshPreview();
      paintChrome();
      return;
    }
    if (action === "delete") {
      if (state.deck.slides.length === 1) throw new Error("A deck needs at least one slide.");
      if (!confirm("Delete this slide?")) return;
      state.deck.slides.splice(state.index, 1);
      state.index = Math.min(state.index, state.deck.slides.length - 1);
      state.dirty = true;
      renderFilm();
      renderInspector();
      refreshPreview();
      paintChrome();
      return;
    }
    if (action === "import") {
      await importCourse(button.dataset.course);
      return;
    }
    if (action === "clearTitleImage") {
      const slide = current();
      if (!slide) return;
      await api("/api/title-image", {
        method: "POST",
        body: JSON.stringify({ driveId: state.folder.driveId, itemId: state.folder.itemId })
      });
      if (String(slide.image || "").indexOf("upload:title-slide.") === 0) slide.image = "";
      state.dirty = true;
      renderInspector();
      refreshPreview();
      await saveDeck();
      return;
    }
    if (action === "restore") {
      if (!confirm("Use the original slides in this project again? The draft in the folder stays as it is.")) return;
      await api("/api/project-restore", {
        method: "POST",
        body: JSON.stringify({ course: state.deck.course, driveId: state.folder.driveId })
      });
      state.status = await api("/api/status");
      renderInspector();
    }
  }

  function rememberNudge(spot) {
    const slide = current();
    const key = spot && spot.key;
    if (!slide || !key) return;
    const x = Math.max(-60, Math.min(60, Math.round(Number(spot.x) || 0)));
    const y = Math.max(-60, Math.min(60, Math.round(Number(spot.y) || 0)));
    const scale = Math.max(0.45, Math.min(2.2, Math.round((Number(spot.scale) || 1) * 100) / 100));
    slide.place = slide.place || {};
    if (!x && !y && scale === 1) delete slide.place[key];
    else slide.place[key] = { x: x, y: y, scale: scale };
    if (!Object.keys(slide.place).length) delete slide.place;
    state.dirty = true;
    paintChrome();
  }

  window.addEventListener("message", (event) => {
    if (event.origin !== location.origin || !event.data) return;
    if (event.data.nudge) {
      rememberNudge(event.data.nudge);
      return;
    }
    if (!event.data.ready) return;
    const hover = document.getElementById("templateHover");
    if (hover && event.source === hover.contentWindow) {
      hoverReady = true;
      if (hoverHtml) event.source.postMessage({ html: hoverHtml, theme: currentThemeClass() }, location.origin);
      return;
    }
    const frame = document.getElementById("preview");
    if (frame && event.source !== frame.contentWindow) return;
    previewReady = true;
    refreshPreview();
  });

  window.addEventListener("beforeunload", (event) => {
    if (!state.dirty) return;
    event.preventDefault();
    event.returnValue = "";
  });

  api("/api/status").then((status) => {
    state.status = status;
    state.source = "pc";
    sessionStorage.setItem("hub-editor-source", "pc");
    return showFolders();
  }).catch((err) => {
    screen.innerHTML = `<div class="home"><div class="error">${escapeText(err.message)}</div></div>`;
  });
})();
