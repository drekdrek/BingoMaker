// script.js

// Wait for the DOM to fully load before running scripts
document.addEventListener('DOMContentLoaded', () => {
  initPage();
});

// Initialize the page
function initPage() {
  // Show the welcome section and hide the bingo section
  document.getElementById('welcome-section').style.display = 'block';
  document.getElementById('bingo-section').style.display = 'none';
}

// Initialize Bootstrap modals
const editModalElement = document.getElementById('modal');
const editModal = new bootstrap.Modal(editModalElement);

const savedCardsModalElement = document.getElementById('saved-cards-modal');
const savedCardsModal = new bootstrap.Modal(savedCardsModalElement);

// Event listener for the "Create New Bingo Card" button
document.getElementById('create-btn').addEventListener('click', () => {
  editModal.show();
});

// Event listener for the "Edit Words" button
document.getElementById('edit-btn').addEventListener('click', () => {
  editModal.show();
});

// Event listener for the "Save" button in the Edit Modal
document.getElementById('save-btn').addEventListener('click', () => {
  saveWords();
  editModal.hide();
});

// Event listener for the "Print" button
document.getElementById('print-btn').addEventListener('click', () => {
  window.print();
});

// Event listener for the "View Saved Cards" button
document.getElementById('view-saved-btn').addEventListener('click', () => {
  displaySavedCards(); // Function to populate the saved cards list
  savedCardsModal.show();
});

// Event listener for the "Save Bingo Card" button
document.getElementById('save-card-btn').addEventListener('click', () => {
  saveCurrentBingoCard();
});

// Function to generate the bingo card
function generateBingoCard(words = []) {
  const bingoCells = document.querySelectorAll('.bingo-cell');
  let items = [];

  if (words.length > 0) {
      items = words;
  } else {
      // Default numbers 1-75
      items = Array.from({ length: 75 }, (_, i) => i + 1).map(String);
  }

  // Shuffle and select 24 items (excluding the center "FREE" cell)
  items = shuffleArray(items).slice(0, 24);

  // Update cells with items
  bingoCells.forEach((cell, index) => {
      // Set center cell as "FREE"
      if (index === 12) { // Cell 13 (center cell)
          cell.textContent = 'FREE';
      } else {
          // Adjust index to skip the center cell when assigning items
          const itemIndex = index < 12 ? index : index - 1;
          cell.textContent = items[itemIndex];
      }

      // Remove previous event listeners to prevent duplication
      const newCell = cell.cloneNode(true);
      cell.parentNode.replaceChild(newCell, cell);
  });

  // Re-select cells to add event listeners
  document.querySelectorAll('.bingo-cell').forEach(cell => {
      cell.addEventListener('click', () => {
          cell.classList.toggle('marked');
      });
  });

  // Show the bingo section and hide the welcome section
  showBingoSection();
}

// Function to shuffle an array
function shuffleArray(array) {
  return array.sort(() => Math.random() - 0.5);
}

// Function to save words from the modal input and update the bingo card
function saveWords() {
  const inputText = document.getElementById('modal-input').value.trim();
  if (inputText !== '') {
      // Split input by new lines and trim each word
      const words = inputText
          .split('\n')
          .map(word => word.trim())
          .filter(word => word !== '');
      generateBingoCard(words);
  } else {
      // If input is empty, generate with random numbers
      generateBingoCard();
  }
  document.getElementById('modal-input').value = ''; // Clear the input
}

// Function to show the bingo section and hide the welcome section
function showBingoSection() {
  document.getElementById('welcome-section').style.display = 'none';
  document.getElementById('bingo-section').style.display = 'block';
}

// Function to save the current bingo card
function saveCurrentBingoCard() {
  const bingoCells = document.querySelectorAll('.bingo-cell');
  const cardData = [];

  bingoCells.forEach(cell => {
      cardData.push(cell.textContent);
  });

  // Get existing saved cards from localStorage
  let savedCards = JSON.parse(localStorage.getItem('savedBingoCards')) || [];

  // Save the new card
  savedCards.push(cardData);
  localStorage.setItem('savedBingoCards', JSON.stringify(savedCards));

  alert('Bingo card saved successfully!');
}

// Function to display saved bingo cards in the modal
function displaySavedCards() {
  const savedCardsList = document.getElementById('saved-cards-list');
  savedCardsList.innerHTML = ''; // Clear previous list

  let savedCards = JSON.parse(localStorage.getItem('savedBingoCards')) || [];

  if (savedCards.length === 0) {
      savedCardsList.innerHTML = '<li class="list-group-item">No saved bingo cards.</li>';
      return;
  }

  savedCards.forEach((card, index) => {
      const listItem = document.createElement('li');
      listItem.textContent = `Bingo Card ${index + 1}`;
      listItem.classList.add('list-group-item');
      listItem.style.cursor = 'pointer';
      listItem.addEventListener('click', () => {
          loadBingoCard(card);
          savedCardsModal.hide();
          showBingoSection();
      });
      savedCardsList.appendChild(listItem);
  });
}

// Function to load a bingo card
function loadBingoCard(cardData) {
  const bingoCells = document.querySelectorAll('.bingo-cell');
  bingoCells.forEach((cell, index) => {
      cell.textContent = cardData[index];
      cell.classList.remove('marked');
  });
}
