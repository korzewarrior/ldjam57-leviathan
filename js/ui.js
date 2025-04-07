import { checkHighScore, displayLeaderboard } from './leaderboard.js';
function updateDepthDisplay(currentDepth) {
    const currentDepthDisplay = document.getElementById('currentDepth');
    if (currentDepthDisplay) {
        currentDepthDisplay.textContent = Math.floor(currentDepth);
    }
}
function updateBrakePowerDisplay(phasePower, maxPhasePower, descentSpeed, phasePowerRegenSpeedThreshold) {
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
function updateBrakingVisuals(isPhasing, canPhase) {
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
function showWelcomeScreen() {
    const welcomeScreen = document.getElementById('welcomeScreen');
    const gameScreen = document.getElementById('gameScreen');
    const resultsScreen = document.getElementById('resultsScreen');
    
    welcomeScreen.classList.remove('hidden');
    gameScreen.classList.add('hidden');
    resultsScreen.classList.add('hidden');
}
function showGameScreen() {
    const welcomeScreen = document.getElementById('welcomeScreen');
    const gameScreen = document.getElementById('gameScreen');
    const resultsScreen = document.getElementById('resultsScreen');
    
    welcomeScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    resultsScreen.classList.add('hidden');
}
function showResultsScreen(playerName, currentDepth) {
    const gameScreen = document.getElementById('gameScreen');
    const resultsScreen = document.getElementById('resultsScreen');
    const finalDepthDisplay = document.getElementById('finalDepth');
    
    gameScreen.classList.add('hidden');
    resultsScreen.classList.remove('hidden');
    
    const finalDepth = Math.floor(currentDepth);
    finalDepthDisplay.textContent = finalDepth;
    
    
    checkHighScore(playerName, currentDepth)
        .then(isHighScore => {
            return displayLeaderboard();
        })
        .catch(error => {
            console.error('Error updating leaderboard:', error);
            displayLeaderboard();
        });
    
    
    let hintElement = document.getElementById('clickToRestartHint');
    if (!hintElement) {
        hintElement = document.createElement('p');
        hintElement.id = 'clickToRestartHint';
        hintElement.style.marginTop = '20px';
        hintElement.style.fontSize = '0.9rem';
        hintElement.style.color = 'var(--phase-color)';
        hintElement.textContent = 'CLICK ANYWHERE TO TRY AGAIN';
        resultsScreen.appendChild(hintElement);
    }
}
function updateDebugVisuals(gameState, elevatorShaft) {
    const existingDebugElements = document.querySelectorAll('.debug-box');
    existingDebugElements.forEach(element => element.remove());
    
    if (!gameState.debugMode) return;
    
    
    const elevatorDebug = document.createElement('div');
    elevatorDebug.className = 'debug-box debug-elevator';
    
    const elevatorWidthPx = gameState.elevatorWidth;
    const elevatorHeightPx = gameState.elevatorHeight;
    const elevatorXPx = (gameState.elevatorX / 100) * gameState.shaftWidth;
    const elevatorYPx = (25 / 100) * gameState.shaftHeight;
    
    elevatorDebug.style.width = `${elevatorWidthPx}px`;
    elevatorDebug.style.height = `${elevatorHeightPx}px`;
    elevatorDebug.style.left = `${elevatorXPx - (elevatorWidthPx / 2)}px`;
    elevatorDebug.style.top = `${elevatorYPx - (elevatorHeightPx / 2)}px`;
    
    elevatorShaft.appendChild(elevatorDebug);
    
    
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