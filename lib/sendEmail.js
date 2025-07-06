import nodemailer from 'nodemailer';

export default async function sendEmail(to, subject, text) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'isaiah.cole0@ethereal.email',
        pass: 'EcVUyJ6ThAWwM3mR7Q'
    }
});

  await transporter.sendMail({
    from: 'isaiah.cole0@ethereal.email',
    to,
    subject,
    text,
  });
}