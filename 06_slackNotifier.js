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
        message += "\n📊 Industry Reference Guide: " + subindustryRefUrl;
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