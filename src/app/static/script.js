// script.js

(function() {
  // Wait for the DOM to fully load before running scripts
  document.addEventListener('DOMContentLoaded', () => {
    initPage();

    // Initialize Bootstrap modals
    const editModalElement = document.getElementById('modal');
    let editModal;
    if (editModalElement) {
      editModal = new bootstrap.Modal(editModalElement);
    }

    const savedCardsModalElement = document.getElementById('saved-cards-modal');
    let savedCardsModal;
    if (savedCardsModalElement) {
      savedCardsModal = new bootstrap.Modal(savedCardsModalElement);
    }

    // Store the selection of bingo cells
    const bingoCells = document.querySelectorAll('.bingo-cell');

    // Attach event listener to the bingo board using event delegation
    const bingoBoard = document.getElementById('bingo-board');
    if (bingoBoard) {
      bingoBoard.addEventListener('click', (event) => {
        const cell = event.target;
        if (cell.classList.contains('bingo-cell')) {
          cell.classList.toggle('marked');
          checkBingoWin();
        }
      });
    }

    

    // Event listener for the "Create New Bingo Card" button
    const createBtn = document.getElementById('create-btn');
    if (createBtn && editModal) {
      createBtn.addEventListener('click', () => {
        editModal.show();
      });
    }

    // Event listener for the "Edit Words" button
    const editBtn = document.getElementById('edit-btn');
    if (editBtn && editModal) {
      editBtn.addEventListener('click', () => {
        editModal.show();
      });
    }

    // Event listener for the "Save" button in the Edit Modal
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn && editModal) {
      saveBtn.addEventListener('click', () => {
        saveWords();
        editModal.hide();
      });
    }

    // Event listener for the "Print" button
    const printBtn = document.getElementById('print-btn');
    if (printBtn) {
      printBtn.addEventListener('click', () => {
        window.print();
      });
    }

    // Event listener for the "View Saved Cards" button
    const viewSavedBtn = document.getElementById('view-saved-btn');
    if (viewSavedBtn && savedCardsModal) {
      viewSavedBtn.addEventListener('click', () => {
        displaySavedCards(); // Function to populate the saved cards list
        savedCardsModal.show();
      });
    }

    // Event listener for the "Save Bingo Card" button
    const saveCardBtn = document.getElementById('save-card-btn');
    if (saveCardBtn) {
      saveCardBtn.addEventListener('click', () => {
        saveCurrentBingoCard();
      });
    }
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

      // Remove 'marked' class
      cell.classList.remove('marked');
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

      if (words.length < 24) {
        alert('Please enter at least 24 words.');
        return;
      }

      generateBingoCard(words);
    } else {
      // If input is empty, generate with random numbers
      generateBingoCard();
    }
    document.getElementById('modal-input').value = ''; // Clear the input
  }

  // Function to show the bingo section and hide the welcome section
  function showBingoSection() {
    const welcomeSection = document.getElementById('welcome-section');
    if (welcomeSection) {
      welcomeSection.style.display = 'none';
    }
    const bingoSection = document.getElementById('bingo-section');
    if (bingoSection) {
      bingoSection.style.display = 'block';
    }
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

    // Implement a limit on the number of saved cards
    const maxCards = 50;
    if (savedCards.length >= maxCards) {
      savedCards.shift(); // Remove the oldest card
    }

    // Save the new card
    savedCards.push(cardData);
    localStorage.setItem('savedBingoCards', JSON.stringify(savedCards));

    alert('Bingo card saved successfully!');
  }

  // Function to display saved bingo cards in the modal
  function displaySavedCards() {
    const savedCardsList = document.getElementById('saved-cards-list');
    if (!savedCardsList) return;
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

  // Initialize the page
  function initPage() {
    // Show the welcome section and hide the bingo section
    const welcomeSection = document.getElementById('welcome-section');
    if (welcomeSection) {
      welcomeSection.style.display = 'block';
    }
    const bingoSection = document.getElementById('bingo-section');
    if (bingoSection) {
      bingoSection.style.display = 'none';
    }
  }

  function checkBingoWin() {
    const bingoCells = document.querySelectorAll('.bingo-cell');
    const size = 5; // Assuming a 5x5 bingo grid
    let cellArray = [];
  
    // Convert NodeList to a 2D array representing the bingo grid
    for (let i = 0; i < size; i++) {
      cellArray[i] = [];
      for (let j = 0; j < size; j++) {
        const index = i * size + j;
        cellArray[i][j] = bingoCells[index].classList.contains('marked');
      }
    }
  
    // Check rows and columns
    for (let i = 0; i < size; i++) {
      let rowWin = true;
      let colWin = true;
  
      for (let j = 0; j < size; j++) {
        // Check row
        if (!cellArray[i][j]) {
          rowWin = false;
        }
        // Check column
        if (!cellArray[j][i]) {
          colWin = false;
        }
      }
  
      if (rowWin || colWin) {
        displayWinMessage();
        return;
      }
    }
  
    // Check diagonals
    let diagWin1 = true;
    let diagWin2 = true;
    for (let i = 0; i < size; i++) {
      if (!cellArray[i][i]) {
        diagWin1 = false;
      }
      if (!cellArray[i][size - i - 1]) {
        diagWin2 = false;
      }
    }
  
    if (diagWin1 || diagWin2) {
      displayWinMessage();
      return;
    }
  
    // No win found
  }

  function displayWinMessage() {
    alert('BINGO! You have a winning card!');
  }


})();
