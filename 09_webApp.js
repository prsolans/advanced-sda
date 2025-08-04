// 09_webApp.js - Web app endpoints for your agentic interface

// Main web app entry point
function doGet(e) {
  const page = e.parameter.page || 'chat';
  
  switch (page) {
    case 'chat':
      return HtmlService.createHtmlOutputFromFile('chatInterface')
        .setTitle('AI Document Generator')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    case 'admin':
      return HtmlService.createHtmlOutputFromFile('adminInterface')
        .setTitle('Document Agent Admin')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    default:
      return HtmlService.createHtmlOutput('<h1>Page not found</h1>');
  }
}

// Handle POST requests (for API endpoints)
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;
  
  switch (action) {
    case 'processMessage':
      return processAgenticMessage(data.userId, data.message);
    case 'getCustomers':
      return getCustomerList();
    case 'updateCustomer':
      return updateCustomerData(data.customerName, data.profileData);
    default:
      return { error: 'Unknown action' };
  }
}

// Process agentic message (async wrapper)
function processAgenticMessage(userId, message) {
  try {
    // Call your agentic service
    const result = processAgenticRequest(userId, message);
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    Logger.log('Error in processAgenticMessage: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Get customer list for admin interface
function getCustomerList() {
  try {
    const profiles = getCustomerProfiles();
    return {
      success: true,
      data: profiles
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Update customer data
function updateCustomerData(customerName, profileData) {
  try {
    updateCustomerProfile(customerName, profileData);
    return {
      success: true,
      message: 'Customer profile updated successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Test function to verify setup
function testAgenticSystem() {
  const testUserId = 'test-user';
  const testMessage = 'Create an NDA for Acme Corporation';
  
  const result = processAgenticRequest(testUserId, testMessage);
  Logger.log('Test result: ' + JSON.stringify(result, null, 2));
  
  return result;
}