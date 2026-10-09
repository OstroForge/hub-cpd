# Hub CPD — how to run a session

WMAS ambulance CPD decks (COPD, Heart Failure, and later packages) with live room voting.

Each topic has its own folder:

| Topic | Folder |
| --- | --- |
| COPD | `copd/` — `slides.js`, `handout.html`, `assets/` |
| Heart Failure | `hf/` — `slides.js`, `handout.html`, `assets/` |
| Acute Asthma | `asthma/` — `slides.js`, `handout.html`, `assets/` |

The hub (`index.html`, `serve.py`) stays at the top. Each topic keeps its feedback workbooks in `feedback/dev.xlsx` and `feedback/live.xlsx`. To add a later package, copy that folder pattern. The backlog of later sessions is `FUTURE-TOPICS.md`.

## Local (this laptop)

From this project folder:

```
python serve.py
```

Then open on **this laptop**:

| What | URL |
| --- | --- |
| Home | http://127.0.0.1:8765/ |
| Presenter / notes | http://127.0.0.1:8765/?view=presenter |
| Audience window (share this) | http://127.0.0.1:8765/?view=audience |
| Self-guided (no vote, no register) | http://127.0.0.1:8765/?view=self |
| Printable COPD handout | http://127.0.0.1:8765/copd/handout.html |
| Printable Heart Failure handout | http://127.0.0.1:8765/hf/handout.html |
| Printable Acute Asthma handout | http://127.0.0.1:8765/asthma/handout.html |

Phones must **not** use `127.0.0.1` — that address only works on the laptop. Put the phone on the **same Wi-Fi** as the laptop (not mobile data) and open the LAN address printed in the terminal, for example:

`http://192.168.1.146:8765/v`

Use **http**, not https. The QR on the slide already uses that LAN address.

If it only works **sometimes**:

1. Turn **mobile data off** on the phone (iPhone: Settings → Mobile Data off, and Wi-Fi Assist off). The phone otherwise hops to 4G and `192.168.1.x` suddenly “can’t be reached”.
2. Stay on the same Wi-Fi as the laptop — not guest Wi-Fi, not a different band/SSID, not a mix of the laptop address and `hub-cpd.co.uk`.
3. Type the URL with `http://` at the front, or scan the QR after a hard refresh of the deck.
4. Some work / Trust Wi-Fi blocks phone-to-laptop traffic. Use a phone hotspot (laptop and phones on that hotspot) or the hosted Render session instead.

Windows Firewall asks again every time `python serve.py` starts if Python is allowed on Public networks only. This laptop’s Wi-Fi is a **Private** network, so that prompt is the phone being refused. When the box appears, tick **Private networks** and click **Allow access**. Do not click Cancel. To set it without waiting for the box: Windows Security → Firewall & network protection → Allow an app through firewall → Change settings → tick Private (and Public) for Python → OK. That is a one-time click on this PC. A code change does not replace it.

Do **not** also run `python -m http.server 8765`. Two listeners on the same port is why only one phone could vote: Windows split the connections, so every other device never reached this quiz.

If phones cannot reach this laptop, the server may still be running. In PowerShell:

```
netstat -ano | findstr :8765 | findstr LISTENING
```

You should see **one** `LISTENING` line. `TIME_WAIT` lines are leftover sockets, not extra servers — ignore those.

To stop every listener on 8765 (replace `8040` with the PID from the `LISTENING` line):

```
Stop-Process -Id 8040 -Force
```

Then from this project folder:

```
python serve.py
```

Hard-refresh presenter view and scan **this** session’s QR. Phone: same Wi-Fi, mobile data off, `http://` not `https`.

Stop the server with Ctrl+C.

## Local secrets (`.env`)

Instructor PINs and feedback workbook links for **dev and prod** live in `.env` in this folder. That file is gitignored. This laptop uses the `DEV` feedback line. The hosted Hub uses the `LIVE` line. Restart `python serve.py` after you edit `.env`. A blank template is `.env.example`.

`DEBUG=true` uses the dev workbooks. `DEBUG=false` uses the live workbooks. This laptop’s `.env` has `DEBUG=true`. On the live Render service set `DEBUG` to `false`. On the test service set `DEBUG` to `true`.

The hosted site cannot read this file. In the Render dashboard, set `FEEDBACK_SHARE_COPD_LIVE` and `FEEDBACK_SHARE_HF_LIVE` on the live service, and `FEEDBACK_SHARE_COPD_DEV` and `FEEDBACK_SHARE_HF_DEV` on the test service.

Instructors are one `PRESENTERS` line, in the same shape as the Render dashboard. Copy the value inside the quotes into the dashboard variable `PRESENTERS`:

`PRESENTERS="PIN: Full Name; PIN: Full Name"`

Feedback workbooks, a dev address and a prod address per topic:

`FEEDBACK_SHARE_COPD_DEV="https://…"`

`FEEDBACK_SHARE_COPD_LIVE="https://…"`

Heart Failure has its own workbook. It does not write into the COPD sheet.

`FEEDBACK_SHARE_HF_DEV="https://…"`

