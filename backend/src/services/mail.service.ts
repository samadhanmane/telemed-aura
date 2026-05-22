import nodemailer from "nodemailer";

function stripQuotes(v: string) {
  const s = v.trim();
  if ((s.startsWith("'") && s.endsWith("'")) || (s.startsWith('"') && s.endsWith('"')))
    return s.slice(1, -1);
  return s;
}

function getTransport() {
  const user = stripQuotes(process.env.EMAIL ?? process.env.SMTP_USER ?? "");
  const pass = stripQuotes(process.env.EMAIL_PASSWORD ?? process.env.SMTP_PASS ?? "");
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: { user, pass },
  });
}

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const from = stripQuotes(process.env.EMAIL ?? process.env.MAIL_FROM ?? "");
  const transport = getTransport();
  await transport.sendMail({
    from: `"Telemed Aura" <${from}>`,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text ?? opts.html.replace(/<[^>]+>/g, ""),
  });
}

export async function sendAppointmentBookedEmails(data: {
  patientEmail: string;
  patientName: string;
  doctorEmail: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
}) {
  const details = `${data.specialty} · ${data.date} at ${data.time}`;
  await Promise.all([
    sendMail({
      to: data.patientEmail,
      subject: "Appointment booked — Telemed Aura",
      html: `<p>Hi ${data.patientName},</p><p>Your appointment with <strong>${data.doctorName}</strong> is booked.</p><p>${details}</p><p>Status: pending confirmation.</p>`,
    }),
    sendMail({
      to: data.doctorEmail,
      subject: "New appointment request — Telemed Aura",
      html: `<p>Hi ${data.doctorName},</p><p><strong>${data.patientName}</strong> requested an appointment.</p><p>${details}</p>`,
    }),
  ]);
}

export async function sendAppointmentStatusEmail(data: {
  to: string;
  name: string;
  status: string;
  doctorName: string;
  date: string;
  time: string;
}) {
  await sendMail({
    to: data.to,
    subject: `Appointment ${data.status} — Telemed Aura`,
    html: `<p>Hi ${data.name},</p><p>Your appointment with ${data.doctorName} on ${data.date} at ${data.time} is now <strong>${data.status}</strong>.</p>`,
  });
}
