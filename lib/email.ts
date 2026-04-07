import nodemailer from "nodemailer";

interface NewTicketEmailParams {
  to: string;
  title: string;
  client_id: string;
  workflow_name: string;
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendNewTicketEmail(params: NewTicketEmailParams) {
  const { to, title, client_id, workflow_name } = params;

  const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const queueUrl = `${appUrl}/`;

  const transporter = createTransporter();

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: `New checkpoint: ${title}`,
    html: `
      <p>A new ticket requires your review.</p>
      <table>
        <tr><th align="left">Title</th><td>${title}</td></tr>
        <tr><th align="left">Client</th><td>${client_id}</td></tr>
        <tr><th align="left">Workflow</th><td>${workflow_name}</td></tr>
      </table>
      <p><a href="${queueUrl}">Open the queue</a></p>
    `,
  });
}
