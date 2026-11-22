# One-off edit of the live COPD deck. Deleted after it runs.
import json
from pathlib import Path

path = Path("copd/deck.js")
text = path.read_text(encoding="utf-8")
start = text.index("[")
end = text.rindex("]")
slides = json.loads(text[start : end + 1])


def dump(items):
    payload = json.dumps(items, ensure_ascii=False, indent=2)
    payload = payload.replace("\u2028", "\\u2028").replace("\u2029", "\\u2029").replace("</", "<\\/")
    return "function copdDeckSlides() {\n  return %s;\n}\n" % payload


if dump(slides) != text:
    raise SystemExit("round-trip changed the file; aborting")

by_title = {s.get("title"): s for s in slides}

objectives = by_title["Learning objectives"]
objectives["notes"] = (
    "Outcomes in 30 seconds: the four lines, then oxygen target beside NEWS2 scale. "
    "Space reveals the callout — those are two separate decisions. "
    "Do not say the conclusion here. The next slide is the first time the room hears it, in JRCALC’s own words: some patients, not all, and COPD is not Scale 2."
)
objectives["html"] = objectives["html"].replace(
    '\n        <div class="banner build box-text" data-box="fit" style="margin-top:8px"><div class="box-copy">COPD ≠ type 2 respiratory failure</div></div>'
    '\n        <div class="banner teal build box-text" data-box="fit" style="margin-top:6px"><div class="box-copy">COPD ≠ automatic NEWS2 Scale 2</div></div>',
    "",
)

scene = by_title["Critically ill, or controlled oxygen?"]
old_no = (
    "<li>Target 88–92% (or the alert card)</li>"
    "<li>Start the 28% white Venturi this service stocks</li>"
    "<li>Salbutamol 5 mg, 6-minute oxygen drive</li>"
    "<li>Ipratropium once if severe</li>"
)
new_no = (
    "<li>Controlled oxygen, target 88–92% (or the alert card)</li>"
    "<li>A bronchodilator if they are wheezy or tight</li>"
    "<li>Stay with them and watch for tiring</li>"
)
if old_no not in scene["html"]:
    raise SystemExit("on-scene map wording not found")
scene["html"] = scene["html"].replace(old_no, new_no)
scene["notes"] = (
    "Scene first: breathless, known or suspected COPD. Then the split: critically ill or not. "
    "The no-path is the decision only — controlled oxygen to 88–92%, then a bronchodilator. "
    "Do not give the mask or the doses here. White 28% Venturi is the oxygen slide. Salbutamol and ipratropium are the neb slide. "
    "Navy bar last: both paths still Scale 1 unless type 2 is already documented. "
    "There can be exceptions — say why if Scale 2 is used without that record."
)

neb = by_title["Bronchodilators, nebulisers and the 6-minute rule"]
neb["notes"] = (
    "One slide for the 6-minute rule. Doses first, then the two JRCALC quotes, then the card: there is no two-neb cap. "
    "Read the quotes. JRCALC does not say ‘maximum two oxygen-powered nebs’. "
    "Six minutes is how long oxygen drives each neb. Salbutamol may be repeated as further 6-minute runs. Ipratropium once. "
    "Between runs, off the neb mask and aim 88–92%. The neb quiz still checks the 6 minutes."
)
neb["html"] = """<div class="body two">
        <div class="card box-text" data-box="fit"><div class="box-copy"><h3>Adult doses from live JRCALC</h3><ul><li>Sit forwards if blood pressure allows</li><li><strong>Salbutamol 5 mg</strong> neb. Repeat every <strong>5 minutes</strong> unless side-effects dominate (tremor, HR &gt;140). No maximum number of salbutamol doses</li><li><strong>Ipratropium 500 micrograms</strong> neb <strong>once</strong> in severe cases, or if unresponsive to salbutamol</li><li>Protect the eyes — caution in glaucoma</li><li><strong>Hydrocortisone 100 mg</strong> slow IV (≥2 min) or IM</li></ul></div></div>
        <div class="card fact box-text" data-box="fit"><div class="box-copy"><h3>There is no two-neb cap</h3><ul><li>JRCALC does <strong>not</strong> write a maximum of two oxygen-powered nebs</li><li>Six minutes is how long <strong>oxygen drives each neb</strong> — not a timer on oxygen for hypoxia</li><li>A further 6-minute run is allowed if they still need the drug</li><li>Between runs: off the neb mask, aim <strong>88–92%</strong>. Do not leave the drive running</li></ul></div></div>
      </div>
      <div class="card box-text" data-box="fit" style="margin-top:10px"><div class="box-copy"><h3>JRCALC / AACE COPD guidance — Bronchodilators</h3><p>“Limit oxygen-driven nebulisation to 6 minutes. If journey time is significant, consider a further 6 minutes of nebulisation therapy ONLY if clinically indicated, but aim for a target saturation within the range of 88–92%.”</p></div></div>
      <div class="card box-text" data-box="fit" style="margin-top:8px"><div class="box-copy"><h3>JRCALC Salbutamol and Ipratropium</h3><p>Both monographs: “If COPD is a possibility limit nebulisation with oxygen to 6 minutes.” That is COPD as a possibility — not only proven type 2 failure.</p></div></div>"""

drop = {
    "Where the 6-minute rule is written",
    "What to do after a 6-minute oxygen-driven neb",
    "This patient needs high-flow oxygen now",
}
missing = drop - {s.get("title") for s in slides}
if missing:
    raise SystemExit("missing slides: %s" % missing)
slides = [s for s in slides if s.get("title") not in drop]

quiz = next(s for s in slides if s.get("pollId") == "q3")
quiz["prompt"] = (
    "64, known COPD. Alert card: previous type 2 failure, on a 28% Venturi. "
    "Exhausted, cyanosed, barely responding. High-flow or low-flow oxygen?"
)
quiz["votePrompt"] = quiz["prompt"]
quiz["teach"] = (
    "<strong>High-flow.</strong> This is shock, not a “usual COPD”. "
    "JRCALC / AACE COPD guidance: do not withhold high-concentration oxygen if the primary illness needs it. "
    "Hypoxia is the greater short-term risk. Titrate 88–92% once they are no longer critically ill. "
    "The 6-minute rule does not apply here — that only limits oxygen as the driving gas of a nebuliser. "
    "<strong>Scale 2</strong> because type 2 failure is already documented on the alert card — not because of the high-flow oxygen just applied."
)
quiz["notes"] = (
    "This is the first time the room sees this patient. The monitor is the argument: 80%, 86/50, 128, RR 32. "
    "Watch for people still giving controlled oxygen because of COPD or the alert card. "
    "After the answer, land the new line: Scale 2 is from the documented type 2, not from the oxygen just applied."
)

path.write_text(dump(slides), encoding="utf-8")
print("slides", len(slides))
for i, s in enumerate(slides, 1):
    print(f"{i:2} {s.get('title')}")
