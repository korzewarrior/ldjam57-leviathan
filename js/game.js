// Main game module
import { Particle, Obstacle } from './entities.js';
import { 
    updateDepthDisplay, 
    updateBrakePowerDisplay, 
    updateBrakingVisuals,
    showGameScreen, 
    showResultsScreen,
    updateDebugVisuals
} from './ui.js';
import { loadLeaderboard, displayLeaderboard } from './leaderboard.js';
import { setupInputHandlers } from './input.js';

// Global reference to whether the mouse is down for braking
let mouseIsDown = false;

// Game state object to keep track of all game variables
const gameState = {
    playerName: '',
    currentDepth: 0,
    descentSpeed: 0,
    minSpeed: 2,
    maxSpeed: 60,
    baseAcceleration: 0.03,
    isBraking: false,
    obstacleInterval: null,
    difficultyTimer: null,
    gameActive: false,
    debugMode: false,
    maxBrakePower: 100,
    brakePower: 100,
    brakePowerConsumptionRate: 1.4,
    brakePowerRegenRate: 0.2,
    brakePowerRegenSpeedThreshold: 8,
    canBrake: true,
    shaftWidth: 0,
    shaftHeight: 0,
    elevatorX: 50,
    elevatorWidth: 70,
    elevatorHeight: 70,
    obstacles: [],
    particles: [],
    difficultyLevel: 1,
    lastObstacleTime: 0,
    minObstacleSpacing: 3000,
    movementFactor: 0.15,
    // New Leviathan properties
    leviathanDistance: 100, // Distance from player (0-100, 0 means caught)
    maxLeviathanDistance: 100,
    leviathanSpeed: 0.05, // Reduced from 0.1 to make it easier initially
    collisionSlowdownFactor: 3, // Reduced from 5 to make collisions less punishing
    recentlyCollided: false,
    collisionCooldown: 0,
    maxCollisionCooldown: 60, // frames
    leviathanElement: null
};

// Initialize the game
function initGame() {
    // Get DOM elements
    const welcomeScreen = document.getElementById('welcomeScreen');
    const gameScreen = document.getElementById('gameScreen');
    const resultsScreen = document.getElementById('resultsScreen');
    const playerNameInput = document.getElementById('playerName');
    const startButton = document.getElementById('startButton');
    const playerNameDisplay = document.getElementById('playerNameDisplay');
    const playAgainButton = document.getElementById('playAgainButton');
    const elevatorShaft = document.querySelector('.elevator-shaft');
    const elevator = document.querySelector('.elevator');
    const leviathan = document.getElementById('leviathan');
    
    // Store leviathan element
    gameState.leviathanElement = leviathan;
    
    // Setup event listeners for UI controls
    startButton.addEventListener('click', () => {
        startGame(playerNameInput, playerNameDisplay, elevatorShaft);
    });
    
    playAgainButton.addEventListener('click', () => {
        resultsScreen.classList.add('hidden');
        startGame(playerNameInput, playerNameDisplay, elevatorShaft);
    });
    
    // Setup input handlers
    setupInputHandlers(gameState, elevatorShaft, elevator);
    
    // Set up mouse and touch events for braking
    window.addEventListener('mousedown', () => {
        if (gameState.gameActive && gameState.canBrake) {
            gameState.isBraking = true;
        }
    });
    
    window.addEventListener('mouseup', () => {
        gameState.isBraking = false;
    });
    
    // Load initial leaderboard
    loadLeaderboard();
    displayLeaderboard();
    
    // Window resize handler
    window.addEventListener('resize', () => {
        if (gameState.gameActive) {
            updateShaftDimensions(elevatorShaft);
        }
    });
}

