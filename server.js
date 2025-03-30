require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const cron = require("node-cron");
const emailjs = require("@emailjs/nodejs");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

let latestInvestmentData = null;

// API Endpoint to Receive Investment Data
app.post("/update-investment", (req, res) => {
    if (!req.body || !req.body.investments) {
        return res.status(400).json({ message: "Invalid investment data" });
    }

    latestInvestmentData = req.body;
    console.log("Received investment data:", latestInvestmentData);

    res.status(200).json({ message: "Investment data updated successfully" });
});

// Function to Send Notification Using EmailJS
const sendNotification = async () => {
    if (!latestInvestmentData) {
        console.log("No investment data available. Skipping email.");
        return;
    }

    const { name, email, investments } = latestInvestmentData;

    const templateParams = {
        user_name: name,
        user_email: email,
        totalInvestment: Object.values(investments).reduce((a, b) => a + (b || 0), 0).toLocaleString("en-IN"),
        gold: (investments?.Gold || 0).toLocaleString("en-IN"),
        silver: (investments?.Silver || 0).toLocaleString("en-IN"),
        ppf: (investments?.ppf_value || 0).toLocaleString("en-IN"),
        fd: (investments?.fd_value || 0).toLocaleString("en-IN"),
        mutual_fund: (investments?.mutual_fund || 0).toLocaleString("en-IN"),
        stocks_value: (investments?.stocks_value || 0).toLocaleString("en-IN"),
        transaction_date: new Date().toLocaleDateString("en-IN"),
    };

    console.table(templateParams);

    try {
        await emailjs.send(
            process.env.EMAILJS_SERVICE_ID,
            process.env.EMAILJS_TEMPLATE_ID,
            templateParams,
            {
                publicKey: process.env.EMAILJS_PUBLIC_KEY,
                privateKey: process.env.EMAILJS_PRIVATE_KEY,             }
        );
        console.log("Investment summary sent successfully!");
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
