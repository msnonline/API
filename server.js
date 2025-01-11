const express = require("express");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const cors = require("cors");
const TelegramBot = require("node-telegram-bot-api"); // Import Telegram Bot library

const app = express();

const port = 3001;

// Middleware to parse JSON requests
app.use(cors());
app.use(bodyParser.json());

// Create a reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  service: "gmail", // Change if you're using another SMTP service
  auth: {
    user: "serenetides37@gmail.com", // Your email
    pass: "rmmh cqms dcub denw", // Your app password
  },
});

// Telegram Bot setup
const telegramToken = "7637425229:AAEOd39Gvu7O77XXk_pm5FLDTOPcbxqAP3c"; // Replace with your bot token from BotFather
const telegramBot = new TelegramBot(telegramToken, { polling: true });

// Your Telegram chat ID
const chatId = "5640521477"; // Replace with your chat ID

app.get("/", (req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Welcome to my simple API");
});

// Email and Telegram notification route
app.post("/send-email", (req, res) => {
  const { subject, message } = req.body;

  // Validate request body
  if (!subject || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  // Collect additional information (IP address, browser, timestamp)
  const ipAddress = req.ip; // IP address of the user
  const userAgent = req.headers["user-agent"]; // Browser info
  const timestamp = new Date().toISOString(); // Current timestamp in ISO format

  // Prepare the message to include these details
  const fullMessage = `*Message* \n${message}\n\n=======================\n*Additional Information*\n=======================\n\n*IP Address* \n${ipAddress}\n\n*Browser* \n${userAgent}\n\n*Timestamp* \n${timestamp}\n\n_Good luck!_`;

  // Define email options
  const mailOptions = {
    from: "yingyang1446@gmail.com", // Sender email
    to: "yingyang1446@gmail.com", // Recipient email
    subject: subject, // Subject of the email
    text: fullMessage, // Email body
  };

  // Send the email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Send the same message to Telegram using Markdown formatting
    telegramBot
      .sendMessage(
        chatId,
        `*Subject:* ${subject}\n\n${fullMessage}`,
        { parse_mode: "Markdown" } // Enable Markdown mode
      )
      .then(() => {
        res.status(200).json({
          message: "Email and Telegram message sent successfully",
          info,
        });
      })
      .catch((telegramError) => {
        res.status(500).json({
          error: "Failed to send Telegram message",
          details: telegramError.message,
        });
      });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