`FEEDBACK_SHARE_HF_LIVE="https://…"`

## Hosted session

Use this when you are not presenting from this laptop, or when Teams needs a public vote link. Share **https://hub-cpd.co.uk**. The app still runs on the Render service `hub-cpd`. Cloudflare DNS for the domain points at that service.

| What | URL |
| --- | --- |
| Home (choose self-guided, presenter, or handout) | https://hub-cpd.co.uk/ |
| Presenter / notes | https://hub-cpd.co.uk/?view=presenter |
| Audience window (share this) | https://hub-cpd.co.uk/?view=audience |
| Phone / Teams vote page | https://hub-cpd.co.uk/v |
| Self-guided (no vote, no register) | https://hub-cpd.co.uk/?view=self |
| Printable COPD handout | https://hub-cpd.co.uk/copd/handout.html |
| Printable Heart Failure handout | https://hub-cpd.co.uk/hf/handout.html |
| Printable Acute Asthma handout | https://hub-cpd.co.uk/asthma/handout.html |
| Previous Render address (forwards to the domain once this build is live) | https://hub-cpd.onrender.com/ |
| Old COPD URL (forwards to Hub) | https://copd-cpd.onrender.com/ |
| GitHub copy (static; not the live room) | https://ostroforge.github.io/copd-cpd/ |
| GitHub COPD handout | https://ostroforge.github.io/copd-cpd/copd/handout.html |
| Source code | https://github.com/OstroForge/copd-cpd |
| Render dashboard (live Hub) | https://dashboard.render.com/web/srv-danfac74ouc73bol8ig |
| Cloudflare dashboard | https://dash.cloudflare.com/ |

The domain is registered at Cloudflare under **ostroforge@outlook.com**. Connect it once, and confirm `https://hub-cpd.co.uk/healthz` answers, before the next deploy that sets `PUBLIC_URL` to that address. Until then the working site is still `https://hub-cpd.onrender.com/`.

1. Render, live service **hub-cpd**, Settings → Custom Domains. Add `hub-cpd.co.uk` and `www.hub-cpd.co.uk`. The DNS target is `hub-cpd.onrender.com`.
2. Cloudflare, zone **hub-cpd.co.uk**, SSL/TLS → Overview → **Full**.
3. DNS → Records. Add both as **DNS only** (grey cloud) until Render says the certificate is issued:
   - `CNAME` `@` → `hub-cpd.onrender.com`
   - `CNAME` `www` → `hub-cpd.onrender.com`
4. In Render, verify the domains. When the certificates are valid, the grey-cloud records can be switched to Proxied.
5. On the same Environment page, click **Edit**. Add a row: key `PUBLIC_URL`, value `https://hub-cpd.co.uk` (no slash on the end). Save. Render restarts the service. That value is what the room QR and the Teams join link use. It is not in the list yet — the live service only has `ATTEND_SHARE_URL` and `PRESENTERS`. Leave the test service on `https://hub-cpd-test.onrender.com`.

Hub staff **do not need a Render account**. Each facilitator has their own PIN. Local or hosted presenter view asks for it. That PIN is also their name on the attendance file, so they are not asked who is delivering.

On this laptop the list is the `PRESENTERS` line in `.env`. Copy that same value into Render. Do not put PINs in this public file or in the room’s Teams chat. The `r=` code on a join/QR link is the **room** for that session, not a PIN.

Free Render instances sleep after a quiet spell. The first open can take about a minute.

## Test site (this branch, not live)

Use this to try Heart Failure and the new folder layout **without merging to `main`**. Live `https://hub-cpd.co.uk/` stays on `main`.

Create it once in the Render dashboard (signed in as ostroforge@outlook.com):

