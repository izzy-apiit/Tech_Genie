// services/notifications.js
const nodemailer = require("nodemailer");
const twilio = require("twilio");
const User = require("../models/User");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT || 587),
  secure: false,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});
let twilioClient = null;
try {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
    );
  } else {
    console.warn("[Notify] Twilio not configured; SMS disabled");
  }
} catch (e) {
  console.warn("[Notify] Twilio init failed:", e.message);
}

function normalizePhone(input) {
  if (!input) return null;
  let p = String(input).trim();
  p = p.replace(/[\s()-]/g, "");
  if (!p.startsWith("+") && /^0\d{9}$/.test(p)) {
    p = "+94" + p.slice(1);
  }
  if (!/^\+?\d{8,15}$/.test(p)) return null;
  if (!p.startsWith("+")) p = "+" + p;
  return p;
}

async function sendProgressEmail(customerId, booking) {
  try {
    const user = await User.findById(customerId);
    if (!user?.email) return false;
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `Booking ${booking._id} update: ${booking.status}`,
      text: `Your repair is now "${booking.status}". Progress: ${booking?.progress?.percent ?? 0}% - ${booking?.progress?.label ?? ""}`,
    });
    return true;
  } catch (e) {
    console.warn("[Notify] Email send failed:", e.message);
    return false;
  }
}

async function sendProgressSMS(customerId, booking) {
  try {
    if (!twilioClient) return false;
    const user = await User.findById(customerId);
    const to = normalizePhone(user?.phone);
    const from = normalizePhone(process.env.TWILIO_PHONE_NUMBER);
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
    if (!to || (!from && !messagingServiceSid)) {
      console.warn("[Notify] SMS not sent: missing valid sender/recipient", {
        to,
        from,
        hasMSS: !!messagingServiceSid,
      });
      return false;
    }
    const payload = {
      to,
      body: `Booking ${booking._id}: ${booking.status}. Progress ${booking?.progress?.percent ?? 0}%`,
    };
    if (messagingServiceSid) payload.messagingServiceSid = messagingServiceSid;
    else payload.from = from;
    await twilioClient.messages.create(payload);
    return true;
  } catch (e) {
    console.warn("[Notify] SMS send failed:", e.message);
    return false;
  }
}

module.exports = { sendProgressEmail, sendProgressSMS };
