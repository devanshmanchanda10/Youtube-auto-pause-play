let videoElement = null;

function findVideoElement() {
  if (!videoElement) {
    videoElement = document.querySelector('video');
  }
  return videoElement;
}

function pauseVideo() {
  const video = findVideoElement();
  if (video && !video.paused) {
    video.pause();
  }
}

function playVideo() {
  const video = findVideoElement();
  if (video && video.paused) {
    video.play();
  }
}

function handleVisibilityChange() {
  if (document.hidden) {
    pauseVideo();
  } else {
    chrome.runtime.sendMessage({action: "updateLastActiveYouTubeTab"});
    playVideo();
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case "pause":
      pauseVideo();
      break;
    case "play":
      playVideo();
      break;
    case "checkVisibility":
      handleVisibilityChange();
      break;
  }
});

document.addEventListener("visibilitychange", handleVisibilityChange);

// Initialize video element and send message to background script
findVideoElement();
if (videoElement) {
  chrome.runtime.sendMessage({action: "updateLastActiveYouTubeTab"});
}

// Monitor for dynamically added video elements
const observer = new MutationObserver(() => {
  if (!videoElement && findVideoElement()) {
    chrome.runtime.sendMessage({action: "updateLastActiveYouTubeTab"});
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});