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
    let minSpeed = 2; // Minimum speed when braking hard
    let maxSpeed = 60; // Dramatically increased to allow for absurd speeds
    let baseAcceleration = 0.03; // Base acceleration rate that will increase with depth
    let deceleration = 0.3;
    let isBraking = false;
    let gameInterval;
    let obstacleInterval;
    let difficultyTimer;
    let gameActive = false;
    let debugMode = false; // Set to true to see collision boundaries
    // Brake power variables
    let maxBrakePower = 100;
    let brakePower = maxBrakePower;
    let brakePowerConsumptionRate = 0.7; // Reduced from 0.9 for less aggressive consumption
    let brakePowerRegenRate = 0.3; // Reduced from 0.5 for more gradual regeneration
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
    let minObstacleSpacing = 2500; // Reduced from 4000 for more frequent obstacles from the start
    const movementFactor = 0.15; // Reduced from 0.2 for better visual synchronization
    
    // Classes
    class Particle {
        constructor() {
            this.x = Math.random() * 100; // Random horizontal position (percent)
            this.y = 120; // Start below viewport
            this.size = Math.random() * 4 + 2;
            this.speed = Math.random() * 0.8 + 0.5; // Significantly reduced speed for better matching with obstacles
            this.opacity = Math.random() * 0.5 + 0.3;
            
            // Create DOM element once
            this.element = document.createElement('div');
            this.element.className = 'particle';
            this.element.style.width = `${this.size}px`;
            this.element.style.height = `${this.size}px`;
            this.element.style.opacity = this.opacity;
            
            // Track if element is in DOM
            this.isInDOM = false;
        }
        
        update(speedMultiplier) {
            // Use the same movement factor as obstacles for visual consistency
            this.y -= this.speed * speedMultiplier * movementFactor;
            
            // Update position in DOM if element exists
            if (this.isInDOM) {
                this.element.style.top = `${this.y}%`;
                this.element.style.left = `${this.x}%`;
            }
            
            const stillVisible = this.y > -20; // Return true if particle still in view
            
            // If no longer visible and in DOM, prepare for removal
            if (!stillVisible && this.isInDOM) {
                this.shouldRemove = true;
            }
            
            return stillVisible;
        }
        
        draw(container) {
            // Only append to DOM if not already there
            if (!this.isInDOM) {
                this.element.style.top = `${this.y}%`;
                this.element.style.left = `${this.x}%`;
                
                container.appendChild(this.element);
                this.isInDOM = true;
                this.shouldRemove = false;
            }
        }
        
        // Remove element from DOM
        remove() {
            if (this.isInDOM && this.element.parentNode) {
                this.element.parentNode.removeChild(this.element);
                this.isInDOM = false;
            }
        }
    }
    
    class Obstacle {
        constructor(difficulty) {
            this.width = Math.random() * 30 + 20; // Width between 20% and 50% of shaft
            // Gap is inversely proportional to difficulty (harder = smaller gap)
            // More balanced gap width calculation with a higher minimum
            this.gapWidth = Math.max(35 - (difficulty * 1.2), 22); // Increased min gap width for better playability
            this.gapPosition = Math.random() * (100 - this.gapWidth); // % position of gap
            this.y = 120; // Start below viewport
            this.passed = false;
            this.height = 15 + Math.random() * 5; // Varied height for more visual interest
            
            // Create DOM elements once and reuse them
            this.leftElement = document.createElement('div');
            this.leftElement.className = 'obstacle';
            
            this.rightElement = document.createElement('div');
            this.rightElement.className = 'obstacle';
            
            // Set styles that won't change
            this.leftElement.style.left = '0';
            this.leftElement.style.width = `${this.gapPosition}%`;
            this.leftElement.style.height = `${this.height}px`;
            this.leftElement.style.transform = 'translateY(-50%)';
            
            this.rightElement.style.left = `${this.gapPosition + this.gapWidth}%`;
            this.rightElement.style.width = `${100 - (this.gapPosition + this.gapWidth)}%`;
            this.rightElement.style.height = `${this.height}px`;
            this.rightElement.style.transform = 'translateY(-50%)';
            
            // Track if elements are in DOM
            this.isInDOM = false;
        }
        
        update(speedMultiplier) {
            // Use a consistent movement factor for visual cohesion
            this.y -= speedMultiplier * movementFactor;
            
            // Update positions in DOM if the elements exist
            if (this.isInDOM) {
                this.leftElement.style.top = `${this.y}%`;
                this.rightElement.style.top = `${this.y}%`;
            }
            
            const stillVisible = this.y > -20; // Return true if obstacle still in view
            
            // If no longer visible and in DOM, mark for removal
            if (!stillVisible && this.isInDOM) {
                this.shouldRemove = true;
            }
            
            return stillVisible;
        }
        
        draw(container) {
            // Only append to DOM if not already there
            if (!this.isInDOM) {
                this.leftElement.style.top = `${this.y}%`;
                this.rightElement.style.top = `${this.y}%`;
                
                container.appendChild(this.leftElement);
                container.appendChild(this.rightElement);
                
                this.isInDOM = true;
                this.shouldRemove = false;
            }
        }
        
        // Remove elements from DOM
        remove() {
            if (this.isInDOM) {
                if (this.leftElement.parentNode) {
                    this.leftElement.parentNode.removeChild(this.leftElement);
                }
                if (this.rightElement.parentNode) {
                    this.rightElement.parentNode.removeChild(this.rightElement);
                }
                this.isInDOM = false;
            }
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
    
    // Create and update particles more efficiently
    function updateParticles() {
        const shaft = document.querySelector('.elevator-shaft');
        
        // Make sure elevator stays in the DOM
        if (!shaft.contains(elevatorElement)) {
            shaft.appendChild(elevatorElement);
        }
        
        // Filter out particles that are no longer visible
        const visibleParticles = [];
        
        particles.forEach(particle => {
            const isVisible = particle.update(descentSpeed);
            
            if (isVisible) {
                particle.draw(shaft);
                visibleParticles.push(particle);
            } else {
                // Remove from DOM if no longer visible
                particle.remove();
            }
        });
        
        // Update our particles array
        particles = visibleParticles;
        
        // Add new particles based on speed but limit creation when too many exist
        const maxParticles = 70; // Reduced from original 180 for better performance
        
        if (particles.length < maxParticles) {
            // Limit creation based on speed
            const particleCount = Math.min(Math.floor(descentSpeed / 4), 3);
            
            for (let i = 0; i < particleCount; i++) {
                const newParticle = new Particle();
                newParticle.draw(shaft);
                particles.push(newParticle);
            }
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
        
        // Adjust minimum spacing based on current speed but cap it to ensure frequent obstacles
        // Lower max speedFactor to ensure more frequent obstacles even at high speeds
        const speedFactor = Math.min(1.2, Math.max(0.8, descentSpeed / 40));
        const adjustedSpacing = minObstacleSpacing * speedFactor;
        
        // Check if minimum spacing has passed
        if (currentTime - lastObstacleTime >= adjustedSpacing) {
            // Create a new obstacle with adjusted gap width for more balanced difficulty
            const obstacle = new Obstacle(difficultyLevel);
            
            // Ensure gap width is not too small early in the game
            if (difficultyLevel < 3) {
                obstacle.gapWidth = Math.max(obstacle.gapWidth, 25); // Ensure a minimum gap width for early levels
            }
            
            // Adjust gap width slightly based on current speed for fairness
            if (descentSpeed > 20) {
                const speedAdjustment = Math.min(10, (descentSpeed - 20) / 4);
                obstacle.gapWidth = Math.min(45, obstacle.gapWidth + speedAdjustment);
            }
            
            obstacles.push(obstacle);
            lastObstacleTime = currentTime;
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
            
            // Add speed warning indicator
            if (descentSpeed > 20) {
                // Flash brake bar at high speeds to indicate danger
                const flashRate = Math.min(1, (descentSpeed - 20) / 20);
                brakePowerBar.style.opacity = 0.5 + (Math.sin(Date.now() * flashRate * 0.01) * 0.5);
                
                // Add pulsing effect to the brake bar at high speeds
                const pulseSize = Math.min(5, (descentSpeed - 20) / 8);
                brakePowerBar.style.boxShadow = `0 0 ${pulseSize}px 2px rgba(255, 60, 90, 0.7)`;
            } else {
                brakePowerBar.style.opacity = 1;
                brakePowerBar.style.boxShadow = '';
            }
        }
    }
    
    // Set up the main game loop using requestAnimationFrame for better performance
    function setupGameLoop() {
        let lastTimestamp = 0;
        const targetFPS = 60;
        const frameInterval = 1000 / targetFPS;
        const shaft = document.querySelector('.elevator-shaft');
        
        // Main game loop using requestAnimationFrame
        function gameLoop(timestamp) {
            if (!gameActive) return;
            
            // Calculate time delta
            const elapsed = timestamp - lastTimestamp;
            
            // Only update if enough time has passed (helps with performance on high refresh rate displays)
            if (elapsed > frameInterval) {
                // Remember last timestamp
                lastTimestamp = timestamp - (elapsed % frameInterval);
                
                // Update depth
                currentDepth += descentSpeed / 100;
                currentDepthDisplay.textContent = Math.floor(currentDepth);
                
                // Calculate current acceleration based on depth - gets faster as you go deeper
                const depthFactor = Math.min(1 + (currentDepth / 300), 4);
                const currentAcceleration = baseAcceleration * depthFactor;
                
                // Handle braking
                if (isBraking && canBrake) {
                    // Consume brake power when braking
                    brakePower -= brakePowerConsumptionRate;
                    
                    // Disable braking if power is depleted
                    if (brakePower <= 0) {
                        brakePower = 0;
                        canBrake = false;
                    }
                    
                    // Less powerful braking - reduced effectiveness values
                    const brakeEffectiveness = Math.min(0.06, 0.03 + (descentSpeed / 200));
                    descentSpeed = Math.max(minSpeed, descentSpeed * (1 - brakeEffectiveness));
                } else {
                    // Regenerate brake power when not braking - make it dependent on speed
                    if (brakePower < maxBrakePower) {
                        // Slower regeneration at higher speeds
                        const speedFactor = Math.max(0.3, 1 - (descentSpeed / 50));
                        const adjustedRegenRate = brakePowerRegenRate * speedFactor;
                        
                        brakePower += adjustedRegenRate;
                        if (brakePower >= maxBrakePower) {
                            brakePower = maxBrakePower;
                        }
                        
                        // Re-enable braking if power is sufficient
                        if (!canBrake && brakePower >= maxBrakePower * 0.2) {
                            canBrake = true;
                        }
                    }
                    
                    // Continuously accelerate - increased effect at higher depths
                    descentSpeed = Math.min(maxSpeed, descentSpeed + currentAcceleration);
                    
                    // Apply a small automatic brake at extreme speeds to prevent impossible gameplay
                    if (descentSpeed > 30) {
                        const autobrake = (descentSpeed - 30) * 0.005;
                        descentSpeed = Math.max(30, descentSpeed - autobrake);
                    }
                }
                
                // Update brake power display
                updateBrakePowerDisplay();
                
                // Update visuals
                updateBrakingVisuals();
                
                // Draw obstacles - needs to happen before particles for proper z-index
                obstacles.forEach(obstacle => obstacle.draw(shaft));
                
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
            }
            
            // Schedule next frame
            if (gameActive) {
                requestAnimationFrame(gameLoop);
            }
        }
        
        // Start the animation loop
        requestAnimationFrame(gameLoop);
        
        // Set up obstacle creation and difficulty progression
        createObstacleInterval();
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
        shaft.innerHTML = ''; // Clear any existing elements
        shaft.appendChild(elevatorElement);
        
        // Update shaft dimensions
        updateShaftDimensions();
        
        // Reset game variables
        currentDepth = 0;
        descentSpeed = 5; // Start at a lower speed but it will quickly accelerate
        gameActive = true;
        isBraking = false;
        
        // Clean up any existing objects
        obstacles.forEach(obstacle => obstacle.remove());
        particles.forEach(particle => particle.remove());
        
        // Reset arrays
        obstacles = [];
        particles = [];
        
        // Reset game state
        difficultyLevel = 1;
        lastObstacleTime = 0;
        minObstacleSpacing = 2500; // Reduced from 4000 for more frequent obstacles from the start
        
        // Reset brake power
        brakePower = maxBrakePower;
        canBrake = true;
        
        // Update displays
        currentDepthDisplay.textContent = '0';
        updateBrakePowerDisplay();
        
        // Clear any existing intervals
        if (obstacleInterval) clearInterval(obstacleInterval);
        if (difficultyTimer) clearInterval(difficultyTimer);
        
        // Set up game loop
        setupGameLoop();
    }
    
    // End the game and show results
    function endGame() {
        gameActive = false;
        
        // Clear all intervals
        if (obstacleInterval) clearInterval(obstacleInterval);
        if (difficultyTimer) clearInterval(difficultyTimer);
        
        // Clean up DOM elements to prevent memory leaks
        obstacles.forEach(obstacle => obstacle.remove());
        particles.forEach(particle => particle.remove());
        
        // Clear arrays
        obstacles = [];
        particles = [];
        
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
    
    // Directly restart the game when clicking "play again"
    playAgainButton.addEventListener('click', () => {
        resultsScreen.classList.add('hidden');
        // Skip the welcome screen entirely
        startGame(); // Directly restart the game with the same player name
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
    
    // Update obstacles with better DOM management
    function updateObstacles() {
        // Filter out obstacles that are no longer visible
        const visibleObstacles = [];
        
        obstacles.forEach(obstacle => {
            // Update obstacle position
            const isVisible = obstacle.update(descentSpeed);
            
            if (isVisible) {
                visibleObstacles.push(obstacle);
            } else {
                // Remove from DOM if no longer visible
                obstacle.remove();
            }
        });
        
        // Update our obstacles array
        obstacles = visibleObstacles;
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
    
    // Create obstacles more frequently
    function createObstacleInterval() {
        obstacleInterval = setInterval(() => {
            if (!gameActive) return;
            
            // Try to generate an obstacle
            generateObstacle();
            
            // Force additional obstacles when there are too few on screen
            if (obstacles.length < 4) { // Increased from 3 to 4 minimum obstacles
                // Reset the last obstacle time to force generation
                lastObstacleTime = 0;
                generateObstacle();
            }
        }, 200); // Check more frequently (reduced from 300ms to 200ms)
    }
    
    // Setup difficulty progression
    function setupDifficultyProgression() {
        difficultyTimer = setInterval(() => {
            if (!gameActive) return;
            
            // More gradual difficulty increase
            difficultyLevel += 0.3;
            
            // As difficulty increases, reduce minimum obstacle spacing more gradually
            minObstacleSpacing = Math.max(1200, 3000 - (difficultyLevel * 150)); // Reduced base spacing and minimum
            
            // Flash the depth display to indicate difficulty increase
            currentDepthDisplay.style.color = 'var(--danger-color)';
            setTimeout(() => {
                currentDepthDisplay.style.color = 'var(--depth-color)';
            }, 200);
            
            console.log(`Difficulty increased to ${difficultyLevel}, spacing: ${minObstacleSpacing}`);
            
        }, 18000); // Every 18 seconds
    }
}); 