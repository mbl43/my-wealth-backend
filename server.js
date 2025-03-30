require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const cron = require("node-cron");
const emailjs = require("emailjs-com");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Allows frontend to communicate with backend
app.use(bodyParser.json()); // Parses JSON data from frontend

let latestInvestmentData = null; // Store the latest investment data

// API Endpoint to Receive Investment Data from Frontend
app.post("/update-investment", (req, res) => {
  latestInvestmentData = req.body; // Store received data

  if (!latestInvestmentData) {
    return res.status(400).json({ message: "No data received" });
  }

  console.log("Received investment data:", latestInvestmentData);
  res.status(200).json({ message: "Investment data updated successfully" });
});

// Function to Send Notification Using Stored Data
const sendNotification = async () => {
  if (!latestInvestmentData) {
    console.log("No investment data available. Skipping email.");
    return;
  }

  const { name,email, investments } = latestInvestmentData;

  const templateParams = {
    nominator_name: "Your Name",
    user_name: name,
    user_email:email,
    totalInvestment: Object.values(investments).reduce((a, b) => a + b, 0).toLocaleString("en-IN"),
    gold: investments.Gold.toLocaleString("en-IN"),
    silver: investments.Silver.toLocaleString("en-IN"),
    ppf: investments.ppf_value.toLocaleString("en-IN"),
    fd: investments.fd_value.toLocaleString("en-IN"),
    mutual_fund: investments.mutual_fund.toLocaleString("en-IN"),
    stocks_value: investments.stocks_value.toLocaleString("en-IN"),
    transaction_date: new Date().toLocaleDateString("en-IN"),
  };
console.table(templateParams);

  try {
    await emailjs.send(
      process.env.EMAILJS_SERVICE_ID,
      process.env.EMAILJS_TEMPLATE_ID,
      templateParams,
      process.env.EMAILJS_PUBLIC_KEY
    );
    console.log("Investment summary sent to nominee!");
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

// Cron Job to Run Every 3 Months
cron.schedule("0 0 1 */3 *", () => {
  console.log("Running scheduled task...");
  sendNotification();
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
