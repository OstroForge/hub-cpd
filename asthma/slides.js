function asthmaSlides() {
  return [
    {
      type: "title",
      kicker: "Ambulance Clinical Refreshers",
      title: "Acute Asthma",
      subtitle: "Mild, Moderate, Acute Severe or Life Threatening?<br>Recognise the differences and treat the right condition.",
      meta: "JRCALC Asthma. Always follow the live JRCALC entry and local Trust policy.",
      notes: "Open on the title. Next is the icebreaker — leave it up while phones scan the QR. The vehicle photo is the ambulance in the garage."
    },
    {
      type: "poll",
      pollId: "asthma-hands",
      resultsTitle: "Oxygen target — how the room voted",
      kicker: "Hands up  ·  live vote",
      title: "Before we start — phones out",
      prompt: "Acute asthma, with no COPD. What oxygen saturation are you aiming for?",
      votePrompt: "Acute asthma, with no COPD. What oxygen saturation are you aiming for?",
      options: [
        "88–92%",
        "94–98%",
        "As close to 100% as you can get"
      ],
      correct: 1,
      teach: "<strong>94–98%.</strong> That is the acute-asthma target. <strong>88–92%</strong> is the controlled-oxygen target for COPD when they are not critically ill. Chasing 100% is not the aim either.",
      notes: "Leave this up while people scan. The wrong answer you want is 88–92%, carried over from the COPD session. Space to results, then Space again for the teaching point."
    },
    {
      kicker: "Core messages",
      title: "Learning objectives",
      html: `
        <div class="card" style="margin-bottom:12px">
          <h3>By the end you will have refreshed how to:</h3>
          <ul style="columns:2;column-gap:28px">
            <li>Grade the attack: moderate, acute severe, or life-threatening</li>
            <li>Treat a quiet chest as a warning, not a success</li>
            <li>Give oxygen to 94–98% and drive the nebuliser with oxygen</li>
            <li>Know when intramuscular adrenaline is the next step</li>
          </ul>
        </div>
        <div class="body two">
          <div class="card">
            <h3>Severity is often missed</h3>
            <p>JRCALC key points: asthma is a common life-threatening condition, and its severity is often not recognised. A patient who is too tired to wheeze can look deceptively calm.</p>
          </div>
          <div class="card">
            <h3>This is not the COPD session</h3>
            <p>The 6-minute oxygen-driven neb, and the 88–92% target, belong to COPD. Acute asthma uses 94–98%, and a life-threatening attack is not limited to a 6-minute neb.</p>
          </div>
        </div>
        <div class="banner build" style="margin-top:12px">A silent chest is a pre-terminal sign</div>`,
      notes: "Outcomes in 30 seconds. The banner is the line from the JRCALC key points, quoted in the Association of Ambulance Chief Executives response to a preventing-future-deaths report. Do not soften it."
    },
    {
      kicker: "JRCALC Asthma — the key points",
      title: "What the guideline is trying to stop",
      html: `
        <div class="banner dark">Severity is often not recognised. A silent chest is a pre-terminal sign.</div>
        <div class="body two" style="margin-top:16px">
          <div class="card fact">
            <h3>The treatment spine</h3>
            <ul>
              <li>Bronchodilators are the mainstay</li>
              <li>Oxygen to <strong>94–98%</strong></li>
              <li>Salbutamol <strong>5 mg</strong> by oxygen-driven nebuliser</li>
              <li>Ipratropium in severe and life-threatening attacks</li>
              <li>A steroid early — do not leave the first dose for hospital</li>
            </ul>
          </div>
          <div class="card warn">
            <h3>The step people delay</h3>
            <ul>
              <li>Life-threatening asthma that is <strong>still deteriorating</strong> on continuous nebulised salbutamol: consider intramuscular adrenaline</li>
              <li>Life-threatening asthma <strong>not improving</strong> on continuous nebulised salbutamol: consider magnesium, at the live-monograph dose</li>
              <li>Neither drug is the opening move for moderate asthma</li>
            </ul>
          </div>
        </div>`,
      notes: "Read the banner, then the two cards. Adrenaline and magnesium are consider-steps for life-threatening asthma on continuous salbutamol, not a routine package. The March 2024 JRCALC update revised asthma in adults and children — open the live page before you teach a milligram that has moved."
    },
    {
      kicker: "The illness",
      title: "Asthma in one minute",
      html: `
        <div class="body two">
          <div class="card">
            <h3>What is narrowing</h3>
            <p>Acute asthma is bronchospasm, swollen mucosa and mucus. Air can sometimes get in more easily than it can get out, so the chest becomes tight and the expiratory wheeze is the noise you hear.</p>
            <p style="margin-top:8px">If they are too tired to move air, the wheeze stops. That is not recovery.</p>
          </div>
          <div class="card fact">
            <h3>What you are reversing</h3>
            <ul>
              <li>Salbutamol opens the airway</li>
              <li>Ipratropium adds to that in a severe attack</li>
              <li>Oxygen corrects hypoxia. The target is 94–98%, not the COPD band</li>
              <li>A steroid starts to settle the inflammation. It is slow, so give it early</li>
            </ul>
          </div>
        </div>`,
      notes: "Keep this short. The point of the slide is the last sentence on the left: no wheeze can mean no air."
    },
    {
      kicker: "Do not assume",
      title: "Is this asthma — or something else?",
      html: `
        <div class="body two">
          <div class="card">
            <h3>Fits asthma</h3>
            <ul>
              <li>Known asthma, or a story of sudden tight chest and wheeze</li>
              <li>Triggers: virus, allergen, smoke, exercise, a missed inhaler</li>
              <li>Widespread wheeze, and they are working to breathe</li>
            </ul>
          </div>
          <div class="card warn">
            <h3>Stop and reconsider</h3>
            <ul>
              <li><strong>Anaphylaxis</strong> — rash, swelling, shock. Adrenaline comes first, not after a neb</li>
              <li><strong>Heart failure</strong> — wet lungs, sit them up, no routine salbutamol package</li>
              <li><strong>Inhaled foreign body, PE, pneumothorax</strong> — one-sided or sudden, and a neb will not fix it</li>
              <li><strong>COPD</strong> — may be both. Grade the attack in front of you</li>
            </ul>
          </div>
        </div>
        <div class="banner build" style="margin-top:12px">If this is anaphylaxis, intramuscular adrenaline is the first drug</div>`,
      notes: "Ask for one differential the room has nebbed that was not asthma. Anaphylaxis is the one that changes the first drug. Heart failure was the last session — do not put a pulmonary-oedema patient on a salbutamol pathway."
    },
    {
      kicker: "Grade the attack",
      title: "Moderate, severe, life-threatening",
      html: `
        <div class="body" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
          <div class="card">
            <h3>Moderate</h3>
            <ul>
              <li>Talks in sentences</li>
              <li>No severe feature</li>
              <li>Peak flow above 50% of best, if you can measure it</li>
            </ul>
            <p class="small" style="margin-top:8px">Still treat. A lower threshold to convey if it is evening, they have had a near-fatal attack, or they cannot look after themselves.</p>
          </div>
          <div class="card warn">
            <h3>Acute severe — any one</h3>
            <ul>
              <li>Cannot finish a sentence in one breath</li>
              <li>Respiratory rate 25 or more</li>
              <li>Heart rate 110 or more</li>
              <li>Peak flow 33–50% of best</li>
            </ul>
          </div>
          <div class="card" style="border-color:var(--red)">
            <h3>Life-threatening — any one</h3>
            <ul>
              <li>Sats under 92%</li>
              <li>Silent chest, cyanosis, or feeble effort</li>
              <li>Exhaustion or altered consciousness</li>
              <li>Hypotension or arrhythmia</li>
              <li>Peak flow under 33% of best</li>
            </ul>
          </div>
        </div>
        <div class="banner red build" style="margin-top:12px">You do not need every feature. One life-threatening feature is enough.</div>`,
      notes: "Walk the three columns. Peak flow is useful and often not done — do not let a missing peak flow delay oxygen and a neb. Sats under 92%, a quiet chest, or exhaustion each stand alone. The next slide is a monitor close-up with readable numbers."
    },
    {
      kicker: "The monitor",
      title: "Read the numbers, then grade the attack",
      html: `
        <div class="body two">
          <img class="monitor-photo" src="asthma/assets/asthma-monitor.jpg?v=2" alt="Monitor close-up. Heart rate 130 in green, blood pressure 167 over 68 in blue, oxygen saturation 94 percent in yellow.">
          <div>
            <div class="card fact">
              <h3>What this screen is saying</h3>
              <ul>
                <li><strong style="color:#1f8a32">130</strong> heart rate. That alone is acute severe.</li>
                <li><strong style="color:#a67c00">94%</strong> saturations. Inside the 94–98% target, not the under-92% life-threatening line.</li>
                <li><strong style="color:#1a7f86">167/68</strong>. This is not hypotension, and it is not a reason for adrenaline.</li>
              </ul>
            </div>
            <div class="banner build" style="margin-top:12px">One severe feature is enough to treat it as severe</div>
          </div>
        </div>`,
      notes: "This is a close-up, not the monitor in the ambulance photograph. Heart rate 130 is the acute-severe feature. Saturations of 94% are in target. Blood pressure 167/68 is not shock. The respiratory rate on this screen is still 24, just under the severe line of 25."
    },
    {
      type: "poll",
      pollId: "asthma-silent",
      resultsTitle: "Quiet chest — how the room voted",
      kicker: "Live vote",
      title: "The wheeze has stopped",
      prompt: "After a nebuliser the wheeze has gone and the chest is quiet. The patient looks less distressed. What do you make of that?",
      votePrompt: "The wheeze has gone and the chest is quiet. What do you make of that?",
      options: [
        "The bronchodilator has worked",
        "They may be too tired to wheeze — this can be pre-terminal",
        "It was only moderate asthma"
      ],
      correct: 1,
      teach: "A <strong>silent chest</strong> is a pre-terminal sign in the JRCALC key points. Recovery is a patient who is speaking more easily, with saturations heading for 94–98%, not a patient who has gone quiet.",
      notes: "People will vote for ‘the neb worked’ if the patient looks calmer. Calm plus a quiet chest plus falling sats or exhaustion is the opposite. Ask: can they speak a sentence, and what is the saturation?"
    },
    {
      kicker: "Oxygen",
      title: "94–98%, including when they also have COPD",
      html: `
        <div class="body two">
          <div class="card fact">
            <h3>Acute asthma</h3>
            <ul>
              <li>Target <strong>94–98%</strong></li>
              <li>Do not delay oxygen for a debate about their usual readings</li>
              <li>High concentration if they are hypoxic or life-threatening, then titrate back to the target</li>
            </ul>
          </div>
          <div class="card warn">
            <h3>They also have COPD</h3>
            <ul>
              <li>A usual COPD target of 88–92% is for the patient who is <strong>not</strong> critically ill</li>
              <li>Life-threatening asthma, exhaustion, or a silent chest: treat the attack in front of you and aim <strong>94–98%</strong></li>
              <li>The COPD 6-minute neb limit is not the plan for this attack</li>
            </ul>
          </div>
        </div>
        <div class="banner build" style="margin-top:12px">Hypoxia kills faster than a transient high saturation</div>`,
      notes: "This is the slide that joins the two sessions. Agree that a stable COPD patient at home uses 88–92%. Then hold the line: an exhausted, hypoxic, quiet-chested patient is the critically ill exception already taught in the COPD deck. Do not apply Scale 2 thinking here."
    },
    {
      kicker: "Nebuliser",
      title: "Oxygen drives the salbutamol",
      html: `
        <div class="body two neb-hero">
          <img class="treat-photo" src="asthma/assets/asthma-patient-treated.jpg?v=3" alt="Older woman in ordinary clothes, sitting up on the ambulance stretcher, working to breathe through an oxygen mask while a clinician checks her.">
          <div class="card fact">
            <h3>Salbutamol 5 mg</h3>
            <ul>
              <li>Oxygen-driven nebuliser for acute severe and life-threatening asthma</li>
              <li>Repeat it. Continuous nebulised salbutamol is the step before adrenaline or magnesium</li>
              <li>The COPD rule — 6 minutes of oxygen drive, then 88–92% — is <strong>not</strong> this guideline</li>
            </ul>
            <p class="small" style="margin-top:8px">Keep the saturation in the 94–98% band while the neb runs.</p>
          </div>
        </div>`,
      notes: "The photograph is the ambulance treatment picture: an older patient in ordinary clothes, on oxygen. If someone says ‘we were taught 6 minutes’, agree that is the COPD monograph. Open Asthma if you need to show them it is a different page."
    },
    {
      kicker: "Second bronchodilator",
      title: "Ipratropium for the severe attack",
      html: `
        <div class="body two">
          <div class="card fact">
            <h3>When to add it</h3>
            <ul>
              <li>Acute severe or life-threatening asthma</li>
              <li>Or a poor response to the first salbutamol</li>
              <li><strong>500 micrograms</strong> nebulised, with the salbutamol</li>
            </ul>
          </div>
          <div class="card">
            <h3>When not to keep repeating it</h3>
            <ul>
              <li>Not needed for a mild attack that has settled</li>
              <li>Salbutamol is the drug you repeat</li>
              <li>Ipratropium is the add-on, not a second endless neb</li>
            </ul>
          </div>
        </div>
        <div class="banner build" style="margin-top:12px">Severe attack: salbutamol and ipratropium, oxygen-driven, target 94–98%</div>`,
      notes: "500 micrograms once in the severe attack is the same ipratropium dose as the COPD session. The difference is the oxygen target and how long oxygen may drive the neb. Confirm the live ipratropium line if someone asks about a second dose."
    },
    {
      kicker: "Steroid",
      title: "Give the steroid now",
      html: `
        <div class="banner dark">The steroid is slow. That is why the first dose is a pre-hospital drug.</div>
        <div class="body two" style="margin-top:16px">
          <div class="card">
            <h3>Who gets it</h3>
            <p>Acute asthma that you are treating with a nebuliser. Do not save the steroid for the hospital receptionist.</p>
          </div>
          <div class="card fact">
            <h3>How</h3>
            <ul>
              <li>Prednisolone by mouth if they can swallow</li>
              <li>Hydrocortisone if they cannot</li>
              <li>Use the dose on the live JRCALC asthma page</li>
            </ul>
          </div>
        </div>`,
      notes: "Do not invent a milligram if the live page is in your hand — read it. Adult acute-asthma practice is often prednisolone 40–50 mg or hydrocortisone 100 mg. Quote the live monograph, not this note, if they differ."
    },
    {
      kicker: "Life-threatening and still falling",
      title: "Adrenaline is the step after continuous salbutamol",
      html: `
        <div class="banner red">Consider intramuscular adrenaline when life-threatening asthma continues to deteriorate despite continuous nebulised salbutamol.</div>
        <div class="body two" style="margin-top:16px">
          <div class="card warn">
            <h3>Before the injection</h3>
            <ul>
              <li>This is already a life-threatening attack</li>
              <li>Salbutamol is running continuously, not a single 6-minute neb</li>
              <li>They are worse, not better: quieter, tireder, or more hypoxic</li>
            </ul>
          </div>
          <div class="card fact">
            <h3>Then</h3>
            <ul>
              <li>Intramuscular adrenaline, as in the live adrenaline monograph</li>
              <li>The usual adult figure to confirm there is <strong>500 micrograms</strong> (0.5 mL of 1 mg/mL)</li>
              <li>Magnesium is the other consider-drug if they are not improving on that continuous neb — use the live dose</li>
            </ul>
          </div>
        </div>`,
      notes: "JRCALC’s own key points, as set out by the Association of Ambulance Chief Executives: consider adrenaline for life-threatening asthma continuing to deteriorate with continuous nebulised salbutamol, and consider magnesium if life-threatening asthma is not improving on continuous nebulised salbutamol. The 2024 review was asked to make the adrenaline step clearer. Read that box on the day. Do not give adrenaline as the first drug for moderate wheeze."
    },
    {
      type: "poll",
      pollId: "asthma-copd",
      resultsTitle: "COPD as well — how the room voted",
      kicker: "Live vote",
      title: "Known COPD and asthma",
      prompt: "70 years old. COPD and asthma. Exhausted, saturation 90% on air, quiet breath sounds. What is the oxygen target now?",
      votePrompt: "Known COPD and asthma. Exhausted, saturation 90% on air, quiet breath sounds. What oxygen target now?",
      options: [
        "88–92%, because of the COPD",
        "94–98%, and treat this as life-threatening asthma",
        "No oxygen until a peak flow is done"
      ],
      correct: 1,
      teach: "One life-threatening feature is enough, and this patient has several. Aim <strong>94–98%</strong>, oxygen-driven salbutamol, add ipratropium, and be ready for intramuscular adrenaline if they keep deteriorating. The COPD 88–92% target is for when they are not this sick.",
      notes: "This is the case the two sessions meet on. If the room says 88–92%, go back to the COPD deck’s own line: do not withhold oxygen from the critically ill. Peak flow must not delay the neb."
    },
    {
      kicker: "Leave scene",
      title: "Who you pre-alert",
      html: `
        <div class="body two">
          <div class="card" style="border-color:var(--red)">
            <h3>Pre-alert</h3>
            <ul>
              <li>Any life-threatening feature</li>
              <li>Still severe after treatment</li>
              <li>Previous near-fatal asthma or intensive care</li>
              <li>You are giving adrenaline, or you are about to</li>
            </ul>
          </div>
          <div class="card">
            <h3>On the way</h3>
            <ul>
              <li>Sit them up</li>
              <li>Keep the neb oxygen-driven if they still need it</li>
              <li>Re-check speech, effort, saturation and pulse</li>
              <li>Hand over the grade, the drugs, and whether the chest is silent</li>
            </ul>
          </div>
        </div>
        <div class="banner build" style="margin-top:12px">A life-threatening attack is a hospital job, even if the wheeze eases on the first neb</div>`,
      notes: "Do not leave a life-threatening attack at home because the first neb sounded better. A moderate attack that fully settles can be a different conversation, with safety-netting. When in doubt, convey."
    },
    {
      type: "poll",
      pollId: "asthma-neb",
      resultsTitle: "Nebuliser drive — how the room voted",
      kicker: "Live vote",
      title: "How long does oxygen drive the neb?",
      prompt: "Acute asthma, no COPD. Oxygen-driven salbutamol. Which rule are you following?",
      votePrompt: "Acute asthma, no COPD. Which nebuliser rule are you following?",
      options: [
        "6 minutes, then aim for 88–92%",
        "Oxygen-driven, and keep the saturation at 94–98%",
        "Air-driven only — never use oxygen"
      ],
      correct: 1,
      teach: "The <strong>6-minute</strong> limit is written in the COPD guidance, for oxygen as the driving gas, with a target of 88–92% afterwards. Acute asthma is a different page: oxygen-driven nebuliser, saturation <strong>94–98%</strong>.",
      notes: "Last check that the COPD session has not overwritten this one. Praise anyone who can say where the 6-minute sentence actually lives."
    },
    {
      kicker: "Remember",
      title: "Five key points to remember",
      html: `
        <div class="banner">1. Grade the attack. One life-threatening feature is enough.</div>
        <div class="banner red" style="margin-top:8px">2. A silent chest is pre-terminal, not a successful neb.</div>
        <div class="banner teal" style="margin-top:8px">3. Oxygen target 94–98%. The COPD 6-minute, 88–92% rule is a different guideline.</div>
        <div class="banner" style="margin-top:8px">4. Salbutamol 5 mg, oxygen-driven. Add ipratropium 500 micrograms when the attack is severe.</div>
        <div class="banner green" style="margin-top:8px">5. Still deteriorating on continuous salbutamol: consider intramuscular adrenaline.</div>`,
      notes: "Read them in order. Ask which one they will do differently on the next asthma job."
    },
    {
      kicker: "Sources",
      title: "References",
      html: `
        <div class="body two">
          <div class="card">
            <h3>Use on the day</h3>
            <ul>
              <li>JRCALC Plus, Asthma (live entry; the March 2024 update revised asthma in adults and children)</li>
              <li>JRCALC Oxygen — 94–98% in acute asthma</li>
              <li>JRCALC Salbutamol, Ipratropium, Adrenaline and the steroid monograph — live doses</li>
              <li>JRCALC COPD — the 6-minute oxygen-driven neb and 88–92% target, so you can show it is a different page</li>
              <li>Local WMAS notices, PGDs and stock</li>
            </ul>
          </div>
          <div class="card">
            <h3>Why the adrenaline line is worded this way</h3>
            <ul>
              <li>Association of Ambulance Chief Executives, response of 1 December 2023 to a preventing-future-deaths report: JRCALC key points include a silent chest as pre-terminal, ipratropium in severe cases, magnesium if life-threatening asthma is not improving on continuous nebulised salbutamol, and adrenaline if it continues to deteriorate on continuous nebulised salbutamol</li>
              <li>BTS/SIGN asthma guideline — oxygen 94–98%, oxygen-driven salbutamol 5 mg, ipratropium 500 micrograms for severe or life-threatening asthma</li>
            </ul>
          </div>
        </div>
        <p class="small" style="margin-top:12px">Teaching summary, not a substitute for the live guideline. Recheck doses and local PGDs before you treat. The treatment photograph is a teaching edit of a posed ambulance picture: the person on the stretcher is shown older and in civilian clothes.</p>`,
      notes: "If anyone disputes the adrenaline timing, the AACE letter is the public statement of what the JRCALC key points said. Then open the live app — the 2024 review may have redrawn the algorithm."
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
      notes: "Leave this up. Offer to stay for questions. The next slide collects feedback. Then the certificate QR — only in a hosted session."
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
      notes: "Leave this up. Phones already on the vote page get the form by themselves. Anyone else can scan the QR. Download feedback from the presenter sidebar. Asthma needs its own workbook links before this stores anywhere but a local file."
    },
    {
      hostedOnly: true,
      kicker: "",
      title: "Record Attendance for CPD Certificate",
      html: `
        <div class="body trust-attend">
          <div class="trust-qr">
            <img src="asthma/assets/asthma-certificate-qr.png" alt="CPD certificate QR code" onerror="var p=this.parentElement;this.remove();var m=p&&p.querySelector('.trust-qr-missing');if(m)m.hidden=false" />
            <p class="trust-qr-missing" hidden>Save the QR image as asthma/assets/asthma-certificate-qr.png, then refresh.</p>
          </div>
        </div>`,
      notes: "Hosted session only. Not in the self-guided deck. Leave it up so the room can scan. Save the Trust QR as asthma/assets/asthma-certificate-qr.png."
    }
  ];
}
