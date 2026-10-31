# COPD, Type 2 Respiratory Failure and NEWS2

Before the first live session:

- [x] In OneDrive, create a share link for the dev feedback workbook
- [x] In OneDrive, create a share link for the live feedback workbook
- [x] Paste the dev share link into `FEEDBACK_SHARE_COPD_DEV` in this laptop's `.env`
- [ ] Paste the live share link into `FEEDBACK_SHARE_COPD_LIVE` in this laptop's `.env` and on the live Render service (hub-cpd)
- [x] Get QA CPD sign-off
- [x] Replace the holding certificate QR with the Trust QR from that sign-off. Save it as `copd/assets/copd-certificate-qr.png`. On the form, the tutor is QA CPD and the training location is Other.

The live site does not read this laptop's `.env`. The share links are the only way it can open the workbooks. Blank `feedback/dev.xlsx` and `feedback/live.xlsx` files are templates only, and the live site does not write into them.
