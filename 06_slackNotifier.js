
function sendSlackNotification(email, agreementType, language, fileUrl) {
    console.log("Email" + email);
    const languageAbbreviations = {
        Spanish: "[ES]",
        French: "[FR]",
        German: "[DE]",
        "Portuguese (PT)": "[PT]",
        "Portuguese (BR)": "[BR]",
        Japanese: "[JA]",
    };

    // Add language abbreviation if not English
    const langPrefix = languageAbbreviations[language] || ""; // Default to an empty string for English or unknown languages

    const properties = PropertiesService.getScriptProperties();
    const url = properties.getProperty('SLACK_WEBHOOK_URL');

    if (!url) {
        Logger.log("SLACK_WEBHOOK_URL not set in Script Properties.");
        return;
    }
    const formData = {
        "submitter": email,
        "link": langPrefix + " Sample " + agreementType + " " + fileUrl
    };
    const options = {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(formData)
    };

    try {
        UrlFetchApp.fetch(url, options);
    } catch (error) {
        Logger.log("Error sending Slack notification: " + error.message);
    }
}