// Load quotes from localStorage or use default
let quotes = JSON.parse(localStorage.getItem('quotes')) || [
  { text: "Stay hungry, stay foolish.", category: "Inspiration" },
  { text: "Life is short, smile while you still have teeth.", category: "Humor" },
];

// DOM references
const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteBtn = document.getElementById('newQuote');
const categoryFilter = document.getElementById('categoryFilter');

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

// Add a new quote
function addQuote() {
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
}

// Save quotes to localStorage
function saveQuotes() {
  localStorage.setItem('quotes', JSON.stringify(quotes));
}

// Export quotes as JSON
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

// Notification function
function notifyUser(message) {
  const notification = document.getElementById('notification');
  notification.innerText = message;
  notification.style.display = 'block';
  setTimeout(() => {
    notification.style.display = 'none';
  }, 4000);
}

// Simulate fetching quotes from server
async function fetchQuotesFromServer() {
  const response = await fetch('https://jsonplaceholder.typicode.com/posts');
  const data = await response.json();
  return data.slice(0, 5).map(post => ({
    id: post.id,
    text: post.title,
    category: "Server"
  }));
}

// Sync quotes with server (server wins conflicts)
function syncQuotes(serverQuotes) {
  let updated = false;

  serverQuotes.forEach(serverQuote => {
    // Find matching quote by text and category
    const localIndex = quotes.findIndex(q =>
      q.text === serverQuote.text && q.category === serverQuote.category
    );

    if (localIndex === -1) {
      // New quote from server, add it
      quotes.push(serverQuote);
      updated = true;
    } else {
      // Conflict: update local if different
      const localQuote = quotes[localIndex];
      if (localQuote.text !== serverQuote.text || localQuote.category !== serverQuote.category) {
        quotes[localIndex] = serverQuote;
        updated = true;
      }
    }
  });

  if (updated) {
    saveQuotes();
    populateCategories();
    notifyUser("Quotes updated from server.");
    showRandomQuote();
  }
}

// Initial setup
document.addEventListener('DOMContentLoaded', () => {
  populateCategories();
  showRandomQuote();
  newQuoteBtn.addEventListener('click', showRandomQuote);
  categoryFilter.addEventListener('change', filterQuote);

  // Manual sync button
  document.getElementById('syncBtn').addEventListener('click', async () => {
    try {
      const serverQuotes = await fetchQuotesFromServer();
      syncQuotes(serverQuotes);
    } catch (error) {
      alert("Failed to sync with server: " + error.message);
    }
  });

  // Auto-sync every 30 seconds
  setInterval(async () => {
    try {
      const serverQuotes = await fetchQuotesFromServer();
      syncQuotes(serverQuotes);
    } catch (error) {
      console.error("Auto-sync failed:", error);
    }
  }, 30000);
});
