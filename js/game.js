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
let mouseIsDown = false;
const gameState = {
    playerName: '',
    currentDepth: 0,
    descentSpeed: 0,
    normalSpeed: 0,  
    minSpeed: 2,
    maxSpeed: 60,
    baseAcceleration: 0.03,
    isPhasing: false,
    phaseBoostActive: false,
    phaseBoostDuration: 0,
    maxPhaseBoostDuration: 10,
    speedNormalizationRate: 0.08, 
    obstacleInterval: null,
    difficultyTimer: null,
    gameActive: false,
    debugMode: false,
    maxPhasePower: 100,
    phasePower: 100,
    phasePowerConsumptionRate: 2.2,
    phasePowerRegenRate: 0.15,
    phasePowerRegenSpeedThreshold: 6,
    canPhase: true,
    shaftWidth: 0,
    shaftHeight: 0,
    elevatorX: 50,
    lastElevatorX: 50, 
    elevatorRotation: 0, 
    maxRotation: 25, 
    rotationSpeed: 0.2, 
    elevatorWidth: 40,  
    elevatorHeight: 70, 
    obstacles: [],
    particles: [],
    difficultyLevel: 1,
    lastObstacleTime: 0,
    minObstacleSpacing: 3000,
    movementFactor: 0.15,
    
    leviathanDistance: 100, 
    maxLeviathanDistance: 100,
    leviathanSpeed: 0.025, 
    collisionSlowdownFactor: 2.0, 
    recentlyCollided: false,
    collisionCooldown: 0,
    maxCollisionCooldown: 60, 
    leviathanElement: null,
    phaseSound: null,
    bubbleInterval: null
};
function initGame() {
    
    const welcomeScreen = document.getElementById('welcomeScreen');
    const gameScreen = document.getElementById('gameScreen');
    const resultsScreen = document.getElementById('resultsScreen');
    const playerNameInput = document.getElementById('playerName');
    const playerNameDisplay = document.getElementById('playerNameDisplay');
    const startButton = document.getElementById('startButton');
    const elevatorShaft = document.querySelector('.elevator-shaft');
    const elevator = document.querySelector('.elevator');
    const leviathan = document.getElementById('leviathan');
    
    
    gameState.leviathanElement = leviathan;
    
    
    try {
        gameState.phaseSound = new Audio();
        gameState.phaseSound.src = 'data:audio/wav;base64,UklGRt4rAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YboqAAABAAEAKysDA/n5dXUICAYG';
        gameState.phaseSound.volume = 0.5;
    } catch (e) {
        console.error("Could not initialize phase sound", e);
    }
    
    
    startButton.addEventListener('click', () => {
        startGame(playerNameInput, playerNameDisplay, elevatorShaft);
    });
    
    
    resultsScreen.addEventListener('click', () => {
        resultsScreen.classList.add('hidden');
        startGame(playerNameInput, playerNameDisplay, elevatorShaft);
    });
    
    
    setupInputHandlers(gameState, elevatorShaft, elevator);
    
    
    window.addEventListener('mousedown', () => {
        if (gameState.gameActive && gameState.canPhase) {
            gameState.isPhasing = true;
            
            
            gameState.normalSpeed = gameState.descentSpeed;
            
            
            gameState.phaseBoostActive = true;
            gameState.phaseBoostDuration = gameState.maxPhaseBoostDuration;
            
            
            if (gameState.phaseSound) {
                try {
                    gameState.phaseSound.currentTime = 0;
                    gameState.phaseSound.play().catch(e => console.log("Could not play phase sound", e));
                } catch (e) {
                    console.log("Error playing sound", e);
                }
            }
            
            
            const elevator = document.getElementById('elevator');
            if (elevator) {
                elevator.classList.add('phasing');
                elevator.classList.remove('normalizing-speed');
                
                
                let trail = elevator.querySelector('.trail');
                if (!trail) {
                    trail = document.createElement('div');
                    trail.className = 'trail';
                    elevator.appendChild(trail);
                }
                
                
                let propulsionTrail = elevator.querySelector('.propulsion-trail');
                if (!propulsionTrail) {
                    propulsionTrail = document.createElement('div');
                    propulsionTrail.className = 'propulsion-trail';
                    elevator.appendChild(propulsionTrail);
                }
                
                
                if (!gameState.bubbleInterval) {
                    gameState.bubbleInterval = setInterval(() => {
                        if (gameState.isPhasing && gameState.gameActive) {
                            createBubble(elevator);
                        } else {
                            clearInterval(gameState.bubbleInterval);
                            gameState.bubbleInterval = null;
                        }
                    }, 200);
                }
            }
        }
    });
    
    window.addEventListener('mouseup', () => {
        gameState.isPhasing = false;
        
        
        const elevator = document.getElementById('elevator');
        if (elevator) {
            elevator.classList.remove('phasing');
            
            
            const trail = elevator.querySelector('.trail');
            if (trail) {
                elevator.removeChild(trail);
            }
            
            
            
        }
        
        
        if (gameState.bubbleInterval) {
            clearInterval(gameState.bubbleInterval);
            gameState.bubbleInterval = null;
        }
    });
    
    
    loadLeaderboard().then(() => {
        displayLeaderboard();
    }).catch(error => {
        console.error('Error loading leaderboard:', error);
    });
    
    
    window.addEventListener('resize', () => {
        if (gameState.gameActive) {
            updateShaftDimensions(elevatorShaft);
        }
    });
}
function startGame(playerNameInput, playerNameDisplay, elevatorShaft) {
    gameState.playerName = playerNameInput.value.trim() || 'ANONYMOUS';
    playerNameDisplay.textContent = gameState.playerName;
    
    showGameScreen();
    
    
    const elevatorElement = document.getElementById('elevator');
    
    
    if (!elevatorElement) {
        console.error('Elevator element not found, creating a new one');
        const newElevator = document.createElement('div');
        newElevator.id = 'elevator';
        newElevator.className = 'elevator';
        
        
        const trail = document.createElement('div');
        trail.className = 'propulsion-trail';
        newElevator.appendChild(trail);
        
        elevatorShaft.innerHTML = '';
        elevatorShaft.appendChild(newElevator);
    } else {
        
        const childElements = Array.from(elevatorShaft.children);
        childElements.forEach(child => {
            if (child.id !== 'elevator' && child.id !== 'leviathan') {
                elevatorShaft.removeChild(child);
            }
        });
        
        
        if (!elevatorShaft.contains(elevatorElement)) {
            elevatorShaft.appendChild(elevatorElement);
        }
        
        
        if (!elevatorElement.querySelector('.propulsion-trail')) {
            const trail = document.createElement('div');
            trail.className = 'propulsion-trail';
            elevatorElement.appendChild(trail);
        }
    }
    
    
    if (gameState.leviathanElement) {
        gameState.leviathanElement.classList.remove('hidden');
        gameState.leviathanElement.classList.remove('approaching');
        gameState.leviathanElement.classList.remove('close');
        gameState.leviathanElement.style.bottom = '';
        gameState.leviathanElement.style.top = '-25%';
    }
    
    updateShaftDimensions(elevatorShaft);
    
    
    gameState.currentDepth = 0;
    gameState.descentSpeed = 5;
    gameState.gameActive = true;
    gameState.isPhasing = false;
    
    gameState.obstacles.forEach(obstacle => obstacle.remove());
    gameState.particles.forEach(particle => particle.remove());
    
    gameState.obstacles = [];
    gameState.particles = [];
    
    gameState.difficultyLevel = 1;
    gameState.lastObstacleTime = 0;
    gameState.minObstacleSpacing = 3000;
    
    gameState.phasePower = gameState.maxPhasePower;
    gameState.canPhase = true;
    
    
    gameState.leviathanDistance = gameState.maxLeviathanDistance;
    gameState.recentlyCollided = false;
    gameState.collisionCooldown = 0;
    
    updateDepthDisplay(gameState.currentDepth);
    updatePhasePowerDisplay(
        gameState.phasePower, 
        gameState.maxPhasePower, 
        gameState.descentSpeed, 
        gameState.phasePowerRegenSpeedThreshold
    );
    updateLeviathanDistanceDisplay();
    
    if (gameState.obstacleInterval) clearInterval(gameState.obstacleInterval);
    if (gameState.difficultyTimer) clearInterval(gameState.difficultyTimer);
    
    setupGameLoop();
}
function endGame() {
    gameState.gameActive = false;
    
    if (gameState.obstacleInterval) clearInterval(gameState.obstacleInterval);
    if (gameState.difficultyTimer) clearInterval(gameState.difficultyTimer);
    
    gameState.obstacles.forEach(obstacle => obstacle.remove());
    gameState.particles.forEach(particle => particle.remove());
    
    gameState.obstacles = [];
    gameState.particles = [];
    
    
    if (gameState.leviathanElement) {
        gameState.leviathanElement.classList.add('hidden');
    }
    
    showResultsScreen(gameState.playerName, gameState.currentDepth);
}
function updateShaftDimensions(elevatorShaft) {
    if (elevatorShaft) {
        gameState.shaftWidth = elevatorShaft.offsetWidth;
        gameState.shaftHeight = elevatorShaft.offsetHeight;
    }
}
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
            
            
            if (frameCount % 5 === 0) {
                updateDepthDisplay(gameState.currentDepth);
            }
            
            
            updateSubmarineOrientation();
            
            const depthFactor = Math.min(1 + (gameState.currentDepth / 300), 4);
            const currentAcceleration = gameState.baseAcceleration * depthFactor;
            
            
            if (gameState.isPhasing && gameState.canPhase) {
                gameState.phasePower -= gameState.phasePowerConsumptionRate;
                
                if (gameState.phasePower <= 0) {
                    gameState.phasePower = 0;
                    gameState.canPhase = false;
                    
                    
                    gameState.isPhasing = false;
                    gameState.phaseBoostActive = false;
                    const elevator = document.getElementById('elevator');
                    if (elevator) {
                        elevator.classList.remove('phasing');
                    }
                }
                
                
                if (gameState.phaseBoostActive && gameState.phaseBoostDuration === gameState.maxPhaseBoostDuration) {
                    gameState.normalSpeed = gameState.descentSpeed;
                }
                
                
                if (gameState.phaseBoostActive) {
                    
                    gameState.descentSpeed = Math.min(gameState.maxSpeed, gameState.descentSpeed * 1.15);
                    
                    gameState.phaseBoostDuration--;
                    if (gameState.phaseBoostDuration <= 0) {
                        gameState.phaseBoostActive = false;
                    }
                } else {
                    
                    gameState.descentSpeed = Math.min(gameState.maxSpeed, gameState.descentSpeed * 1.02);
                }
            } else {
                
                gameState.phaseBoostActive = false;
                
                
                if (gameState.normalSpeed > 0 && Math.abs(gameState.descentSpeed - gameState.normalSpeed) > 1) {
                    if (gameState.descentSpeed > gameState.normalSpeed) {
                        
                        const reductionAmount = Math.max(
                            0.5, 
                            (gameState.descentSpeed - gameState.normalSpeed) * gameState.speedNormalizationRate
                        );
                        gameState.descentSpeed = Math.max(
                            gameState.normalSpeed,
                            gameState.descentSpeed - reductionAmount
                        );
                        
                        
                        const elevator = document.getElementById('elevator');
                        if (elevator) {
                            elevator.classList.add('normalizing-speed');
                        }
                    }
                } else {
                    
                    gameState.normalSpeed = 0;
                    
                    
                    const elevator = document.getElementById('elevator');
                    if (elevator) {
                        elevator.classList.remove('normalizing-speed');
                    }
                }
                
                
                if (gameState.phasePower < gameState.maxPhasePower) {
                    if (gameState.descentSpeed >= gameState.phasePowerRegenSpeedThreshold) {
                        const speedFactor = Math.max(0.3, 1 - (gameState.descentSpeed / 50));
                        const adjustedRegenRate = gameState.phasePowerRegenRate * speedFactor;
                        
                        gameState.phasePower += adjustedRegenRate;
                        if (gameState.phasePower >= gameState.maxPhasePower) {
                            gameState.phasePower = gameState.maxPhasePower;
                        }
                    }
                    
                    
                    if (!gameState.canPhase && gameState.phasePower >= gameState.maxPhasePower * 0.3) {
                        gameState.canPhase = true;
                    }
                }
                
                
                if (gameState.normalSpeed === 0) {
                    gameState.descentSpeed = Math.min(gameState.maxSpeed, gameState.descentSpeed + currentAcceleration);
                }
                
                
                if (gameState.descentSpeed > 30) {
                    const autobrake = (gameState.descentSpeed - 30) * 0.005;
                    gameState.descentSpeed = Math.max(30, gameState.descentSpeed - autobrake);
                }
            }
            
            
            if (frameCount % 3 === 0) {
                updatePhasePowerDisplay(
                    gameState.phasePower, 
                    gameState.maxPhasePower, 
                    gameState.descentSpeed, 
                    gameState.phasePowerRegenSpeedThreshold
                );
                updatePhasingVisuals(gameState.isPhasing, gameState.canPhase);
                updateLeviathanDistanceDisplay();
            }
            
            
            updateParticles();
            updateObstacles();
            
            
            if (gameState.recentlyCollided) {
                gameState.collisionCooldown--;
                if (gameState.collisionCooldown <= 0) {
                    gameState.recentlyCollided = false;
                    gameState.collisionCooldown = 0;
                }
            }
            
            
            updateLeviathan(frameCount);
            
            
            checkCollisions();
            
            
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
function updateLeviathan(frameCount) {
    
    let baseApproachRate = gameState.leviathanSpeed;
    
    
    const depthFactor = Math.min(1 + (gameState.currentDepth / 800), 2.0); 
    baseApproachRate *= depthFactor;
    
    
    const speedFactor = Math.max(0.5, Math.min(2.8, gameState.descentSpeed / 12)); 
    const approachRate = baseApproachRate / speedFactor;
    
    
    let isEscaping = false;
    
    
    if (gameState.descentSpeed > 16 && !gameState.recentlyCollided) { 
        
        const previousDistance = gameState.leviathanDistance;
        gameState.leviathanDistance = Math.min(
            gameState.maxLeviathanDistance, 
            gameState.leviathanDistance + (gameState.descentSpeed - 16) * 0.05 
        );
        
        
        isEscaping = gameState.leviathanDistance > previousDistance;
    } else {
        
        gameState.leviathanDistance -= approachRate;
        isEscaping = false;
    }
    
    
    const elevatorShaft = document.querySelector('.elevator-shaft');
    const leviathanDistanceBar = document.getElementById('leviathanDistanceBar');
    
    if (isEscaping) {
        
        if (gameState.leviathanElement) {
            gameState.leviathanElement.classList.add('escaping');
            gameState.leviathanElement.classList.remove('approaching', 'close');
        }
        
        if (elevatorShaft) {
            elevatorShaft.classList.add('escaping');
        }
        
        if (leviathanDistanceBar) {
            leviathanDistanceBar.classList.add('escaping');
        }
    } else {
        
        if (gameState.leviathanElement) {
            gameState.leviathanElement.classList.remove('escaping');
        }
        
        if (elevatorShaft) {
            elevatorShaft.classList.remove('escaping');
        }
        
        if (leviathanDistanceBar) {
            leviathanDistanceBar.classList.remove('escaping');
        }
    }
    
    
    if (gameState.recentlyCollided) {
        gameState.leviathanDistance -= baseApproachRate * 1.0; 
    }
    
    
    if (gameState.leviathanDistance <= 0) {
        gameState.leviathanDistance = 0;
        
        
        if (gameState.leviathanElement) {
            
            gameState.leviathanElement.style.top = '-10%';
            gameState.leviathanElement.style.bottom = 'auto'; 
        }
        
        endGame();
        return;
    }
    
    
    if (frameCount % 4 === 0 && gameState.leviathanElement) {
        const normalizedDistance = gameState.leviathanDistance / gameState.maxLeviathanDistance;
        
        
        
        const topPosition = -10 - (normalizedDistance * 70);
        
        
        gameState.leviathanElement.style.bottom = 'auto';
        gameState.leviathanElement.style.top = `${topPosition}%`;
        
        
        if (!isEscaping) {
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
}
function updateLeviathanDistanceDisplay() {
    const leviathanDistanceBar = document.getElementById('leviathanDistanceBar');
    if (leviathanDistanceBar) {
        const distancePercentage = (gameState.leviathanDistance / gameState.maxLeviathanDistance) * 100;
        leviathanDistanceBar.style.width = `${distancePercentage}%`;
        
        
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
    
    
    const maxParticles = 50; 
    
    if (gameState.particles.length < maxParticles) {
        const newParticlesCount = Math.min(Math.floor(currentSpeed / 5), 2); 
        
        for (let i = 0; i < newParticlesCount; i++) {
            const newParticle = new Particle();
            newParticle.draw(elevatorShaft);
            gameState.particles.push(newParticle);
        }
    }
}
function updateObstacles() {
    const elevatorShaft = document.querySelector('.elevator-shaft');
    if (!elevatorShaft) return;
    
    const visibleObstacles = [];
    const currentSpeed = gameState.descentSpeed;
    const moveFactor = gameState.movementFactor;
    
    
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
function generateObstacle() {
    
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
function createObstacleInterval() {
    
    generateObstacle();
    
    gameState.obstacleInterval = setInterval(() => {
        if (!gameState.gameActive) return;
        
        
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
function setupDifficultyProgression() {
    gameState.difficultyTimer = setInterval(() => {
        if (!gameState.gameActive) return;
        
        gameState.difficultyLevel += 0.3;
        gameState.minObstacleSpacing = Math.max(1200, 3000 - (gameState.difficultyLevel * 150));
        
        
        gameState.leviathanSpeed += 0.002; 
        
        const currentDepthDisplay = document.getElementById('currentDepth');
        if (currentDepthDisplay) {
            currentDepthDisplay.style.color = 'var(--danger-color)';
            setTimeout(() => {
                currentDepthDisplay.style.color = 'var(--depth-color)';
            }, 200);
        }
    }, 18000);
}
function checkCollisions() {
    
    if (gameState.recentlyCollided || gameState.isPhasing) {
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
            
            console.log(`Collision detected with obstacle at y=${obstacle.y}%, gapPosition=${obstacle.gapPosition}%`);
            console.log(`Elevator position: x=${gameState.elevatorX}%, width=${gameState.elevatorWidth}px`);
            
            
            if (obstacle.isInDOM) {
                obstacle.leftElement.style.backgroundColor = 'red';
                obstacle.rightElement.style.backgroundColor = 'red';
                
                
                setTimeout(() => {
                    obstacle.leftElement.style.backgroundColor = '';
                    obstacle.rightElement.style.backgroundColor = '';
                }, 300);
            }
            
            collision = true;
        }
    });
    
    if (collision) {
        
        const elevatorShaft = document.querySelector('.elevator-shaft');
        if (elevatorShaft) {
            elevatorShaft.classList.add('collision');
            setTimeout(() => {
                elevatorShaft.classList.remove('collision');
            }, 300);
        }
        
        
        gameState.descentSpeed = Math.max(gameState.minSpeed, gameState.descentSpeed / gameState.collisionSlowdownFactor);
        
        
        gameState.recentlyCollided = true;
        gameState.collisionCooldown = gameState.maxCollisionCooldown;
        
        
        gameState.leviathanDistance = Math.max(0, gameState.leviathanDistance - 3); 
        
        
        if (gameState.leviathanDistance <= 0) {
            endGame();
        }
    }
}
function updatePhasePowerDisplay(phasePower, maxPhasePower, descentSpeed, phasePowerRegenSpeedThreshold) {
    const phasePowerBar = document.getElementById('brakePowerBar');
    if (phasePowerBar) {
        const powerPercentage = (phasePower / maxPhasePower) * 100;
        phasePowerBar.style.width = `${powerPercentage}%`;
        
        if (powerPercentage < 25) {
            phasePowerBar.style.backgroundColor = 'var(--danger-color)';
        } else if (powerPercentage < 50) {
            phasePowerBar.style.backgroundColor = '#8a2be2'; 
        } else {
            phasePowerBar.style.backgroundColor = '#00bfff'; 
        }
        
        if (descentSpeed > 20) {
            const flashRate = Math.min(1, (descentSpeed - 20) / 20);
            phasePowerBar.style.opacity = 0.5 + (Math.sin(Date.now() * flashRate * 0.01) * 0.5);
            
            const pulseSize = Math.min(5, (descentSpeed - 20) / 8);
            phasePowerBar.style.boxShadow = `0 0 ${pulseSize}px 2px rgba(0, 191, 255, 0.7)`;
        } else {
            phasePowerBar.style.opacity = 1;
            phasePowerBar.style.boxShadow = '';
        }
        
        if (descentSpeed < phasePowerRegenSpeedThreshold && phasePower < maxPhasePower) {
            phasePowerBar.style.opacity = 0.5;
            phasePowerBar.style.background = `repeating-linear-gradient(
                45deg,
                ${phasePowerBar.style.backgroundColor},
                ${phasePowerBar.style.backgroundColor} 10px,
                rgba(0, 0, 0, 0.2) 10px,
                rgba(0, 0, 0, 0.2) 20px
            )`;
        } else if (descentSpeed <= 20) {
            phasePowerBar.style.background = '';
        }
    }
}
function updatePhasingVisuals(isPhasing, canPhase) {
    const body = document.body;
    const elevatorShaft = document.querySelector('.elevator-shaft');
    
    if (isPhasing && canPhase) {
        elevatorShaft.classList.add('phasing');
        body.classList.add('phasing');
    } else {
        elevatorShaft.classList.remove('phasing');
        body.classList.remove('phasing');
    }
}
function createBubble(elevator) {
    const elevatorShaft = document.querySelector('.elevator-shaft');
    if (!elevatorShaft || !elevator) return;
    
    const bubble = document.createElement('div');
    bubble.className = 'bubble-particle';
    
    
    const elevatorRect = elevator.getBoundingClientRect();
    const shaftRect = elevatorShaft.getBoundingClientRect();
    
    
    const bubbleX = (elevatorRect.left + elevatorRect.right) / 2 - shaftRect.left;
    const bubbleY = elevatorRect.bottom - 10 - shaftRect.top;
    
    bubble.style.left = `${bubbleX}px`;
    bubble.style.top = `${bubbleY}px`;
    
    
    bubble.style.width = `${4 + Math.random() * 4}px`;
    bubble.style.height = bubble.style.width;
    bubble.style.opacity = `${0.6 + Math.random() * 0.4}`;
    
    
    elevatorShaft.appendChild(bubble);
    
    
    setTimeout(() => {
        if (bubble.parentNode) {
            bubble.parentNode.removeChild(bubble);
        }
    }, 2000);
}
function updateSubmarineOrientation() {
    const elevator = document.getElementById('elevator');
    if (!elevator) return;
    
    
    const xDiff = gameState.elevatorX - gameState.lastElevatorX;
    
    
    const targetRotation = -xDiff * gameState.maxRotation;
    
    
    gameState.elevatorRotation += (targetRotation - gameState.elevatorRotation) * gameState.rotationSpeed;
    
    
    if (Math.abs(xDiff) < 0.01 && Math.abs(gameState.elevatorRotation) > 0.1) {
        gameState.elevatorRotation *= 0.9; 
    }
    
    
    elevator.style.transform = `translate(-50%, -50%) rotate(${gameState.elevatorRotation}deg)`;
    
    
    elevator.style.setProperty('--current-rotation', `${gameState.elevatorRotation}deg`);
    
    
    if (Math.abs(xDiff) > 0.05) {
        elevator.classList.add('moving');
        
        
        if (!elevator.querySelector('.propulsion-trail')) {
            const trail = document.createElement('div');
            trail.className = 'propulsion-trail';
            elevator.appendChild(trail);
        }
    } else {
        elevator.classList.remove('moving');
    }
    
    
    gameState.lastElevatorX = gameState.elevatorX;
}
export { 
    initGame,
    gameState
}; 