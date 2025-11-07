# AgamiOps: Marking the future

AgamiOps is an AI-assisted business planning platform that helps founders turn ideas into investor-ready plans. The project combines a Node.js/Express backend with a modern React frontend to deliver guided business model generation, forecasting, and collaborative tooling.

---

## Project Structure

- `backend/` – Express server (authentication, persistence, email verification, AI endpoints).
- `frontend/` – React single-page application (UI, charts, chatbot assistant).

---

## Key Features

- AI-generated business models with financial projections.
- Investor-ready charts, exports, and scenario planning.
- Execution checklists and collaboration tools.
- Voice-enabled chatbot branded as the AgamiOps AI assistant.

---

## Prerequisites

- Node.js 18 or newer
- npm, pnpm, or yarn (examples below use `npm`)
- PostgreSQL database
- Google/Gemini API key (for AI routes, optional but recommended)

---

## Environment Variables

Create a `.env` file in `backend/` with the following keys:

```
DATABASE_URL=postgres://user:password@host:port/db
SESSION_SECRET=super_secret_key
EMAIL_USER=you@example.com
EMAIL_PASS=email_app_password
FRONTEND_ORIGIN=http://localhost:5173

# Optional integrations
GEMINI_API_KEY=your_google_generative_ai_key
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://localhost:5050/auth/google/callback
```

Update `FRONTEND_ORIGIN` if you host the UI elsewhere or need to whitelist multiple origins (comma-separated).

---

## Installation

Install backend and frontend dependencies:

```bash
npm install --prefix backend
npm install --prefix frontend
```

---

## Development

Start the backend API (defaults to port `5050`):

```bash
npm run dev --prefix backend
```

Start the frontend dev server (defaults to port `5173`):

```bash
npm run dev --prefix frontend
```

The frontend expects the backend at `http://localhost:5050` during development.

---

## Building for Production

Build the React app:

```bash
npm run build --prefix frontend
```

The compiled assets are produced in `frontend/dist/`. Serve them behind your preferred static host or integrate them with the backend.

---

## Testing & Linting

Each workspace manages its lint/test scripts. Run them with:

```bash
npm test --prefix backend
npm run lint --prefix frontend
```

Add/adjust scripts in each `package.json` as your testing strategy evolves.

---

## Deployment Notes

- Ensure production databases and API credentials are provisioned.
- Configure HTTPS and CORS appropriately for the deployed domains.
- Set up email delivery (Gmail, SMTP, or another provider) to support verification messages.
- For AI features, supply a valid Google Generative AI/Gemini key and model name.

---

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/my-update`.
3. Commit your changes with clear messages.
4. Open a pull request describing the change and testing performed.

---

## License

This project is proprietary to the AgamiOps team. Contact the maintainers for licensing inquiries or partnership opportunities.


