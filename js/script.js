/**
 * Cricket Player Guessing Game
 * A game where users guess a cricket player based on country hint and stat comparisons
 */

// Game state
let playerData = [];
let mysteryPlayer = null;
let attemptsRemaining = 5;
let gameOver = false;
let guessedPlayers = [];

// DOM elements
const countryHintElement = document.getElementById('country-hint');
const attemptsCountElement = document.getElementById('attempts-count');
const playerGuessInput = document.getElementById('player-guess');
const autocompleteList = document.getElementById('autocomplete-list');
const submitGuessButton = document.getElementById('submit-guess');
const feedbackContainer = document.getElementById('feedback-container');
const guessHistoryList = document.getElementById('guess-history');
const gameOverMessageElement = document.getElementById('game-over-message');
const modal = document.getElementById('modal');
const modalContent = document.getElementById('modal-content');
const closeModalButton = document.getElementById('close-modal');
const newGameButton = document.getElementById('new-game-btn');

// Initialize the game
async function initGame() {
    try {
        // Fetch player data
        const response = await fetch('clean_data_2.json');
        if (!response.ok) {
            throw new Error('Failed to load player data');
        }
        
        // Parse the JSON data
        // The data is in NDJSON format (each line is a valid JSON object)
        const text = await response.text();
        playerData = text.trim().split('\n').map(line => JSON.parse(line));
        
        // Start a new game
        startNewGame();
        
        // Set up event listeners
        setupEventListeners();
    } catch (error) {
        console.error('Error initializing game:', error);
        showErrorMessage('Failed to load the game. Please refresh the page.');
    }
}

// Start a new game
function startNewGame() {
    // Reset game state
    attemptsRemaining = 5;
    gameOver = false;
    guessedPlayers = [];
    
    // Select a random player as the mystery player
    const randomIndex = Math.floor(Math.random() * playerData.length);
    mysteryPlayer = playerData[randomIndex];
    
    // Update UI
    countryHintElement.innerHTML = `<span class="team-hint">${mysteryPlayer.Team}</span> <span class="format-hint">(${mysteryPlayer.Format})</span>`;
    attemptsCountElement.textContent = attemptsRemaining;
    playerGuessInput.value = '';
    feedbackContainer.innerHTML = '';
    guessHistoryList.innerHTML = '';
    gameOverMessageElement.classList.add('hidden');
    
    // Enable input and button
    playerGuessInput.disabled = false;
    submitGuessButton.disabled = false;
    
    console.log('New game started. Mystery player:', mysteryPlayer.Name, mysteryPlayer.Team, mysteryPlayer.Format);
}

// Set up event listeners
function setupEventListeners() {
    // Submit guess when button is clicked
    submitGuessButton.addEventListener('click', handleGuessSubmission);
    
    // Submit guess when Enter key is pressed
    playerGuessInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            handleGuessSubmission();
        }
    });
    
    // Show autocomplete suggestions as user types
    playerGuessInput.addEventListener('input', showAutocompleteSuggestions);
    
    // Show all player names when input field is clicked
    playerGuessInput.addEventListener('click', showAllPlayerNames);
    
    // Close autocomplete list when clicking outside
    document.addEventListener('click', (event) => {
        if (event.target !== playerGuessInput) {
            autocompleteList.innerHTML = '';
        }
    });
    
    // Start a new game when the New Game button is clicked
    newGameButton.addEventListener('click', () => {
        modal.classList.add('hidden');
        startNewGame();
    });
    
    // Close modal when close button is clicked
    closeModalButton.addEventListener('click', () => {
        modal.classList.add('hidden');
    });
}

