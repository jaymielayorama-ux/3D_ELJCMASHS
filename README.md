# ELJCMASHS Official Website

A modern school website for ELJCMASHS with:
- interactive 3D campus exploration
- admissions, about, and contact pages
- student works gallery
- student submission + admin approval workflow
- email notifications through Resend

## Project structure

```text
3D_ELJCMASHS/
├── index.html
├── about.html
├── admissions.html
├── contact.html
├── explore.html
├── student-works.html
├── upload-work.html
├── admin.html
├── style.css
├── script.js
├── server.js
├── package.json
├── .gitignore
├── images/
├── model/
├── uploads/   (generated locally)
├── data.json  (generated locally)
└── .env       (local only; do not commit)
```

## Local development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file in the project root with:
   ```env
   ADMIN_EMAIL=your_admin_email@example.com
   RESEND_API_KEY=your_resend_key
   RESEND_FROM_EMAIL=onboarding@resend.dev
   PUBLIC_BASE_URL=http://localhost:3000
   ```
3. Start the app:
   ```bash
   node server.js
   ```
4. Open the site in your browser at:
   ```text
   http://localhost:3000
   ```

## Features

### Static website pages
- Home
- Explore
- About
- Admissions
- Contact
- Student Works

### Student Works workflow
- Students can submit a work through the upload form
- Admin can review pending submissions
- Approved works appear in the public gallery
- Rejected works are not published
- Each approved work supports a like button

### Email approval flow
- A new submission sends an email to the admin
- The email includes approve/reject actions
- The public base URL is configured through `PUBLIC_BASE_URL`

## Deployment to Render

1. Push the repository to GitHub.
2. In Render, create a new Web Service.
3. Connect the GitHub repo.
4. Use these settings:
   - Build Command: `npm install`
   - Start Command: `node server.js`
5. Add environment variables:
   - `ADMIN_EMAIL`
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`
   - `PUBLIC_BASE_URL=https://your-render-app-name.onrender.com`
6. Deploy the service.

## Production note

This app currently stores uploaded files locally in the `uploads/` directory. For a production deployment, it is better to move uploaded files to a hosted storage solution such as Cloudinary or Supabase Storage to avoid file loss on restarts.

## Notes

- The 3D model should live in `model/ELJ-MODEL.glb` if you want the campus viewer to work.
- The app expects a local server or deployed Node server; opening HTML pages directly with `file://` is not supported for uploads.
- `data.json` is generated automatically on first run and should be ignored in Git.
