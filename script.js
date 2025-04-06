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
    let debugMode = false; // Set to true to see collision boundaries
    // Brake power variables
    let maxBrakePower = 100;
    let brakePower = maxBrakePower;
    let brakePowerConsumptionRate = 1; // How fast braking consumes power
    let brakePowerRegenRate = 0.3; // How fast power regenerates when not braking
    let canBrake = true; // Whether the player can currently brake
    let leaderboard = [];
    let shaftWidth = 0; // Width of the elevator shaft
    let shaftHeight = 0; // Height of the elevator shaft
    let elevatorX = 50; // % position horizontally
    let elevatorWidth = 70; // px - updated to match CSS
    let elevatorHeight = 70; // px - updated to match CSS
    let obstacles = [];
    let particles = [];
    let lastMouseX = 0;
    let difficultyLevel = 1;
    let lastObstacleTime = 0;
    let minObstacleSpacing = 4000; // Increased minimum time between obstacles in ms
    const movementFactor = 0.15; // Reduced from 0.2 for better visual synchronization
    
    // Classes
    class Particle {
        constructor() {
            this.x = Math.random() * 100; // Random horizontal position (percent)
            this.y = 120; // Start below viewport
            this.size = Math.random() * 4 + 2;
            this.speed = Math.random() * 0.8 + 0.5; // Significantly reduced speed for better matching with obstacles
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
            leftPart.style.transform = 'translateY(-50%)'; // Center vertically
            
            // Right part of obstacle
            const rightPart = document.createElement('div');
            rightPart.className = 'obstacle';
            rightPart.style.left = `${this.gapPosition + this.gapWidth}%`;
            rightPart.style.top = `${this.y}%`;
            rightPart.style.width = `${100 - (this.gapPosition + this.gapWidth)}%`;
            rightPart.style.height = `${this.height}px`;
            rightPart.style.transform = 'translateY(-50%)'; // Center vertically
            
            container.appendChild(leftPart);
            container.appendChild(rightPart);
        }
        
        // Simple, direct rectangle collision check
        checkCollision(elevatorX, elevatorWidth, elevatorHeight, shaftWidth) {
            // Get elevator position in pixels
            const elevator = {
                centerX: (elevatorX / 100) * shaftWidth,
                centerY: (15 / 100) * shaftHeight, // 15% from top
                width: elevatorWidth,
                height: elevatorHeight
            };
            
            // Calculate elevator boundaries
            const elevatorLeft = elevator.centerX - (elevator.width / 2);
            const elevatorRight = elevator.centerX + (elevator.width / 2);
            const elevatorTop = elevator.centerY - (elevator.height / 2);
            const elevatorBottom = elevator.centerY + (elevator.height / 2);
            
            // Calculate obstacle position in pixels
            const obstacleY = (this.y / 100) * shaftHeight;
            const obstacleHeight = this.height;
            
            // Calculate obstacle top and bottom
            const obstacleTop = obstacleY - (obstacleHeight / 2);
            const obstacleBottom = obstacleY + (obstacleHeight / 2);
            
            // Check if there is a vertical overlap
            const verticalOverlap = !(
                elevatorBottom < obstacleTop || 
                elevatorTop > obstacleBottom
            );
            
            // If no vertical overlap, no collision is possible
            if (!verticalOverlap) {
                // Mark as passed once it's clearly above the elevator
                if (obstacleBottom < elevatorTop && !this.passed) {
                    this.passed = true;
                }
                return false;
            }
            
            // Calculate gap boundaries in pixels
            const gapLeft = (this.gapPosition / 100) * shaftWidth;
            const gapRight = ((this.gapPosition + this.gapWidth) / 100) * shaftWidth;
            
            // Check if elevator is inside the gap (no collision)
            const insideGap = elevatorLeft >= gapLeft && elevatorRight <= gapRight;
            
            // If inside gap, no collision
            if (insideGap) {
                return false;
            }
            
            // Otherwise there is a collision
            console.log("Collision detected:", {
                elevator: { left: elevatorLeft, right: elevatorRight, top: elevatorTop, bottom: elevatorBottom },
                obstacle: { y: obstacleY, top: obstacleTop, bottom: obstacleBottom },
                gap: { left: gapLeft, right: gapRight }
            });
            
            return true;
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
    
    // Update visual effects for braking
    function updateBrakingVisuals() {
        const shaft = document.querySelector('.elevator-shaft');
        const body = document.body;
        
        if (isBraking && canBrake) {
            // Add visual cues for braking
            shaft.classList.add('braking');
            body.classList.add('braking');
        } else {
            // Remove braking visual cues
            shaft.classList.remove('braking');
            body.classList.remove('braking');
        }
    }
    
    // Update shaft dimensions
    function updateShaftDimensions() {
        const shaft = document.querySelector('.elevator-shaft');
        if (shaft) {
            shaftWidth = shaft.offsetWidth;
            shaftHeight = shaft.offsetHeight;
            console.log(`Shaft dimensions updated: ${shaftWidth}px x ${shaftHeight}px`);
        }
    }
    
    // Update brake power display
    function updateBrakePowerDisplay() {
        const brakePowerBar = document.getElementById('brakePowerBar');
        if (brakePowerBar) {
            // Update the width based on current brake power percentage
            const powerPercentage = (brakePower / maxBrakePower) * 100;
            brakePowerBar.style.width = `${powerPercentage}%`;
            
            // Change color based on power level
            if (powerPercentage < 25) {
                brakePowerBar.style.backgroundColor = 'var(--danger-color)';
            } else if (powerPercentage < 50) {
                brakePowerBar.style.backgroundColor = 'var(--brake-color)';
            } else {
                brakePowerBar.style.backgroundColor = 'var(--success-color)';
            }
        }
    }
    
    // Set up the main game loop
    function setupGameLoop() {
        gameInterval = setInterval(() => {
            if (!gameActive) return;
            
            // Update depth
            currentDepth += descentSpeed / 100;
            currentDepthDisplay.textContent = Math.floor(currentDepth);
            
            // Handle braking
            if (isBraking && canBrake) {
                // Consume brake power when braking
                brakePower -= brakePowerConsumptionRate;
                
                // Disable braking if power is depleted
                if (brakePower <= 0) {
                    brakePower = 0;
                    canBrake = false;
                }
                
                // Apply braking effect to speed
                descentSpeed = Math.max(minSpeed, descentSpeed * 0.95);
            } else {
                // Regenerate brake power when not braking
                if (brakePower < maxBrakePower) {
                    brakePower += brakePowerRegenRate;
                    if (brakePower >= maxBrakePower) {
                        brakePower = maxBrakePower;
                    }
                    
                    // Re-enable braking if power is sufficient
                    if (!canBrake && brakePower >= maxBrakePower * 0.25) {
                        canBrake = true;
                    }
                }
                
                // Increase speed when not braking
                descentSpeed = Math.min(maxSpeed, descentSpeed * 1.01);
            }
            
            // Update brake power display
            updateBrakePowerDisplay();
            
            // Update visuals
            updateBrakingVisuals();
            
            // Update particles
            updateParticles();
            
            // Update obstacles
            updateObstacles();
            
            // Check for collisions
            checkCollisions();
            
            // Update debug visuals if enabled
            if (debugMode) {
                updateDebugVisuals();
            }
        }, 1000 / 60); // 60 FPS
        
        // Set up obstacle creation
        createObstacleInterval();
        
        // Increase difficulty over time
        setupDifficultyProgression();
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
        
        // Update shaft dimensions
        updateShaftDimensions();
        
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
        
        // Reset brake power
        brakePower = maxBrakePower;
        canBrake = true;
        
        // Update displays
        currentDepthDisplay.textContent = '0';
        updateBrakePowerDisplay();
        
        // Clear any existing intervals
        if (gameInterval) clearInterval(gameInterval);
        if (obstacleInterval) clearInterval(obstacleInterval);
        if (difficultyTimer) clearInterval(difficultyTimer);
        
        // Set up game loop
        setupGameLoop();
        
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
    
    // Add a resize handler to keep shaft dimensions updated
    window.addEventListener('resize', () => {
        if (gameActive) {
            updateShaftDimensions();
        }
    });
    
    // Update obstacles
    function updateObstacles() {
        obstacles = obstacles.filter(obstacle => {
            // Update obstacle position
            return obstacle.update(descentSpeed);
        });
    }
    
    // Check for collisions with obstacles
    function checkCollisions() {
        let collision = false;
        
        obstacles.forEach(obstacle => {
            // Check if the obstacle is in collision range and hasn't been passed
            if (!obstacle.passed && obstacle.checkCollision(elevatorX, elevatorWidth, elevatorHeight, shaftWidth)) {
                collision = true;
                console.log("Collision detected!");
            }
        });
        
        // End game if collision occurred
        if (collision) {
            endGame();
        }
    }
    
    // Create obstacles periodically
    function createObstacleInterval() {
        obstacleInterval = setInterval(() => {
            if (!gameActive) return;
            
            const currentTime = Date.now();
            // Only create a new obstacle if enough time has passed since the last one
            if (currentTime - lastObstacleTime >= minObstacleSpacing) {
                generateObstacle();
                lastObstacleTime = currentTime;
            }
        }, 500); // Check opportunity to create obstacles every 500ms
    }
    
    // Setup difficulty progression
    function setupDifficultyProgression() {
        difficultyTimer = setInterval(() => {
            if (!gameActive) return;
            
            difficultyLevel += 0.5;
            
            // As difficulty increases, reduce minimum obstacle spacing
            minObstacleSpacing = Math.max(1500, 4000 - (difficultyLevel * 250));
            
            // Increase max speed with difficulty
            maxSpeed = Math.min(25, 10 + (difficultyLevel * 0.5));
            
            console.log(`Difficulty increased to ${difficultyLevel}, spacing: ${minObstacleSpacing}, max speed: ${maxSpeed}`);
            
        }, 15000); // Increase difficulty every 15 seconds
    }
}); 