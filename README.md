# EcoWaste - E-Waste Recycling Portal

A simple web-based portal for collecting e-waste pickup requests from users and managing those requests from a recycler dashboard.

## Features

- User form to submit e-waste pickup requests
- Recycler dashboard to view and update request status
- Firebase Realtime Database integration
- Local storage fallback for offline/demo use
- Mobile-friendly responsive UI
- Green/eco-friendly project presentation suitable for school or college competitions

## Tech Stack

- HTML
- CSS
- JavaScript
- Firebase Realtime Database

## Project Structure

- `index.html` — user-facing pickup request page
- `recycler.html` — recycler dashboard
- `index.css` — styling for the user page
- `recycler.css` — styling for the recycler dashboard
- `firebase-config.js` — Firebase configuration and database helper logic
- `database.rules.json` — Firebase Realtime Database rules
- `firebase.json` — Firebase project configuration

## Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com/
2. Add a Web App in your Firebase project.
3. Copy your Firebase config values.
4. Open `firebase-config.js` and replace the empty values in `window.ECOWASTE_FIREBASE_CONFIG`.
5. Enable Realtime Database.
6. Deploy the database rules:

```bash
firebase login
firebase init database
firebase deploy
