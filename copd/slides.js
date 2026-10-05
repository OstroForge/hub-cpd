function copdSlides() {
  return [
      {
        type: "title",
        kicker: "Ambulance Clinical Refreshers",
        title: "COPD, Type 2 Respiratory Failure and NEWS2",
        subtitle: "Pre-hospital assessment and treatment of acute exacerbations, with a hard look at NEWS2 Scale 2.",
        meta: "JRCALC / AACES COPD guidance v20.40 (updated 6 September 2023), JRCALC oxygen and medicines, and RCP NEWS2. Always follow the live JRCALC entry and local Trust policy.",
        notes: "Open with the title statement. Next slide is the icebreaker — leave it up while phones scan the QR."
      },
      {
        type: "poll",
        pollId: "hands",
        resultsTitle: "Default NEWS2 scale — how the room voted",
        kicker: "Hands up  ·  live vote",
        title: "Before we start — phones out",
        prompt: "When dealing with a known COPD patient, what is your default SpO<sub>2</sub> scale when using the NEWS2 chart?",
        votePrompt: "When dealing with a known COPD patient, what is your default SpO<sub>2</sub> scale when using the NEWS2 chart?",
        options: [
          "Scale 1",
          "Scale 2"
        ],
        correct: 0,
        teach: "Unless there is clear documented history that the patient has type 2 respiratory failure (or they carry an alert card) then <strong>ALWAYS use Scale 1</strong>. COPD in itself does not mean Scale 2.",
        notes: "Leave this up while people scan the QR. Typical wrong answer is Scale 2 because they have COPD. Space goes to the results (numbers only). Space or click once more to paint Scale 1 green and show the teaching point."
      },
      {
        kicker: "Core messages",
        title: "Learning objectives",
        html: `
          <div class="card" style="margin-bottom:12px">
            <h3>By the end you will have refreshed how to:</h3>
            <ul style="columns:2;column-gap:28px">
              <li>Recognise and treat an acute exacerbation of COPD using JRCALC principles</li>
              <li>Give controlled oxygen without withholding it from the critically ill</li>
              <li>Use NEWS2 Scale 1 unless type 2 failure is already documented</li>
              <li>Hand over a score that receiving staff can trust</li>
            </ul>
          </div>
          <div class="body two">
            <div class="card">
              <h3>Oxygen target</h3>
              <p>In known or suspected COPD, start with a target of <strong>88–92%</strong> (or the alert-card range) unless the patient is critically ill.</p>
              <p class="small" style="margin-top:10px">This is a treatment decision from JRCALC.</p>
            </div>
            <div class="card">
              <h3>NEWS2 scale</h3>
              <p>Use <strong>Scale 1</strong> unless type 2 respiratory failure is clearly documented in their medical history, they carry an alert card or are able to categorically inform you that they do have type 2 (hypercapnic) respiratory failure.</p>
              <p class="small" style="margin-top:10px">Routinely, look for that record before Scale 2. There can be exceptions — if you use Scale 2 without it, say why at handover.</p>
              <p class="small" style="margin-top:10px">This is a scoring decision from RCP NEWS2. The oxygen target does not, by itself, choose the scale.</p>
            </div>
          </div>
          <div class="banner build" style="margin-top:12px">COPD ≠ type 2 respiratory failure</div>
          <div class="banner teal build" style="margin-top:8px">COPD ≠ automatic NEWS2 Scale 2</div>
          <p class="callout build" style="margin-top:12px">These are two separate decisions. They do not automatically travel together.</p>`,
        notes: "Outcomes in 30 seconds. Then oxygen vs NEWS2. Space reveals the two banners, then the callout. Drop the old ‘usually missed’ card — the banners are that point."
      },
      {
        kicker: "JRCALC Guideline 'Chronic Obstructive Pulmonary Disease' — the actual wording",
        title: "Does not treat every COPD patient as type 2",
        html: `
          <div class="banner dark">“Some patients with COPD are at increased risk of hypercapnic respiratory failure (Type 2)”</div>
          <div class="body two" style="margin-top:16px">
            <div class="card fact">
              <h3>What that sentence does</h3>
              <ul>
                <li>The word is <strong>some</strong>, not all</li>
                <li>COPD raises the risk of type 2 failure. It does not diagnose it</li>
                <li>Those with a <strong>history</strong> of type 2 failure should know their baseline saturations and carry an alert card</li>
                <li>That group may need a tailored oxygen approach</li>
              </ul>
            </div>
            <div class="card warn">
              <h3>What the guideline does not say about NEWS2</h3>
              
              <p style="margin-top:10px">It does <strong>not</strong> say “COPD = Scale 2”, and it does not advise an on-scene Scale 2 decision.</p>
            </div>
          </div>`,
        notes: "Read the quote slowly. This is the user’s requested highlight, now in JRCALC’s own words. Then: JRCALC / AACES COPD guidance’s NEWS2 instruction is ‘calculate a NEWS2 score (refer to Sepsis)’ — no scale switch. RCP still governs how Scale 2 is used."
      },
      {
        kicker: "Background",
        title: "COPD in one minute",
        html: `
          <div class="body two">
            <div>
              <ul>
                <li>Chronic progressive airflow obstruction</li>
                <li>Usually diagnosed over 35 in current or ex-smokers</li>
                <li>Treat as COPD if over 50, long-term smoker, exertional breathlessness, and no other known cause</li>
                <li>Baseline SpO<sub>2</sub> is often lower than in healthy adults — ask what “normal for them” is</li>
                <li>An exacerbation is a worsening of a previously stable condition; 30% have no identified cause</li>
              </ul>
            </div>
            <div>
              <div class="photo-frame" style="height:250px">
                <img src="copd/assets/copd-exacerbation-cxr.jpg" alt="Anteroposterior chest X-ray of a COPD exacerbation">
              </div>
              <p class="photo-caption">AP chest X-ray in a COPD exacerbation (Mikael Häggström, MD, public domain / CC0).</p>
              <div class="card warn" style="margin-top:10px">
                <h3>Pre-hospital trap</h3>
                <p>COPD is a risk factor for hypercapnia. It is not proof of hypercapnia. Only a blood gas (now or previously documented) confirms type 2 respiratory failure.</p>
              </div>
            </div>
          </div>`,
        notes: `<strong>What COPD is</strong>
Airways narrowed; alveoli lose their spring. Usually smoking. Air goes in more easily than it comes out, so the chest stays over-inflated.
<strong>What that causes</strong>
Breathless, cough, often a lower SpO<sub>2</sub> when well. Some retain CO<sub>2</sub> — that is type 2 failure, and it is not automatic.
<strong>Asthma vs COPD</strong>
Asthma: mostly reversible narrowing of the tubes. Often younger / atopic. Can be nearly normal between attacks.<br>
COPD: largely irreversible damage. Older smokers. Never fully ‘back to normal’. Lungs stay over-inflated.<br>
Some people have features of both.
<strong>On scene</strong>
They can look the same: breathless, wheezy, coughing. History (age, smoking, baseline) separates them — not the sound of the chest.
<strong>Land this</strong>
Do not lecture pathophysiology. The trap box is the only part that must land.`
      },
      {
        kicker: "Look again",
        title: "Is this an exacerbation — or something else?",
        html: `
          <div class="body two">
            <div class="card">
              <h3>Supports an exacerbation</h3>
              <ul>
                <li>Increased dyspnoea, especially on exertion</li>
                <li>Increased sputum volume or purulence</li>
                <li>Increased cough, wheeze, chest tightness</li>
                <li>Reduced exercise tolerance, fatigue, fluid retention</li>
                <li>Acute confusion or a worsening of a previously stable condition</li>
              </ul>
            </div>
            <div class="card myth">
              <h3>Think again if you find</h3>
              <ul class="think-again">
                <li><span>Chest pain — sudden or pleuritic</span><em>ACS, PE, pneumothorax</em></li>
                <li><span>Fever</span><em>Pneumonia</em></li>
                <li><span>Sudden severe breathlessness</span><em>PE, pneumothorax</em></li>
                <li><span>Unilateral silent chest or tracheal shift</span><em>Pneumothorax, effusion</em></li>
                <li><span>Pink frothy sputum or orthopnoea</span><em>LVF / pulmonary oedema</em></li>
                <li><span>Stridor or haemoptysis</span><em>Upper airway, PE, cancer</em></li>
              </ul>
            </div>
          </div>`,
        notes: "Left box is a simple flare. Right box: clue on the left, other impression on the right. JRCALC / AACES COPD guidance flags chest pain and fever as uncommon. Do not turn this into a lecture on every differential — one example per row is enough."
      },
      {
        kicker: "Assessment",
        title: "What to ask and what to measure",
        html: `
          <div class="body three">
            <div class="card">
              <h3>Ask</h3>
              <ul>
                <li>Baseline saturations when well, and previous problems with oxygen</li>
                <li>Alert card, individualised plan, or Hub special message</li>
                <li>Home oxygen, previous NIV / ITU</li>
                <li>Have they already taken steroids or antibiotics?</li>
                <li>Encourage their usual breathing-control techniques if they help</li>
              </ul>
            </div>
            <div class="card">
              <h3>Examine</h3>
              <ul>
                <li>&lt;C&gt;ABCDE, including work of breathing</li>
                <li>SpO<sub>2</sub>, RR, pulse, BP, temperature</li>
                <li>Blood glucose if appropriate</li>
                <li>12-lead ECG if indicated (JRCALC / AACES COPD guidance update 2023)</li>
                <li>NEWS2 Scale 1 unless a hospital or specialist record of type 2 failure is already in front of you</li>
              </ul>
            </div>
            <div class="card">
              <h3>Red flags</h3>
              <ul>
                <li>Exhaustion or tiring</li>
                <li>Silent chest</li>
                <li>SpO<sub>2</sub> &lt;88% unresponsive to oxygen</li>
                <li>Drowsiness or new confusion</li>
                <li>Major ABCD failure</li>
              </ul>
            </div>
          </div>`,
        notes: "The patient and carers often know their baseline better than we do. An oxygen alert card is gold, but its absence does not prove they are not a retainer — and its presence still does not automatically select NEWS2 Scale 2 unless HCRF is documented."
      },
      {
        kicker: "Time critical",
        title: "When COPD becomes time-critical",
        html: `
          <div class="body">
            <div class="body two">
              <div class="card">
                <h3>Time-critical features</h3>
                <ul>
                <li>Major &lt;C&gt;ABCDE problems</li>
                <li>Extreme breathing difficulty against their usual condition</li>
                <li>Cyanosis — though peripheral cyanosis may be “normal” for some</li>
                <li>Exhaustion</li>
                <li>SpO<sub>2</sub> &lt;88% unresponsive to oxygen</li>
                </ul>
              </div>
              <div class="card">
                <h3>Then</h3>
                <ul>
                <li>Start correcting &lt;C&gt;ABCDE</li>
                <li>Do not withhold high-concentration oxygen if the primary illness needs it</li>
                <li>TIME-CRITICAL transfer and an ATMIST call</li>
                <li>Continue treatment en-route</li>
                </ul>
              </div>
            </div>
            <p class="small" style="margin-top:12px">JRCALC / AACES COPD guidance: in the short time a patient is in ambulance care, hypoxia presents a much greater risk than hypercapnia in most cases. Pulse oximetry does not show CO<sub>2</sub>. Type 2 failure is confirmed on a blood gas.</p>
            <div class="banner red build" style="margin-top:12px">Do not withhold high-concentration oxygen from the critically ill COPD patient</div>
          </div>`,
        notes: "Talk the two cards first. Click or Space brings in the red line. Kill the old fear that ‘oxygen will stop them breathing’ as a reason to leave someone hypoxic. Titrate once they are no longer critically ill. Good to know, not for the slide: waveform capnography is available but not used routinely on front-line vehicles. It shows end-tidal CO2 (EtCO2), not arterial CO2, so it does not confirm type 2 failure and it does not choose Scale 2. A normal EtCO2 is about 4.0–5.7 kPa (35–45 mmHg). A trace staying above about 6 kPa (45 mmHg), or rising, suggests CO2 retention. In COPD the end-tidal number often sits below the arterial PaCO2, so a normal trace does not rule type 2 failure out."
      },
      {
        kicker: "On-scene map",
        title: "Critically ill, or controlled oxygen?",
        html: `
          <div class="card" style="margin-bottom:12px;text-align:center">
            <p style="font-size:22px;font-weight:750;color:var(--navy);margin:0">Breathless patient. Known or suspected COPD.</p>
          </div>
          <p style="text-align:center;font-weight:750;margin:0 0 10px;font-size:22px;color:var(--navy)">Are they critically ill or tiring?</p>
          <div class="diagram-row two">
            <div class="step red">
              <h3>YES — time-critical</h3>
              <ul>
                <li>Do not withhold high-flow oxygen</li>
                <li>Correct &lt;C&gt;ABCDE</li>
                <li>TIME-CRITICAL transfer and ATMIST</li>
                <li>Titrate 88–92% once they are no longer critical</li>
              </ul>
            </div>
            <div class="step green">
              <h3>NO — controlled oxygen</h3>
              <ul>
                <li>Target 88–92% (or the alert card)</li>
                <li>Start the 28% white Venturi this service stocks</li>
                <li>Salbutamol 5 mg, 6-minute oxygen drive</li>
                <li>Ipratropium once if severe</li>
              </ul>
            </div>
          </div>
          <div class="step dark" style="margin-top:12px">
            <h3>Both paths — NEWS2</h3>
            <p>Scale 1 unless type 2 failure is already documented. Look for that record — an alert card, specialist plan or previous blood gas. 88–92% is the oxygen target. It is not, by itself, Scale 2.</p>
          </div>`,
        notes: "Scene first: breathless, known or suspected COPD. Then the split: critically ill or not. Navy bar last: both paths still Scale 1 unless type 2 is already documented. Look for the alert card. Oxygen target is not the NEWS2 scale. There can be exceptions — say why if Scale 2 is used without that record."
      },
      {
        kicker: "Physiology that changes the score",
        title: "Two types of respiratory failure",
        html: `
          <table>
            <thead>
              <tr>
                <th></th>
                <th>Type 1</th>
                <th>Type 2 (hypercapnic)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Blood gas</strong></td>
                <td>Low PaO<sub>2</sub> (&lt;8 kPa). PaCO<sub>2</sub> normal or low.</td>
                <td>Low PaO<sub>2</sub> and high PaCO<sub>2</sub> (&gt;6 kPa).</td>
              </tr>
              <tr>
                <td><strong>What it means</strong></td>
                <td>The lungs are not oxygenating. Ventilation of CO<sub>2</sub> is still working.</td>
                <td>The patient is failing to ventilate. High-flow oxygen can worsen CO<sub>2</sub> retention.</td>
              </tr>
              <tr>
                <td><strong>In COPD</strong></td>
                <td>Common. COPD does not protect anyone from type 1 failure.</td>
                <td>Important, but not automatic. Needs blood gas confirmation, now or previously documented.</td>
              </tr>
              <tr>
                <td><strong>NEWS2</strong></td>
                <td>Scale 1</td>
                <td>Scale 1 unless type 2 failure is already documented. Look for an alert card or specialist record before Scale 2.</td>
              </tr>
            </tbody>
          </table>`,
        notes: "Walk through the table slowly. Ask: ‘If you have no blood gas and no documented HCRF, which type do you know this patient has?’ Answer: neither. You know they are at risk. That is why you titrate oxygen. It is not why you switch NEWS2 scale."
      },
      {
        kicker: "Evidence",
        title: "Most COPD patients do not present with hypercapnia",
        html: `
          <div class="body two">
            <div class="card">
              <h3>What the evidence says</h3>
              <ul>
                <li>Around 1 in 5 hospitalised AECOPD patients has respiratory acidosis — so most do not</li>
                <li>RCP NEWS2 authors: Scale 2 was designed only for documented hypercapnic respiratory failure, “explicitly noting that most acutely ill patients with AECOPD will not present with HCRF”</li>
                <li>RCP 2020: putting COPD patients without hypercapnia on Scale 2 “is not in line with NEWS2 guidance”</li>
              </ul>
            </div>
            <div class="card fact">
              <h3>So what?</h3>
              <p>If you default every COPD job to Scale 2, you will under-score hypoxia in the majority. A patient with SpO<sub>2</sub> 90% can look “stable” on Scale 2 and “red” on Scale 1.</p>
            </div>
          </div>
          <div class="callout" style="margin-top:14px">If there is no documented evidence of type 2 respiratory failure, assume type 1 and use <strong>Scale 1</strong> on the NEWS2 chart. That does not mean treating them as if they do not have COPD — still titrate oxygen to <strong>88–92%</strong>.</div>`,
        notes: "Plant ~20% acidosis; RCP: most AECOPD do not have HCRF. Then the callout: no documented type 2 → assume type 1 → Scale 1. Still COPD, still 88–92%. Scoring scale and oxygen target are separate."
      },
      {
        kicker: "NEWS2",
        title: "When Scale 2 can be applied",
        html: `
          <div class="body two">
            <div class="card fact">
              <h3>When Scale 2 may be applied</h3>
              <ul>
                <li>Hypercapnic (type 2) failure already confirmed on blood gas — previous admission or this hospital stay</li>
                <li>A hospital doctor, ANP or specialist has already recorded that decision</li>
                <li>You can see that documentation: alert card stating type 2 / raised CO<sub>2</sub>, specialist care plan, previous ABG, or Hub special message</li>
              </ul>
              <p style="margin-top:10px"><strong>The usual role on scene is to apply that record. Look for it before you use Scale 2.</strong></p>
            </div>
            <div class="card myth">
              <h3>COPD alone is not a reason to choose Scale 2</h3>
              <ul>
                <li>Not because the patient “has COPD”</li>
                <li>Not because they are on home oxygen</li>
                <li>Not because they “look like a retainer”</li>
                <li>Not because you are targeting 88–92%</li>
                <li>Not because the ePR offered Scale 2 when you typed COPD</li>
              </ul>
            </div>
          </div>
          <p class="small" style="margin-top:12px">If you cannot see that record, use Scale 1 and say so at handover. JRCALC is less absolute than a hard ban, and there can be exceptions — if you use Scale 2 without the record, say why. Receiving staff can confirm after a blood gas.</p>`,
        notes: "RCP’s ‘competent clinical decision-maker’ is usually a hospital doctor, ANP or specialist after a blood gas. The routine ambulance role is to look for an alert card or other record of type 2 / raised CO2 / previous hypercapnia, not to start Scale 2 because the patient has COPD. JRCALC is vaguer, and there can be exceptions. An alert card that only says ‘COPD, target 88–92’ is an oxygen target, not by itself a Scale 2 record."
      },
      {
        kicker: "Worked example",
        title: "Same patient, two scales, two very different risks",
        html: `
          <div class="body two" style="margin-bottom:10px;align-items:stretch">
            <div>
              <p style="margin-bottom:10px;font-size:18px">68-year-old with known COPD. No alert card. No documented blood gas. SpO<sub>2</sub> <strong>90% on air</strong>, elevated pulse and respiratory rate. Other observations unremarkable.</p>
              <div class="photo-frame cutout">
                <img src="copd/assets/zoll_1.png" alt="Zoll monitor showing pulse 110, blood pressure 144 over 87, respiratory rate 24, SpO2 90 percent">
              </div>
              <p class="photo-caption"</p>
            </div>
            ${news2OfficialChart()}
          </div>
          <table>
            <thead>
              <tr><th>Scale</th><th>SpO<sub>2</sub> 90% on air</th><th>What the score tells the next clinician</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Scale 1 — correct default</strong></td>
                <td class="score bad">3</td>
                <td>Single red parameter. This person is hypoxic on the standard scale and needs a proper look.</td>
              </tr>
              <tr>
                <td><strong>Scale 2 — incorrect habit</strong></td>
                <td class="score good">0</td>
                <td>Looks “fine”. Hypoxia has been normalised away. Deterioration is easier to miss.</td>
              </tr>
            </tbody>
          </table>
          <p class="callout build" style="margin-top:12px">Wrong scale does not just tidy the paperwork. It can hide a hypoxic patient.</p>`,
        notes: "Emphasise the importance of recognising that 91% and lower is hypoxia, even if it is 'normal' for the patient. Automatically using scale 2 for a non T2RF patient will hide the hypoxia."
      },
      {
        kicker: "Why Scale 1 is still right",
        title: "A usual SpO₂ of 90% scoring 3 is not a reason to switch scale",
        html: `
          <div class="body two">
            <div class="card">
              <h3>That 3 is doing its job</h3>
              <ul>
                <li>Scale 1 was built on a normal SpO<sub>2</sub> of 96%+. 90% is hypoxia on that scale, even if it is “normal for them”</li>
                <li>RCP designed that score to prompt a look. It does not, by itself, mean you must change scale or turn the oxygen up</li>
                <li>Keep targeting 88–92% (or the alert card). The oxygen target and the scoring scale are separate decisions</li>
              </ul>
            </div>
            <div class="card warn">
              <h3>Scale 2 is still the wrong fix</h3>
              <ul>
                <li>Switching scale because 90% is “usual for them” scores that hypoxia as 0 and hides it</li>
                <li>Scale 2 is only for documented type 2 failure — not for a comfortable NEWS</li>
                <li>Handover: “NEWS 3, all from sats, usual 90% on air, Scale 1, targeting 88–92%.”</li>
              </ul>
            </div>
          </div>`,
        notes: "The 3 is working — it flags hypoxia on the standard scale. Do not switch to Scale 2 to make the score look nicer. Still 88–92%. Next slide is the room’s pre-alert worry and CN-436."
      },
      {
        kicker: "CN-436",
        title: "Doesn't this mean I will pre-alert every COPD patient with normal sats for them?",
        html: `
          <div class="callout" style="margin-bottom:14px">“Doesn't the Trust state that a single 3 in a NEWS2 category requires me to alert the ED? I am going to be alerting a lot of patients unnecessarily.”</div>
          <div class="build">
            <div class="body two" style="align-items:stretch">
              <div>
                <img class="cn-extract" src="copd/assets/cn-436-sats.png" alt="CN-436: O2 saturations on oxygen less than or equal to 91 percent, or 83 percent in chronic hypercapnic respiratory failure">
                <p class="photo-caption">CN-436 Pre-alerting of Patients V8, 20 July 2026. Highlight added.</p>
              </div>
              <div class="card fact">
                <h3>The sats line is not “any single 3”</h3>
                <ul>
                  <li>90% <strong>on air</strong> scores 3 on Scale 1. It does <strong>not</strong> meet this criterion</li>
                  <li>90% <strong>on oxygen</strong> does — unless chronic hypercapnic failure is already documented, when the alert sat is ≤83%</li>
                  <li>Other red physiology on this list still alerts. So does significant clinical concern</li>
                </ul>
              </div>
            </div>
            <div class="banner teal" style="margin-top:12px">The sats pre-alert is ≤91% <strong>on oxygen</strong> — not 90% on air</div>
          </div>`,
        notes: "Leave the question up. Space brings CN-436. Hit ‘on oxygen’ and ≤91% out loud. 90% on air at baseline is a Scale 1 3, not a CN-436 sats alert. Other red physiology (RR ≤8 or ≥25, SBP ≤90, pulse ≤40 or ≥131, GCS <13) still alerts. Concern still allows an alert."
      },
      {
        kicker: "Worked example 2",
        title: "When Scale 2 is the safer score",
        html: `
          <p style="margin-bottom:12px;font-size:20px">Same age, known COPD, oxygen alert card: previous type 2 failure, target 88–92%. SpO<sub>2</sub> <strong>90% on 28% Venturi</strong>.</p>
          <table>
            <thead>
              <tr><th>Scale</th><th>SpO<sub>2</sub> score</th><th>Oxygen</th><th>SpO<sub>2</sub> + O<sub>2</sub></th></tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Scale 1</strong></td>
                <td class="score bad">3</td>
                <td class="score mid">+2</td>
                <td class="score bad">5</td>
              </tr>
              <tr>
                <td><strong>Scale 2 — appropriate here</strong></td>
                <td class="score good">0</td>
                <td class="score mid">+2</td>
                <td class="score mid">2</td>
              </tr>
            </tbody>
          </table>
          <p style="margin-top:14px">Scale 1 would keep alarming because 90% looks too low. Staff then creep the oxygen up to “improve the NEWS”. Scale 2 exists to stop that, where type 2 failure is already documented. The usual role on scene is to apply that record. There can be exceptions — say why if you use Scale 2 without it.</p>`,
        notes: "This is why Scale 2 was invented. Austin 2010: high-flow pre-hospital oxygen increased mortality in suspected COPD compared with titrated oxygen. NEWS2 Scale 2 is a scoring fix for confirmed retainers, not a treatment protocol for all COPD."
      },
      {
        kicker: "Oxygen",
        title: "How to give oxygen in COPD",
        html: `
          <div class="o2-methods">
            <div class="o2-rows">
              <article class="o2-row">
                <img src="copd/assets/o2-white-venturi-70.png" alt="Woman in her 70s wearing a white 28 percent Venturi oxygen mask">
                <div>
                  <h3>White Venturi 28%</h3>
                  <p>Start here. <strong>4 L/min</strong>. Target <strong>88–92%</strong>, or the alert card.</p>
                </div>
              </article>
              <article class="o2-row">
                <img src="copd/assets/o2-red-venturi-70.png" alt="Woman in her 70s wearing a red 40 percent Venturi oxygen mask">
                <div>
                  <h3>Red Venturi 40%</h3>
                  <p>Step up if 28% is not reaching target. There is no simple face mask on the vehicle.</p>
                </div>
              </article>
              <article class="o2-row">
                <img src="copd/assets/o2-nebuliser-70.png" alt="Woman in her 70s wearing an oxygen-driven nebuliser mask">
                <div>
                  <h3>Oxygen-driven nebuliser</h3>
                  <p>Salbutamol or ipratropium. Oxygen may <strong>drive</strong> it for <strong>6 minutes</strong>, then stop and aim 88–92%.</p>
                </div>
              </article>
            </div>
            <div class="diagram-row three">
              <div class="step dark">
                <h3>Reservoir mask</h3>
                <p>If 40% is not enough, or they are critically ill. Do not withhold high-concentration oxygen. Aim 94–98%, then titrate back.</p>
              </div>
              <div class="step gold">
                <h3>RR &gt;30 on a Venturi</h3>
                <p>Increase flow to <strong>50% above the mask minimum</strong>. Same mask — the percentage does not change.</p>
              </div>
              <div class="step red">
                <h3>6 minutes is neb drive only</h3>
                <p>Not a timer on oxygen given for hypoxia. If they become drowsy, reduce oxygen and support ventilation.</p>
              </div>
            </div>
          </div>`,
        notes: "Point at the kit: white 28% start, then red 40% if that is not reaching target, then a reservoir mask for high-flow. The green chamber is a nebuliser, not high-flow. 50% flow bump is JRCALC Oxygen on a Venturi — same mask. Six minutes is neb drive only. Over 50, long-term smoker, exertional breathlessness, no other cause: treat as COPD."
      },
      {
        kicker: "Treatment",
        title: "Bronchodilators, nebulisers and the 6-minute rule",
        html: `
          <div class="body two neb-hero" style="flex:1">
            <div class="photo-frame cutout">
              <img src="copd/assets/o2-nebuliser-70.png" alt="Woman in her 70s wearing an oxygen-driven nebuliser mask">
            </div>
            <div>
              <div class="card">
                <h3>Adult doses from live JRCALC</h3>
                <ul>
                  <li>Sit forwards if blood pressure allows</li>
                  <li><strong>Salbutamol 5 mg</strong> neb. Repeat every <strong>5 minutes</strong> unless side-effects dominate (tremor, HR &gt;140). No maximum number of salbutamol doses</li>
                  <li><strong>Ipratropium 500 micrograms</strong> neb <strong>once</strong> in severe cases, or if unresponsive to salbutamol</li>
                  <li>Protect the eyes — caution in glaucoma</li>
                  <li><strong>Hydrocortisone 100 mg</strong> slow IV (≥2 min) or IM</li>
                </ul>
              </div>
              <div class="card warn" style="margin-top:10px">
                <h3>What the 6 minutes actually limits</h3>
                <ul>
                  <li>How long <strong>oxygen drives each nebuliser</strong> — not a written maximum number of nebs</li>
                  <li>This is <strong>not</strong> a timer on oxygen therapy</li>
                  <li>Do not leave an oxygen-driven neb running for a full 10–15 minutes</li>
                  <li>Applies if <strong>COPD is a possibility</strong> — not only proven type 2 failure</li>
                </ul>
              </div>
            </div>
          </div>
          <div class="diagram-row" style="margin-top:12px">
            <div class="step green"><h3>1. Salbutamol 5 mg</h3><p>Oxygen drive for <strong>6 minutes</strong></p></div>
            <div class="step gold"><h3>2. Stop the drive</h3><p>Off the neb mask. Aim <strong>88–92%</strong></p></div>
            <div class="step dark"><h3>3. Still symptomatic?</h3><p>Further 6-minute run if clinically indicated</p></div>
            <div class="step red" style="background:var(--green)"><h3>Ipratropium</h3><p>500 micrograms <strong>once only</strong></p></div>
          </div>`,
        notes: "Concede this if challenged: JRCALC / AACES COPD guidance does not say ‘maximum two oxygen-powered nebs’. It says limit oxygen-driven nebulisation to 6 minutes. Salbutamol may still be repeated. Each O2-driven episode should still be a 6-minute run, not a continuous neb. High-flow oxygen for critical illness has no 6-minute cap."
      },
      {
        kicker: "The guideline text",
        title: "Where the 6-minute rule is written",
        html: `
          <div class="body">
            <div class="card">
              <h3>JRCALC / AACES COPD guidance — Bronchodilators</h3>
              <p style="font-size:18px">“Limit oxygen-driven nebulisation to 6 minutes. If journey time is significant, consider a further 6 minutes of nebulisation therapy ONLY if clinically indicated, but aim for a target saturation within the range of 88–92%.”</p>
            </div>
            <div class="card" style="margin-top:10px">
              <h3>JRCALC Salbutamol and Ipratropium</h3>
              <p style="font-size:18px">Both monographs: “If COPD is a possibility limit nebulisation with oxygen to 6 minutes.”</p>
              <p class="small" style="margin-top:8px">That is COPD as a possibility — not “only if type 2 failure is proven”.</p>
            </div>
          </div>`,
        notes: "Read the quotes. Then say what they do not say: there is no sentence that reads ‘maximum of two oxygen-powered nebs’. The 6 minutes is the duration of oxygen as the driving gas. Salbutamol may be repeated. Ipratropium once."
      },
      {
        kicker: "Treatment",
        title: "What to do after a 6-minute oxygen-driven neb",
        html: `
          <div class="body two">
            <div class="card">
              <h3>What JRCALC / AACES COPD guidance actually says</h3>
              <ul>
                <li>Limit oxygen-driven nebulisation to 6 minutes</li>
                <li>If the journey is significant, consider a further 6 minutes only if clinically indicated</li>
                <li>Aim 88–92% throughout</li>
                <li>Salbutamol may be repeated at regular intervals. Ipratropium once</li>
              </ul>
            </div>
            <div class="card warn">
              <h3>What it does not say</h3>
              <ul>
                <li>It does <strong>not</strong> write a maximum of two oxygen-powered nebs for the whole job</li>
                <li>If they still need bronchodilator and oxygen is the only driving gas you have, a further 6-minute oxygen-driven neb can be argued as clinically indicated</li>
                <li>What you must not do is leave oxygen driving the neb continuously, or for 10–15 minutes at a time</li>
                <li>Between runs: off the neb mask, titrate to 88–92%</li>
              </ul>
            </div>
          </div>`,
        notes: "Teach the 6-minute duration limit. Do not teach a two-neb cap that is not in the text. If someone in the room makes that point, agree. The operational rule is: 6 minutes of oxygen drive, stop, titrate, repeat as 6-minute episodes if they still need the drug and you have no air compressor. Ipratropium remains once only. Time-critical features still override."
      },
      {
        kicker: "Package of care",
        title: "The rest of the job",
        html: `
          <div class="job-flow">
            <section class="job-step">
              <div class="job-num">1</div>
              <h3>On scene / en route</h3>
              <ul>
                <li>Follow the alert card / individualised plan — the patient often knows what works</li>
                <li>12-lead ECG if indicated</li>
                <li>Pain score, fluids if required, blood glucose if appropriate</li>
                <li>Watch for tiring, not just the SpO<sub>2</sub> number</li>
                <li>Consider Call Before You Convey, or an alternative pathway, if the patient does not need alerting to hospital</li>
              </ul>
            </section>
            <div class="job-arrow" aria-hidden="true"></div>
            <section class="job-step decide build">
              <div class="job-num">2</div>
              <h3>Hospital, not home, if</h3>
              <ul>
                <li>Cannot cope at home, living alone, or not coping</li>
                <li>Severe breathlessness, poor or deteriorating condition</li>
                <li>Cyanosis, new or worsening oedema, impaired consciousness, acute confusion</li>
                <li>Already on LTOT, rapid onset, or significant comorbidity</li>
                <li>SpO<sub>2</sub> &lt;90%</li>
              </ul>
            </section>
            <div class="job-arrow" aria-hidden="true"></div>
            <section class="job-step hand build">
              <div class="job-num">3</div>
              <h3>Then say this</h3>
              <ul>
                <li>NEWS2 total <strong>and the components</strong> — “3, all from sats”</li>
                <li>Scale 1, unless type 2 failure is already documented</li>
                <li>Usual saturations if known, current SpO<sub>2</sub>, target, device</li>
                <li>Alert card, previous NIV, or previous hypercapnia if known</li>
              </ul>
            </section>
          </div>`,
        notes: "Step 1 is already up. Click or Space brings in step 2, then step 3. Step 1 includes Call Before You Convey or an alternative pathway when the patient does not need a hospital alert. Receiving staff should not have to guess the scale. ‘NEWS 3 on Scale 1, targeting 88–92, 90% on 28% Venturi, no documented type 2’ is a high-quality sentence."
      },
      {
        type: "poll",
        pollId: "q-t2",
        layout: "news2",
        kind: "news2",
        expectedScale: 2,
        expectedTotal: 7,
        resultsTitle: "How the room scored patient 1",
        kicker: "Your turn  ·  live NEWS2  ·  patient 1",
        title: "62, known COPD — score this patient",
        prompt: "Score this patient on the NEWS2 chart on your phone. Tap one cell on each row. For SpO<sub>2</sub>, tap Scale 1 or Scale 2.",
        votePrompt: "Score this patient on the NEWS2 chart. Tap one cell on each row. For SpO<sub>2</sub>, tap Scale 1 or Scale 2.",
        options: [],
        obs: {
          hx: "62, known COPD. Alert card: previous type 2 respiratory failure, target 88–92%. Currently on 28% Venturi. Increased SOB. No pyrexia.",
          rr: "24 /min",
          spo2: "96% on oxygen",
          o2: "Oxygen (28% Venturi)",
          sbp: "118 mmHg",
          pulse: "92 /min",
          con: "Alert",
          temp: "36.5 °C"
        },
        scene: [
          "62 years old, known COPD",
          "Alert card: previous type 2 respiratory failure, target 88–92%",
          "Currently on 28% Venturi",
          "Increased shortness of breath",
          "No pyrexia",
          "Alert",
          "Temp 36.5 °C"
        ],
        detail: `
          <div class="poll-detail">
            <div class="photo-frame n2-monitor">
              <img src="copd/assets/patient1-monitor.png" alt="Zoll monitor showing pulse 92, blood pressure 118 over 72, MAP 87, respiratory rate 24, SpO2 96 percent">
            </div>
            <div class="n2-chart-slot"></div>
          </div>`,
        teach: "<strong>NEWS 7 on Scale 2.</strong> Type 2 failure is already documented on the alert card, so Scale 2 is the SpO<sub>2</sub> scale — not because they have COPD. RR 24 scores 2. SpO<sub>2</sub> 96% <strong>on oxygen</strong> scores 2 on Scale 2 (95–96 on oxygen); on air, ≥93% would score 0. On Scale 1, 96% scores 0. Oxygen scores 2, pulse 92 scores 1. Total <strong>7</strong>. Still target 88–92%.",
        notes: "Now they apply the teaching. Patient 1 has documented T2RF — Scale 2. Correct is NEWS 7. Typical error: Scale 1 because they are ‘just COPD’, so 96% scores 0."
      },
      {
        type: "poll",
        pollId: "q-not2",
        layout: "news2",
        kind: "news2",
        expectedScale: 1,
        expectedTotal: 6,
        resultsTitle: "How the room scored patient 2",
        kicker: "Your turn  ·  live NEWS2  ·  patient 2",
        title: "78, known COPD — score this patient",
        prompt: "Score this patient on the NEWS2 chart on your phone. Tap one cell on each row. For SpO<sub>2</sub>, tap Scale 1 or Scale 2.",
        votePrompt: "Score this patient on the NEWS2 chart. Tap one cell on each row. For SpO<sub>2</sub>, tap Scale 1 or Scale 2.",
        options: [],
        obs: {
          hx: "78, known COPD. Not on home oxygen. Increased SOB and secretions. Talking in short sentences. No alert card. No documented type 2 failure.",
          rr: "22 /min",
          spo2: "90% on air",
          o2: "Air",
          sbp: "152 mmHg",
          pulse: "104 /min",
          con: "Alert",
          temp: "36.9 °C"
        },
        scene: [
          "78 years old, known COPD",
          "Not on home oxygen — scoring on air",
          "Increased shortness of breath and secretions",
          "Talking in short sentences",
          "No alert card, no documented type 2 failure",
          "Alert",
          "Temp 36.9 °C"
        ],
        detail: `
          <div class="poll-detail">
            <div class="photo-frame n2-monitor">
              <img src="copd/assets/patient2-monitor.png" alt="Zoll monitor showing pulse 104, blood pressure 152 over 88, MAP 109, respiratory rate 22, SpO2 90 percent">
            </div>
            <div class="n2-chart-slot"></div>
          </div>`,
        teach: "<strong>NEWS 6 on Scale 1.</strong> COPD, extra secretions and 90% on air do not document type 2 failure, so stay on Scale 1. RR 22 scores 2, SpO<sub>2</sub> 90% on air scores 3, air 0, SBP 152 scores 0, pulse 104 scores 1, Alert 0, temp 36.9 scores 0. Total <strong>6</strong>. Scale 2 would score 90% as 0 (88–92) and give NEWS <strong>3</strong>, hiding the hypoxia. Still target 88–92%.",
        notes: "Patient 2 has no documented T2RF — Scale 1. Correct is NEWS 6. Typical error: Scale 2 because they have COPD, so 90% scores 0."
      },
      {
        kicker: "Critically unwell",
        title: "This patient needs high-flow oxygen now",
        html: `
          <div class="shock-layout">
            <img class="shock-monitor" src="copd/assets/patient-shock-monitor.png" alt="Zoll monitor showing pulse 128, blood pressure 86 over 50, MAP 62, respiratory rate 32, SpO2 80 percent">
            <div>
              <p class="shock-scene-line">64, known COPD. Alert card: previous type 2 failure, target 88–92%, on a 28% Venturi. Exhausted, cyanosed, barely responding.</p>
              <div class="shock-vitals">
                <div><strong>80%</strong><span>SpO2</span></div>
                <div><strong>86/50</strong><span>BP</span></div>
                <div><strong>128</strong><span>Pulse</span></div>
                <div><strong>32</strong><span>RR</span></div>
              </div>
              <ul class="shock-actions">
                <li>Do not withhold oxygen for COPD, the alert card, or the 88–92% target</li>
                <li>Reservoir mask now. <strong>TIME-CRITICAL.</strong> ATMIST</li>
                <li>Titrate once they are no longer critically ill. If they become drowsy, reduce flow and support ventilation</li>
                <li><strong>Scale 2</strong> because type 2 is already documented — not because of the high-flow oxygen</li>
              </ul>
            </div>
          </div>
          <div class="banner red" style="margin-top:12px">The 6-minute rule is neb drive only. It is not a timer on oxygen for hypoxia</div>`,
        notes: "Land this as the critically unwell exception, not a ‘take the oxygen off’ story. High-flow now. The 6-minute clock does not apply to oxygen therapy. Alert-card 88–92% is for when they are not critically ill. Scale 2 is from the documented type 2, not from the oxygen you just put on."
      },
      {
        type: "poll",
        pollId: "q1",
        kicker: "Check  1 of 5",
        title: "True or false?",
        prompt: "Every COPD patient should be scored on NEWS2 Scale 2.",
        options: ["True", "False"],
        correct: 1,
        teach: "False. JRCALC / AACES COPD guidance says some patients are at increased risk of type 2 failure — not all. Look for an alert card or other record before Scale 2. The default is Scale 1. There can be exceptions — say why if you use Scale 2 without that record.",
        notes: "First assessment of whether the session worked. Space reveals. If the room goes True, slow down on the take-home."
      },
      {
        type: "poll",
        pollId: "q2",
        kicker: "Check  2 of 5",
        title: "Oxygen target vs scale",
        prompt: "Can you target SpO<sub>2</sub> 88–92% while still using Scale 1?",
        options: ["Yes", "No"],
        correct: 0,
        teach: "Yes. JRCALC / AACES COPD guidance targets 88–92% and still only asks you to calculate a NEWS2 score. RCP: Scale 2 is a separate, documented decision.",
        notes: "Second assessment question. This is the distinction most staff blur."
      },
      {
        type: "poll",
        pollId: "q3",
        kicker: "Check  3 of 5",
        title: "The critically ill",
        prompt: "Known COPD patient presents with the observations below. Do we give high-flow or low-flow oxygen?",
        options: [
          "They are hypoxic and in shock — give high-flow, then titrate if they improve",
          "They have COPD — give low-flow oxygen"
        ],
        correct: 0,
        image: "copd/assets/patient-shock-monitor.png",
        detail: `
          <div class="photo-frame cutout shock-zoll">
            <img src="copd/assets/patient-shock-monitor.png" alt="Zoll monitor showing pulse 128, blood pressure 86 over 50, MAP 62, respiratory rate 32, SpO2 80 percent">
          </div>`,
        teach: "<strong>High-flow.</strong> This is shock, not a “usual COPD”. JRCALC / AACES COPD guidance: do not withhold high-concentration oxygen if the primary illness needs it. Hypoxia is the greater short-term risk. Titrate 88–92% once they are no longer critically ill. The 6-minute rule does not apply here — that only limits oxygen as the driving gas of a nebuliser.",
        notes: "Watch for people still giving controlled oxygen in shock because of COPD. The Zoll is the argument: 80%, 86/50, 128, RR 32."
      },
      {
        type: "poll",
        pollId: "q4",
        kicker: "Check  4 of 5",
        title: "Nebuliser drive",
        prompt: "An oxygen-driven neb in COPD. How long may oxygen drive it?",
        options: ["2 minutes", "6 minutes", "Until the chamber is empty"],
        correct: 1,
        teach: "6 minutes per run, then stop the oxygen drive and aim 88–92%. JRCALC / AACES COPD guidance does not write a maximum number of nebs. Salbutamol may be repeated as further 6-minute oxygen-driven episodes if that is the only method you have. Ipratropium once. Applies if COPD is a possibility — not only type 2 failure.",
        notes: "If they say until empty, correct firmly. Duration is the drive time, not a two-neb cap."
      },
      {
        type: "poll",
        pollId: "q5",
        kicker: "Check  5 of 5",
        title: "Not every breathless COPD is an exacerbation",
        prompt: "Chest pain and fever in “COPD” — what now?",
        options: ["Treat as a simple exacerbation", "Reconsider the diagnosis"],
        correct: 1,
        teach: "Uncommon in simple exacerbation. Reconsider pneumonia, ACS, PE, pneumothorax, heart failure. COPD does not choose Scale 2. A previous hospital or specialist record of type 2 failure does.",
        notes: "Finish the quiz on differential, then the take-home lines."
      },
      {
        kicker: "Take home",
        title: "Five key points to remember",
        html: `
          <div class="body">
            <div class="banner build">1. Some COPD patients are at risk of type 2 failure — not all.</div>
            <div class="banner teal build" style="margin-top:8px">2. Do not put every COPD patient on NEWS2 Scale 2.</div>
            <div class="banner green build" style="margin-top:8px">3. Target 88–92% oxygen in COPD — that does not choose the scale.</div>
            <div class="banner dark build" style="margin-top:8px">4. Look for a record of type 2 failure before Scale 2. COPD alone is not enough.</div>
            <div class="banner red build" style="margin-top:8px">5. Never leave a critically ill COPD patient hypoxic.</div>
          </div>`,
        notes: "Read them slowly. Space reveals each line."
      },
      {
        kicker: "Sources",
        title: "References",
        html: `
          <div class="body two">
            <div class="card">
              <h3>Clinical guidance</h3>
              <ul>
                <li>JRCALC / AACES COPD guidance v20.40 (6 September 2023)</li>
                <li>JRCALC Oxygen — 4 L/min 28% Venturi, target 88–92%</li>
                <li>JRCALC Salbutamol D0300, Ipratropium D0200, Hydrocortisone D0180</li>
                <li>WMAS clinical notices and local PGDs where they apply — including CN-436</li>
              </ul>
            </div>
            <div class="card">
              <h3>NEWS2</h3>
              <ul>
                <li>RCP, National Early Warning Score (NEWS) 2, 2017 — Chart 1 reproduced unmodified, in colour</li>
                <li><a href="https://www.rcp.ac.uk/resources/national-early-warning-score-news-2/" style="color:inherit">rcp.ac.uk/resources/national-early-warning-score-news-2</a></li>
                <li>RCP NEWS2 additional implementation guidance, March 2020 — oxygen scales</li>
                <li>Williams B. Clin Med 2019;19:94–95 — most AECOPD patients do not have HCRF</li>
                <li>WMAS CN-436 Pre-alerting of Patients V8 (20 July 2026) — sats on oxygen ≤91%, or ≤83% in chronic hypercapnic respiratory failure</li>
              </ul>
            </div>
          </div>
          <p class="small" style="margin-top:12px">Teaching summary of JRCALC Plus, not a substitute for the live guideline. ${NEWS2_CITE} NEWS2 Chart 1 is reproduced unmodified and in colour; the RCP places no copyright restriction on NEWS2 provided those conditions are met. Chest X-ray: Mikael Häggström, MD, via Wikimedia Commons, CC0 public domain. Other diagrams in this deck are original teaching graphics, not official JRCALC artwork. Recheck local PGDs and stock — prednisolone is named in JRCALC / AACES COPD guidance but is not currently available in WMAS.</p>`,
        notes: "Ask staff to open JRCALC / AACES COPD guidance after the session. If the ePR auto-selects Scale 2 from a COPD tick-box, that is a governance issue worth feeding back."
      },
      {
        questions: true,
        kicker: "Close",
        title: "Any questions?",
        html: `
          <div class="body">
            <div class="banner dark" style="font-size:clamp(28px,3.2vw,42px);padding:28px 24px">Thank you for attending</div>
            <div class="banner teal" style="margin-top:12px;padding:22px 24px">We hope it has been useful</div>
            <div class="banner" style="margin-top:12px;padding:22px 24px">Ask now, or email: <a href="mailto:jon.ostrowski@wmas.nhs.uk" style="color:inherit;text-decoration:underline">jon.ostrowski@wmas.nhs.uk</a></div>
            <div class="banner green" style="margin-top:12px;padding:22px 24px">The next slide is for feedback, and ideas for another 30-minute CPD.</div>
          </div>`,
        notes: "Leave this up. Offer to stay for ePR / local pathway queries. The next slide collects feedback and topic ideas. Then the CPD certificate QR — only in a hosted session. Leave that one up for the room to scan."
      },
      {
        feedback: true,
        kicker: "Feedback",
        title: "Help shape the next session",
        html: `
          <div class="body two feedback-layout">
            <div>
              <div class="banner teal">Please provide feedback on this Hub CPD Session</div>
              <div class="banner" style="margin-top:12px">Any suggestions for future hub CPD Sessions?</div>
            </div>
            <aside class="poll-join feedback-join">
              <img class="feedback-qr" alt="Open the feedback form" width="132" height="132" hidden />
              <p class="poll-url"></p>
            </aside>
          </div>
          <div class="feedback-brand">
            <img class="feedback-logo" src="assets/hub-cpd-logo.png" alt="Hub CPD. Ambulance clinical refreshers.">
            <p class="feedback-home"></p>
          </div>`,
        notes: "Leave this up. Phones already on the vote page get the form by themselves. Anyone else can scan the QR. Download feedback from the presenter sidebar."
      },
      {
        hostedOnly: true,
        kicker: "",
        title: "Record Attendance for CPD Certificate",
        html: `
          <div class="body trust-attend">
            <div class="trust-qr">
              <img src="copd/assets/copd-certificate-qr.png" alt="CPD certificate QR code" onerror="var p=this.parentElement;this.remove();var m=p&&p.querySelector('.trust-qr-missing');if(m)m.hidden=false" />
              <p class="trust-qr-missing" hidden>Save the QR image as copd/assets/copd-certificate-qr.png, then refresh.</p>
            </div>
          </div>`,
        notes: "This slide is only in a hosted session, after a Hub PIN. It is not in the self-guided deck. Leave it up so the room can scan. Save the Trust QR as copd/assets/copd-certificate-qr.png and hard-refresh."
      }
  ];
}
