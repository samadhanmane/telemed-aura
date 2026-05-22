# Architecture

```
telemed-aura/
├── frontend/          # React dashboards + WebRTC client (mirror, adaptive media)
└── backend/
    ├── src/           # Main REST API
    └── services/
        ├── email/     # Nodemailer → patient & doctor inboxes
        ├── ai/        # Symptom scan → severity → booking priority
        └── video/     # Signaling + rooms + low-bandwidth config
```

## Flow: Book → Notify → Consult

1. Patient runs **AI scanner** (`services/ai`)
2. **Triage severity** feeds `src/modules/appointments/booking/priority-queue.ts`
3. Slot booked → **in-app notification** + **email** (`services/email`) to patient & doctor
4. On confirm → **video room** created (`services/video`) + **video invite email**
5. Join via WebRTC signaling; media constraints tuned for village bandwidth
