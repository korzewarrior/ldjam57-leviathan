// UI management functions
import { checkHighScore, displayLeaderboard } from './leaderboard.js';

// Update the depth display with current depth
function updateDepthDisplay(currentDepth) {
    const currentDepthDisplay = document.getElementById('currentDepth');
    if (currentDepthDisplay) {
        currentDepthDisplay.textContent = Math.floor(currentDepth);
    }
}

// Update the brake power display
function updateBrakePowerDisplay(brakePower, maxBrakePower, descentSpeed, brakePowerRegenSpeedThreshold) {
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
        
        if (descentSpeed < brakePowerRegenSpeedThreshold && brakePower < maxBrakePower) {
            brakePowerBar.style.opacity = 0.5;
            brakePowerBar.style.background = `repeating-linear-gradient(
                45deg,
                ${brakePowerBar.style.backgroundColor},
                ${brakePowerBar.style.backgroundColor} 10px,
                rgba(0, 0, 0, 0.2) 10px,
                rgba(0, 0, 0, 0.2) 20px
            )`;
        } else if (descentSpeed <= 20) {
            brakePowerBar.style.background = '';
        }
    }
}

// Update visuals for braking state
function updateBrakingVisuals(isBraking, canBrake) {
    const body = document.body;
    const elevatorShaft = document.querySelector('.elevator-shaft');
    
    if (isBraking && canBrake) {
        elevatorShaft.classList.add('braking');
        body.classList.add('braking');
    } else {
        elevatorShaft.classList.remove('braking');
        body.classList.remove('braking');
    }
}

// Show the welcome screen
function showWelcomeScreen() {
    const welcomeScreen = document.getElementById('welcomeScreen');
    const gameScreen = document.getElementById('gameScreen');
    const resultsScreen = document.getElementById('resultsScreen');
    
    welcomeScreen.classList.remove('hidden');
    gameScreen.classList.add('hidden');
    resultsScreen.classList.add('hidden');
}

// Show the game screen
function showGameScreen() {
    const welcomeScreen = document.getElementById('welcomeScreen');
    const gameScreen = document.getElementById('gameScreen');
    const resultsScreen = document.getElementById('resultsScreen');
    
    welcomeScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    resultsScreen.classList.add('hidden');
}

// Show the results screen
function showResultsScreen(playerName, currentDepth) {
    const gameScreen = document.getElementById('gameScreen');
    const resultsScreen = document.getElementById('resultsScreen');
    const finalDepthDisplay = document.getElementById('finalDepth');
    const highScoreMessage = document.getElementById('highScoreMessage');
    
    gameScreen.classList.add('hidden');
    resultsScreen.classList.remove('hidden');
    
    const finalDepth = Math.floor(currentDepth);
    finalDepthDisplay.textContent = finalDepth;
    
    const isHighScore = checkHighScore(playerName, currentDepth);
    if (isHighScore) {
        highScoreMessage.textContent = '★ NEW RECORD! ★';
    } else {
        highScoreMessage.textContent = '';
    }
    
    displayLeaderboard();
}

// Update debug visuals when debug mode is active
function updateDebugVisuals(gameState, elevatorShaft) {
    const existingDebugElements = document.querySelectorAll('.debug-box');
    existingDebugElements.forEach(element => element.remove());
    
    if (!gameState.debugMode) return;
    
    // Debug box for elevator
    const elevatorDebug = document.createElement('div');
    elevatorDebug.className = 'debug-box debug-elevator';
    
    const elevatorWidthPx = gameState.elevatorWidth;
    const elevatorHeightPx = gameState.elevatorHeight;
    const elevatorXPx = (gameState.elevatorX / 100) * gameState.shaftWidth;
    const elevatorYPx = (10 / 100) * gameState.shaftHeight;
    
    elevatorDebug.style.width = `${elevatorWidthPx}px`;
    elevatorDebug.style.height = `${elevatorHeightPx}px`;
    elevatorDebug.style.left = `${elevatorXPx - (elevatorWidthPx / 2)}px`;
    elevatorDebug.style.top = `${elevatorYPx - (elevatorHeightPx / 2)}px`;
    
    elevatorShaft.appendChild(elevatorDebug);
    
    // Debug boxes for obstacles
    gameState.obstacles.forEach(obstacle => {
        const obstacleY = (obstacle.y / 100) * gameState.shaftHeight;
        const gapLeft = (obstacle.gapPosition / 100) * gameState.shaftWidth;
        const gapWidth = (obstacle.gapWidth / 100) * gameState.shaftWidth;
        
        const gapDebug = document.createElement('div');
        gapDebug.className = 'debug-box debug-gap';
        gapDebug.style.width = `${gapWidth}px`;
        gapDebug.style.height = `${obstacle.height}px`;
        gapDebug.style.left = `${gapLeft}px`;
        gapDebug.style.top = `${obstacleY - (obstacle.height / 2)}px`;
        
        elevatorShaft.appendChild(gapDebug);
    });
}

export {
    updateDepthDisplay,
    updateBrakePowerDisplay,
    updateBrakingVisuals,
    showWelcomeScreen,
    showGameScreen,
    showResultsScreen,
    updateDebugVisuals
}; 