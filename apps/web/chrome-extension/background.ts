// background.ts

// This function is injected into the active tab to replace the selected text.
function replaceSelectedText(newText: string) {
  const activeElement = document.activeElement as HTMLInputElement | HTMLTextAreaElement;
  // ✅ FIX: Changed all instances of 'active-element' to 'activeElement'
  if (activeElement && (activeElement.isContentEditable || activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT')) {
    const start = activeElement.selectionStart ?? 0;
    const end = activeElement.selectionEnd ?? 0;
    activeElement.value =
      activeElement.value.substring(0, start) +
      newText +
      activeElement.value.substring(end);
  } else {
    alert(`AI Suggestion:\n\n${newText}`);
  }
}

// Create context menus when the extension is installed.
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'proofread-text',
    title: 'Proofread with FortiTwin AI',
    contexts: ['selection'],
  });
  chrome.contextMenus.create({
    id: 'rewrite-text-formal',
    title: 'Rewrite Formally',
    contexts: ['selection'],
  });
});

// Helper function to show notifications.
function showNotification(title: string, message: string) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'images/icon128.png',
    title: title,
    message: message
  });
}

// Listen for clicks on our context menu items.
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id || !info.selectionText) return;

  const selectedText = info.selectionText;

  // --- Proofreader Logic ---
  if (info.menuItemId === 'proofread-text') {
    try {
      if (!self.Proofreader) throw new Error('Proofreader API is not supported.');

      const availability = await Proofreader.availability();

      if (availability === 'available') {
        const proofreader = await Proofreader.create();
        const result = await proofreader.proofread(selectedText);
        console.log('Raw Proofreader API Result:', result);

        if (result && result.correctedInput && result.correctedInput !== selectedText) {
          const correctedText = String(result.correctedInput);
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: replaceSelectedText,
            args: [correctedText],
          });
        } else {
          showNotification('FortiTwin AI', 'No grammar suggestions found.');
        }
      } else if (availability === 'downloadable') {
        showNotification('FortiTwin AI is Getting Ready', 'Downloading the AI model. Please try again shortly.');
        Proofreader.create();
      } else {
        throw new Error(`Proofreader is not ready. Status: ${availability}`);
      }
    } catch (error) {
      console.error('FortiTwin AI Error:', error);
    }
  }

  // --- Rewriter Logic ---
  else if (info.menuItemId === 'rewrite-text-formal') {
    try {
      if (!self.Rewriter) throw new Error('Rewriter API is not supported.');
      const availability = await Rewriter.availability();
      if (availability === 'available') {
        const rewriter = await Rewriter.create();
        const resultText = await rewriter.rewrite(selectedText, { tone: 'more-formal' });
        const rewrittenText = String(resultText);
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: replaceSelectedText,
          args: [rewrittenText],
        });
      } else if (availability === 'downloadable') {
        showNotification('FortiTwin AI is Getting Ready', 'Downloading the AI model. Please try again shortly.');
        Rewriter.create();
      } else {
        throw new Error(`Rewriter is not ready. Status: ${availability}`);
      }
    } catch (error) {
      console.error('FortiTwin AI Error:', error);
    }
  }
});