1. [New Web Service](https://dashboard.render.com/select-repo?type=web)
2. Repository: **OstroForge/copd-cpd**
3. Name: **hub-cpd-test**
4. Branch: **heart-failure-cpd** (not `main`)
5. Region: Frankfurt
6. Runtime: Python 3
7. Build command: `pip install -r requirements.txt`
8. Start command: `python serve.py`
9. Health check path: `/healthz`
10. Instance type: Free

Environment variables (Environment tab). Copy **PRESENTERS** from the live `hub-cpd` service — do not paste PINs into chat or this file. Then add:

| Key | Value |
| --- | --- |
| `PYTHON_VERSION` | `3.12.0` |
| `PUBLIC_URL` | `https://hub-cpd-test.onrender.com` |
| `DEBUG` | `true` |
| `FEEDBACK_SHARE_COPD_DEV` | the dev COPD feedback workbook from `.env` |
| `FEEDBACK_SHARE_HF_DEV` | the dev Heart Failure feedback workbook from `.env` |

Create Web Service. First build takes a few minutes. After that:

| What | URL |
| --- | --- |
| Test home | https://hub-cpd-test.onrender.com/ |
| Test presenter | https://hub-cpd-test.onrender.com/?course=hf&view=presenter |
| Test COPD | https://hub-cpd-test.onrender.com/?course=copd&view=self |

Later commits on `heart-failure-cpd` update this test site only. Merging to `main` is what updates the live Hub.

Keep the current `copd-cpd` service running so https://copd-cpd.onrender.com/ can forward.

## Accounts

| Service | Account | Email |
| --- | --- | --- |
| GitHub | **OstroForge** | ostroforge@outlook.com |
| Render | workspace **My Workspace** (same GitHub account) | ostroforge@outlook.com |
| Cloudflare | zone **hub-cpd.co.uk** | ostroforge@outlook.com |
| OneDrive | Personal (attendance CSVs) | jon.ski1382@gmail.com |

GitHub sign-in: https://github.com/login  
Render sign-in: https://dashboard.render.com/login  
Cloudflare sign-in: https://dash.cloudflare.com/login  
OneDrive: https://onedrive.live.com/

Certificates folder (open while signed in as jon.ski1382@gmail.com):  
https://onedrive.live.com/my?id=%2Fpersonal%2F4a2042dbbcf48071%2FDocuments%2FCursor%20Projects%2FCPD%2FCOPD%2Fcertificates&viewid=6c1bdb91-03c5-436a-8302-197408acb301

## On the day

1. Wake the live site (or start `python serve.py`).
2. On your laptop, open **presenter** view (local `http://127.0.0.1:8765/?view=presenter` or https://hub-cpd.co.uk/?view=presenter) — type **your** Hub PIN when asked.
3. Share the **Audience** window to the projector and/or Teams (Share window, not the presenter screen).
4. Room: scan **this session’s** QR (it includes a room code). Teams: copy the join link from the presenter sidebar into chat — do not reuse another facilitator’s QR.
5. Space, a mouse click on the slide, a wireless clicker (Page Down / next), or **Next** on a question goes to the results slide.
6. Both hosted decks then show **Help shape the next session**. The feedback QR is in the top right, with the address under it. Phones already on the vote page get the form. Anyone else can scan that QR. The same QR is on the self-guided deck. Download the sheet from **Download feedback** in the presenter sidebar. The last slide is **Record Attendance for CPD Certificate**. Leave that QR up for the room to scan. It is not in the self-guided deck. Certificate attendance is the Trust QR only: there is no name, ESR, or email collection for certificates, and no certificate lookup page.

Two people can deliver the same CPD at the same time. Each opens presenter view on the **same live site** (usually Render). The site gives each facilitator a different room code, a different attendance file, and quiz answers from their own phones only. Phones must scan the QR on **that** screen.

If you present from this laptop instead, phones vote on this `serve.py` process — a second laptop running its own `serve.py` is a second session. Do not mix a laptop presenter with the hosted Render QR unless everyone is actually presenting on Render.

Automatic copies (same names, no extra click):

- `certificates.csv` in this project folder (synced with OneDrive)
- `COPD-CPD-certificate-names.csv` in this folder, and also in **Documents** and **OneDrive** if those folders exist
- The serve.py terminal prints each name as it arrives

On Render the files are lost when the service sleeps, so also set a `CERT_WEBHOOK` environment variable if you want each name POSTed as JSON to an inbox you control.

**OneDrive attendance folder:** account **jon.ski1382@gmail.com**. Layout is course, then env:

```
certificates/
  copd/dev
  copd/live
  heart failure/dev
  heart failure/live
```

The OneDrive **share link** must be the parent `certificates` folder — not `certificates/dev` and not `certificates/COPD/dev`. The site then creates `copd/dev`, `copd/live`, `heart failure/dev` and `heart failure/live` inside that folder.

| Course | Path |
| --- | --- |
| COPD | `certificates/copd/dev` or `certificates/copd/live` |
| Heart Failure | `certificates/heart failure/dev` or `certificates/heart failure/live` |

Both hosted decks collect session feedback (how useful it was, comments, a suggestion for the next half hour, and an optional name and email). COPD writes to the COPD workbook. Heart Failure writes to the Heart Failure workbook. Certificate attendance is the Trust QR on the last slide. Neither course collects names, ESR numbers, or emails for a certificate. There is no page to look up or reprint a certificate.

To add a later package, give it a `folder` name in `COURSES` in `serve.py`. The `dev` and `live` folders are created the first time that course writes an attendance file.

## Handout and self-guided

For staff who missed the room, or for a Teams share with no phones:

1. **Handout** — two A4 pages. Open `copd/handout.html`, `hf/handout.html` or `asthma/handout.html` and use Print / save PDF.
2. **Self-guided deck** — add `?view=self` to the deck URL. Same slides, no live vote, no certificate QR. The feedback QR stays, with the address under it. Check questions reveal on click or Space. **Printable handout** is on the bottom bar.

A PowerPoint export is a poorer copy of this deck (NEWS2 chart and kit photos sit in HTML). Use the self-guided URL if you need a version with voting removed.

## Updating the live site

Commit your changes, then:

```
git push origin HEAD
```

Render rebuilds from `main`. Hard-refresh https://hub-cpd.co.uk/ after the deploy finishes. Do not deploy the domain redirect until https://hub-cpd.co.uk/healthz already answers.