// Start a new game
function startGame(playerNameInput, playerNameDisplay, elevatorShaft) {
    gameState.playerName = playerNameInput.value.trim() || 'ANONYMOUS';
    playerNameDisplay.textContent = gameState.playerName;
    
    showGameScreen();
    
    // Save a reference to the elevator element before clearing the shaft
    const elevatorElement = document.getElementById('elevator');
    
    // Create a new elevator if the original one doesn't exist
    if (!elevatorElement) {
        console.error('Elevator element not found, creating a new one');
        const newElevator = document.createElement('div');
        newElevator.id = 'elevator';
        newElevator.className = 'elevator';
        elevatorShaft.innerHTML = '';
        elevatorShaft.appendChild(newElevator);
    } else {
        // Clear everything except the elevator
        const childElements = Array.from(elevatorShaft.children);
        childElements.forEach(child => {
            if (child.id !== 'elevator' && child.id !== 'leviathan') {
                elevatorShaft.removeChild(child);
            }
        });
        
        // Make sure elevator is in the shaft
        if (!elevatorShaft.contains(elevatorElement)) {
            elevatorShaft.appendChild(elevatorElement);
        }
    }
    
    // Show the leviathan
    if (gameState.leviathanElement) {
        gameState.leviathanElement.classList.remove('hidden');
        gameState.leviathanElement.classList.remove('approaching');
        gameState.leviathanElement.classList.remove('close');
        gameState.leviathanElement.style.bottom = '';
        gameState.leviathanElement.style.top = '-20%';
    }
    
    updateShaftDimensions(elevatorShaft);
    
    // Reset game state
    gameState.currentDepth = 0;
    gameState.descentSpeed = 5;
    gameState.gameActive = true;
    gameState.isBraking = false;
    
    gameState.obstacles.forEach(obstacle => obstacle.remove());
    gameState.particles.forEach(particle => particle.remove());
    
    gameState.obstacles = [];
    gameState.particles = [];
    
    gameState.difficultyLevel = 1;
    gameState.lastObstacleTime = 0;
    gameState.minObstacleSpacing = 3000;
    
    gameState.brakePower = gameState.maxBrakePower;
    gameState.canBrake = true;
    
    // Reset leviathan state
    gameState.leviathanDistance = gameState.maxLeviathanDistance;
    gameState.recentlyCollided = false;
    gameState.collisionCooldown = 0;
    
    updateDepthDisplay(gameState.currentDepth);
    updateBrakePowerDisplay(
        gameState.brakePower, 
        gameState.maxBrakePower, 
        gameState.descentSpeed, 
        gameState.brakePowerRegenSpeedThreshold
    );
    updateLeviathanDistanceDisplay();
    
    if (gameState.obstacleInterval) clearInterval(gameState.obstacleInterval);
    if (gameState.difficultyTimer) clearInterval(gameState.difficultyTimer);
    
    setupGameLoop();
}

// End the current game
function endGame() {
    gameState.gameActive = false;
    
    if (gameState.obstacleInterval) clearInterval(gameState.obstacleInterval);
    if (gameState.difficultyTimer) clearInterval(gameState.difficultyTimer);
    
    gameState.obstacles.forEach(obstacle => obstacle.remove());
    gameState.particles.forEach(particle => particle.remove());
    
    gameState.obstacles = [];
    gameState.particles = [];
    
    // Hide the leviathan
    if (gameState.leviathanElement) {
        gameState.leviathanElement.classList.add('hidden');
    }
    
    showResultsScreen(gameState.playerName, gameState.currentDepth);
}

// Update shaft dimensions
function updateShaftDimensions(elevatorShaft) {
    if (elevatorShaft) {
        gameState.shaftWidth = elevatorShaft.offsetWidth;
        gameState.shaftHeight = elevatorShaft.offsetHeight;
    }
}

