import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import './popup.css';

// This function is injected into the webpage to get the most relevant text.
// It tries to find the <main> or <article> content first, falling back to the whole body.
const getTextFromPage = () => {
  const mainContent = document.querySelector('main')?.innerText;
  const articleContent = document.querySelector('article')?.innerText;
  return mainContent || articleContent || document.body.innerText;
};

const Popup = () => {
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const showNotification = (title: string, message: string) => {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'images/icon128.png',
      title: title,
      message: message,
    });
  };

  const handleSummarize = async () => {
    setIsLoading(true);
    setError('');
    setSummary('');

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      setError('Could not access the current tab.');
      setIsLoading(false);
      return;
    }

    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: getTextFromPage,
      });

      const pageText = results[0]?.result;
      if (!pageText || pageText.trim().length < 150) { // Increased minimum length
        throw new Error("Could not extract enough text from the page to summarize.");
      }
      
      const availability = await self.Summarizer.availability();
      
      if (availability === 'available') {
        const summarizer = await self.Summarizer.create();
        const result = await summarizer.summarize({ text: pageText, outputLanguage: 'en' });
        setSummary(result);
      } else if (availability === 'downloadable') {
        showNotification('FortiTwin AI is Getting Ready', 'Downloading the Summarizer model. Please try again shortly.');
        self.Summarizer.create(); // Trigger the download
      } else {
        throw new Error(`Summarizer not ready. Status: ${availability}`);
      }

    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1>FortiTwin AI Assistant</h1>
      <button 
        onClick={handleSummarize} 
        disabled={isLoading}
      >
        {isLoading ? 'Summarizing...' : 'Summarize Page'}
      </button>
      
      {error && <p className="error">Error: {error}</p>}

      {summary && (
        <div className="summary-container">
          <h2>Summary:</h2>
          <p>{summary}</p>
        </div>
      )}
    </div>
  );
};

ReactDOM.render(<Popup />, document.getElementById('root'));

