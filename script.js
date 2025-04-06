document.addEventListener('DOMContentLoaded', () => {
    // Game elements
    const welcomeScreen = document.getElementById('welcomeScreen');
    const gameScreen = document.getElementById('gameScreen');
    const resultsScreen = document.getElementById('resultsScreen');
    const playerNameInput = document.getElementById('playerName');
    const startButton = document.getElementById('startButton');
    const playerNameDisplay = document.getElementById('playerNameDisplay');
    const currentDepthDisplay = document.getElementById('currentDepth');
    const finalDepthDisplay = document.getElementById('finalDepth');
    const descentButton = document.getElementById('descentButton');
    const playAgainButton = document.getElementById('playAgainButton');
    const highScoreMessage = document.getElementById('highScoreMessage');
    const leaderboardList = document.getElementById('leaderboardList');
    const elevatorElement = document.getElementById('elevator');
    
    // Game variables
    let playerName = '';
    let currentDepth = 0;
    let isDescending = false;
    let descentSpeed = 0;
    let descentAcceleration = 0.05;
    let maxSpeed = 15;
    let descentInterval;
    let slowDownInterval;
    let gameActive = false;
    let startTime;
    let difficultyTimer;
    let inactivityTimer;
    let leaderboard = [];
    
    // Visual effects variables
    let shaftHeight;
    let particles = [];
    
    // Classes
    class Particle {
        constructor() {
            this.x = Math.random() * 100; // Random horizontal position (percent)
            this.y = 120; // Start below viewport
            this.size = Math.random() * 4 + 2;
            this.speed = Math.random() * 3 + 2;
            this.opacity = Math.random() * 0.5 + 0.3;
        }
        
        update(speedMultiplier) {
            this.y -= this.speed * speedMultiplier; // Move upward instead of downward
            return this.y > -20; // Return true if particle still in view
        }
        
        draw(container) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = `${this.x}%`;
            particle.style.top = `${this.y}%`;
            particle.style.width = `${this.size}px`;
            particle.style.height = `${this.size}px`;
            particle.style.opacity = this.opacity;
            container.appendChild(particle);
        }
    }
    
    // Load leaderboard from localStorage
    function loadLeaderboard() {
        const savedLeaderboard = localStorage.getItem('deepDescentLeaderboard');
        if (savedLeaderboard) {
            try {
                leaderboard = JSON.parse(savedLeaderboard);
                console.log('Leaderboard loaded:', leaderboard);
            } catch (e) {
                console.error('Error parsing leaderboard:', e);
                leaderboard = [];
            }
        }
    }
    
    // Save leaderboard to localStorage
    function saveLeaderboard() {
        try {
            localStorage.setItem('deepDescentLeaderboard', JSON.stringify(leaderboard));
            console.log('Leaderboard saved:', leaderboard);
        } catch (e) {
            console.error('Error saving leaderboard:', e);
        }
    }
    
    // Display leaderboard
    function displayLeaderboard() {
        leaderboardList.innerHTML = '';
        
        // Sort leaderboard by depth (highest first)
        const sortedLeaderboard = [...leaderboard].sort((a, b) => b.depth - a.depth);
        
        // Display top 10 entries
        const topEntries = sortedLeaderboard.slice(0, 10);
        
        if (topEntries.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'leaderboard-empty';
            emptyMessage.textContent = 'NO RECORDS YET';
            leaderboardList.appendChild(emptyMessage);
            return;
        }
        
        topEntries.forEach((entry, index) => {
            const entryElement = document.createElement('div');
            entryElement.className = 'leaderboard-entry';
            
            const rankElement = document.createElement('span');
            rankElement.className = 'leaderboard-rank';
            rankElement.textContent = `${index + 1}.`;
            
            const nameElement = document.createElement('span');
            nameElement.className = 'leaderboard-name';
            nameElement.textContent = entry.name;
            
            const depthElement = document.createElement('span');
            depthElement.className = 'leaderboard-depth';
            depthElement.textContent = `${Math.floor(entry.depth)}m`;
            
            entryElement.appendChild(rankElement);
            entryElement.appendChild(nameElement);
            entryElement.appendChild(depthElement);
            leaderboardList.appendChild(entryElement);
        });
    }
    
    // Check if current score is a high score
    function checkHighScore(depth) {
        // Only consider scores with valid player names
        if (!playerName.trim()) return false;
        
        // Add current score to leaderboard
        const newScore = {
            name: playerName,
            depth: depth,
            date: new Date().toISOString()
        };
        
        leaderboard.push(newScore);
        console.log('Added new score:', newScore);
        
        // Sort leaderboard
        const sortedLeaderboard = [...leaderboard].sort((a, b) => b.depth - a.depth);
        
        // Check if current score is in top 10
        const playerRank = sortedLeaderboard.findIndex(entry => 
            entry.name === newScore.name && 
            Math.abs(entry.depth - newScore.depth) < 0.1 &&
            entry.date === newScore.date);
        
        console.log('Player rank:', playerRank);
        
        // Limit leaderboard to 50 entries
        leaderboard = sortedLeaderboard.slice(0, 50);
        saveLeaderboard();
        
        // Return true if score is in top 10
        return playerRank < 10;
    }
    
    // Create particles for speed effect
    function createParticles() {
        const shaft = document.querySelector('.elevator-shaft');
        shaft.innerHTML = '';
        shaft.appendChild(elevatorElement);
        
        // Add new particles based on speed
        const particleCount = Math.floor(descentSpeed);
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
        
        // Update and draw existing particles
        particles = particles.filter(particle => {
            const stillVisible = particle.update(descentSpeed / 5);
            if (stillVisible) {
                particle.draw(shaft);
            }
            return stillVisible;
        });
        
        // Limit particles array size
        if (particles.length > 100) {
            particles = particles.slice(-100);
        }
    }
    
    // Start the game
    function startGame() {
        playerName = playerNameInput.value.trim() || 'ANONYMOUS';
        playerNameDisplay.textContent = playerName;
        
        welcomeScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        
        // Clear any existing particles
        const shaft = document.querySelector('.elevator-shaft');
        shaft.innerHTML = '';
        shaft.appendChild(elevatorElement);
        particles = [];
        
        // Reset game variables
        currentDepth = 0;
        descentSpeed = 0;
        isDescending = false;
        gameActive = true;
        currentDepthDisplay.textContent = '0';
        
        shaftHeight = document.querySelector('.elevator-shaft').offsetHeight;
        
        // Clear any existing timers
        if (descentInterval) clearInterval(descentInterval);
        if (slowDownInterval) clearInterval(slowDownInterval);
        if (difficultyTimer) clearInterval(difficultyTimer);
        if (inactivityTimer) clearTimeout(inactivityTimer);
        
        startTime = Date.now();
        
        // Set up game loop for particle effects
        descentInterval = setInterval(() => {
            if (gameActive) {
                createParticles();
            }
        }, 50);
        
        // Set difficulty increase timer
        difficultyTimer = setInterval(() => {
            if (gameActive) {
                // Increase max speed every 10 seconds
                maxSpeed += 2;
                // Flash the depth display to indicate difficulty increase
                currentDepthDisplay.style.color = 'var(--danger-color)';
                setTimeout(() => {
                    currentDepthDisplay.style.color = 'var(--depth-color)';
                }, 200);
            }
        }, 10000);
        
        // Set maximum game duration (3 minutes)
        setTimeout(() => {
            if (gameActive) {
                endGame();
            }
        }, 180000); // 3 minutes
    }
    
    // End the game and show results
    function endGame() {
        gameActive = false;
        isDescending = false;
        
        // Clear all intervals
        if (descentInterval) clearInterval(descentInterval);
        if (slowDownInterval) clearInterval(slowDownInterval);
        if (difficultyTimer) clearInterval(difficultyTimer);
        if (inactivityTimer) clearTimeout(inactivityTimer);
        
        gameScreen.classList.add('hidden');
        resultsScreen.classList.remove('hidden');
        
        const finalDepth = Math.floor(currentDepth);
        finalDepthDisplay.textContent = finalDepth;
        
        // Check if it's a high score
        const isHighScore = checkHighScore(currentDepth);
        if (isHighScore) {
            highScoreMessage.textContent = 'NEW RECORD!';
        } else {
            highScoreMessage.textContent = '';
        }
        
        displayLeaderboard();
    }
    
    // Handle descent button press
    function startDescent() {
        if (!isDescending && gameActive) {
            isDescending = true;
            
            // Clear any existing inactivity timer
            if (inactivityTimer) {
                clearTimeout(inactivityTimer);
                inactivityTimer = null;
            }
            
            // Process descent
            const updateInterval = setInterval(() => {
                if (isDescending && gameActive) {
                    // Increase speed with acceleration, up to max speed
                    descentSpeed = Math.min(descentSpeed + descentAcceleration, maxSpeed);
                    
                    // Update depth
                    currentDepth += descentSpeed;
                    currentDepthDisplay.textContent = Math.floor(currentDepth);
                } else {
                    clearInterval(updateInterval);
                }
            }, 50);
        }
    }
    
    // Handle descent button release
    function stopDescent() {
        if (isDescending) {
            isDescending = false;
            
            // Decrease speed gradually
            slowDownInterval = setInterval(() => {
                descentSpeed = Math.max(descentSpeed - 0.2, 0);
                
                // Update depth
                if (descentSpeed > 0) {
                    currentDepth += descentSpeed;
                    currentDepthDisplay.textContent = Math.floor(currentDepth);
                } else {
                    clearInterval(slowDownInterval);
                    
                    // Set inactivity timer - end game after 3 seconds of inactivity
                    if (gameActive && !inactivityTimer) {
                        inactivityTimer = setTimeout(() => {
                            if (gameActive && !isDescending) {
                                console.log("Ending game due to inactivity");
                                endGame();
                            }
                        }, 3000);
                    }
                }
            }, 50);
        }
    }
    
    // Add event listeners
    startButton.addEventListener('click', startGame);
    descentButton.addEventListener('mousedown', startDescent);
    descentButton.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Prevent double events
        startDescent();
    });
    
    document.addEventListener('mouseup', stopDescent);
    document.addEventListener('touchend', (e) => {
        if (e.target === descentButton) {
            e.preventDefault();
        }
        stopDescent();
    });
    
    playAgainButton.addEventListener('click', () => {
        resultsScreen.classList.add('hidden');
        welcomeScreen.classList.remove('hidden');
        playerNameInput.value = playerName;
    });
    
    // Prevent context menu on long press
    document.addEventListener('contextmenu', (e) => {
        if (e.target === descentButton) {
            e.preventDefault();
        }
    });
    
    // Load leaderboard from localStorage
    loadLeaderboard();
    // Display initial leaderboard
    displayLeaderboard();
}); 