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
    const elevatorShaft = document.querySelector('.elevator-shaft');
    const gameContainer = document.querySelector('.game-container');
    const elevator = document.querySelector('.elevator');
    const brakePowerDisplay = document.getElementById('brake-power');
    const brakePowerFill = document.querySelector('.brake-power-fill');
    
    // Prevent dragging behavior
    document.addEventListener('dragstart', e => e.preventDefault());
    document.addEventListener('drag', e => e.preventDefault());
    document.addEventListener('drop', e => e.preventDefault());
    document.addEventListener('dragover', e => e.preventDefault());
    
    // Mouse/touch state tracking
    let mouseIsDown = false;
    let mouseIsInGameArea = true;
    let lastKnownMouseX = window.innerWidth / 2;
    
    // Game variables
    let playerName = '';
    let currentDepth = 0;
    let descentSpeed = 0;
    let minSpeed = 2;
    let maxSpeed = 60;
    let baseAcceleration = 0.03;
    let deceleration = 0.3;
    let isBraking = false;
    let gameInterval;
    let obstacleInterval;
    let difficultyTimer;
    let gameActive = false;
    let debugMode = false;
    let maxBrakePower = 100;
    let brakePower = maxBrakePower;
    let brakePowerConsumptionRate = 1.0;
    let brakePowerRegenRate = 0.3;
    let canBrake = true;
    let leaderboard = [];
    let shaftWidth = 0;
    let shaftHeight = 0;
    let elevatorX = 50;
    let elevatorWidth = 70;
    let elevatorHeight = 70;
    let obstacles = [];
    let particles = [];
    let lastMouseX = 0;
    let difficultyLevel = 1;
    let lastObstacleTime = 0;
    let minObstacleSpacing = 3000;
    const movementFactor = 0.15;
    
    class Particle {
        constructor() {
            this.x = Math.random() * 100;
            this.y = 120;
            this.size = Math.random() * 4 + 2;
            this.speed = Math.random() * 0.8 + 0.5;
            this.opacity = Math.random() * 0.5 + 0.3;
            
            this.element = document.createElement('div');
            this.element.className = 'particle';
            this.element.style.width = `${this.size}px`;
            this.element.style.height = `${this.size}px`;
            this.element.style.opacity = this.opacity;
            
            this.isInDOM = false;
        }
        
        update(speedMultiplier) {
            this.y -= this.speed * speedMultiplier * movementFactor;
            
            if (this.isInDOM) {
                this.element.style.top = `${this.y}%`;
                this.element.style.left = `${this.x}%`;
            }
            
            const stillVisible = this.y > -20;
            
            if (!stillVisible && this.isInDOM) {
                this.shouldRemove = true;
            }
            
            return stillVisible;
        }
        
        draw(container) {
            if (!this.isInDOM) {
                this.element.style.top = `${this.y}%`;
                this.element.style.left = `${this.x}%`;
                
                container.appendChild(this.element);
                this.isInDOM = true;
                this.shouldRemove = false;
            }
        }
        
        remove() {
            if (this.isInDOM && this.element.parentNode) {
                this.element.parentNode.removeChild(this.element);
                this.isInDOM = false;
            }
        }
    }
    
    class Obstacle {
        constructor(difficulty) {
            this.gapWidth = Math.max(35 - (difficulty * 1), 25);
            
            const maxPosition = 100 - this.gapWidth - 5;
            const minPosition = 5;
            this.gapPosition = minPosition + (Math.random() * (maxPosition - minPosition));
            
            this.y = 120;
            this.passed = false;
            this.height = 15 + Math.random() * 5;
            
            this.leftElement = document.createElement('div');
            this.leftElement.className = 'obstacle';
            
            this.rightElement = document.createElement('div');
            this.rightElement.className = 'obstacle';
            
            this.leftElement.style.left = '0';
            this.leftElement.style.width = `${this.gapPosition}%`;
            this.leftElement.style.height = `${this.height}px`;
            this.leftElement.style.transform = 'translateY(-50%)';
            
            this.rightElement.style.left = `${this.gapPosition + this.gapWidth}%`;
            this.rightElement.style.width = `${100 - (this.gapPosition + this.gapWidth)}%`;
            this.rightElement.style.height = `${this.height}px`;
            this.rightElement.style.transform = 'translateY(-50%)';
            
            this.isInDOM = false;
        }
        
        update(speedMultiplier) {
            this.y -= speedMultiplier * movementFactor;
            
            if (this.isInDOM) {
                this.leftElement.style.top = `${this.y}%`;
                this.rightElement.style.top = `${this.y}%`;
            }
            
            const stillVisible = this.y > -20;
            
            if (!stillVisible && this.isInDOM) {
                this.shouldRemove = true;
            }
            
            return stillVisible;
        }
        
        draw(container) {
            if (!this.isInDOM) {
                this.leftElement.style.top = `${this.y}%`;
                this.rightElement.style.top = `${this.y}%`;
                
                container.appendChild(this.leftElement);
                container.appendChild(this.rightElement);
                
                this.isInDOM = true;
                this.shouldRemove = false;
            }
        }
        
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
        
        checkCollision(elevatorX, elevatorWidth, elevatorHeight, shaftWidth) {
            const elevator = {
                centerX: (elevatorX / 100) * shaftWidth,
                centerY: (10 / 100) * shaftHeight,
                width: elevatorWidth,
                height: elevatorHeight
            };
            
            const elevatorLeft = elevator.centerX - (elevator.width / 2);
            const elevatorRight = elevator.centerX + (elevator.width / 2);
            const elevatorTop = elevator.centerY - (elevator.height / 2);
            const elevatorBottom = elevator.centerY + (elevator.height / 2);
            
            const obstacleY = (this.y / 100) * shaftHeight;
            const obstacleHeight = this.height;
            
            const obstacleTop = obstacleY - (obstacleHeight / 2);
            const obstacleBottom = obstacleY + (obstacleHeight / 2);
            
            const verticalOverlap = !(
                elevatorBottom < obstacleTop || 
                elevatorTop > obstacleBottom
            );
            
            if (!verticalOverlap) {
                if (obstacleBottom < elevatorTop && !this.passed) {
                    this.passed = true;
                }
                return false;
            }
            
            const gapLeft = (this.gapPosition / 100) * shaftWidth;
            const gapRight = ((this.gapPosition + this.gapWidth) / 100) * shaftWidth;
            
            const insideGap = elevatorLeft >= gapLeft && elevatorRight <= gapRight;
            
            if (insideGap) {
                return false;
            }
            
            return true;
        }
    }
    
    function loadLeaderboard() {
        const savedLeaderboard = localStorage.getItem('deepDescentLeaderboard');
        if (savedLeaderboard) {
            try {
                leaderboard = JSON.parse(savedLeaderboard);
            } catch (e) {
                leaderboard = [];
            }
        }
    }
    
    function saveLeaderboard() {
        try {
            localStorage.setItem('deepDescentLeaderboard', JSON.stringify(leaderboard));
        } catch (e) {
            console.error('Error saving leaderboard:', e);
        }
    }
    
    function displayLeaderboard() {
        leaderboardList.innerHTML = '';
        
        const sortedLeaderboard = [...leaderboard].sort((a, b) => b.depth - a.depth);
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
    
    function checkHighScore(depth) {
        if (!playerName.trim()) return false;
        
        const newScore = {
            name: playerName,
            depth: depth,
            date: new Date().toISOString()
        };
        
        leaderboard.push(newScore);
        
        const sortedLeaderboard = [...leaderboard].sort((a, b) => b.depth - a.depth);
        
        const playerRank = sortedLeaderboard.findIndex(entry => 
            entry.name === newScore.name && 
            Math.abs(entry.depth - newScore.depth) < 0.1 &&
            entry.date === newScore.date);
        
        leaderboard = sortedLeaderboard.slice(0, 50);
        saveLeaderboard();
        
        return playerRank < 10;
    }
    
    function updateParticles() {
        const shaft = document.querySelector('.elevator-shaft');
        
        if (!shaft.contains(elevatorElement)) {
            shaft.appendChild(elevatorElement);
        }
        
        const visibleParticles = [];
        
        particles.forEach(particle => {
            const isVisible = particle.update(descentSpeed);
            
            if (isVisible) {
                particle.draw(shaft);
                visibleParticles.push(particle);
            } else {
                particle.remove();
            }
        });
        
        particles = visibleParticles;
        
        const maxParticles = 70;
        
        if (particles.length < maxParticles) {
            const particleCount = Math.min(Math.floor(descentSpeed / 4), 3);
            
            for (let i = 0; i < particleCount; i++) {
                const newParticle = new Particle();
                newParticle.draw(shaft);
                particles.push(newParticle);
            }
        }
    }
    
    function setPosition(clientX) {
        const xPosition = mouseIsInGameArea ? clientX : lastKnownMouseX;
        
        const rect = elevatorShaft.getBoundingClientRect();
        const shaftLeft = rect.left;
        const shaftWidth = rect.width;
        
        const elevatorWidth = elevator.offsetWidth;
        const halfElevatorWidth = elevatorWidth / 2;
        
        const relativeX = xPosition - shaftLeft;
        
        const constrainedX = Math.max(halfElevatorWidth, Math.min(relativeX, shaftWidth - halfElevatorWidth));
        
        elevator.style.left = `${constrainedX}px`;
        
        elevatorX = (constrainedX / shaftWidth) * 100;
    }
    
    elevatorShaft.addEventListener('mousemove', e => {
        lastKnownMouseX = e.clientX;
        setPosition(e.clientX);
    });
    
    elevatorShaft.addEventListener('touchmove', e => {
        e.preventDefault();
        if (e.touches.length > 0) {
            lastKnownMouseX = e.touches[0].clientX;
            setPosition(e.touches[0].clientX);
        }
    });
    
    function generateObstacle() {
        const currentTime = Date.now();
        
        const speedFactor = Math.min(1.5, Math.max(1.0, descentSpeed / 40));
        const adjustedSpacing = minObstacleSpacing * speedFactor;
        
        if (currentTime - lastObstacleTime >= adjustedSpacing) {
            const obstacle = new Obstacle(difficultyLevel);
            
            if (difficultyLevel < 3) {
                obstacle.gapWidth = Math.max(obstacle.gapWidth, 25);
            }
            
            if (descentSpeed > 20) {
                const speedAdjustment = Math.min(10, (descentSpeed - 20) / 4);
                obstacle.gapWidth = Math.min(45, obstacle.gapWidth + speedAdjustment);
            }
            
            if (obstacles.length > 0) {
                const lastObstacle = obstacles[obstacles.length - 1];
                
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
            
            obstacles.push(obstacle);
            lastObstacleTime = currentTime;
        }
    }
    
    function updateBrakingVisuals() {
        const shaft = document.querySelector('.elevator-shaft');
        const body = document.body;
        
        if (isBraking && canBrake) {
            shaft.classList.add('braking');
            body.classList.add('braking');
        } else {
            shaft.classList.remove('braking');
            body.classList.remove('braking');
        }
    }
    
    function updateShaftDimensions() {
        const shaft = document.querySelector('.elevator-shaft');
        if (shaft) {
            shaftWidth = shaft.offsetWidth;
            shaftHeight = shaft.offsetHeight;
        }
    }
    
    function updateBrakePowerDisplay() {
        const brakePowerBar = document.getElementById('brakePowerBar');
        if (brakePowerBar) {
            const powerPercentage = (brakePower / maxBrakePower) * 100;
            brakePowerBar.style.width = `${powerPercentage}%`;
            
            if (powerPercentage < 25) {
                brakePowerBar.style.backgroundColor = 'var(--danger-color)';
            } else if (powerPercentage < 50) {
                brakePowerBar.style.backgroundColor = 'var(--brake-color)';
            } else {
                brakePowerBar.style.backgroundColor = 'var(--success-color)';
            }
            
            if (descentSpeed > 20) {
                const flashRate = Math.min(1, (descentSpeed - 20) / 20);
                brakePowerBar.style.opacity = 0.5 + (Math.sin(Date.now() * flashRate * 0.01) * 0.5);
                
                const pulseSize = Math.min(5, (descentSpeed - 20) / 8);
                brakePowerBar.style.boxShadow = `0 0 ${pulseSize}px 2px rgba(255, 60, 90, 0.7)`;
            } else {
                brakePowerBar.style.opacity = 1;
                brakePowerBar.style.boxShadow = '';
            }
        }
    }
    
    function setupGameLoop() {
        let lastTimestamp = 0;
        const targetFPS = 60;
        const frameInterval = 1000 / targetFPS;
        const shaft = document.querySelector('.elevator-shaft');
        
        function gameLoop(timestamp) {
            if (!gameActive) return;
            
            const elapsed = timestamp - lastTimestamp;
            
            if (elapsed > frameInterval) {
                lastTimestamp = timestamp - (elapsed % frameInterval);
                
                currentDepth += descentSpeed / 100;
                currentDepthDisplay.textContent = Math.floor(currentDepth);
                
                const depthFactor = Math.min(1 + (currentDepth / 300), 4);
                const currentAcceleration = baseAcceleration * depthFactor;
                
                if ((mouseIsDown || isBraking) && canBrake) {
                    brakePower -= brakePowerConsumptionRate;
                    
                    if (brakePower <= 0) {
                        brakePower = 0;
                        canBrake = false;
                    }
                    
                    const brakeEffectiveness = Math.min(0.03, 0.015 + (descentSpeed / 400));
                    descentSpeed = Math.max(minSpeed, descentSpeed * (1 - brakeEffectiveness));
                } else {
                    if (brakePower < maxBrakePower) {
                        const speedFactor = Math.max(0.3, 1 - (descentSpeed / 50));
                        const adjustedRegenRate = brakePowerRegenRate * speedFactor;
                        
                        brakePower += adjustedRegenRate;
                        if (brakePower >= maxBrakePower) {
                            brakePower = maxBrakePower;
                        }
                        
                        if (!canBrake && brakePower >= maxBrakePower * 0.2) {
                            canBrake = true;
                        }
                    }
                    
                    descentSpeed = Math.min(maxSpeed, descentSpeed + currentAcceleration);
                    
                    if (descentSpeed > 30) {
                        const autobrake = (descentSpeed - 30) * 0.005;
                        descentSpeed = Math.max(30, descentSpeed - autobrake);
                    }
                }
                
                updateBrakePowerDisplay();
                updateBrakingVisuals();
                obstacles.forEach(obstacle => obstacle.draw(shaft));
                updateParticles();
                updateObstacles();
                checkCollisions();
                
                if (debugMode) {
                    updateDebugVisuals();
                }
            }
            
            if (gameActive) {
                requestAnimationFrame(gameLoop);
            }
        }
        
        requestAnimationFrame(gameLoop);
        createObstacleInterval();
        setupDifficultyProgression();
    }
    
    function startGame() {
        playerName = playerNameInput.value.trim() || 'ANONYMOUS';
        playerNameDisplay.textContent = playerName;
        
        welcomeScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        
        const shaft = document.querySelector('.elevator-shaft');
        shaft.innerHTML = '';
        shaft.appendChild(elevatorElement);
        
        updateShaftDimensions();
        
        currentDepth = 0;
        descentSpeed = 5;
        gameActive = true;
        isBraking = false;
        
        obstacles.forEach(obstacle => obstacle.remove());
        particles.forEach(particle => particle.remove());
        
        obstacles = [];
        particles = [];
        
        difficultyLevel = 1;
        lastObstacleTime = 0;
        minObstacleSpacing = 3000;
        
        brakePower = maxBrakePower;
        canBrake = true;
        
        currentDepthDisplay.textContent = '0';
        updateBrakePowerDisplay();
        
        if (obstacleInterval) clearInterval(obstacleInterval);
        if (difficultyTimer) clearInterval(difficultyTimer);
        
        setupGameLoop();
    }
    
    function endGame() {
        gameActive = false;
        
        if (obstacleInterval) clearInterval(obstacleInterval);
        if (difficultyTimer) clearInterval(difficultyTimer);
        
        obstacles.forEach(obstacle => obstacle.remove());
        particles.forEach(particle => particle.remove());
        
        obstacles = [];
        particles = [];
        
        gameScreen.classList.add('hidden');
        resultsScreen.classList.remove('hidden');
        
        const finalDepth = Math.floor(currentDepth);
        finalDepthDisplay.textContent = finalDepth;
        
        const isHighScore = checkHighScore(currentDepth);
        if (isHighScore) {
            highScoreMessage.textContent = 'NEW RECORD!';
        } else {
            highScoreMessage.textContent = '';
        }
        
        displayLeaderboard();
    }
    
    startButton.addEventListener('click', startGame);
    
    window.addEventListener('mousedown', () => {
        mouseIsDown = true;
        if (gameActive && canBrake) {
            isBraking = true;
        }
    });
    
    window.addEventListener('mouseup', () => {
        mouseIsDown = false;
        isBraking = false;
    });
    
    document.querySelector('.elevator-shaft').addEventListener('mouseenter', () => {
        mouseIsInGameArea = true;
    });
    
    document.querySelector('.elevator-shaft').addEventListener('mouseleave', () => {
        mouseIsInGameArea = false;
    });
    
    window.addEventListener('mousemove', (e) => {
        if (gameActive) {
            lastKnownMouseX = e.clientX;
            if (!mouseIsInGameArea && mouseIsDown) {
                setPosition(e.clientX);
            }
        }
    });
    
    window.addEventListener('touchstart', (e) => {
        if (gameActive && canBrake) {
            mouseIsDown = true;
            isBraking = true;
            if (e.touches.length > 0) {
                lastKnownMouseX = e.touches[0].clientX;
            }
            e.preventDefault();
        }
    }, { passive: false });
    
    window.addEventListener('touchend', () => {
        mouseIsDown = false;
        isBraking = false;
    });
    
    window.addEventListener('touchmove', (e) => {
        if (gameActive && e.touches.length > 0) {
            lastKnownMouseX = e.touches[0].clientX;
            setPosition(e.touches[0].clientX);
            e.preventDefault();
        }
    }, { passive: false });
    
    playAgainButton.addEventListener('click', () => {
        resultsScreen.classList.add('hidden');
        startGame();
    });
    
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'd') {
            debugMode = !debugMode;
            
            if (debugMode) {
                updateDebugVisuals();
            } else {
                const debugElements = document.querySelectorAll('.debug-box');
                debugElements.forEach(element => element.remove());
            }
        }
    });
    
    loadLeaderboard();
    displayLeaderboard();
    
    window.addEventListener('resize', () => {
        if (gameActive) {
            updateShaftDimensions();
        }
    });
    
    function updateObstacles() {
        const visibleObstacles = [];
        
        obstacles.forEach(obstacle => {
            const isVisible = obstacle.update(descentSpeed);
            
            if (isVisible) {
                visibleObstacles.push(obstacle);
            } else {
                obstacle.remove();
            }
        });
        
        obstacles = visibleObstacles;
    }
    
    function checkCollisions() {
        let collision = false;
        
        obstacles.forEach(obstacle => {
            if (!obstacle.passed && obstacle.checkCollision(elevatorX, elevatorWidth, elevatorHeight, shaftWidth)) {
                collision = true;
            }
        });
        
        if (collision) {
            endGame();
        }
    }
    
    function createObstacleInterval() {
        obstacleInterval = setInterval(() => {
            if (!gameActive) return;
            
            generateObstacle();
            
            if (obstacles.length < 3) {
                let lowestY = 0;
                obstacles.forEach(obs => {
                    lowestY = Math.max(lowestY, obs.y);
                });
                
                if (lowestY < 80) {
                    lastObstacleTime = 0;
                    generateObstacle();
                }
            }
        }, 250);
    }
    
    function setupDifficultyProgression() {
        difficultyTimer = setInterval(() => {
            if (!gameActive) return;
            
            difficultyLevel += 0.3;
            minObstacleSpacing = Math.max(1200, 3000 - (difficultyLevel * 150));
            
            currentDepthDisplay.style.color = 'var(--danger-color)';
            setTimeout(() => {
                currentDepthDisplay.style.color = 'var(--depth-color)';
            }, 200);
            
        }, 18000);
    }
    
    function updateDebugVisuals() {
        const existingDebugElements = document.querySelectorAll('.debug-box');
        existingDebugElements.forEach(element => element.remove());
        
        if (!debugMode) return;
        
        const shaft = document.querySelector('.elevator-shaft');
        
        const elevatorDebug = document.createElement('div');
        elevatorDebug.className = 'debug-box debug-elevator';
        
        const elevatorWidthPx = elevatorWidth;
        const elevatorHeightPx = elevatorHeight;
        const elevatorXPx = (elevatorX / 100) * shaftWidth;
        const elevatorYPx = (10 / 100) * shaftHeight;
        
        elevatorDebug.style.width = `${elevatorWidthPx}px`;
        elevatorDebug.style.height = `${elevatorHeightPx}px`;
        elevatorDebug.style.left = `${elevatorXPx - (elevatorWidthPx / 2)}px`;
        elevatorDebug.style.top = `${elevatorYPx - (elevatorHeightPx / 2)}px`;
        
        shaft.appendChild(elevatorDebug);
        
        obstacles.forEach(obstacle => {
            const obstacleY = (obstacle.y / 100) * shaftHeight;
            const gapLeft = (obstacle.gapPosition / 100) * shaftWidth;
            const gapWidth = (obstacle.gapWidth / 100) * shaftWidth;
            
            const gapDebug = document.createElement('div');
            gapDebug.className = 'debug-box debug-gap';
            gapDebug.style.width = `${gapWidth}px`;
            gapDebug.style.height = `${obstacle.height}px`;
            gapDebug.style.left = `${gapLeft}px`;
            gapDebug.style.top = `${obstacleY - (obstacle.height / 2)}px`;
            
            shaft.appendChild(gapDebug);
        });
    }
}); 