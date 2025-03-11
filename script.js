class AnimalSudoku {
    constructor() {
        this.grid = Array(9).fill(null);
        this.solution = [];
        this.animals = ['🐱', '🐶', '🐦'];
        this.currentMode = 'easy';
        this.playerName = '';
        this.startTime = null;
        this.lives = 5;
        this.setupPlayerName();
    }

    setupPlayerName() {
        const modal = document.getElementById('playerNameModal');
        const input = document.getElementById('playerNameInput');
        const startBtn = document.getElementById('startGameBtn');
        
        startBtn.addEventListener('click', () => {
            const name = input.value.trim();
            if (name) {
                this.playerName = name;
                document.getElementById('currentPlayer').textContent = name;
                modal.style.display = 'none';
                this.setupGame();
                this.setupEventListeners();
                this.loadSounds();
                this.updateLeaderboard(this.currentMode);
            }
        });

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                startBtn.click();
            }
        });
    }

    setupGame() {
        this.createGrid();
        this.generateSolution();
        this.setInitialState();
        this.startTime = new Date();
        this.resetLives();
    }

    resetLives() {
        this.lives = 5;
        const hearts = document.querySelectorAll('.heart');
        hearts.forEach(heart => {
            heart.classList.remove('lost', 'losing');
        });
    }

    loseLife() {
        if (this.lives > 0) {
            this.lives--;
            const hearts = document.querySelectorAll('.heart');
            const heart = hearts[this.lives];
            heart.classList.add('losing');
            setTimeout(() => {
                heart.classList.remove('losing');
                heart.classList.add('lost');
            }, 500);

            if (this.lives === 0) {
                setTimeout(() => {
                    alert('Game Over! You ran out of lives. Let\'s try again!');
                    this.setInitialState();
                    this.resetLives();
                }, 1000);
            }
        }
    }

    createGrid() {
        const gridContainer = document.getElementById('sudokuGrid');
        gridContainer.innerHTML = '';
        
        for (let i = 0; i < 9; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.index = i;
            cell.addEventListener('dragover', (e) => this.handleDragOver(e));
            cell.addEventListener('drop', (e) => this.handleDrop(e, i));
            gridContainer.appendChild(cell);
        }
    }

    generateSolution() {
        this.solution = [
            '🐱', '🐶', '🐦',
            '🐦', '🐱', '🐶',
            '🐶', '🐦', '🐱'
        ];
    }

    setInitialState() {
        this.grid = Array(9).fill(null);
        switch(this.currentMode) {
            case 'easy':
                this.setHints(5);
                break;
            case 'medium':
                this.setHints(3);
                break;
            case 'hard':
                break;
        }
        this.updateDisplay();
        this.startTime = new Date();
    }

    setHints(count) {
        const positions = this.shuffleArray([...Array(9).keys()]).slice(0, count);
        positions.forEach(pos => {
            this.grid[pos] = this.solution[pos];
        });
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    updateDisplay() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach((cell, index) => {
            cell.textContent = this.grid[index] || '';
            cell.className = 'cell';
            if (this.grid[index]) {
                cell.classList.add('filled');
            }
        });
    }

    loadSounds() {
        this.correctSound = document.getElementById('correctSound');
        this.incorrectSound = document.getElementById('incorrectSound');
    }

    playSound(isCorrect) {
        if (isCorrect) {
            this.correctSound.play().catch(() => {});
        } else {
            this.incorrectSound.play().catch(() => {});
        }
    }

    setupEventListeners() {
        // Mode buttons
        document.getElementById('easyMode').addEventListener('click', () => {
            this.currentMode = 'easy';
            this.setInitialState();
            this.resetLives();
            this.updateLeaderboard('easy');
        });
        document.getElementById('mediumMode').addEventListener('click', () => {
            this.currentMode = 'medium';
            this.setInitialState();
            this.resetLives();
            this.updateLeaderboard('medium');
        });
        document.getElementById('hardMode').addEventListener('click', () => {
            this.currentMode = 'hard';
            this.setInitialState();
            this.resetLives();
            this.updateLeaderboard('hard');
        });

        // Leaderboard filter buttons
        document.getElementById('easyLeaderboard').addEventListener('click', (e) => {
            this.updateLeaderboardButtons(e.target);
            this.updateLeaderboard('easy');
        });
        document.getElementById('mediumLeaderboard').addEventListener('click', (e) => {
            this.updateLeaderboardButtons(e.target);
            this.updateLeaderboard('medium');
        });
        document.getElementById('hardLeaderboard').addEventListener('click', (e) => {
            this.updateLeaderboardButtons(e.target);
            this.updateLeaderboard('hard');
        });

        // Drag and drop for animals
        const animals = document.querySelectorAll('.animal');
        animals.forEach(animal => {
            animal.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', animal.textContent);
            });
        });
    }

    updateLeaderboardButtons(clickedButton) {
        document.querySelectorAll('.leaderboard-filters button').forEach(btn => {
            btn.classList.remove('active');
        });
        clickedButton.classList.add('active');
    }

    handleDragOver(e) {
        e.preventDefault();
    }

    handleDrop(e, index) {
        e.preventDefault();
        if (this.grid[index] !== null || this.lives === 0) return;

        const animal = e.dataTransfer.getData('text/plain');
        const isCorrect = animal === this.solution[index];

        this.grid[index] = animal;
        const cell = e.target;
        cell.textContent = animal;
        
        if (isCorrect) {
            cell.classList.add('correct');
            cell.classList.add('celebration');
            this.playSound(true);
            setTimeout(() => cell.classList.remove('celebration'), 500);

            if (this.checkWin()) {
                const endTime = new Date();
                const timeTaken = (endTime - this.startTime) / 1000;
                this.saveScore(timeTaken);
                setTimeout(() => {
                    alert(`Congratulations ${this.playerName}! You helped all the animal friends find their homes! 🎉\nTime: ${timeTaken.toFixed(1)} seconds\nLives remaining: ${this.lives}`);
                    this.setInitialState();
                    this.resetLives();
                }, 500);
            }
        } else {
            cell.classList.add('incorrect');
            this.playSound(false);
            this.loseLife();
            setTimeout(() => {
                cell.classList.remove('incorrect');
                cell.textContent = '';
                this.grid[index] = null;
            }, 1000);
        }
    }

    checkWin() {
        return this.grid.every((cell, index) => cell === this.solution[index]);
    }

    saveScore(timeTaken) {
        const scores = JSON.parse(localStorage.getItem(`animalSudoku_${this.currentMode}`) || '[]');
        scores.push({
            name: this.playerName,
            time: timeTaken,
            lives: this.lives,
            date: new Date().toISOString()
        });
        
        scores.sort((a, b) => a.time - b.time);
        scores.splice(10);
        
        localStorage.setItem(`animalSudoku_${this.currentMode}`, JSON.stringify(scores));
        this.updateLeaderboard(this.currentMode);
    }

    updateLeaderboard(mode) {
        const scores = JSON.parse(localStorage.getItem(`animalSudoku_${mode}`) || '[]');
        const leaderboardList = document.getElementById('leaderboardList');
        leaderboardList.innerHTML = '';

        if (scores.length === 0) {
            leaderboardList.innerHTML = '<div class="leaderboard-entry">No scores yet!</div>';
            return;
        }

        scores.forEach((score, index) => {
            const entry = document.createElement('div');
            entry.className = 'leaderboard-entry';
            const date = new Date(score.date);
            const formattedDate = date.toLocaleDateString();
            
            entry.innerHTML = `
                <span class="entry-rank">#${index + 1}</span>
                <span class="entry-name">${score.name}</span>
                <span class="entry-date">${score.time.toFixed(1)}s - ${score.lives || 5} ❤️ - ${formattedDate}</span>
            `;
            leaderboardList.appendChild(entry);
        });
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new AnimalSudoku();
});