// Main game loop
function setupGameLoop() {
    let lastTimestamp = 0;
    const targetFPS = 60;
    const frameInterval = 1000 / targetFPS;
    let frameCount = 0;
    
    function gameLoop(timestamp) {
        if (!gameState.gameActive) return;
        
        const elapsed = timestamp - lastTimestamp;
        
        if (elapsed > frameInterval) {
            lastTimestamp = timestamp - (elapsed % frameInterval);
            frameCount++;
            
            gameState.currentDepth += gameState.descentSpeed / 100;
            
            // Only update the display every 5 frames for better performance
            if (frameCount % 5 === 0) {
                updateDepthDisplay(gameState.currentDepth);
            }
            
            const depthFactor = Math.min(1 + (gameState.currentDepth / 300), 4);
            const currentAcceleration = gameState.baseAcceleration * depthFactor;
            
            // Handle braking
            if (gameState.isBraking && gameState.canBrake) {
                gameState.brakePower -= gameState.brakePowerConsumptionRate;
                
                if (gameState.brakePower <= 0) {
                    gameState.brakePower = 0;
                    gameState.canBrake = false;
                }
                
                const brakeEffectiveness = Math.min(0.03, 0.015 + (gameState.descentSpeed / 400));
                gameState.descentSpeed = Math.max(gameState.minSpeed, gameState.descentSpeed * (1 - brakeEffectiveness));
            } else {
                // Handle brake power regeneration
                if (gameState.brakePower < gameState.maxBrakePower) {
                    if (gameState.descentSpeed >= gameState.brakePowerRegenSpeedThreshold) {
                        const speedFactor = Math.max(0.3, 1 - (gameState.descentSpeed / 50));
                        const adjustedRegenRate = gameState.brakePowerRegenRate * speedFactor;
                        
                        gameState.brakePower += adjustedRegenRate;
                        if (gameState.brakePower >= gameState.maxBrakePower) {
                            gameState.brakePower = gameState.maxBrakePower;
                        }
                    }
                    
                    if (!gameState.canBrake && gameState.brakePower >= gameState.maxBrakePower * 0.2) {
                        gameState.canBrake = true;
                    }
                }
                
                // Increase speed
                gameState.descentSpeed = Math.min(gameState.maxSpeed, gameState.descentSpeed + currentAcceleration);
                
                // Auto-brake at extreme speeds
                if (gameState.descentSpeed > 30) {
                    const autobrake = (gameState.descentSpeed - 30) * 0.005;
                    gameState.descentSpeed = Math.max(30, gameState.descentSpeed - autobrake);
                }
            }
            
            // Update visual elements only every 3 frames for better performance
            if (frameCount % 3 === 0) {
                updateBrakePowerDisplay(
                    gameState.brakePower, 
                    gameState.maxBrakePower, 
                    gameState.descentSpeed, 
                    gameState.brakePowerRegenSpeedThreshold
                );
                updateBrakingVisuals(gameState.isBraking, gameState.canBrake);
                updateLeviathanDistanceDisplay();
            }
            
            // Update game entities
            updateParticles();
            updateObstacles();
            
            // Handle collision cooldown
            if (gameState.recentlyCollided) {
                gameState.collisionCooldown--;
                if (gameState.collisionCooldown <= 0) {
                    gameState.recentlyCollided = false;
                    gameState.collisionCooldown = 0;
                }
            }
            
            // Update leviathan position and check for game over
            updateLeviathan(frameCount);
            
            // Always check for collisions
            checkCollisions();
            
            // Debug visuals only every 10 frames if enabled
            if (gameState.debugMode && frameCount % 10 === 0) {
                updateDebugVisuals(gameState, document.querySelector('.elevator-shaft'));
            }
        }
        
        if (gameState.gameActive) {
            requestAnimationFrame(gameLoop);
        }
    }
    
    requestAnimationFrame(gameLoop);
    createObstacleInterval();
    setupDifficultyProgression();
}

