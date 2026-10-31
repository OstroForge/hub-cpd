function strokeSlides() {
  return [
    {
      type: "title",
      kicker: "Ambulance Clinical Refreshers",
      title: "Stroke / TIA",
      subtitle: "Time-critical features, mimics, and who is conveyed as an emergency.",
      meta: "Always follow the live JRCALC entry and local Trust policy.",
      notes: "Title only for now. The teaching slides come next."
    },
    {
      kicker: "Core messages",
      title: "Learning objectives",
      html: `
        <div class="card"><h3>By the end you will have refreshed how to:</h3><ul></ul></div>
        <div class="body two">
          <div class="card"><h3></h3><p></p></div>
          <div class="card"><h3></h3><p></p></div>
        </div>`,
      notes: "Leave this blank until the objectives are agreed."
    },
    {
      kicker: "Take home",
      title: "Take home points",
      html: `
        <div class="body">
          <div class="banner build hold-space">Time-critical features</div>
          <div class="banner teal build hold-space" style="margin-top:8px">Mimics</div>
          <div class="banner green build hold-space" style="margin-top:8px">Who is conveyed as an emergency</div>
        </div>`,
      notes: "Replace these three lines with the points the room should leave with."
    },
    {
      kicker: "Sources",
      title: "References",
      html: `
        <div class="body two">
          <div class="card">
            <h3>Clinical guidance</h3>
            <ul><li>JRCALC Stroke and TIA — add the live entry</li></ul>
          </div>
          <div class="card">
            <h3>Local guidance</h3>
            <ul><li>Add Trust notices</li></ul>
          </div>
        </div>`,
      notes: "Add the guideline links before this session is used."
    },
    {
      questions: true,
      self: false,
      kicker: "Close",
      title: "Any questions?",
      html: `
        <div class="body">
          <div class="banner dark">Thank you for attending</div>
          <div class="banner teal" style="margin-top:12px">We hope it has been useful</div>
          <div class="banner" style="margin-top:12px">Ask now, or email: <a href="mailto:info@hub-cpd.co.uk" style="color:inherit;text-decoration:underline">info@hub-cpd.co.uk</a></div>
          <div class="banner green" style="margin-top:12px">The next slide is for feedback, and ideas for another 30-minute CPD.</div>
        </div>`,
      notes: "Live room only. Leave this up for questions."
    },
    {
      feedback: true,
      kicker: "Feedback",
      title: "Help shape the next session",
      html: `
        <div class="body two feedback-layout">
          <div>
            <div class="banner teal">Please provide feedback on this session</div>
            <div class="banner" style="margin-top:12px">Any suggestions for a future session?</div>
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
      notes: "The feedback QR is filled in a live room."
    },
    {
      hostedOnly: true,
      self: false,
      kicker: "",
      title: "Record attendance for a CPD certificate",
      html: `
        <div class="body trust-attend has-guide">
          <div class="trust-qr">
            <img src="stroke/assets/stroke-certificate-qr.svg" alt="Placeholder CPD certificate QR code" />
          </div>
        </div>`,
      notes: "Live room only. This QR is a placeholder. Replace it before the session is used."
    }
  ];
}