// Show all player names when input field is clicked
function showAllPlayerNames() {
    // Clear previous suggestions
    autocompleteList.innerHTML = '';
    
    // Filter players by the mystery player's country and format
    const filteredPlayers = playerData
        .filter(player => player.Team === mysteryPlayer.Team && player.Format === mysteryPlayer.Format)
        .sort((a, b) => a.Name.localeCompare(b.Name));
    
    filteredPlayers.forEach(player => {
        const suggestionItem = document.createElement('div');
        suggestionItem.textContent = `${player.Name}`;
        suggestionItem.addEventListener('click', () => {
            playerGuessInput.value = player.Name;
            autocompleteList.innerHTML = '';
        });
        autocompleteList.appendChild(suggestionItem);
    });
}

// Show autocomplete suggestions based on input
function showAutocompleteSuggestions() {
    const input = playerGuessInput.value.trim();
    autocompleteList.innerHTML = '';
    if (input.length < 1) return;
    // Filter players by Team and Format
    const matchingPlayers = playerData
        .filter(player => 
            player.Team === mysteryPlayer.Team && 
            player.Format === mysteryPlayer.Format &&
            player.Name.toLowerCase().includes(input.toLowerCase())
        )
        .sort((a, b) => a.Name.localeCompare(b.Name));
    matchingPlayers.forEach(player => {
        const suggestionItem = document.createElement('div');
        suggestionItem.textContent = `${player.Name}`;
        suggestionItem.addEventListener('click', () => {
            playerGuessInput.value = player.Name;
            autocompleteList.innerHTML = '';
        });
        autocompleteList.appendChild(suggestionItem);
    });
}

// Handle guess submission
function handleGuessSubmission() {
    if (gameOver) return;
    
    const playerName = playerGuessInput.value.trim();
    
    // Validate input
    if (!playerName) {
        showErrorMessage('Please enter a player name');
        return;
    }
    
    // Find the guessed player in our data
    const guessedPlayer = playerData.find(
        player => player.Name.toLowerCase() === playerName.toLowerCase()
    );
    
    // Validate that the player exists in our data
    if (!guessedPlayer) {
        showErrorMessage('Player not found. Please select from the suggestions.');
        return;
    }
    
    // Check if player has already been guessed
    if (guessedPlayers.some(player => player.Name === guessedPlayer.Name)) {
        showErrorMessage('You already guessed this player. Try another one.');
        return;
    }
    
    // Add to guessed players
    guessedPlayers.push(guessedPlayer);
    
    // Check if the guess is correct
    if (guessedPlayer.Name === mysteryPlayer.Name) {
        handleCorrectGuess();
    } else {
        handleIncorrectGuess(guessedPlayer);
    }
    
    // Clear input and suggestions
    playerGuessInput.value = '';
    autocompleteList.innerHTML = '';
}

// Handle a correct guess
function handleCorrectGuess() {
    gameOver = true;
    
    // Show success message
    const message = `
        <h2>Congratulations!</h2>
        <p>You correctly guessed the mystery player: <strong>${mysteryPlayer.Name}</strong>!</p>
        <p>You solved it in ${6 - attemptsRemaining} ${attemptsRemaining === 5 ? 'attempt' : 'attempts'}.</p>
        <div class="player-stats">
            <p>Country: ${mysteryPlayer.Team}</p>
            <p>Format: ${mysteryPlayer.Format}</p>
            <p>Matches: ${mysteryPlayer.Matches}</p>
            <p>Runs: ${mysteryPlayer.Runs}</p>
            <p>Wickets: ${mysteryPlayer.Wickets}</p>
        </div>
    `;
    
    // Show in modal
    modalContent.innerHTML = message;
    modal.classList.remove('hidden');
    
    // Disable input and button
    playerGuessInput.disabled = true;
    submitGuessButton.disabled = true;
}

// Handle an incorrect guess
function handleIncorrectGuess(guessedPlayer) {
    // Decrease attempts
    attemptsRemaining--;
    attemptsCountElement.textContent = attemptsRemaining;
    
    // Add to guess history
    addToGuessHistory(guessedPlayer);
    
    // Show feedback
    showFeedback(guessedPlayer);
    
    // Check if game is over (no attempts left)
    if (attemptsRemaining === 0) {
        handleGameOver();
    }
}

