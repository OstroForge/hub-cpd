(function () {
  const LABELS = {
    title: "Title",
    columns: "Two columns",
    photo: "Text and photo",
    quote: "Quote",
    banners: "Banners",
    steps: "Three columns",
    poll: "Poll",
    special: "Existing layout",
    custom: "Existing slide"
  };

  function uid() {
    return Math.random().toString(36).slice(2, 10);
  }

  function esc(value) {
    return String(value || "").replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[ch]));
  }

  function lines(value) {
    return String(value || "").split(/\n/).map((line) => line.trim()).filter(Boolean);
  }

  function safeTag(tag) {
    const close = /^<\/(sub|sup|strong|em|b|i|a)\s*>$/i.exec(tag);
    if (close) return "</" + close[1].toLowerCase() + ">";
    if (/^<br\s*\/?>$/i.test(tag)) return "<br>";
    const open = /^<(sub|sup|strong|em|b|i)\s*>$/i.exec(tag);
    if (open) return "<" + open[1].toLowerCase() + ">";
    if (/^<a\s/i.test(tag)) {
      const href = /\bhref="([^"]+)"/i.exec(tag);
      const url = href ? href[1] : "";
      if (/^https:\/\//i.test(url) || /^mailto:/i.test(url)) return '<a href="' + esc(url) + '">';
    }
    return esc(tag);
  }

  function rich(value) {
    const text = String(value || "");
    const tags = /<[^>]+>/g;
    let out = "";
    let last = 0;
    let match = tags.exec(text);
    while (match) {
      out += esc(text.slice(last, match.index));
      out += safeTag(match[0]);
      last = match.index + match[0].length;
      match = tags.exec(text);
    }
    return out + esc(text.slice(last));
  }

  function list(value) {
    const items = lines(value);
    if (!items.length) return "";
    return "<ul>" + items.map((item) => "<li>" + rich(item) + "</li>").join("") + "</ul>";
  }

  function plain(value) {
    return String(value || "")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">");
  }

  function blank(template, title) {
    const slide = {
      id: uid(),
      template: template,
      live: true,
      self: true,
      notes: "",
      kicker: "",
      title: title || ""
    };
    if (template === "title") {
      slide.kicker = "Ambulance Clinical Refreshers";
      slide.title = title || "New session";
      slide.subtitle = "";
      slide.meta = "Always follow the live JRCALC entry and local Trust policy.";
    } else if (template === "columns") {
      slide.kicker = "Teaching point";
      slide.title = title || "Two sides of the decision";
      slide.leftTitle = "";
      slide.leftBody = "";
      slide.rightTitle = "";
      slide.rightBody = "";
      slide.rightTone = "normal";
      slide.note = "";
      slide.banner = "";
      slide.bannerTone = "red";
      slide.bannerReveal = true;
    } else if (template === "photo") {
      slide.kicker = "Look at this";
      slide.title = title || "Picture and explanation";
      slide.body = "";
      slide.caption = "";
      slide.image = "";
      slide.imageAlt = "";
      slide.imageSide = "right";
    } else if (template === "quote") {
      slide.kicker = "The wording";
      slide.title = title || "What the guidance says";
      slide.quote = "";
      slide.leftTitle = "What that means";
      slide.leftBody = "";
      slide.rightTitle = "What it does not say";
      slide.rightBody = "";
    } else if (template === "banners") {
      slide.kicker = "Take home";
      slide.title = title || "Key points";
      slide.lines = "";
      slide.reveal = true;
    } else if (template === "steps") {
      slide.kicker = "Assessment";
      slide.title = title || "Three parts";
      slide.oneTitle = "Ask";
      slide.oneBody = "";
      slide.oneTone = "plain";
      slide.twoTitle = "Examine";
      slide.twoBody = "";
      slide.twoTone = "hand";
      slide.threeTitle = "Red flags";
      slide.threeBody = "";
      slide.threeTone = "decide";
      slide.reveal = true;
    } else if (template === "poll") {
      slide.kicker = "Check";
      slide.title = title || "Question";
      slide.prompt = "";
      slide.optionsText = "Yes\nNo";
      slide.correct = 0;
      slide.teach = "";
      slide.pollId = "";
      slide.resultsTitle = "How the room voted";
      slide.detail = "";
      slide.image = "";
      slide.imageAlt = "";
    }
    if (window.HubLayouts) HubLayouts.prepare(slide);
    return slide;
  }

  function blankDeck(name, course) {
    return {
      kind: "hub-cpd-deck",
      version: 1,
      course: course || "",
      title: name || "New session",
      slides: [blank("title", name || "New session")]
    };
  }

  function audience(slide) {
    const special = !!(slide.hostedOnly || slide.collectNames || slide.questions);
    return {
      live: slide.live !== false,
      self: slide.self === true || (slide.self !== false && !special)
    };
  }

  function fromPlayer(slide) {
    const flags = audience(slide);
    const base = {
      id: uid(),
      live: flags.live,
      self: flags.self,
      notes: slide.notes || "",
      kicker: slide.kicker || "",
      title: slide.title || ""
    };
    if (slide.type === "title") {
      return Object.assign(base, {
        template: "title",
        subtitle: String(slide.subtitle || "").replace(/<br\s*\/?>/gi, "\n"),
        meta: slide.meta || ""
      });
    }
    if (slide.type === "poll" && slide.layout === "news2") {
      const picture = /<img[^>]*src="([^"]*)"[^>]*>/i.exec(slide.detail || "");
      const described = /<img[^>]*alt="([^"]*)"[^>]*>/i.exec(slide.detail || "");
      const obs = slide.obs || {};
      return Object.assign(base, {
        template: "score",
        prompt: slide.prompt || "",
        teach: slide.teach || "",
        pollId: slide.pollId || "",
        resultsTitle: slide.resultsTitle || "How the room scored",
        sceneText: (slide.scene || []).join("\n"),
        detail: slide.detail || "",
        image: picture ? picture[1] : "",
        imageAlt: described ? described[1] : "",
        hx: obs.hx || "",
        rr: obs.rr || "",
        spo2: obs.spo2 || "",
        o2: obs.o2 || "",
        sbp: obs.sbp || "",
        pulse: obs.pulse || "",
        con: obs.con || "",
        temp: obs.temp || "",
        expectedScale: slide.expectedScale || 1,
        expectedTotal: slide.expectedTotal || 0,
        player: slide
      });
    }
    if (slide.type === "poll") {
      const picture = /<img[^>]*src="([^"]*)"[^>]*>/i.exec(slide.detail || "");
      const described = /<img[^>]*alt="([^"]*)"[^>]*>/i.exec(slide.detail || "");
      return Object.assign(base, {
        template: "poll",
        prompt: slide.prompt || "",
        optionsText: (slide.options || []).join("\n"),
        correct: typeof slide.correct === "number" ? slide.correct : 0,
        teach: slide.teach || "",
        pollId: slide.pollId || "",
        resultsTitle: slide.resultsTitle || "How the room voted",
        detail: slide.detail || "",
        image: slide.image || (picture ? picture[1] : ""),
        imageAlt: described ? described[1] : ""
      });
    }
    return adopt(Object.assign(base, {
      template: "custom",
      html: slide.html || "",
      player: slide,
      questions: !!slide.questions,
      feedback: !!slide.feedback,
      hostedOnly: !!slide.hostedOnly
    }));
  }

  function applyAudience(out, slide) {
    if (slide.questions) out.questions = true;
    if (slide.feedback) out.feedback = true;
    if (slide.hostedOnly) out.hostedOnly = true;
    out.live = !!slide.live;
    out.self = !!slide.self;
    if (slide.self) {
      delete out.questions;
      delete out.hostedOnly;
      delete out.collectNames;
    }
    return out;
  }

  function imageSrc(image, ctx, forPlayer) {
    if (!image) return "";
    if (String(image).indexOf("upload:") === 0) {
      const name = String(image).slice(7);
      if (forPlayer) return (ctx.course || "copd") + "/assets/" + name;
      const query = new URLSearchParams({
        driveId: ctx.driveId || "",
        itemId: ctx.itemId || "",
        name: name
      });
      return "/media?" + query.toString();
    }
    return image;
  }

  function shell(kind, inner, ctx, style) {
    const attr = style ? ` style="${style}"` : "";
    return `<section class="slide ${kind} active"${attr}>${inner}
      <div class="footer-bar"><span class="footer-brand">Hub CPD</span><span>${ctx.index + 1} / ${ctx.total}</span></div>
    </section>`;
  }

  function titlePreviewStyle(slide, ctx) {
    if (String(slide.image || "").indexOf("upload:title-slide.") !== 0) return "";
    const src = imageSrc(slide.image, ctx, false);
    if (!src) return "";
    return "background-image:linear-gradient(90deg, rgba(8, 16, 14, 0.92) 0%, rgba(8, 16, 14, 0.55) 42%, rgba(8, 16, 14, 0.2) 100%), linear-gradient(rgba(8, 16, 14, 0.28), rgba(8, 16, 14, 0.28)), url('" + esc(src) + "');background-size:100% 100%, 100% 100%, cover;background-position:left center, left center, right center;background-repeat:no-repeat";
  }

  function paras(value) {
    const parts = String(value || "").split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
    return parts.map((part) => "<p>" + rich(part) + "</p>").join("");
  }

  function cardBox(title, body, prose, note, tone) {
    const kind = tone && tone !== "normal" && tone !== "plain" ? "card " + tone : "card";
    const main = prose ? paras(body) : list(body);
    const extra = note ? `<p style="margin-top:10px">${rich(note)}</p>` : "";
    return `<div class="${kind}"><h3>${esc(title)}</h3>${main}${extra}</div>`;
  }

  function bodyHtml(slide, ctx, forPlayer) {
    if (window.HubLayouts && HubLayouts.owns(slide.template)) {
      const drawn = HubLayouts.body(slide, ctx, forPlayer, { esc: esc, rich: rich, list: list, lines: lines, imageSrc: imageSrc });
      if (drawn != null) return drawn;
    }
    if (slide.template === "title") {
      return `
        <div class="kicker">${esc(slide.kicker)}</div>
        <h1>${esc(slide.title)}</h1>
        <p class="subtitle">${esc(slide.subtitle).replace(/\n/g, "<br>")}</p>
        ${slide.meta ? `<p class="meta">${esc(slide.meta)}</p>` : ""}
      `;
    }
    if (slide.template === "columns" || slide.template === "quote") {
      const cards = `<div class="body two"${slide.template === "quote" ? ' style="margin-top:16px"' : ""}>
        ${cardBox(slide.leftTitle, slide.leftBody, slide.leftProse, slide.leftNote, slide.leftTone)}
        ${cardBox(slide.rightTitle, slide.rightBody, slide.rightProse, slide.rightNote, slide.rightTone)}
      </div>`;
      const opening = slide.template === "quote" || slide.quote ? `<div class="banner dark">${rich(slide.quote)}</div>` : "";
      const note = slide.note ? `<p class="small" style="margin-top:12px">${rich(slide.note)}</p>` : "";
      const callout = slide.callout ? `<div class="callout${slide.calloutReveal ? " build" : ""}" style="margin-top:14px">${rich(slide.callout)}</div>` : "";
      const tone = ["teal", "green", "dark", "red"].indexOf(slide.bannerTone) !== -1 ? " " + slide.bannerTone : "";
      const reveal = slide.banner && slide.bannerReveal === true ? " build" : "";
      const banner = slide.banner ? `<div class="banner${tone}${reveal}" style="margin-top:12px">${rich(slide.banner)}</div>` : "";
      return `${opening}${cards}${note}${callout}${banner}`;
    }
    if (slide.template === "photo") {
      const src = imageSrc(slide.image, ctx, forPlayer);
      const card = slide.cardTitle || slide.cardBody ? `<div class="card${slide.cardTone === "warn" ? " warn" : ""}" style="margin-top:10px"><h3>${esc(slide.cardTitle)}</h3><p>${rich(slide.cardBody)}</p></div>` : "";
      const picture = `<div>${src ? `<div class="photo-frame"><img src="${esc(src)}" alt="${esc(slide.imageAlt)}"></div>` : ""}<p class="photo-caption">${esc(slide.caption)}</p>${card}</div>`;
      const copy = `<div>${list(slide.body)}</div>`;
      return `<div class="body two fill-side">${slide.imageSide === "left" ? picture + copy : copy + picture}</div>`;
    }
    if (slide.template === "steps") {
      const block = (heading, body, tone, index) => {
        const toneClass = tone && tone !== "plain" ? " " + tone : "";
        const build = slide.reveal !== false && index > 0 ? " build" : "";
        return `<section class="job-step${toneClass}${build}"><div class="job-num job-pill">${esc(heading)}</div>${list(body)}</section>`;
      };
      return `<div class="step-row">
        ${block(slide.oneTitle, slide.oneBody, slide.oneTone, 0)}
        ${block(slide.twoTitle, slide.twoBody, slide.twoTone, 1)}
        ${block(slide.threeTitle, slide.threeBody, slide.threeTone, 2)}
      </div>`;
    }
    if (slide.template === "banners") {
      const cycle = ["", "teal", "green", "dark", "red"];
      return `<div class="body">${lines(slide.lines).map((line, index) => {
        const match = /^(plain|teal|green|navy|dark|red)\s*\|\s*([\s\S]*)$/.exec(line);
        let tone = cycle[index % cycle.length];
        let text = line;
        if (match) {
          const name = match[1] === "navy" ? "dark" : match[1];
          tone = name === "plain" ? "" : name;
          text = match[2];
        }
        const reveal = slide.reveal === false ? "" : " build hold-space";
        return `<div class="banner${tone ? " " + tone : ""}${reveal}" style="margin-top:${index ? "8px" : "0"}">${rich(text)}</div>`;
      }).join("")}</div>`;
    }
    if (slide.template === "poll") {
      const correct = Number(slide.correct) || 0;
      const options = lines(slide.optionsText).map((option, index) => {
        const mark = index === correct ? " is-correct" : "";
        return `<div class="poll-opt${mark}"><span class="poll-lab">${esc(option)}</span></div>`;
      }).join("");
      const detail = slide.detail || (slide.image ? `<div class="photo-frame cutout"><img src="${esc(imageSrc(slide.image, ctx, forPlayer))}" alt="${esc(slide.imageAlt)}"></div>` : "");
      return `<div class="body">
        <p class="poll-prompt">${slide.prompt || ""}</p>
        ${detail}
        <div class="poll-opts">${options}</div>
        ${slide.teach ? `<div class="poll-teach">${slide.teach}</div>` : ""}
      </div>`;
    }
    const html = slide.html || (slide.player && slide.player.html) || (slide.player && slide.player.detail) || "";
    if (slide.template === "special" && slide.prompt) {
      return `<div class="body"><p class="poll-prompt">${slide.prompt}</p>${html}</div>`;
    }
    return html;
  }

  function previewHtml(slide, ctx) {
    if (!slide) return "";
    const inner = bodyHtml(slide, ctx, false);
    if (slide.template === "title") return shell("title-slide", inner, ctx, titlePreviewStyle(slide, ctx));
    const kind = slide.template === "poll" ? "poll-slide" : (slide.player && slide.player.hostedOnly ? "trust-slide" : "");
    const heading = slide.template === "title" ? "" : `<div class="kicker">${esc(slide.kicker)}</div><h2>${esc(slide.title)}</h2>`;
    return shell(kind, heading + inner, ctx);
  }

  function toPlayer(slide, ctx) {
    if (slide.template === "custom" || slide.template === "special") {
      const out = Object.assign({}, slide.player || { kicker: "", title: "", html: "" });
      out.kicker = slide.kicker || "";
      out.title = slide.title || "";
      out.notes = slide.notes || "";
      if (slide.template === "custom") out.html = slide.html || "";
      if (slide.template === "special") {
        out.prompt = slide.prompt || "";
        out.teach = slide.teach || "";
      }
      return applyAudience(out, slide);
    }
    if (slide.template === "title") {
      return applyAudience({
        type: "title",
        kicker: slide.kicker || "",
        title: slide.title || "",
        subtitle: esc(slide.subtitle).replace(/\n/g, "<br>"),
        meta: slide.meta || "",
        notes: slide.notes || ""
      }, slide);
    }
    if (slide.template === "poll") {
      const options = lines(slide.optionsText);
      const correct = Math.max(0, Math.min(Math.max(options.length - 1, 0), Number(slide.correct) || 0));
      return applyAudience({
        type: "poll",
        pollId: slide.pollId || ("q-" + (slide.id || uid())),
        resultsTitle: slide.resultsTitle || "How the room voted",
        kicker: slide.kicker || "",
        title: slide.title || "",
        prompt: slide.prompt || "",
        votePrompt: plain(slide.prompt),
        options: options,
        correct: correct,
        teach: slide.teach || "",
        notes: slide.notes || "",
        detail: slide.detail || "",
        image: slide.image || ""
      }, slide);
    }
    if (slide.template === "score") {
      const out = Object.assign({}, slide.player || {});
      out.type = "poll";
      out.layout = "news2";
      out.kind = "news2";
      out.pollId = slide.pollId || out.pollId || ("q-" + (slide.id || uid()));
      out.resultsTitle = slide.resultsTitle || "How the room scored";
      out.kicker = slide.kicker || "";
      out.title = slide.title || "";
      out.prompt = slide.prompt || "";
      out.votePrompt = plain(slide.prompt);
      out.teach = slide.teach || "";
      out.notes = slide.notes || "";
      out.scene = lines(slide.sceneText);
      out.expectedScale = Number(slide.expectedScale) || 1;
      out.expectedTotal = Number(slide.expectedTotal) || 0;
      out.obs = {
        hx: slide.hx || "",
        rr: slide.rr || "",
        spo2: slide.spo2 || "",
        o2: slide.o2 || "",
        sbp: slide.sbp || "",
        pulse: slide.pulse || "",
        con: slide.con || "",
        temp: slide.temp || ""
      };
      out.options = [];
      if (slide.detail) out.detail = slide.image ? String(slide.detail).replace(/src="[^"]*"/, 'src="' + slide.image + '"') : slide.detail;
      return applyAudience(out, slide);
    }
    return applyAudience({
      kicker: slide.kicker || "",
      title: slide.title || "",
      notes: slide.notes || "",
      html: bodyHtml(slide, ctx, true)
    }, slide);
  }

  function uploadsIn(deck) {
    const found = [];
    JSON.stringify(deck || {}).replace(/upload:([A-Za-z0-9._-]+)/g, (_all, name) => {
      found.push(name);
      return _all;
    });
    return Array.from(new Set(found));
  }

  function textChunks(slide) {
    if (slide.template === "columns" || slide.template === "quote") {
      return [
        { title: slide.leftTitle || "", body: slide.leftBody || "" },
        { title: slide.rightTitle || "", body: slide.rightBody || "" },
        { title: "", body: "" }
      ];
    }
    if (slide.template === "steps") {
      return [
        { title: slide.oneTitle || "", body: slide.oneBody || "" },
        { title: slide.twoTitle || "", body: slide.twoBody || "" },
        { title: slide.threeTitle || "", body: slide.threeBody || "" }
      ];
    }
    if (slide.template === "banners") {
      return [{ title: "", body: slide.lines || "" }, { title: "", body: "" }, { title: "", body: "" }];
    }
    if (slide.template === "photo") {
      return [{ title: "", body: slide.body || "" }, { title: "", body: "" }, { title: "", body: "" }];
    }
    return [{ title: "", body: "" }, { title: "", body: "" }, { title: "", body: "" }];
  }

  function changeTemplate(slide, next) {
    if (!slide || slide.template === next) return slide;
    const fresh = blank(next, slide.title);
    fresh.id = slide.id;
    fresh.live = slide.live;
    fresh.self = slide.self;
    fresh.notes = slide.notes || "";
    fresh.kicker = slide.kicker || fresh.kicker;
    fresh.title = slide.title || fresh.title;
    const chunks = textChunks(slide);
    if (next === "columns" || next === "quote") {
      fresh.leftTitle = chunks[0].title;
      fresh.leftBody = chunks[0].body;
      fresh.rightTitle = chunks[1].title;
      fresh.rightBody = chunks[1].body;
      if (next === "quote") fresh.quote = slide.quote || "";
      fresh.leftTone = slide.leftTone || fresh.leftTone;
      fresh.rightTone = slide.rightTone || fresh.rightTone;
      fresh.leftProse = !!slide.leftProse;
      fresh.rightProse = !!slide.rightProse;
      fresh.leftNote = slide.leftNote || "";
      fresh.rightNote = slide.rightNote || "";
      fresh.callout = slide.callout || "";
      fresh.calloutReveal = !!slide.calloutReveal;
      if (next === "columns") {
        fresh.note = slide.note || "";
        fresh.banner = slide.banner || "";
        fresh.bannerTone = slide.bannerTone || "red";
        fresh.bannerReveal = slide.bannerReveal !== false;
      }
    } else if (next === "steps") {
      fresh.oneTitle = chunks[0].title || fresh.oneTitle;
      fresh.oneBody = chunks[0].body;
      fresh.twoTitle = chunks[1].title || fresh.twoTitle;
      fresh.twoBody = chunks[1].body;
      fresh.threeTitle = chunks[2].title || fresh.threeTitle;
      fresh.threeBody = chunks[2].body;
    } else if (next === "banners") {
      const bits = [];
      chunks.forEach((chunk) => lines(chunk.body).forEach((line) => bits.push(line)));
      fresh.lines = bits.join("\n");
    } else if (next === "photo") {
      fresh.body = chunks.map((chunk) => chunk.body).filter(Boolean).join("\n");
      fresh.image = slide.image || "";
      fresh.caption = slide.caption || "";
      fresh.imageAlt = slide.imageAlt || "";
      fresh.imageSide = slide.imageSide || "right";
    }
    return fresh;
  }

  const INLINE = { sub: 1, sup: 1, strong: 1, em: 1, b: 1, i: 1, br: 1 };

  function parseRoot(html) {
    if (typeof DOMParser === "undefined") return null;
    const doc = new DOMParser().parseFromString("<div id=\"root\">" + (html || "") + "</div>", "text/html");
    return doc.getElementById("root");
  }

  function elements(node) {
    return Array.from(node.children || []);
  }

  function onlyClasses(el, allowed) {
    return Array.from(el.classList).every((name) => allowed.indexOf(name) !== -1);
  }

  function simpleInline(el) {
    return Array.from(el.childNodes).every((child) => {
      if (child.nodeType === 3) return true;
      if (child.nodeType !== 1) return false;
      const name = child.tagName.toLowerCase();
      if (name === "a") {
        const href = child.getAttribute("href") || "";
        if (!/^https:\/\//i.test(href) && !/^mailto:/i.test(href)) return false;
        return Array.from(child.attributes).every((attr) => attr.name === "href" || attr.name === "style") && simpleInline(child);
      }
      if (!INLINE[name] || child.attributes.length) return false;
      return name === "br" || simpleInline(child);
    });
  }

  function sourceText(el) {
    let out = "";
    el.childNodes.forEach((child) => {
      if (child.nodeType === 3) out += child.nodeValue;
      else if (child.nodeType === 1) {
        const name = child.tagName.toLowerCase();
        const href = child.getAttribute("href") || "";
        if (name === "a" && (/^https:\/\//i.test(href) || /^mailto:/i.test(href))) {
          out += '<a href="' + href + '">' + sourceText(child) + "</a>";
        } else if (INLINE[name] && !child.attributes.length) {
          out += name === "br" ? "<br>" : "<" + name + ">" + sourceText(child) + "</" + name + ">";
        } else out += child.textContent;
      }
    });
    return out.replace(/\s+/g, " ").trim();
  }

  function simpleList(ul) {
    if (!ul || ul.tagName !== "UL" || ul.classList.length) return false;
    const items = elements(ul);
    return items.length > 0 && items.every((item) => item.tagName === "LI" && simpleInline(item));
  }

  function listSource(ul) {
    return elements(ul).map((item) => sourceText(item)).filter(Boolean).join("\n");
  }

  function parseCard(card) {
    if (!card || card.tagName !== "DIV" || !card.classList.contains("card")) return null;
    const tone = ["warn", "fact", "myth"].filter((name) => card.classList.contains(name))[0] || "normal";
    const allowed = tone === "normal" ? ["card"] : ["card", tone];
    if (!onlyClasses(card, allowed)) return null;
    const kids = elements(card);
    if (!kids.length || kids[0].tagName !== "H3") return null;
    const rest = kids.slice(1);
    const lists = rest.filter((node) => node.tagName === "UL");
    const paras = rest.filter((node) => node.tagName === "P");
    if (rest.some((node) => node.tagName !== "UL" && node.tagName !== "P")) return null;
    if (lists.length === 1 && simpleList(lists[0]) && paras.length <= 1 && paras.every(simpleInline)) {
      return { title: kids[0].textContent.trim(), body: listSource(lists[0]), prose: false, note: paras.length ? sourceText(paras[0]) : "", tone: tone };
    }
    if (!lists.length && paras.length && paras.every(simpleInline)) {
      const notes = paras.filter((node) => node.classList.contains("small"));
      const mains = paras.filter((node) => !node.classList.contains("small"));
      return {
        title: kids[0].textContent.trim(),
        body: mains.map(sourceText).join("\n\n"),
        prose: true,
        note: notes.map(sourceText).join("\n"),
        tone: tone
      };
    }
    return null;
  }

  function parseColumns(nodes) {
    if (!nodes.length || nodes.length > 4) return null;
    const grid = nodes[0];
    if (grid.tagName !== "DIV" || !grid.classList.contains("two") || !onlyClasses(grid, ["body", "two"])) return null;
    const cards = elements(grid);
    if (cards.length !== 2) return null;
    const left = parseCard(cards[0]);
    const right = parseCard(cards[1]);
    if (!left || !right) return null;
    let note = "";
    let callout = "";
    let calloutReveal = false;
    let banner = "";
    let bannerTone = "";
    let bannerReveal = false;
    let index = 1;
    const noteNode = nodes[index];
    if (noteNode && noteNode.tagName === "P" && noteNode.classList.contains("small") && onlyClasses(noteNode, ["small"]) && simpleInline(noteNode)) {
      note = sourceText(noteNode);
      index += 1;
    }
    const calloutNode = nodes[index];
    if (calloutNode && (calloutNode.tagName === "DIV" || calloutNode.tagName === "P") && calloutNode.classList.contains("callout") && simpleInline(calloutNode)) {
      const extra = Array.from(calloutNode.classList).filter((name) => name !== "callout" && name !== "build");
      if (extra.length) return null;
      callout = sourceText(calloutNode);
      calloutReveal = calloutNode.classList.contains("build");
      index += 1;
    }
    const bannerNode = nodes[index];
    if (bannerNode && bannerNode.tagName === "DIV" && bannerNode.classList.contains("banner") && simpleInline(bannerNode)) {
      const tones = ["teal", "green", "dark", "red"];
      const names = Array.from(bannerNode.classList);
      const tone = names.filter((name) => tones.indexOf(name) !== -1);
      const extra = names.filter((name) => name !== "banner" && name !== "build" && name !== "hold-space" && tones.indexOf(name) === -1);
      if (extra.length || tone.length > 1) return null;
      banner = sourceText(bannerNode);
      bannerTone = tone[0] || "";
      bannerReveal = names.indexOf("build") !== -1;
      index += 1;
    }
    if (index !== nodes.length) return null;
    const slide = blank("columns");
    slide.leftTitle = left.title;
    slide.leftBody = left.body;
    slide.leftProse = left.prose;
    slide.leftNote = left.note;
    slide.leftTone = left.tone;
    slide.rightTitle = right.title;
    slide.rightBody = right.body;
    slide.rightProse = right.prose;
    slide.rightNote = right.note;
    slide.rightTone = right.tone;
    slide.note = note;
    slide.callout = callout;
    slide.calloutReveal = calloutReveal;
    slide.banner = banner;
    slide.bannerTone = banner ? (bannerTone || "") : "";
    slide.bannerReveal = bannerReveal;
    return slide;
  }

  function parseStep(section) {
    if (!section || section.tagName !== "SECTION" || !section.classList.contains("job-step")) return null;
    const tones = { hand: "hand", decide: "decide", amber: "amber" };
    let tone = "plain";
    let build = false;
    const names = Array.from(section.classList);
    for (let i = 0; i < names.length; i++) {
      if (names[i] === "job-step") continue;
      if (names[i] === "build") build = true;
      else if (tones[names[i]] && tone === "plain") tone = tones[names[i]];
      else return null;
    }
    const kids = elements(section);
    if (kids.length !== 2 || kids[0].tagName !== "DIV" || !kids[0].classList.contains("job-num") || !simpleList(kids[1])) return null;
    return { title: kids[0].textContent.trim(), body: listSource(kids[1]), tone: tone, build: build };
  }

  function parseSteps(nodes) {
    if (nodes.length !== 1 || !nodes[0].classList.contains("step-row") || nodes[0].classList.length !== 1) return null;
    const cols = elements(nodes[0]);
    if (cols.length !== 3) return null;
    const parsed = cols.map(parseStep);
    if (parsed.some((item) => !item) || parsed[0].build) return null;
    const later = parsed.slice(1);
    if (later.some((item) => item.build) && later.some((item) => !item.build)) return null;
    const slide = blank("steps");
    ["one", "two", "three"].forEach((name, index) => {
      slide[name + "Title"] = parsed[index].title;
      slide[name + "Body"] = parsed[index].body;
      slide[name + "Tone"] = parsed[index].tone;
    });
    slide.reveal = later[0].build;
    return slide;
  }

  function parseLayout(html) {
    const root = parseRoot(html);
    if (!root) return null;
    let nodes = elements(root);
    if (nodes.length === 1 && nodes[0].tagName === "DIV" && nodes[0].classList.contains("body") && !nodes[0].classList.contains("two") && onlyClasses(nodes[0], ["body"])) {
      nodes = elements(nodes[0]);
    }
    if (window.HubLayouts) {
      const found = realize(HubLayouts.parse(nodes));
      if (found) return found;
    }
    return parseSteps(nodes) || parseColumns(nodes);
  }

  function realize(parsed) {
    if (!parsed) return null;
    const slide = blank(parsed.template || "columns");
    Object.keys(parsed).forEach((key) => {
      if (parsed[key] !== undefined) slide[key] = parsed[key];
    });
    return slide;
  }

  function flagOf(slide, name) {
    return !!(slide[name] || (slide.player && slide.player[name]));
  }

  function adopt(slide) {
    if (!slide) return slide;
    if (slide.template === "special" && slide.player) {
      const next = fromPlayer(slide.player);
      next.id = slide.id || next.id;
      next.notes = slide.notes || next.notes;
      next.kicker = slide.kicker || next.kicker;
      next.title = slide.title || next.title;
      return next;
    }
    if (slide.template !== "custom") return slide;
    const parsed = parseLayout(slide.html || "");
    if (!parsed) return slide;
    parsed.id = slide.id || parsed.id;
    parsed.live = !!slide.live;
    parsed.self = !!slide.self;
    parsed.notes = slide.notes || "";
    parsed.kicker = slide.kicker || "";
    parsed.title = slide.title || "";
    parsed.questions = flagOf(slide, "questions");
    parsed.feedback = !!(flagOf(slide, "feedback") || parsed.feedback);
    parsed.hostedOnly = !!(flagOf(slide, "hostedOnly") || parsed.hostedOnly);
    return parsed;
  }

  function skipped(node) {
    let parent = node.parentElement;
    while (parent) {
      const tag = parent.tagName;
      if (tag === "TABLE" || tag === "SVG" || tag === "SCRIPT" || tag === "STYLE") return true;
      parent = parent.parentElement;
    }
    return false;
  }

  function partKind(node) {
    if (node.classList.contains("banner")) return "Banner";
    if (node.classList.contains("callout")) return "Callout";
    if (node.classList.contains("photo-caption")) return "Caption";
    if (node.classList.contains("small")) return "Note";
    if (node.tagName === "H3") return "Heading";
    if (node.tagName === "LI") return "Bullet";
    return "Text";
  }

  function isPart(node) {
    if (skipped(node) || !simpleInline(node)) return false;
    if (node.classList.contains("banner") || node.classList.contains("callout") || node.classList.contains("photo-caption")) return true;
    if (node.tagName === "H3" || node.tagName === "LI") return true;
    return node.tagName === "P";
  }

  function walkParts(root, visit) {
    let index = 0;
    function walk(node) {
      if (!node || node.nodeType !== 1 || skipped(node)) return;
      if (isPart(node)) {
        visit(node, index);
        index += 1;
        return;
      }
      elements(node).forEach(walk);
    }
    walk(root);
  }

  function textParts(html) {
    const root = parseRoot(html);
    if (!root) return [];
    const counts = {};
    const parts = [];
    walkParts(root, (node) => {
      const kind = partKind(node);
      counts[kind] = (counts[kind] || 0) + 1;
      parts.push({ label: kind + " " + counts[kind], value: sourceText(node) });
    });
    return parts;
  }

  function writePart(html, index, value) {
    const root = parseRoot(html);
    if (!root) return html || "";
    let found = null;
    walkParts(root, (node, partIndex) => {
      if (partIndex === index) found = node;
    });
    if (!found) return html || "";
    found.innerHTML = rich(value);
    return root.innerHTML;
  }

  function example(id) {
    const slide = blank(id);
    const extra = window.HubLayouts && HubLayouts.sample(id);
    if (extra) Object.assign(slide, extra);
    slide.template = id;
    return slide;
  }

  if (window.HubLayouts) {
    HubLayouts.choices.forEach((item) => { LABELS[item.id] = item.label; });
  }

  const THEMES = [
    { id: "copd", label: "Sand" },
    { id: "hf", label: "Slate" },
    { id: "asthma", label: "Sage" },
    { id: "clay", label: "Clay" },
    { id: "tide", label: "Tide" },
    { id: "plum", label: "Plum" }
  ];

  function themeIdFor(course, chosen) {
    if (THEMES.some((item) => item.id === chosen)) return chosen;
    if (course === "hf") return "hf";
    if (course === "asthma") return "asthma";
    return "copd";
  }

  function themeClass(id) {
    if (!id || id === "copd") return "";
    return "theme-" + id;
  }

  function themeFor(course, chosen) {
    return themeClass(themeIdFor(course, chosen));
  }

  window.HubDeck = {
    LABELS: LABELS,
    uid: uid,
    blank: blank,
    blankDeck: blankDeck,
    fromPlayer: fromPlayer,
    previewHtml: previewHtml,
    toPlayer: toPlayer,
    changeTemplate: changeTemplate,
    adopt: adopt,
    example: example,
    choices: window.HubLayouts ? HubLayouts.choices : [],
    textParts: textParts,
    writePart: writePart,
    uploadsIn: uploadsIn,
    THEMES: THEMES,
    themeIdFor: themeIdFor,
    themeClass: themeClass,
    themeFor: themeFor,
    lines: lines
  };
})();
