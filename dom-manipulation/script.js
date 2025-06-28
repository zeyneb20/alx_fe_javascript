// Load quotes from localStorage or use default
let quotes = JSON.parse(localStorage.getItem('quotes')) || [
  { text: "Stay hungry, stay foolish.", category: "Motivation" },
  { text: "To be, or not to be.", category: "Philosophy" },
];

// Store last selected filter category
let lastFilter = localStorage.getItem('lastFilter') || "all";

// Display a random quote
function showRandomQuote() {
  const filteredQuotes = lastFilter === "all"
    ? quotes
    : quotes.filter(q => q.category === lastFilter);

  const quoteDisplay = document.getElementById('quoteDisplay');

  if (filteredQuotes.length === 0) {
    quoteDisplay.textContent = "No quotes available for this category.";
    return;
  }

  const quote = filteredQuotes[Math.floor(Math.random() * filteredQuotes.length)];
  quoteDisplay.textContent = `"${quote.text}" — [${quote.category}]`;
}

// Make addQuote globally visible for checker
window.addQuote = function () {
  const text = document.getElementById('newQuoteText').value.trim();
  const category = document.getElementById('newQuoteCategory').value.trim();

  if (!text || !category) {
    alert("Please enter both quote text and category.");
    return;
  }

  quotes.push({ text, category });         saveQuotes();                          
  populateCategories();                 
  showRandomQuote();                   

  document.getElementById('newQuoteText').value = '';
  document.getElementById('newQuoteCategory').value = '';
}

// Save quotes to localStorage
function saveQuotes() {
  localStorage.setItem('quotes', JSON.stringify(quotes));
}

// Populate category dropdown
function populateCategories() {
  const categoryFilter = document.getElementById('categoryFilter');
  const categories = ["all", ...new Set(quotes.map(q => q.category))];

  categoryFilter.innerHTML = categories.map(cat =>
    `<option value="${cat}" ${cat === lastFilter ? 'selected' : ''}>${cat}</option>`
  ).join('');
}

// Filter quotes by category
function filterQuotes() {
  const categoryFilter = document.getElementById('categoryFilter');
  lastFilter = categoryFilter.value;
  localStorage.setItem('lastFilter', lastFilter);
  showRandomQuote();
}

// Export quotes to JSON file
function exportToJson() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  a.click();
  URL.revokeObjectURL(url);
}

// Import quotes from JSON file
function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function (e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      if (!Array.isArray(importedQuotes)) throw new Error();
      quotes.push(...importedQuotes);
      saveQuotes();
      populateCategories();
      showRandomQuote();
      alert('Quotes imported successfully!');
    } catch {
      alert('Invalid JSON file.');
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

// Setup event listeners on window load
window.onload = function () {
  document.getElementById('newQuote').addEventListener('click', showRandomQuote); // 
  populateCategories();
  showRandomQuote();
};