// Add guessed player to history
function addToGuessHistory(guessedPlayer) {
    const listItem = document.createElement('li');
    listItem.innerHTML = `
        <span>${guessedPlayer.Name} (${guessedPlayer.Team})</span>
        <span>M: ${guessedPlayer.Matches} | R: ${guessedPlayer.Runs} | W: ${guessedPlayer.Wickets}</span>
    `;
    guessHistoryList.prepend(listItem);
}

// Show feedback comparing guessed player to mystery player
function showFeedback(guessedPlayer) {
    const feedbackItem = document.createElement('div');
    feedbackItem.className = 'feedback-item';
    
    // Compare stats
    const runsComparison = compareStats(guessedPlayer.Runs, mysteryPlayer.Runs);
    const wicketsComparison = compareStats(guessedPlayer.Wickets, mysteryPlayer.Wickets);
    const matchesComparison = compareStats(guessedPlayer.Matches, mysteryPlayer.Matches);
    
    feedbackItem.innerHTML = `
        <div class="feedback-title">${guessedPlayer.Name} (${guessedPlayer.Team})</div>
        <div class="stat-comparison">
            <div class="stat-item">
                <span class="stat-label">Runs:</span>
                <span class="${runsComparison.class}" title="${runsComparison.tooltip}">
                    <i class="fas fa-${runsComparison.icon}"></i>
                </span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Wickets:</span>
                <span class="${wicketsComparison.class}" title="${wicketsComparison.tooltip}">
                    <i class="fas fa-${wicketsComparison.icon}"></i>
                </span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Matches:</span>
                <span class="${matchesComparison.class}" title="${matchesComparison.tooltip}">
                    <i class="fas fa-${matchesComparison.icon}"></i>
                </span>
            </div>
        </div>
    `;
    
    feedbackContainer.prepend(feedbackItem);
}

// Compare stats and return appropriate text and class
function compareStats(guessedStat, mysteryStat) {
    if (guessedStat < mysteryStat) {
        return {
            text: "Mystery player has more",
            class: "higher",
            icon: "arrow-up",
            tooltip: "Mystery player has MORE than your guess"
        };
    } else if (guessedStat > mysteryStat) {
        return {
            text: "Mystery player has less",
            class: "lower",
            icon: "arrow-down",
            tooltip: "Mystery player has LESS than your guess"
        };
    } else {
        return {
            text: "Same as mystery player",
            class: "",
            icon: "equals",
            tooltip: "Mystery player has SAME as your guess"
        };
    }
}

// Handle game over (ran out of attempts)
function handleGameOver() {
    gameOver = true;
    
    // Show failure message
    const message = `
        <h2>Game Over!</h2>
        <p>You've run out of attempts.</p>
        <p>The mystery player was: <strong>${mysteryPlayer.Name}</strong> from ${mysteryPlayer.Team}.</p>
        <div class="player-stats">
            <p>Format: ${mysteryPlayer.Format}</p>
            <p>Matches: ${mysteryPlayer.Matches}</p>
            <p>Runs: ${mysteryPlayer.Runs}</p>
            <p>Wickets: ${mysteryPlayer.Wickets}</p>
        </div>
    `;
    
    // Show in modal
    modalContent.innerHTML = message;
    modal.classList.remove('hidden');
    
    // Disable input and button
    playerGuessInput.disabled = true;
    submitGuessButton.disabled = true;
}

// Show an error message
function showErrorMessage(message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'feedback-item';
    errorElement.innerHTML = `
        <div class="feedback-title" style="color: var(--error-color);">
            <i class="fas fa-exclamation-circle"></i> ${message}
        </div>
    `;
    
    // Add to feedback container
    feedbackContainer.prepend(errorElement);
    
    // Remove after 3 seconds
    setTimeout(() => {
        errorElement.remove();
    }, 3000);
}

// Initialize the game when the page is loaded
document.addEventListener('DOMContentLoaded', initGame);
