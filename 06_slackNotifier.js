// 06_slackNotifier.js (Updated to handle multiple reference documents)

/**
 * Sends a Slack notification with document generation results and reference documents
 * @param {string} email - The email of the requester
 * @param {string} successMessage - The success message describing what was created
 * @param {string} language - The language of the documents
 * @param {string} folderUrl - The URL to the folder containing the documents
 * @param {string} contractSetRefUrl - Optional URL to the contract set reference document
 * @param {string} subindustryRefUrl - Optional URL to the subindustry reference document
 */
// ADD this new function to 06_slackNotifier.js:
function sendSlackNotificationWithReferences(email, successMessage, language, folderUrl, contractSetRefUrl, subindustryRefUrl) {
    console.log("Email: " + email);
    const languageAbbreviations = {
        Spanish: "[ES]",
        French: "[FR]",
        German: "[DE]",
        "Portuguese (PT)": "[PT]",
        "Portuguese (BR)": "[BR]",
        Japanese: "[JA]",
    };

    const langPrefix = languageAbbreviations[language] || "";
    const properties = PropertiesService.getScriptProperties();
    const url = properties.getProperty('SLACK_WEBHOOK_URL');

    if (!url) {
        Logger.log("SLACK_WEBHOOK_URL not set in Script Properties.");
        return;
    }
    
    // Build message with all links
    let message = langPrefix + " " + successMessage + "\n📁 Documents: " + folderUrl;
    
    if (contractSetRefUrl) {
        message += "\n📋 Contract Set Reference: " + contractSetRefUrl;
    }
    
    if (subindustryRefUrl) {
        message += "\n📖 Document Types & Obligations Guide: " + subindustryRefUrl;
    }
    
    const formData = {
        "submitter": email,
        "link": message
    };
    
    const options = {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(formData)
    };

    try {
        UrlFetchApp.fetch(url, options);
        Logger.log("Slack notification sent with reference documents");
    } catch (error) {
        Logger.log("Error sending Slack notification: " + error.message);
    }
}

// Keep the original function for backward compatibility
function sendSlackNotification(email, agreementType, language, fileUrl, referenceDocUrl = null) {
    sendSlackNotificationWithReferences(email, agreementType, language, fileUrl, referenceDocUrl, null);
}

/**
 * Sends a Slack notification for feedback submissions
 * @param {Object} feedbackData - The feedback data object
 */
function sendFeedbackSlackNotification(feedbackData) {
    Logger.log('sendFeedbackSlackNotification called with data: ' + JSON.stringify(feedbackData));
    
    const properties = PropertiesService.getScriptProperties();
    const url = properties.getProperty('SLACK_WEBHOOK_URL');

    Logger.log('SLACK_WEBHOOK_URL retrieved: ' + (url ? 'URL found' : 'URL not found'));

    if (!url) {
        Logger.log("SLACK_WEBHOOK_URL not set in Script Properties.");
        throw new Error("SLACK_WEBHOOK_URL not configured");
    }

    // Create a simple message format compatible with workflow webhooks
    const message = {
        "submitter": feedbackData.email || 'Unknown',
        "link": `📝 New Advanced Sample Document Assistant (ASDA) Feedback\n\n*Name:* ${feedbackData.name || 'Not provided'}\n*Email:* ${feedbackData.email || 'Not provided'}\n*Job Title:* ${feedbackData.jobTitle || 'Not provided'}\n*Location:* ${feedbackData.location || 'Not provided'}\n\n*Feedback:* ${feedbackData.feedback || 'No feedback provided'}\n\n⏰ Submitted: ${new Date().toLocaleString()}`
    };

    const options = {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(message)
    };

    try {
        Logger.log('Sending Slack webhook request...');
        const response = UrlFetchApp.fetch(url, options);
        Logger.log('Slack webhook response code: ' + response.getResponseCode());
        Logger.log('Slack webhook response: ' + response.getContentText());
        Logger.log("Feedback Slack notification sent successfully");
    } catch (error) {
        Logger.log("Error sending feedback Slack notification: " + error.message);
        Logger.log("Full error: " + JSON.stringify(error));
        throw error;
    }
}