// Update leviathan position and check if it caught the player
function updateLeviathan(frameCount) {
    // Update leviathan distance
    let baseApproachRate = gameState.leviathanSpeed;
    
    // Leviathan gets faster as depth increases
    const depthFactor = Math.min(1 + (gameState.currentDepth / 500), 3);
    baseApproachRate *= depthFactor;
    
    // Leviathan catches up faster when player is slow
    const speedFactor = Math.max(0.5, Math.min(2.0, gameState.descentSpeed / 15));
    const approachRate = baseApproachRate / speedFactor;
    
    // When player is going fast, they can create some distance
    if (gameState.descentSpeed > 25 && !gameState.recentlyCollided) {
        // Player can slowly increase distance by going fast
        gameState.leviathanDistance = Math.min(
            gameState.maxLeviathanDistance, 
            gameState.leviathanDistance + (gameState.descentSpeed - 25) * 0.01
        );
    } else {
        // Reduce distance (leviathan gets closer)
        gameState.leviathanDistance -= approachRate;
    }
    
    // If there was a recent collision, leviathan gains ground faster
    if (gameState.recentlyCollided) {
        gameState.leviathanDistance -= baseApproachRate * 1.5; // Reduced from 2x to 1.5x
    }
    
    // Check if leviathan caught the player
    if (gameState.leviathanDistance <= 0) {
        gameState.leviathanDistance = 0;
        endGame();
        return;
    }
    
    // Update leviathan visual position every 4 frames for performance
    if (frameCount % 4 === 0 && gameState.leviathanElement) {
        const normalizedDistance = gameState.leviathanDistance / gameState.maxLeviathanDistance;
        // Convert normalized distance to visual position
        // When distance is 0, top should be 10% (caught)
        // When distance is 100, top should be -20% (far away)
        const topPosition = 10 - (normalizedDistance * 30);
        
        // Position from the top instead of bottom
        gameState.leviathanElement.style.bottom = '';
        gameState.leviathanElement.style.top = `${topPosition}%`;
        
        // Add visual indicators when leviathan is close
        if (normalizedDistance < 0.3) {
            gameState.leviathanElement.classList.add('close');
            gameState.leviathanElement.classList.remove('approaching');
        } else if (normalizedDistance < 0.5) {
            gameState.leviathanElement.classList.add('approaching');
            gameState.leviathanElement.classList.remove('close');
        } else {
            gameState.leviathanElement.classList.remove('approaching');
            gameState.leviathanElement.classList.remove('close');
        }
    }
}

// Update the leviathan distance display
function updateLeviathanDistanceDisplay() {
    const leviathanDistanceBar = document.getElementById('leviathanDistanceBar');
    if (leviathanDistanceBar) {
        const distancePercentage = (gameState.leviathanDistance / gameState.maxLeviathanDistance) * 100;
        leviathanDistanceBar.style.width = `${distancePercentage}%`;
        
        // Change color based on proximity
        if (distancePercentage < 25) {
            leviathanDistanceBar.style.backgroundColor = 'var(--danger-color)';
            leviathanDistanceBar.style.boxShadow = '0 0 10px rgba(255, 60, 90, 0.7)';
        } else if (distancePercentage < 50) {
            leviathanDistanceBar.style.backgroundColor = 'var(--brake-color)';
            leviathanDistanceBar.style.boxShadow = '0 0 8px rgba(255, 102, 0, 0.6)';
        } else {
            leviathanDistanceBar.style.backgroundColor = 'var(--leviathan-color)';
            leviathanDistanceBar.style.boxShadow = '0 0 8px rgba(114, 9, 183, 0.5)';
        }
    }
}

// Particle management
function updateParticles() {
    const elevatorShaft = document.querySelector('.elevator-shaft');
    if (!elevatorShaft) return;
    
    const elevatorElement = document.getElementById('elevator');
    if (!elevatorElement && elevatorShaft) {
        const newElevator = document.createElement('div');
        newElevator.id = 'elevator';
        newElevator.className = 'elevator';
        elevatorShaft.appendChild(newElevator);
    } else if (!elevatorShaft.contains(elevatorElement)) {
        elevatorShaft.appendChild(elevatorElement);
    }
    
    // Process particles in bulk for better performance
    const visibleParticles = [];
    const currentSpeed = gameState.descentSpeed;
    const moveFactor = gameState.movementFactor;
    
    for (let i = 0; i < gameState.particles.length; i++) {
        const particle = gameState.particles[i];
        const isVisible = particle.update(currentSpeed, moveFactor);
        
        if (isVisible) {
            if (!particle.isInDOM) {
                particle.draw(elevatorShaft);
            }
            visibleParticles.push(particle);
        } else {
            particle.remove();
        }
    }
    
    gameState.particles = visibleParticles;
    
    // Create new particles if needed
    const maxParticles = 50; // Reduced from 70 for better performance
    
    if (gameState.particles.length < maxParticles) {
        const newParticlesCount = Math.min(Math.floor(currentSpeed / 5), 2); // Reduced rate
        
        for (let i = 0; i < newParticlesCount; i++) {
            const newParticle = new Particle();
            newParticle.draw(elevatorShaft);
            gameState.particles.push(newParticle);
        }
    }
}

