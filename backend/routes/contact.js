const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const xss = require('xss');
require('dotenv').config();

// POST /api/contact
router.post('/', async (req, res) => {
  let { name, email, message } = req.body || {};

  // Sanitize inputs to prevent XSS attacks
  name = xss(name || '').trim();
  email = xss(email || '').toLowerCase().trim();
  message = xss(message || '').trim();

  // Validate required fields
  if (!name || !email || !message) {
    return res.status(400).json({ message: 'Name, email and message are required.' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Please provide a valid email address.' });
  }

  const to = process.env.EMAIL_TO;
  if (!to) {
    return res.status(500).json({ message: 'Contact email not configured on server (EMAIL_TO).' });
  }

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port) {
    return res.status(500).json({ message: 'SMTP server not configured (SMTP_HOST, SMTP_PORT).' });
  }

  const secure = Number(port) === 465;

  const transporterOptions = {
    host,
    port: Number(port),
    secure,
  };

  if (user && pass) transporterOptions.auth = { user, pass };

  const transporter = nodemailer.createTransport(transporterOptions);

  const mailOptions = {
    from: user || `no-reply@${req.hostname}`,
    to,
    subject: `New contact message from ${name}`,
    text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    html: `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Message:</strong></p><p>${message.replace(/\n/g, '<br>')}</p>`
  };

  try {
    await transporter.sendMail(mailOptions);
    return res.json({ message: 'Message sent successfully' });
  } catch (err) {
    console.error('Error sending contact email:', err);
    return res.status(500).json({ message: 'Failed to send message. Check server email configuration.' });
  }
});

module.exports = router;
