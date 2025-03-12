class SudokuGame {
    constructor() {
        this.currentMode = 'easy';
        this.gridSizes = { easy: 3, medium: 4, hard: 5 };
        this.animals = {
            easy: ['🐦', '🌸', '🐠'],
            medium: ['🐦', '🌸', '🐠', '🐢'],
            hard: ['🐦', '🌸', '🐠', '🐢', '🐼']
        };
        this.selectedAnimal = null;
        this.board = [];
        this.solution = [];
        this.hearts = 5;
        this.hintsLeft = 3;
        this.timer = null;
        this.startTime = null;
        this.bestTimes = this.loadBestTimes();
        this.tutorialPausedTimer = false;
        this.init();
    }

    loadBestTimes() {
        const savedTimes = localStorage.getItem('sudokuBestTimes');
        return savedTimes ? JSON.parse(savedTimes) : {
            easy: null,
            medium: null,
            hard: null
        };
    }

    saveBestTimes() {
        localStorage.setItem('sudokuBestTimes', JSON.stringify(this.bestTimes));
    }

    updateBestTimesDisplay() {
        Object.keys(this.bestTimes).forEach(mode => {
            const time = this.bestTimes[mode];
            const element = document.getElementById(`best-time-${mode}`);
            element.textContent = time ? this.formatTime(time) : '--:--';
        });
    }

    startTimer() {
        this.startTime = Date.now();
        this.updateTimer();
        this.timer = setInterval(() => this.updateTimer(), 1000);
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    updateTimer() {
        const currentTime = Math.floor((Date.now() - this.startTime) / 1000);
        document.getElementById('current-time').textContent = this.formatTime(currentTime);
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    checkAndUpdateBestTime() {
        const currentTime = Math.floor((Date.now() - this.startTime) / 1000);
        if (!this.bestTimes[this.currentMode] || currentTime < this.bestTimes[this.currentMode]) {
            this.bestTimes[this.currentMode] = currentTime;
            this.saveBestTimes();
            this.updateBestTimesDisplay();
            return true;
        }
        return false;
    }

    generateSolution(size) {
        // Initialize empty solution grid
        this.solution = Array(size).fill().map(() => Array(size).fill(null));
        
        // Helper function to check if an animal can be placed
        const isValid = (grid, row, col, animal) => {
            // Check row
            for (let x = 0; x < size; x++) {
                if (grid[row][x] === animal) return false;
            }
            
            // Check column
            for (let x = 0; x < size; x++) {
                if (grid[x][col] === animal) return false;
            }
            
            return true;
        };
        
        // Helper function to solve the grid
        const solve = (grid, row = 0, col = 0) => {
            if (col === size) {
                row++;
                col = 0;
            }
            if (row === size) return true;
            
            const currentAnimals = this.animals[this.currentMode];
            const shuffledAnimals = [...currentAnimals].sort(() => Math.random() - 0.5);
            
            for (const animal of shuffledAnimals) {
                if (isValid(grid, row, col, animal)) {
                    grid[row][col] = animal;
                    if (solve(grid, row, col + 1)) return true;
                    grid[row][col] = null;
                }
            }
            return false;
        };
        
        // Generate valid solution
        solve(this.solution);
        
        // Initialize empty board
        this.board = Array(size).fill().map(() => Array(size).fill(null));
        
        // Place exactly 3 initial animals that follow Sudoku rules
        const positions = [];
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                positions.push([i, j]);
            }
        }
        
        // Shuffle positions and place 3 random animals
        positions.sort(() => Math.random() - 0.5);
        const initialCount = 3;
        let placed = 0;
        let index = 0;
        
        while (placed < initialCount && index < positions.length) {
            const [row, col] = positions[index];
            // Only place if it doesn't conflict with other placed animals
            if (isValid(this.board, row, col, this.solution[row][col])) {
                this.board[row][col] = this.solution[row][col];
                placed++;
            }
            index++;
        }
    }

    setupBoard() {
        const gameBoard = document.querySelector('.game-board');
        const size = this.gridSizes[this.currentMode];
        
        // Set the current mode as a data attribute
        gameBoard.dataset.mode = this.currentMode;
        
        // Clear the board
        gameBoard.innerHTML = '';

        // Create cells
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                
                if (this.board[i][j]) {
                    cell.textContent = this.board[i][j];
                    cell.classList.add('fixed');
                }

                cell.addEventListener('click', () => this.handleCellClick(cell, i, j));
                gameBoard.appendChild(cell);
            }
        }
    }

    setupHintButton() {
        const hintBtn = document.getElementById('hint');
        hintBtn.textContent = `Hint (${this.hintsLeft} left) 💡`;
        hintBtn.addEventListener('click', () => {
            if (this.hintsLeft > 0) {
                const size = this.gridSizes[this.currentMode];
                const emptyCells = [];
                
                // Find empty cells
                for (let i = 0; i < size; i++) {
                    for (let j = 0; j < size; j++) {
                        if (!this.board[i][j]) {
                            emptyCells.push({row: i, col: j});
                        }
                    }
                }
                
                if (emptyCells.length > 0) {
                    // Pick random empty cell
                    const hint = emptyCells[Math.floor(Math.random() * emptyCells.length)];
                    const correctAnimal = this.solution[hint.row][hint.col];
                    
                    // Fill the cell
                    this.board[hint.row][hint.col] = correctAnimal;
                    const cell = document.querySelector(`[data-row="${hint.row}"][data-col="${hint.col}"]`);
                    cell.textContent = correctAnimal;
                    cell.classList.add('correct', 'fixed', 'hint-reveal');
                    
                    // Update hint counter
                    this.hintsLeft--;
                    hintBtn.textContent = `Hint (${this.hintsLeft} left) 💡`;
                    
                    if (this.hintsLeft === 0) {
                        hintBtn.disabled = true;
                    }

                    // Show feedback
                    this.showFeedback('Here\'s a hint! 🌟', true);
                }
            }
        });
    }

    showFeedback(message, isCorrect) {
        const feedback = document.createElement('div');
        feedback.className = 'feedback';
        feedback.textContent = message;
        document.body.appendChild(feedback);
        setTimeout(() => feedback.remove(), 2000);
    }

    init() {
        this.setupModeButtons();
        this.setupAnimalSelector();
        this.setupNewGameButton();
        this.setupHintButton();
        this.setupTutorial();
        this.updateBestTimesDisplay();
        this.newGame();
    }

    setupTutorial() {
        const howToPlayBtn = document.getElementById('how-to-play');
        const tutorialBox = document.getElementById('tutorial-box');
        const closeBtn = document.getElementById('close-tutorial');

        // Show tutorial on button click
        howToPlayBtn.addEventListener('click', () => {
            tutorialBox.classList.remove('hidden');
            // Pause the timer if it's running
            if (this.timer) {
                this.stopTimer();
                this.tutorialPausedTimer = true;
            }
        });

        // Close tutorial on close button click
        closeBtn.addEventListener('click', () => {
            tutorialBox.classList.add('hidden');
            // Resume timer if it was paused by tutorial
            if (this.tutorialPausedTimer) {
                this.startTimer();
                this.tutorialPausedTimer = false;
            }
        });

        // Close tutorial when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === tutorialBox) {
                tutorialBox.classList.add('hidden');
                // Resume timer if it was paused by tutorial
                if (this.tutorialPausedTimer) {
                    this.startTimer();
                    this.tutorialPausedTimer = false;
                }
            }
        });

        // Show tutorial automatically on first visit
        if (!localStorage.getItem('tutorialShown')) {
            tutorialBox.classList.remove('hidden');
            localStorage.setItem('tutorialShown', 'true');
        }
    }

    handleCellClick(cell, row, col) {
        // Start timer on first move if not already started
        if (!this.timer && !cell.classList.contains('fixed')) {
            this.startTimer();
        }

        if (!this.selectedAnimal) {
            this.showFeedback('Pick an animal friend first! 🌟', false);
            return;
        }
        
        if (cell.classList.contains('fixed')) {
            this.showFeedback('This spot is taken! Try another! 🌈', false);
            return;
        }
        
        // Place the animal
        this.board[row][col] = this.selectedAnimal;
        cell.textContent = this.selectedAnimal;
        
        // Check if correct
        if (this.selectedAnimal === this.solution[row][col]) {
            cell.classList.add('correct');
            this.showFeedback('Perfect match! 🎉', true);
            
            // Check if game is won
            if (this.checkWin()) {
                this.stopTimer();
                const isNewBestTime = this.checkAndUpdateBestTime();
                setTimeout(() => {
                    let message = '🎉 Wonderful job! All animal friends found their homes! 🌟';
                    if (isNewBestTime) {
                        message += '\n\n🏆 NEW BEST TIME! 🏆';
                    }
                    alert(message);
                    this.newGame();
                }, 500);
            }
        } else {
            cell.classList.add('wrong');
            this.hearts--;
            this.updateHearts();
            this.showFeedback('Try again! 💝', false);
            
            setTimeout(() => {
                cell.classList.remove('wrong');
                cell.textContent = '';
                this.board[row][col] = null;
            }, 500);

            if (this.hearts === 0) {
                this.stopTimer();
                setTimeout(() => {
                    alert('💝 Don\'t worry! Let\'s try again! 💝');
                    this.newGame();
                }, 500);
            }
        }
    }

    checkWin() {
        const size = this.gridSizes[this.currentMode];
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                if (this.board[i][j] !== this.solution[i][j]) {
                    return false;
                }
            }
        }
        return true;
    }

    updateHearts() {
        const hearts = document.querySelectorAll('.hearts span');
        hearts.forEach((heart, index) => {
            heart.textContent = index < this.hearts ? '❤️' : '💔';
            heart.classList.toggle('lost', index >= this.hearts);
        });
    }

    setupModeButtons() {
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentMode = btn.dataset.mode;
                this.newGame();
            });
        });
    }

    setupAnimalSelector() {
        const selector = document.querySelector('.animal-selector');
        selector.innerHTML = '';
        
        const currentAnimals = this.animals[this.currentMode];
        currentAnimals.forEach(animal => {
            const option = document.createElement('div');
            option.className = 'animal-option';
            option.textContent = animal;
            option.addEventListener('click', () => this.selectAnimal(animal));
            selector.appendChild(option);
        });
    }

    selectAnimal(animal) {
        this.selectedAnimal = animal;
        document.querySelectorAll('.animal-option').forEach(option => {
            option.classList.toggle('selected', option.textContent === animal);
        });
    }

    setupNewGameButton() {
        document.getElementById('new-game').addEventListener('click', () => {
            this.newGame();
        });
    }

    newGame() {
        this.board = [];
        this.solution = [];
        this.hearts = 5;
        this.hintsLeft = 3;
        this.selectedAnimal = null;
        this.stopTimer();
        document.getElementById('current-time').textContent = '00:00';
        
        // Reset hint button
        const hintBtn = document.getElementById('hint');
        hintBtn.textContent = `Hint (${this.hintsLeft} left) 💡`;
        hintBtn.disabled = false;
        
        // Setup new game
        const size = this.gridSizes[this.currentMode];
        this.generateSolution(size);
        this.setupBoard();
        this.updateHearts();
        this.setupAnimalSelector();
    }
}

// Start the game
new SudokuGame();