// Obstacle management - optimized version
function updateObstacles() {
    const elevatorShaft = document.querySelector('.elevator-shaft');
    if (!elevatorShaft) return;
    
    const visibleObstacles = [];
    const currentSpeed = gameState.descentSpeed;
    const moveFactor = gameState.movementFactor;
    
    // Process all obstacles at once for better performance
    for (let i = 0; i < gameState.obstacles.length; i++) {
        const obstacle = gameState.obstacles[i];
        const isVisible = obstacle.update(currentSpeed, moveFactor);
        
        if (isVisible) {
            if (!obstacle.isInDOM) {
                obstacle.draw(elevatorShaft);
            }
            visibleObstacles.push(obstacle);
        } else {
            obstacle.remove();
        }
    }
    
    gameState.obstacles = visibleObstacles;
}

// Generates new obstacles
function generateObstacle() {
    // Make sure the shaft dimensions are valid
    if (!gameState.shaftWidth || !gameState.shaftHeight) {
        const elevatorShaft = document.querySelector('.elevator-shaft');
        if (elevatorShaft) {
            updateShaftDimensions(elevatorShaft);
        } else {
            console.error('Elevator shaft not found for generating obstacles');
            return;
        }
    }
    
    const currentTime = Date.now();
    
    const speedFactor = Math.min(1.5, Math.max(1.0, gameState.descentSpeed / 40));
    const adjustedSpacing = gameState.minObstacleSpacing * speedFactor;
    
    if (currentTime - gameState.lastObstacleTime >= adjustedSpacing) {
        try {
            const obstacle = new Obstacle(gameState.difficultyLevel);
            
            if (gameState.difficultyLevel < 3) {
                obstacle.gapWidth = Math.max(obstacle.gapWidth, 25);
            }
            
            if (gameState.descentSpeed > 20) {
                const speedAdjustment = Math.min(10, (gameState.descentSpeed - 20) / 4);
                obstacle.gapWidth = Math.min(45, obstacle.gapWidth + speedAdjustment);
            }
            
            if (gameState.obstacles.length > 0) {
                const lastObstacle = gameState.obstacles[gameState.obstacles.length - 1];
                
                if (lastObstacle.y > 80) {
                    return;
                }
                
                const lastGapLeft = lastObstacle.gapPosition;
                const lastGapRight = lastObstacle.gapPosition + lastObstacle.gapWidth;
                const newGapLeft = obstacle.gapPosition;
                const newGapRight = obstacle.gapPosition + obstacle.gapWidth;
                
                const noGapOverlap = (newGapRight < lastGapLeft || newGapLeft > lastGapRight);
                
                if (noGapOverlap) {
                    const targetCenter = lastGapLeft + (lastObstacle.gapWidth / 2);
                    const gapHalfWidth = obstacle.gapWidth / 2;
                    
                    const newPosition = Math.max(0, Math.min(100 - obstacle.gapWidth, targetCenter - gapHalfWidth));
                    obstacle.gapPosition = newPosition;
                    
                    obstacle.leftElement.style.width = `${obstacle.gapPosition}%`;
                    obstacle.rightElement.style.left = `${obstacle.gapPosition + obstacle.gapWidth}%`;
                    obstacle.rightElement.style.width = `${100 - (obstacle.gapPosition + obstacle.gapWidth)}%`;
                }
            }
            
            // Draw the obstacle immediately after creating it
            const elevatorShaft = document.querySelector('.elevator-shaft');
            if (elevatorShaft) {
                obstacle.draw(elevatorShaft);
            }
            
            gameState.obstacles.push(obstacle);
            gameState.lastObstacleTime = currentTime;
        } catch (error) {
            console.error('Error generating obstacle:', error);
        }
    }
}

