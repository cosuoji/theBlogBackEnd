import nodemailer from 'nodemailer';

export default async function sendEmail(to, subject, text) {
  const transporter = nodemailer.createTransport({
    service: 'Gmail', // or any SMTP provider
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
  });
}