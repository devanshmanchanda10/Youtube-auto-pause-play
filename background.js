let lastActiveYouTubeTabId = null;

function sendMessageToTab(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}

async function pauseAllYouTubeTabs() {
  const youtubeTabs = await chrome.tabs.query({url: "*://www.youtube.com/*"});
  for (const tab of youtubeTabs) {
    try {
      await sendMessageToTab(tab.id, {action: "pause"});
    } catch (error) {
      console.log(`Error sending message to tab ${tab.id}: ${error.message}`);
    }
  }
}

async function handleFocusChange() {
  const [activeTab] = await chrome.tabs.query({active: true, currentWindow: true});
  
  if (!activeTab || !activeTab.url.includes("youtube.com")) {
    if (lastActiveYouTubeTabId) {
      try {
        await sendMessageToTab(lastActiveYouTubeTabId, {action: "pause"});
      } catch (error) {
        console.log(`Error pausing last active YouTube tab: ${error.message}`);
      }
    }
    await pauseAllYouTubeTabs();
  } else {
    lastActiveYouTubeTabId = activeTab.id;
    try {
      await sendMessageToTab(activeTab.id, {action: "play"});
    } catch (error) {
      console.log(`Error playing video in tab ${activeTab.id}: ${error.message}`);
    }
  }
}

chrome.tabs.onActivated.addListener(handleFocusChange);
chrome.windows.onFocusChanged.addListener(handleFocusChange);

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url.includes("youtube.com")) {
    lastActiveYouTubeTabId = tabId;
  }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateLastActiveYouTubeTab") {
    lastActiveYouTubeTabId = sender.tab.id;
  }
});