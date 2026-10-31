# Acute Asthma

Before the first live session:

- [ ] In OneDrive, create a share link for the dev feedback workbook
- [ ] In OneDrive, create a share link for the live feedback workbook
- [ ] Paste the dev share link into `FEEDBACK_SHARE_ASTHMA_DEV` in this laptop's `.env`
- [ ] Paste the live share link into `FEEDBACK_SHARE_ASTHMA_LIVE` in this laptop's `.env` and on the live Render service (hub-cpd)
- [ ] Get QA CPD sign-off
- [ ] Replace the holding certificate QR with the Trust QR from that sign-off. Save it as `asthma/assets/asthma-certificate-qr.png`. On the form, the tutor is QA CPD and the training location is Other.

The live site does not read this laptop's `.env`. The share links are the only way it can open the workbooks. Blank `feedback/dev.xlsx` and `feedback/live.xlsx` files are templates only, and the live site does not write into them.
