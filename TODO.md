# Tomorrow

## 1. One local env file for secrets

Put every secret in a gitignored `.env` in this folder, and make `serve.py` read that file. New topics should only need a new line, not a new text file.

Move these in:

- Presenter PINs (`presenters.txt`, `presenter-pin.txt`, and `PRESENTERS` / `PRESENTER_PIN`)
- Feedback workbook link (`feedback-share.txt`, `FEEDBACK_SHARE_URL`)
- OneDrive attendance folder (`attend-folder.txt`, `ATTEND_SHARE_URL`, `ATTEND_FOLDER`)
- `HOST_TOKEN` and `CERT_WEBHOOK`

Leave the values out of git, `INSTRUCTIONS.md`, and `render.yaml`. On Render, the same names stay as environment variables in the dashboard.

## 2. Create a logo

There is no logo in the project yet. Make a Hub CPD mark and use it on the home page, the slide footer, and the handout.

## 3. Prepare to merge the branches

`heart-failure-cpd` has 7 commits that are not on `main` (Heart Failure as a second session, Render test site, OneDrive course folders). `main` has the presenter PIN fix, plus the COPD work that is still uncommitted: Trust certificate QR, feedback, email check, and the workbook link.

Before merging:

- Commit the COPD work on `main` first, so it is not lost in the merge.
- Merge `heart-failure-cpd` into `main`. Both sides change `index.html`, `serve.py`, and `INSTRUCTIONS.md`, so expect conflicts there.
- Do the env file first, so COPD and Heart Failure read the same secrets.