// Create the obstacle generation interval
function createObstacleInterval() {
    // Generate an initial obstacle right away
    generateObstacle();
    
    gameState.obstacleInterval = setInterval(() => {
        if (!gameState.gameActive) return;
        
        // Debug info to see obstacles
        console.log(`Current obstacles: ${gameState.obstacles.length}, Descent speed: ${gameState.descentSpeed.toFixed(1)}`);
        if (gameState.obstacles.length > 0) {
            console.log(`First obstacle y: ${gameState.obstacles[0].y.toFixed(1)}%, isInDOM: ${gameState.obstacles[0].isInDOM}`);
        }
        
        generateObstacle();
        
        if (gameState.obstacles.length < 3) {
            let lowestY = 0;
            gameState.obstacles.forEach(obs => {
                lowestY = Math.max(lowestY, obs.y);
            });
            
            if (lowestY < 80) {
                gameState.lastObstacleTime = 0;
                generateObstacle();
            }
        }
    }, 250);
}

// Setup increasing difficulty over time
function setupDifficultyProgression() {
    gameState.difficultyTimer = setInterval(() => {
        if (!gameState.gameActive) return;
        
        gameState.difficultyLevel += 0.3;
        gameState.minObstacleSpacing = Math.max(1200, 3000 - (gameState.difficultyLevel * 150));
        
        // Increase leviathan speed as difficulty increases, but more slowly
        gameState.leviathanSpeed += 0.005; // Reduced from 0.01
        
        const currentDepthDisplay = document.getElementById('currentDepth');
        if (currentDepthDisplay) {
            currentDepthDisplay.style.color = 'var(--danger-color)';
            setTimeout(() => {
                currentDepthDisplay.style.color = 'var(--depth-color)';
            }, 200);
        }
    }, 18000);
}

// Collision detection - modified to slow down player instead of ending the game
function checkCollisions() {
    // Skip collision check if player already recently collided
    if (gameState.recentlyCollided) {
        return;
    }
    
    let collision = false;
    
    gameState.obstacles.forEach(obstacle => {
        if (!obstacle.passed && obstacle.checkCollision(
            gameState.elevatorX, 
            gameState.elevatorWidth, 
            gameState.elevatorHeight, 
            gameState.shaftWidth,
            gameState.shaftHeight
        )) {
            // Add debugging to show which obstacle is causing collision
            console.log(`Collision detected with obstacle at y=${obstacle.y}%, gapPosition=${obstacle.gapPosition}%`);
            console.log(`Elevator position: x=${gameState.elevatorX}%, width=${gameState.elevatorWidth}px`);
            
            // Highlight the colliding obstacle for debugging
            if (obstacle.isInDOM) {
                obstacle.leftElement.style.backgroundColor = 'red';
                obstacle.rightElement.style.backgroundColor = 'red';
                
                // Reset color after a short delay
                setTimeout(() => {
                    obstacle.leftElement.style.backgroundColor = '';
                    obstacle.rightElement.style.backgroundColor = '';
                }, 300);
            }
            
            collision = true;
        }
    });
    
    if (collision) {
        // Flash the background to indicate collision
        const elevatorShaft = document.querySelector('.elevator-shaft');
        if (elevatorShaft) {
            elevatorShaft.classList.add('collision');
            setTimeout(() => {
                elevatorShaft.classList.remove('collision');
            }, 300);
        }
        
        // Slow down the player
        gameState.descentSpeed = Math.max(gameState.minSpeed, gameState.descentSpeed / gameState.collisionSlowdownFactor);
        
        // Set collision state
        gameState.recentlyCollided = true;
        gameState.collisionCooldown = gameState.maxCollisionCooldown;
        
        // Decrease leviathan distance (leviathan gets closer)
        gameState.leviathanDistance = Math.max(0, gameState.leviathanDistance - 5); // Reduced from 10 to 5
        
        // If leviathan catches player, end the game
        if (gameState.leviathanDistance <= 0) {
            endGame();
        }
    }
}

// Export game functions
export { 
    initGame,
    gameState
}; 