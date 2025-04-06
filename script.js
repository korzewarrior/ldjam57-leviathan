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
    const playAgainButton = document.getElementById('playAgainButton');
    const highScoreMessage = document.getElementById('highScoreMessage');
    const leaderboardList = document.getElementById('leaderboardList');
    const elevatorElement = document.getElementById('elevator');
    
    // Game variables
    let playerName = '';
    let currentDepth = 0;
    let descentSpeed = 0;
    let minSpeed = 3; // Minimum speed when braking hard (increased for better gameplay)
    let maxSpeed = 20; // Increased for more exciting gameplay
    let acceleration = 0.15;
    let deceleration = 0.3; // Increased for better braking
    let isBraking = false;
    let gameInterval;
    let obstacleInterval;
    let difficultyTimer;
    let gameActive = false;
    let leaderboard = [];
    let shaftWidth; // Width of the elevator shaft
    let shaftHeight; // Height of the elevator shaft
    let elevatorX = 50; // % position horizontally
    let elevatorWidth = 70; // px - updated to match CSS
    let elevatorHeight = 70; // px - updated to match CSS
    let obstacles = [];
    let particles = [];
    let lastMouseX = 0;
    let difficultyLevel = 1;
    let lastObstacleTime = 0;
    let minObstacleSpacing = 4000; // Increased minimum time between obstacles in ms
    const movementFactor = 0.2; // Consistency factor for visual movement
    
    // Classes
    class Particle {
        constructor() {
            this.x = Math.random() * 100; // Random horizontal position (percent)
            this.y = 120; // Start below viewport
            this.size = Math.random() * 4 + 2;
            this.speed = Math.random() * 1.5 + 1; // Reduced from Math.random() * 3 + 2 for better pacing
            this.opacity = Math.random() * 0.5 + 0.3;
        }
        
        update(speedMultiplier) {
            // Use the same movement factor as obstacles for visual consistency
            this.y -= this.speed * speedMultiplier * movementFactor;
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
    
    class Obstacle {
        constructor(difficulty) {
            this.width = Math.random() * 30 + 20; // Width between 20% and 50% of shaft
            // Gap is inversely proportional to difficulty (harder = smaller gap)
            this.gapWidth = Math.max(30 - (difficulty * 1.5), 20); // Made gaps slightly larger for better playability
            this.gapPosition = Math.random() * (100 - this.gapWidth); // % position of gap
            this.y = 120; // Start below viewport
            this.passed = false;
            this.height = 15 + Math.random() * 5; // Varied height for more visual interest
        }
        
        update(speedMultiplier) {
            // Use a consistent movement factor for visual cohesion
            this.y -= speedMultiplier * movementFactor;
            return this.y > -20; // Return true if obstacle still in view
        }
        
        draw(container) {
            // Left part of obstacle
            const leftPart = document.createElement('div');
            leftPart.className = 'obstacle';
            leftPart.style.left = '0';
            leftPart.style.top = `${this.y}%`;
            leftPart.style.width = `${this.gapPosition}%`;
            leftPart.style.height = `${this.height}px`;
            
            // Right part of obstacle
            const rightPart = document.createElement('div');
            rightPart.className = 'obstacle';
            rightPart.style.left = `${this.gapPosition + this.gapWidth}%`;
            rightPart.style.top = `${this.y}%`;
            rightPart.style.width = `${100 - (this.gapPosition + this.gapWidth)}%`;
            rightPart.style.height = `${this.height}px`;
            
            container.appendChild(leftPart);
            container.appendChild(rightPart);
        }
        
        checkCollision(elevatorX, elevatorWidth, elevatorHeight, shaftWidth) {
            // Elevator vertical position - now at 20% from top
            const elevatorTop = 20 - (elevatorHeight / 2);
            const elevatorBottom = 20 + (elevatorHeight / 2);
            
            // Only check collision when obstacle is near elevator's level (vertically)
            if (this.y > elevatorTop && this.y < elevatorBottom) {
                // Convert elevator's center position from percentage to actual position
                const elevatorLeft = (elevatorX / 100) * shaftWidth - (elevatorWidth / 2);
                const elevatorRight = elevatorLeft + elevatorWidth;
                
                // Calculate obstacle edges in actual pixels
                const gapLeft = (this.gapPosition / 100) * shaftWidth;
                const gapRight = ((this.gapPosition + this.gapWidth) / 100) * shaftWidth;
                
                // Check if elevator is within the gap
                if (elevatorRight < gapLeft || elevatorLeft > gapRight) {
                    return true; // Collision detected
                }
            }
            
            // Mark obstacle as passed once it's above the elevator
            if (this.y < elevatorTop && !this.passed) {
                this.passed = true;
                return false;
            }
            
            return false;
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
        console.log('Added new record:', newScore);
        
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
    
    // Create and update particles
    function updateParticles() {
        const shaft = document.querySelector('.elevator-shaft');
        shaft.innerHTML = '';
        shaft.appendChild(elevatorElement);
        
        // Draw obstacles
        obstacles.forEach(obstacle => obstacle.draw(shaft));
        
        // Add new particles based on speed
        const particleCount = Math.floor(descentSpeed / 2.5); // Adjusted to create more visible particles
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
        
        // Update and draw existing particles
        particles = particles.filter(particle => {
            const stillVisible = particle.update(descentSpeed);
            if (stillVisible) {
                particle.draw(shaft);
            }
            return stillVisible;
        });
        
        // Limit particles array size
        if (particles.length > 180) { // Increased for more particles
            particles = particles.slice(-180);
        }
    }
    
    // Update elevator horizontal position based on mouse
    function updateElevatorPosition(mouseX) {
        if (!gameActive) return;
        
        const shaft = document.querySelector('.elevator-shaft');
        const shaftRect = shaft.getBoundingClientRect();
        
        // Calculate elevator width and position relative to shaft width
        const relativePosition = ((mouseX - shaftRect.left) / shaftRect.width) * 100;
        
        // Constraint elevator position to stay within shaft
        elevatorX = Math.max(0, Math.min(100, relativePosition));
        
        // Update elevator position
        elevatorElement.style.left = `${elevatorX}%`;
        elevatorElement.style.transform = 'translate(-50%, -50%)';
    }
    
    // Generate an obstacle if enough time has passed since the last one
    function generateObstacle() {
        const currentTime = Date.now();
        
        // Check if minimum spacing has passed
        if (currentTime - lastObstacleTime >= minObstacleSpacing) {
            obstacles.push(new Obstacle(difficultyLevel));
            lastObstacleTime = currentTime;
            
            // Adjust spacing based on difficulty (but keep it playable)
            minObstacleSpacing = Math.max(2000, 4000 - (difficultyLevel * 200));
        }
    }
    
    // Apply visual effects for braking
    function updateBrakingVisuals() {
        const shaft = document.querySelector('.elevator-shaft');
        
        if (isBraking) {
            // Add visual cue for braking
            shaft.classList.add('braking');
            document.body.classList.add('braking');
            elevatorElement.classList.add('braking');
        } else {
            // Remove visual cue
            shaft.classList.remove('braking');
            document.body.classList.remove('braking');
            elevatorElement.classList.remove('braking');
        }
    }
    
    // Start the game
    function startGame() {
        playerName = playerNameInput.value.trim() || 'ANONYMOUS';
        playerNameDisplay.textContent = playerName;
        
        welcomeScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        
        // Get shaft dimensions
        const shaft = document.querySelector('.elevator-shaft');
        shaft.innerHTML = '';
        shaft.appendChild(elevatorElement);
        
        shaftHeight = shaft.offsetHeight;
        shaftWidth = shaft.offsetWidth;
        
        // Reset game variables
        currentDepth = 0;
        descentSpeed = maxSpeed / 2; // Start at medium speed
        gameActive = true;
        isBraking = false;
        obstacles = [];
        particles = [];
        difficultyLevel = 1;
        lastObstacleTime = 0;
        minObstacleSpacing = 4000;
        
        // Update displays
        currentDepthDisplay.textContent = '0';
        
        // Clear any existing intervals
        if (gameInterval) clearInterval(gameInterval);
        if (obstacleInterval) clearInterval(obstacleInterval);
        if (difficultyTimer) clearInterval(difficultyTimer);
        
        // Set up the main game loop
        gameInterval = setInterval(() => {
            if (!gameActive) return;
            
            // Update speed based on braking state
            if (isBraking) {
                descentSpeed = Math.max(descentSpeed - deceleration, minSpeed);
            } else {
                descentSpeed = Math.min(descentSpeed + acceleration, maxSpeed);
            }
            
            // Update visuals for braking
            updateBrakingVisuals();
            
            // Update depth (depends on speed)
            currentDepth += descentSpeed / 10;
            currentDepthDisplay.textContent = Math.floor(currentDepth);
            
            // Update visual elements
            updateParticles();
            
            // Check for obstacle collisions
            let collision = false;
            obstacles = obstacles.filter(obstacle => {
                // Update obstacle position
                const stillVisible = obstacle.update(descentSpeed);
                
                // Check for collision
                if (!obstacle.passed && obstacle.checkCollision(elevatorX, elevatorWidth, elevatorHeight, shaftWidth)) {
                    collision = true;
                }
                
                return stillVisible;
            });
            
            // Game over on collision
            if (collision) {
                endGame();
            }
            
        }, 50);
        
        // Generate new obstacles periodically
        obstacleInterval = setInterval(() => {
            if (gameActive && obstacles.length < 8) { // Allow more obstacles with larger shaft
                generateObstacle();
            }
        }, 500); // Check frequently but actual spawning is controlled by minObstacleSpacing
        
        // Increase difficulty level over time
        difficultyTimer = setInterval(() => {
            if (gameActive) {
                difficultyLevel = Math.min(difficultyLevel + 0.5, 10);
                maxSpeed = Math.min(maxSpeed + 1, 30);
                
                // Flash the depth display to indicate difficulty increase
                currentDepthDisplay.style.color = 'var(--danger-color)';
                setTimeout(() => {
                    currentDepthDisplay.style.color = 'var(--depth-color)';
                }, 200);
            }
        }, 15000);
    }
    
    // End the game and show results
    function endGame() {
        gameActive = false;
        
        // Clear all intervals
        if (gameInterval) clearInterval(gameInterval);
        if (obstacleInterval) clearInterval(obstacleInterval);
        if (difficultyTimer) clearInterval(difficultyTimer);
        
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
    
    // Event listeners
    startButton.addEventListener('click', startGame);
    
    // Hold anywhere to brake
    document.addEventListener('mousedown', () => {
        if (gameActive) {
            isBraking = true;
        }
    });
    document.addEventListener('touchstart', (e) => {
        if (gameActive) {
            e.preventDefault();
            isBraking = true;
        }
    });
    
    document.addEventListener('mouseup', () => {
        isBraking = false;
    });
    document.addEventListener('touchend', () => {
        isBraking = false;
    });
    
    // Mouse movement to control elevator
    document.addEventListener('mousemove', (e) => {
        lastMouseX = e.clientX;
        updateElevatorPosition(lastMouseX);
    });
    
    // Touch movement for mobile
    document.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            lastMouseX = e.touches[0].clientX;
            updateElevatorPosition(lastMouseX);
        }
    });
    
    playAgainButton.addEventListener('click', () => {
        resultsScreen.classList.add('hidden');
        welcomeScreen.classList.remove('hidden');
        playerNameInput.value = playerName;
    });
    
    // Prevent context menu on long press
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
    
    // Load leaderboard from localStorage
    loadLeaderboard();
    // Display initial leaderboard
    displayLeaderboard();
}); 