# Email Service (Nodemailer)

Sends transactional email to **patients** and **doctors**:

- Appointment booked / confirmed / cancelled / reminder
- Prescription issued
- Doctor message
- AI triage alert (high severity)
- Video consult link & join reminder
- System notifications

## Layout

- `config/` — SMTP / transport from env
- `templates/` — HTML + text per event
- `senders/` — patient vs doctor routing
- `queues/` — async retry for village connectivity
- `routes/` — HTTP API for other services to trigger sends

## Environment

Uses `backend/.env` (SMTP_* variables).

## Run

`npm run email:dev` — default port **4001**
