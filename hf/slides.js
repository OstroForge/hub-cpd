function heartFailureSlides() {
  return [
    {
      type: "title",
      kicker: "Ambulance Clinical Refreshers",
      title: "Heart Failure in Pre-hospital Care",
      subtitle: "Recognise the presentation, sit them up, and treat the right problem — congestion, ischaemia or shock.",
      meta: "JRCALC Heart Failure, Glyceryl Trinitrate and Furosemide. Always follow the live JRCALC entry and local Trust policy.",
      notes: "Open on the title. Next is the icebreaker — leave it up while phones scan the QR. Do not call the guideline by a code number. People know it as Heart Failure."
    },
    {
      type: "poll",
      pollId: "hf-hands",
      resultsTitle: "GTN blood pressure — how the room voted",
      kicker: "Hands up  ·  live vote",
      title: "Before we start — phones out",
      prompt: "In acute heart failure, below which systolic blood pressure must you <strong>not</strong> give GTN?",
      votePrompt: "In acute heart failure, below which systolic blood pressure must you not give GTN?",
      options: [
        "90 mmHg",
        "110 mmHg",
        "140 mmHg"
      ],
      correct: 1,
      teach: "<strong>110 mmHg</strong> — the Heart Failure / GTN threshold for AHF, or any symptomatic hypotension. <strong>90 mmHg</strong> is the angina / MI figure. Mixing the two is the habit this session is here to break.",
      notes: "Leave this up while people scan. Typical wrong answer is 90 because that is what they use for ACS. Space to results, then Space again for the teaching point."
    },
    {
      kicker: "Core messages",
      title: "Learning objectives",
      html: `
        <div class="card" style="margin-bottom:12px">
          <h3>By the end you will have refreshed how to:</h3>
          <ul style="columns:2;column-gap:28px">
            <li>Spot acute heart failure and separate it from COPD, PE, pneumonia and sepsis</li>
            <li>Sit the patient fully upright as a treatment, not a comfort measure</li>
            <li>Give GTN only when the indication and the blood pressure both allow it</li>
            <li>Think before fluids, morphine or a “usual LVF package”</li>
          </ul>
        </div>
          <div class="body two">
            <div class="card">
              <h3>This is time-critical</h3>
              <p>JRCALC: acute heart failure is life-threatening. New and decompensated chronic cases need <strong>TIME-CRITICAL</strong> transfer unless there is an advance care or palliative plan. Prefer a hospital with a coronary care unit.</p>
            </div>
            <div class="card">
              <h3>Four presentations — not one protocol</h3>
              <p>Treat what you are looking at: acute pulmonary oedema, peripheral oedema, respiratory distress, or cardiogenic shock.</p>
              <p class="small" style="color:var(--red);margin-top:10px">GTN and furosemide are not automatic. Shock is a different job.</p>
            </div>
          </div>
          <div class="banner build" style="margin-top:12px">AHF is not “give GTN if SBP is over 90”</div>`,
      notes: "Outcomes in 30 seconds. Then the two banners. The room often still runs an old LVF package: sit up, GTN, furosemide, morphine. That package is no longer the guideline."
    },
    {
      kicker: "JRCALC Heart Failure — the actual wording",
      title: "GTN is considered — it is not automatic",
      html: `
        <div class="banner dark">“Consider administering GTN in Acute Heart Failure with ischaemia or uncontrolled hypertension.”</div>
        <div class="body two" style="margin-top:16px">
          <div class="card fact">
            <h3>Two gates before a spray</h3>
            <ul>
              <li><strong>Indication:</strong> acute heart failure <em>with</em> ischaemia or uncontrolled hypertension</li>
              <li><strong>Safety:</strong> systolic BP greater than <strong>110 mmHg</strong>, and not symptomatic hypotension</li>
              <li>Avoid in severe aortic or mitral stenosis, PDE5 inhibitors in the last 24 hours, hypovolaemia, head injury</li>
            </ul>
          </div>
          <div class="card warn">
            <h3>What that sentence does not say</h3>
            <ul>
              <li>It does not say “any pulmonary oedema with SBP over 90”</li>
              <li>It does not say GTN is first-line for every AHF job</li>
              <li>90 mmHg is the ACS / angina figure — a different table in the same monograph</li>
            </ul>
          </div>
        </div>`,
      notes: "Read the quote slowly. January 2024 update: GTN in AHF is for ischaemia or uncontrolled hypertension. Then the 110 mmHg safety line. People will argue ‘we’ve always given it in LVF’. Agree that congestion with a high BP is exactly when vasodilators help — then hold the two gates."
    },
    {
      kicker: "What it is",
      title: "Heart failure in one minute",
      html: `
        <div class="body two hf-signs">
          <div>
            <ul>
              <li>A clinical syndrome, not a single disease — the heart cannot meet the body’s needs, or does so at high filling pressures</li>
              <li>Commonest UK cause is coronary disease; many have had a previous MI</li>
              <li>Valves, pericardium, rhythm and conduction can all do it</li>
              <li><strong>Chronic HF</strong> is already diagnosed and treated in the community</li>
              <li><strong>Acute on chronic</strong> is a rapid worsening of that known condition</li>
              <li><strong>Heart failure de novo</strong> is the first presentation — no previous diagnosis. Write it that way.</li>
            </ul>
            <div class="card warn" style="margin-top:12px">
              <h3>Pre-hospital trap</h3>
              <p>AHF is frequently mistaken for sepsis: both can collapse and look hypotensive. Fluids that would be right for sepsis can be harmful here.</p>
            </div>
          </div>
          <div class="hf-signs-pic">
            <div class="photo-frame">
              <img src="hf/assets/hf-signs.jpg" alt="Diagram of major heart failure signs: breathlessness, pulmonary oedema, pleural fluid, ascites and swollen legs">
            </div>
            <p class="photo-caption">Signs of heart failure. National Heart, Lung, and Blood Institute / NIH, public domain, via Wikimedia Commons.</p>
          </div>
        </div>
        <div class="banner" style="margin-top:12px">Three acute forms: pulmonary oedema · peripheral oedema · cardiogenic shock (5–8%, often STEMI)</div>`,
      notes: "Do not lecture HFrEF versus HFpEF. Use the picture: wet lungs, wet abdomen, wet legs. Name heart failure de novo in full — not just ‘de novo’. Shock is rare but it is the one that makes GTN and furosemide the wrong drugs. The sepsis trap is the line that must land."
    },
    {
      kicker: "Words you will hear",
      title: "Terms without the alphabet soup",
      html: `
        <table>
          <thead>
            <tr><th>You may hear</th><th>Stands for</th><th>What it means on scene</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>HFrEF</strong></td>
              <td>Heart Failure with reduced Ejection Fraction<br><span class="small">Also called LVSD — Left Ventricular Systolic Dysfunction</span></td>
              <td>Pumping problem. Ejection fraction under 40%. The left ventricle does not empty well.</td>
            </tr>
            <tr>
              <td><strong>HFpEF</strong></td>
              <td>Heart Failure with preserved Ejection Fraction</td>
              <td>Filling problem. EF 50% or more. The ventricle is stiff. They can still get pulmonary oedema.</td>
            </tr>
            <tr>
              <td><strong>LVF</strong></td>
              <td>Left Ventricular Failure</td>
              <td>Breathless, often basal crackles, pulmonary oedema. May also have right-sided signs.</td>
            </tr>
            <tr>
              <td><strong>RVF</strong></td>
              <td>Right Ventricular Failure<br><span class="small">Cor pulmonale — right failure from chronic lung disease</span></td>
              <td>Swollen, raised JVP, ascites, pleural fluid. Lungs often clear.</td>
            </tr>
            <tr>
              <td><strong>CCF</strong></td>
              <td>Congestive Cardiac Failure</td>
              <td>Old term. Both pulmonary and peripheral oedema — left and right.</td>
            </tr>
          </tbody>
        </table>
        <p class="callout" style="margin-top:14px">Treat what you see and hear in front of you. The type of heart failure does not matter in pre-hospital care — easing the congestion and shock is what is important.</p>`,
      notes: "Walk the table: say the words out loud so HFrEF and HFpEF stop being noise. Skip HFmrEF unless asked. Land the callout: type is a hospital label. On scene, treat congestion or shock."
    },
    {
      kicker: "Look again",
      title: "Is this heart failure — or something else?",
      html: `
        <table class="hf-diff">
          <thead>
            <tr>
              <th>Condition</th>
              <th>Symptoms</th>
              <th>Signs</th>
              <th>Auscultation or audible sounds</th>
              <th>History</th>
            </tr>
          </thead>
          <tbody>
            <tr class="ahf">
              <td><strong>AHF</strong></td>
              <td>Dyspnoea, worse lying flat. Orthopnoea, paroxysmal nocturnal dyspnoea (PND). Pink or white frothy sputum</td>
              <td>Peripheral oedema, raised JVP, tachycardia</td>
              <td>Fine basal crackles. Wheeze. Murmur if present</td>
              <td>IHD, hypertension, previous MI, known HF</td>
            </tr>
            <tr class="copd">
              <td><strong>COPD</strong></td>
              <td>Worse breathlessness and cough over days. More sputum than usual</td>
              <td>Pursed lips, barrel chest, accessory muscles. No new oedema</td>
              <td>Wheeze, poor air entry</td>
              <td>Likely known COPD, smoker, usually 35+</td>
            </tr>
            <tr class="asthma">
              <td><strong>Asthma</strong></td>
              <td>Acute dyspnoea, cough. Cannot finish sentences</td>
              <td>Tachypnoea, tachycardia, accessory muscles. Peak flow down</td>
              <td>Expiratory wheeze. Silent chest if severe</td>
              <td>Previous asthma, inhaler surge, allergen</td>
            </tr>
            <tr class="infection">
              <td><strong>Chest infection</strong></td>
              <td>Dyspnoea, fever, cough. Green or yellow sputum</td>
              <td>Fever, tachycardia, unwell over days</td>
              <td>Focal crackles or rhonchi</td>
              <td>Recent infection. Smoking</td>
            </tr>
            <tr class="pe">
              <td><strong>PE</strong></td>
              <td>Sudden dyspnoea. Pleuritic pain, cough, maybe haemoptysis or leg pain</td>
              <td>Tachycardia, tachypnoea. Hypoxia out of proportion</td>
              <td>Often a clear chest, or focal crackles</td>
              <td>Immobility, recent surgery, previous clot, cancer, pregnancy</td>
            </tr>
            <tr class="acs">
              <td><strong>ACS</strong></td>
              <td>Breathlessness — may be the only symptom. Chest pain, nausea, sweat</td>
              <td>Pale, clammy. 12-lead may show ACS</td>
              <td>Often clear unless AHF as well</td>
              <td>IHD, previous MI, diabetes, cardiac risk</td>
            </tr>
          </tbody>
        </table>
        <div class="banner build hf-diff-punch">If the ECG shows ACS, this is an ACS job as well.</div>`,
      notes: "This is the JRCALC Dyspnoea split — do not quote a guideline code. Walk AHF first, then the five that mimic it. Orthopnoea supports AHF but COPD often cannot lie flat either. Cardiac wheeze in older people is not asthma. Pneumonia can trigger decompensation. ACS may have no chest pain. Land the banner: overlap is expected; the 12-lead still matters."
    },
    {
      kicker: "Why they look like this",
      title: "Left backup, right backup",
      html: `
        <div class="body two">
          <div class="card">
            <h3>Left — into the lungs</h3>
            <p>Poor left ventricular contraction. Blood backs into the pulmonary veins. Hydrostatic pressure pushes fluid into the alveoli.</p>
            <ul>
              <li>Severe dyspnoea, orthopnoea, paroxysmal nocturnal dyspnoea (PND)</li>
              <li>Pink or white frothy sputum</li>
              <li>Basal crackles ± wheeze</li>
              <li>Hypoxia</li>
            </ul>
          </div>
          <div class="card">
            <h3>Right — into the body</h3>
            <p>Often follows left failure. Isolated right failure: lung disease, PE, valves. High pulmonary pressure, then a failing right ventricle.</p>
            <ul>
              <li>Raised JVP</li>
              <li>Hepatomegaly, ascites</li>
              <li>Dependent oedema from the feet up</li>
              <li>Lungs may be clear</li>
            </ul>
          </div>
        </div>
        <div class="banner teal" style="margin-top:12px">Most jobs you see will mix both. Treat the presentation in front of you.</div>`,
      notes: "Keep this physiological and short. Left = wet lungs. Right = wet body. JVP is useful but JRCALC says it is hard pre-hospital and must not delay treatment."
    },
    {
      kicker: "What congestion looks like",
      title: "The film you will not have — and the signs you may",
      html: `
        <div class="body pic-strip">
          <figure data-zoom="1">
            <div class="photo-frame" style="height:min(250px,32vh);background:#111">
              <img src="hf/assets/hf-cxr-chf.jpg" alt="Chest X-ray labelled with pleural effusion, Kerley B lines, upper-lobe blood diversion and an enlarged heart">
            </div>
            <p class="photo-caption">Mikael Häggström, MD, CC0, via Wikimedia Commons.</p>
            <p class="pic-teach">The heart is large. High left atrial pressure fills the upper lung veins first (upper-lobe diversion). Kerley B lines are interstitial oedema at the bases. Fluid has also spilled into the pleural space.</p>
          </figure>
          <figure data-zoom="2">
            <div class="photo-frame fill" style="height:min(250px,32vh)">
              <img src="hf/assets/hf-jvp.jpg" alt="Raised jugular venous pressure in a person with heart failure, arrow marking the external jugular vein" style="object-position:center 35%">
            </div>
            <p class="photo-caption">James Heilman, MD, CC BY-SA 3.0. Arrow: external jugular.</p>
            <p class="pic-teach">If they will sit at about 45°, look at the right neck. You want a flickering venous column, not a carotid you can feel. It is high because the right heart cannot empty, so vena cava pressure stays up and the neck veins stay full.</p>
          </figure>
          <figure data-zoom="3">
            <div class="photo-frame fill" style="height:min(250px,32vh)">
              <img src="hf/assets/hf-oedema.jpg" alt="Pitting oedema of the lower leg, shown while pressure is applied and after the finger is lifted">
            </div>
            <p class="photo-caption">James Heilman, MD, CC BY-SA 3.0.</p>
            <p class="pic-teach">Press for a few seconds, then lift. A dent that stays is pitting oedema — fluid that has been pushed out of the veins into the tissues.</p>
          </figure>
        </div>`,
      notes: "Open with all three. Space zooms the CXR. The next Space shrinks it back into the row, then the JVP grows; same again for oedema. Space after oedema leaves the slide."
    },
    {
      kicker: "Why today?",
      title: "What triggered this episode?",
      html: `
        <p style="margin-bottom:10px">JRCALC: a trigger is found in about two-thirds of decompensations. Some — ischaemia and pneumonia — raise mortality. You may be treating two conditions at once.</p>
        <div class="diagram-row quad" style="margin-top:0">
          <div class="step red pic-heart"><h3 class="build">Heart</h3><p class="build">MI / ACS<br>Tachyarrhythmia (AF, VT)<br>Bradyarrhythmia<br>Uncontrolled BP</p></div>
          <div class="step gold pic-lungs"><h3 class="build">Lungs and infection</h3><p class="build">Pneumonia<br>COPD flare<br>Pulmonary embolism<br>Sepsis</p></div>
          <div class="step green pic-pills"><h3 class="build">Drugs and lifestyle</h3><p class="build">Missed HF medicines<br>NSAIDs, steroids<br>Alcohol / recreational drugs<br>Cardiotoxic chemo</p></div>
          <div class="step dark pic-also"><h3 class="build">Also consider</h3><p class="build">Chest trauma<br>Valve failure / endocarditis<br>Aortic dissection<br>LVAD if they have one</p></div>
        </div>
        <p class="callout build hold-space" style="margin-top:14px">If the ECG shows ACS, this is an ACS job as well as a heart-failure job. Follow Acute Coronary Syndrome.</p>`,
      notes: "Four empty boxes. Space: Heart. Space: the list. Space: Lungs. Space: that list. Same for drugs, then also-consider. Last Space is the ACS callout."
    },
    {
      kicker: "The dangerous habit",
      title: "STOP and THINK before intravenous fluids",
      html: `
        <div class="banner red">If they have heart failure or valve disease, IV fluids can be harmful — especially given quickly and in large amounts</div>
        <div class="body two" style="margin-top:16px">
          <div class="card myth">
            <h3>Why this keeps happening</h3>
            <ul>
              <li>They look shocked, so the reflex is a fluid challenge</li>
              <li>AHF is frequently mistaken for sepsis</li>
              <li>A “low BP, give fluid” habit does not ask <em>why</em> the pressure is low</li>
            </ul>
          </div>
          <div class="card fact">
            <h3>What to do instead</h3>
            <ul>
              <li>Look for congestion: orthopnoea, crackles, frothy sputum, oedema</li>
              <li>Cardiogenic shock is hypoperfusion from pump failure — not an empty tank</li>
              <li>Correct life-threatening ABCD, sit them up if they will tolerate it, TIME-CRITICAL transfer</li>
              <li>If you truly cannot tell sepsis from AHF, say so at handover and be cautious with volume</li>
            </ul>
          </div>
        </div>`,
      notes: "This is a key-point sentence in JRCALC. Read the red banner. Then the sepsis mix-up. Do not ban every millilitre — ban unthinking wide-open fluids in known HF."
    },
    {
      kicker: "The easiest and most important intervention you can do",
      title: "Sit them fully upright — IMMEDIATELY",
      html: `
        <div class="body two hf-upright">
          <div class="hf-upright-copy">
            <div class="card ok">
              <h3>Why this is treatment</h3>
              <ul>
                <li>Lowers left atrial pressure — the driving pressure for pulmonary oedema</li>
                <li>Drops the diaphragm, so the lung bases can open</li>
                <li>Lets them use accessory muscles</li>
                <li>JRCALC: the importance of positioning cannot be overstated</li>
              </ul>
            </div>
            <div class="card warn">
              <h3>They will slump</h3>
              <ul>
                <li>Exhausted patients slide down the trolley</li>
                <li>Reposition repeatedly on scene and en route</li>
                <li>Do not lay them flat for a 12-lead if they decompensate the moment they go down — sit them, record what you can, document why</li>
              </ul>
            </div>
          </div>
          <figure class="hf-upright-pic">
            <div class="photo-frame">
              <img src="hf/assets/hf-sit-upright.png?v=11" alt="Older patient in a navy T-shirt sitting fully upright on a yellow ambulance trolley with a white sheet, oxygen mask with a white Venturi fitting and tubing">
            </div>
          </figure>
        </div>
        <div class="banner build hold-space" style="margin-top:12px">First sit them upright, then oxygen, ECG and further medications</div>`,
      notes: "This is free, immediate, and often skipped while people reach for GTN. If they are peri-arrest and need to be laid for CPR, that overrides — but the breathless congested patient should not be recumbent."
    },
    {
      kicker: "On-scene map",
      title: "Congestion — or cardiogenic shock?",
      html: `
        <div class="card" style="margin-bottom:10px;text-align:center">
          <p style="font-size:22px;font-weight:750;color:var(--navy);margin:0">Breathless. Wet lungs or wet legs. Known or suspected heart failure.</p>
        </div>
        <p style="text-align:center;font-weight:750;margin:0 0 10px;font-size:22px;color:var(--navy)">Are they hypotensive or hypoperfused?</p>
        <div class="diagram-row two hf-shock-defs">
          <div class="card">
            <h3>Hypotensive</h3>
            <p>Systolic BP under <strong>110 mmHg</strong> — the Heart Failure line — or they look hypotensive: collapsing, dizzy, weak.</p>
          </div>
          <div class="card">
            <h3>Hypoperfused</h3>
            <p>The tissues are not being supplied. Cool, clammy, delayed CRT, confused, mottled, weak pulses. The BP can still look “not too bad”.</p>
          </div>
        </div>
        <div class="diagram-row two">
          <div class="step red">
            <h3>YES — treat as shock</h3>
            <ul>
              <li>No GTN. No furosemide</li>
              <li>Correct &lt;C&gt;ABCDE. Do not dump fluid</li>
              <li>12-lead — this is often STEMI</li>
              <li>TIME-CRITICAL. ATMIST. Prefer CCU</li>
            </ul>
          </div>
          <div class="step green">
            <h3>NO — congested, BP holding</h3>
            <ul>
              <li>Sit fully upright. Oxygen 94–98%</li>
              <li>GTN only if ischaemia or uncontrolled hypertension, and SBP &gt;110</li>
              <li>Consider furosemide 40 mg slow IV</li>
            </ul>
          </div>
        </div>
          <div class="step dark" style="margin-top:12px">
            <h3>Both paths</h3>
            <p>12-lead. Ask about a care plan or DNACPR. Still TIME-CRITICAL unless a palliative plan says otherwise.</p>
          </div>`,
      notes: "Do not say ‘congestion with a pulse’ — it does not land. The split is: congested but the pressure is holding, versus cardiogenic shock (hypotensive or hypoperfused). Read the two definitions. Left path is the 5–8%. Right path is most of the room’s jobs. Navy bar: both still get ECG and a proper receiving hospital."
    },
    {
      kicker: "Oxygen and ECG",
      title: "94–98%, and a 12-lead on everyone",
      html: `
        <div class="body two">
          <div class="card">
            <h3>Oxygen</h3>
            <ul>
              <li>Recommended in acute heart failure</li>
              <li>Target <strong>94–98%</strong></li>
              <li>Give an initial dose until you have a reliable SpO<sub>2</sub>, then titrate</li>
              <li>If they also have COPD, the COPD / oxygen target of 88–92% still applies — that is a separate decision</li>
            </ul>
          </div>
          <div class="card">
            <h3>ECG</h3>
            <ul>
              <li>Record a 12-lead</li>
              <li>It is rare for heart failure to have a normal ECG</li>
              <li>If the ECG is normal, consider another diagnosis</li>
              <li>If it shows ACS, follow the ACS pathway as well</li>
            </ul>
          </div>
        </div>
        <p class="small" style="margin-top:12px">Non-invasive monitoring — SpO<sub>2</sub>, BP, respiratory rate and continuous ECG — from minutes after contact, and keep it on during transfer.</p>`,
      notes: "Oxygen is 94–98% here, not 88–92%. If they have COPD, do not pretend Heart Failure overrules COPD oxygen — you still titrate. The normal-ECG line is a useful ‘are we sure?’ check."
    },
    {
      kicker: "GTN",
      title: "How to give it when both gates are open",
      html: `
        <div class="body two">
          <div class="card">
            <h3>Dose from live JRCALC (spray)</h3>
            <ul>
              <li>Mucosa must be moist</li>
              <li><strong>400–800 micrograms</strong> (1–2 sprays) under the tongue</li>
              <li>Assess over <strong>5 minutes</strong></li>
              <li>Repeat every 5–10 minutes if SBP remains <strong>&gt;110</strong></li>
              <li>Maximum <strong>6 sprays (2.4 milligrams)</strong> in AHF</li>
            </ul>
          </div>
          <div class="card warn">
            <h3>Do not give it</h3>
            <ul>
              <li>SBP under 110 in AHF, or symptomatic hypotension</li>
              <li>Hypovolaemia, unconscious</li>
              <li>Head trauma or cerebral haemorrhage</li>
              <li>Sildenafil or related drugs in the previous 24 hours</li>
              <li>Known severe aortic or mitral stenosis</li>
            </ul>
          </div>
        </div>
        <p class="small" style="margin-top:10px">Same drug, different table: angina / MI / cocaine chest pain still uses SBP &gt;90, and has no 6-spray cap. Do not import that table into heart failure.</p>`,
      notes: "Spray is what we carry. Cite 400–800, 5-minute look, 110, max 6 sprays. PDE5 inhibitors still catch people. Caution in STEMI: GTN is not routinely first-line for MI regardless of location — if this is a STEMI with oedema, you are on two pathways."
    },
    {
      type: "poll",
      pollId: "hf-gtn",
      kicker: "Your turn  ·  live vote",
      title: "Would you give GTN?",
      prompt: "72, known heart failure. Slept in the chair. Pink frothy sputum, crackles, <strong>chest pain</strong>. SBP <strong>168</strong>, HR 50, SpO<sub>2</sub> 90% on air. 12-lead as shown.",
      votePrompt: "72, known heart failure, pink frothy sputum, chest pain, SBP 168, 12-lead as shown. Give GTN?",
      detail: `
        <figure class="poll-ecg">
          <div class="photo-frame">
            <img src="hf/assets/hf-gtn-ecg.png" alt="12-lead ECG at 50 per minute showing ST depression and T-wave inversion, without ST elevation">
          </div>
        </figure>
        <div class="photo-frame cutout shock-zoll">
          <img src="hf/assets/hf-gtn-monitor.png?v=2" alt="Zoll monitor showing pulse 50, blood pressure 168 over 96, MAP 120, respiratory rate 28, SpO2 90 percent on air">
        </div>`,
      options: [
        "Yes — 12-lead ischaemia and SBP over 110",
        "No — wait until hospital for nitrates",
        "No — SBP must be over 180"
      ],
      correct: 0,
      teach: "<strong>Yes.</strong> There is global T wave inversion (ischaemic changes), patient has chest pain, blood pressure 168 systolic so there is no reason to withhold GTN. Sit fully upright, titrate for saturations 94–98%, GTN 400–800 mcg. <strong>Time critical transfer</strong>. Consider furosemide.",
      notes: "Point at the inverted T waves first. That is how we know there is ischaemia — not tombstone elevation. If someone says Wellens, agree: T inversion, not a PPCI STEMI. Rhythm is about 50 — six large squares. Then the Zoll: 50 and 168. Hypertension alone would still open GTN."
    },
    {
      type: "poll",
      pollId: "hf-shock",
      kicker: "Your turn  ·  live vote",
      title: "Same lungs, different blood pressure",
      prompt: "68, known heart failure. Pale, sweaty, barely responding. Crackles throughout. SBP <strong>86</strong>, HR 128, SpO<sub>2</sub> 80%. 12-lead as shown.",
      votePrompt: "68, known HF, shocked, crackles, SBP 86, 12-lead as shown. GTN and furosemide?",
      detail: `
        <figure class="poll-ecg">
          <div class="photo-frame">
            <img src="hf/assets/hf-shock-ecg.png?v=3" alt="12-lead ECG at 128 per minute showing ST depression and T-wave inversion, without ST elevation">
          </div>
        </figure>
        <div class="photo-frame cutout shock-zoll">
          <img src="hf/assets/patient-shock-monitor.png" alt="Zoll monitor showing pulse 128, blood pressure 86 over 50, MAP 62, respiratory rate 32, SpO2 80 percent">
        </div>`,
      options: [
        "GTN and furosemide — it is still LVF",
        "GTN only, skip furosemide",
        "Neither — this is cardiogenic shock"
      ],
      correct: 2,
      teach: "<strong>Neither.</strong> SBP 86 is below the GTN line. Furosemide is contraindicated in cardiogenic shock. Sit up if they tolerate it, high-concentration oxygen. The 12-lead is ischaemic — T-wave inversion and ST depression, not ST elevation. TIME-CRITICAL. Caution must be noted regarding giving IV fluids for heart failure",
      notes: "Zoll is 128 — the 12-lead is the same rate. Point at the inverted T waves and ST depression, not elevation. People will still reach for GTN because the chest is wet. The blood pressure decides: 86 is below the line."
    },
    {
      kicker: "Furosemide",
      title: "Consider 40 milligrams — not a reflex, not in shock",
      html: `
        <div class="body two">
          <div class="card">
            <h3>When JRCALC says consider it</h3>
            <ul>
              <li>Pulmonary oedema and/or respiratory distress due to acute heart failure</li>
              <li>Adults 18 years and over</li>
              <li><strong>40 milligrams IV slowly over 2 minutes</strong> — no repeat dose</li>
              <li>The monograph also says consider it when the time to hospital is prolonged</li>
            </ul>
          </div>
          <div class="card warn">
            <h3>Do not give it</h3>
            <ul>
              <li>Cardiogenic shock</li>
              <li>Severe renal failure with anuria</li>
              <li>Reduced GCS with liver cirrhosis</li>
              <li>Children under 18</li>
              <li>Caution if already hypotensive, pregnant, or known low potassium</li>
            </ul>
          </div>
        </div>
        <div class="card build hf-oedema-diff" style="margin-top:12px">
          <h3>Pulmonary oedema is not the same as peripheral oedema</h3>
          <div class="hf-oedema-diff-grid">
            <div>
              <p><strong>Pulmonary — fluid in the lungs</strong></p>
              <ul>
                <li>Left heart backing up into the alveoli</li>
                <li>Orthopnoea, crackles, frothy sputum, hypoxia</li>
                <li><strong>This is the furosemide indication</strong></li>
              </ul>
            </div>
            <div>
              <p><strong>Peripheral — fluid in the tissues</strong></p>
              <ul>
                <li>Right heart backing up into the body</li>
                <li>Pitting ankles, sacrum, raised JVP, ascites — lungs may be clear</li>
                <li><strong>Swollen legs alone is not the indication</strong></li>
              </ul>
            </div>
          </div>
        </div>
        <p class="callout" style="margin-top:12px">Known chronic HF: look at the care plan. Extra oral diuretic may be the plan if they are staying at home. If they need active management, do not delay hospital for a community call.</p>`,
      notes: "Open on the two boxes as before — consider 40 mg, not in shock. Space: pulmonary vs peripheral. People give furosemide for ankles; that is the habit. Wet lungs are the indication, not wet legs. Care-plan oral diuretic is for the stable known patient, not the drowning one."
    },
    {
      kicker: "What not to reach for",
      title: "Morphine is not part of the package",
      html: `
        <div class="body two">
          <div class="card myth">
            <h3>Morphine</h3>
            <p>Registries associate opiates in heart failure with higher mortality. JRCALC: <strong>do not use routinely</strong>.</p>
            <p style="margin-top:10px">Consider it if they have <strong>chest pain</strong>, or if a palliative care plan already lists morphine.</p>
          </div>
          <div class="card fact">
            <h3>If you are unsure it is COPD</h3>
            <p>Diagnosis is difficult pre-hospital. Where doubt exists between COPD exacerbation and AHF, <strong>salbutamol may be considered</strong>.</p>
            <p class="small" style="margin-top:10px">That is not a reason to skip sitting them up, a 12-lead, or the HF pathway if the picture is still wet and orthopnoeic.</p>
          </div>
        </div>
        <div class="banner dark build" style="margin-top:12px">The old LVF pack of GTN + furosemide + morphine is not the current guideline</div>`,
      notes: "Kill the morphine-for-oedema habit. Chest pain is the exception. Salbutamol is allowed when you cannot tell — say that out loud so people do not feel trapped."
    },
    {
      kicker: "The rest of the job",
      title: "Care plans, conveyance and handover",
      html: `
        <div class="step-row">
          <section class="job-step">
            <div class="job-num">1</div>
            <h3>Plans and specialist teams</h3>
            <ul>
              <li>Ask about a personal, anticipatory or end-of-life plan, DNACPR / ReSPECT</li>
              <li>Not all chronic HF is palliative — most still go to hospital</li>
              <li>If they are stable and known to the community team, call them if there is time</li>
              <li>Extra oral diuretic may be in the plan if they are staying home</li>
            </ul>
          </section>
          <section class="job-step hand">
            <div class="job-num">2</div>
            <h3>Where to take them</h3>
            <ul>
              <li>TIME-CRITICAL unless a palliative plan says otherwise</li>
              <li>Local pathways — prefer cardiology / CCU / ICU</li>
              <li>There is a ‘time-to-therapy’ idea in AHF: what you do before the door matters</li>
              <li>Watch for an LVAD — different resuscitation rules</li>
            </ul>
          </section>
          <section class="job-step amber">
            <div class="job-num">3</div>
            <h3>Handover language</h3>
            <ul>
              <li>Congestion or shock — say which</li>
              <li>SBP trend, GTN given or withheld and why</li>
              <li>Furosemide 40 mg or not</li>
              <li>12-lead: ACS or not</li>
              <li>Usual care team / DNACPR if known</li>
            </ul>
          </section>
        </div>`,
      notes: "Receiving staff need ‘wet and hypertensive, GTN two sprays, SBP still 150’ or ‘shocked, no nitrates, possible STEMI’. That is better than ‘LVF, treated’."
    },
    {
      type: "poll",
      pollId: "hf-q1",
      kicker: "Check  1 of 5",
      title: "True or false?",
      prompt: "Every acute heart failure patient with a systolic BP over 90 mmHg should get GTN.",
      options: ["True", "False"],
      correct: 1,
      teach: "False. AHF uses <strong>110 mmHg</strong>, not 90. And GTN is considered in AHF with <strong>ischaemia or uncontrolled hypertension</strong> — not every congested chest.",
      notes: "First check that the icebreaker stuck."
    },
    {
      type: "poll",
      pollId: "hf-q2",
      kicker: "Check  2 of 5",
      title: "Fluids",
      prompt: "Known heart failure, collapsed and hypotensive. Your first move with IV fluid?",
      options: [
        "Standard fluid challenge — they are shocked",
        "STOP and THINK — fluids can be harmful in heart failure or valve disease"
      ],
      correct: 1,
      teach: "JRCALC’s own words: if they have heart failure or valve disease, STOP and THINK before IV fluids, especially large or rapid volumes. Cardiogenic shock is not an empty tank. AHF is often misread as sepsis.",
      notes: "Second check. This is the other key-point sentence."
    },
    {
      type: "poll",
      pollId: "hf-q3",
      kicker: "Check  3 of 5",
      title: "Furosemide",
      prompt: "Adult with pulmonary oedema, BP holding, long journey. Furosemide dose?",
      options: [
        "40 milligrams IV slowly over 2 minutes, no repeat",
        "80 milligrams IV, repeat if still wet",
        "Do not give furosemide pre-hospital"
      ],
      correct: 0,
      teach: "<strong>40 mg once</strong>, slowly over 2 minutes. Indication is pulmonary oedema and/or respiratory distress due to AHF. Not in cardiogenic shock. The monograph flags prolonged time to hospital as a reason to consider it — it does not make 80 mg or a second dose legal.",
      notes: "Old practice was 80. Hold 40 and no repeat."
    },
    {
      type: "poll",
      pollId: "hf-q4",
      kicker: "Check  4 of 5",
      title: "Morphine",
      prompt: "Routine morphine for acute pulmonary oedema?",
      options: ["Yes — it eases distress and preload", "No — not routinely"],
      correct: 1,
      teach: "Not routinely. Associated with higher mortality in HF registries. Consider it for <strong>chest pain</strong>, or if a palliative plan already includes morphine.",
      notes: "Short and firm."
    },
    {
      type: "poll",
      pollId: "hf-q5",
      kicker: "Check  5 of 5",
      title: "Positioning",
      prompt: "First physical treatment for the congested, breathless patient?",
      options: [
        "Lie flat for a 12-lead, then sit up",
        "Sit fully upright immediately, and keep repositioning them"
      ],
      correct: 1,
      teach: "Sit fully upright immediately. It lowers left atrial pressure. They will slump — sit them up again. The 12-lead still matters; do not sacrifice the airway and the lungs to get a prettier tracing.",
      notes: "Finish on something they can do on every job."
    },
    {
      kicker: "Take home",
      title: "Five key points to remember",
      html: `
        <div class="body">
          <div class="banner build hold-space">1. Acute heart failure is time-critical unless a palliative plan says otherwise.</div>
          <div class="banner teal build hold-space" style="margin-top:8px">2. Sit them fully upright first. Target 94–98% oxygen. Record a 12-lead.</div>
          <div class="banner green build hold-space" style="margin-top:8px">3. GTN: ischaemia or uncontrolled hypertension, and SBP over 110 — not the ACS 90 mmHg line.</div>
          <div class="banner dark build hold-space" style="margin-top:8px">4. STOP and THINK before IV fluids. No GTN or furosemide in cardiogenic shock.</div>
          <div class="banner red build hold-space" style="margin-top:8px">5. Morphine is not routine — consider it for chest pain, or if a palliative plan already includes it.</div>
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
              <li>JRCALC Plus, Heart Failure (live entry; v4.33 at the time this session was built)</li>
              <li>JRCALC Dyspnoea — differentials for AHF, COPD, asthma, chest infection, PE and ACS</li>
              <li>JRCALC Glyceryl Trinitrate — AHF table, updated 10 December 2025</li>
              <li>JRCALC Furosemide — 40 mg slow IV, adults 18+</li>
              <li>JRCALC Oxygen — target 94–98% in AHF</li>
              <li>Local WMAS notices, PGDs and stock where they apply</li>
            </ul>
          </div>
          <div class="card">
            <h3>Bibliography</h3>
            <ul>
              <li>Mebazaa et al. Eur J Heart Fail 2015 — pre-hospital AHF consensus; vasodilators if SBP ≥110</li>
              <li>NICE CG187 Acute heart failure — hospital nitrates not routine</li>
              <li>Ponikowski et al. ESC heart failure 2016</li>
              <li>Wakai et al. Cochrane 2013 — nitrates in AHF</li>
            </ul>
          </div>
        </div>
        <p class="small" style="margin-top:12px">Teaching summary of JRCALC Plus, not a substitute for the live guideline. Recheck local PGDs and stock before you treat. Original diagrams in this deck are teaching graphics, not official JRCALC artwork. Clinical images from Wikimedia Commons: NHLBI/NIH heart-failure signs (public domain); chest X-ray, Mikael Häggström, MD (CC0); JVP and pitting oedema, James Heilman, MD (CC BY-SA 3.0).</p>`,
      notes: "Ask staff to open Heart Failure in JRCALC Plus after the session. The GTN monograph is the one they will argue about — send them there."
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
      notes: "Leave this up. Offer to stay for questions. The next slide collects feedback and topic ideas. Then the CPD certificate QR — only in a hosted session. Leave that one up for the room to scan."
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
            <img src="hf/assets/hf-certificate-qr.png" alt="CPD certificate QR code" onerror="var p=this.parentElement;this.remove();var m=p&&p.querySelector('.trust-qr-missing');if(m)m.hidden=false" />
            <p class="trust-qr-missing" hidden>Save the QR image as hf/assets/hf-certificate-qr.png, then refresh.</p>
          </div>
        </div>`,
      notes: "This slide is only in a hosted session, after a Hub PIN. It is not in the self-guided deck. Leave it up so the room can scan. Save the Trust QR as hf/assets/hf-certificate-qr.png and hard-refresh."
    }
  ];
}
