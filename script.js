// Load quotes from localStorage or use default
let quotes = JSON.parse(localStorage.getItem('quotes')) || [
  { text: "Stay hungry, stay foolish.", category: "Inspiration" },
  { text: "Life is short, smile while you still have teeth.", category: "Humor" },
];

// DOM references
const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteBtn = document.getElementById('newQuote');
const categoryFilter = document.getElementById('categoryFilter');
const notificationEl = document.getElementById('notification');
const syncBtn = document.getElementById('syncBtn');

// Display a random quote based on current filter
function showRandomQuote() {
  const selectedCategory = categoryFilter.value;
  const filteredQuotes = selectedCategory === 'all'
    ? quotes
    : quotes.filter(q => q.category.toLowerCase() === selectedCategory.toLowerCase());

  if (filteredQuotes.length === 0) {
    quoteDisplay.innerText = "No quotes available for this category.";
    return;
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const quote = filteredQuotes[randomIndex];
  quoteDisplay.innerText = `"${quote.text}" — ${quote.category}`;
}

// Add a new quote and post to server
async function addQuote() {
  const textInput = document.getElementById('newQuoteText');
  const categoryInput = document.getElementById('newQuoteCategory');
  const text = textInput.value.trim();
  const category = categoryInput.value.trim();

  if (!text || !category) {
    alert("Please fill in both the quote and category.");
    return;
  }

  const newQuote = { text, category };
  quotes.push(newQuote);
  saveQuotes();
  populateCategories();
  textInput.value = '';
  categoryInput.value = '';
  showRandomQuote();

  const success = await postQuoteToServer(newQuote);
  if (!success) notify('Failed to post new quote to server.');
}

// Save quotes to localStorage
function saveQuotes() {
  localStorage.setItem('quotes', JSON.stringify(quotes));
}

// Export quotes as JSON file
function exportToJson() {
  const json = JSON.stringify(quotes, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'quotes.json';
  link.click();

  URL.revokeObjectURL(url);
}

// Import quotes from uploaded JSON file
function importFromJsonFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      if (!Array.isArray(importedQuotes)) throw new Error("Invalid format.");
      quotes.push(...importedQuotes);
      saveQuotes();
      populateCategories();
      alert("Quotes imported successfully!");
      showRandomQuote();
    } catch (error) {
      alert("Failed to import quotes: " + error.message);
    }
  };
  reader.readAsText(file);
}

// Populate the dropdown with unique categories
function populateCategories() {
  const uniqueCategories = [...new Set(quotes.map(q => q.category))];
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';

  uniqueCategories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });

  // Restore the last selected category
  const savedCategory = localStorage.getItem('selectedCategory');
  if (savedCategory && [...categoryFilter.options].some(opt => opt.value === savedCategory)) {
    categoryFilter.value = savedCategory;
  }
}

// Save selected category and refresh quote display
function filterQuote() {
  const selectedCategory = categoryFilter.value;
  localStorage.setItem('selectedCategory', selectedCategory);
  showRandomQuote();
}

// Notify user with a message (shows notification div)
function notify(message) {
  notificationEl.innerText = message;
  notificationEl.style.display = 'block';
  setTimeout(() => {
    notificationEl.style.display = 'none';
  }, 4000);
}

// Fetch quotes from mock server (simulated)
async function fetchQuotesFromServer() {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts');
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();

    // Map server data to quote format (adjust as needed)
    const serverQuotes = data.map(item => ({
      text: item.title || item.body || "No text",
      category: "Server Quote"
    }));

    return serverQuotes;
  } catch (error) {
    console.error('Failed to fetch from server:', error);
    return [];
  }
}

// Post a single quote to mock server (simulated)
async function postQuoteToServer(quote) {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quote),
    });
    if (!response.ok) throw new Error('Network response was not ok');
    const result = await response.json();
    console.log('Posted quote to server:', result);
    return true;
  } catch (error) {
    console.error('Failed to post quote to server:', error);
    return false;
  }
}

// Sync local quotes with server: server data takes precedence
async function syncQuotes() {
  const serverQuotes = await fetchQuotesFromServer();

  if (serverQuotes.length === 0) {
    notify('Failed to sync: no server data.');
    return;
  }

  // Overwrite local quotes with server quotes (conflict resolution)
  quotes = serverQuotes;
  saveQuotes();
  populateCategories();
  showRandomQuote();
  notify('Quotes synced with server successfully!');
}

// Initial setup
document.addEventListener('DOMContentLoaded', () => {
  populateCategories();
  showRandomQuote();

  newQuoteBtn.addEventListener('click', showRandomQuote);
  categoryFilter.addEventListener('change', filterQuote);

  // Sync button handler
  if(syncBtn) {
    syncBtn.addEventListener('click', () => {
      syncQuotes();
    });
  }

  // Periodic sync every 30 seconds
  setInterval(syncQuotes, 30000);
});
