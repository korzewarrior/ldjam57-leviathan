
console.log('Start helper script loaded');

document.addEventListener('DOMContentLoaded', () => {
    console.log('Start helper initialized');
    
    const startButton = document.getElementById('startButton');
    
    if (startButton) {
        console.log('Start button found by helper');
        
        startButton.onclick = function(event) {
            console.log('Start button clicked via helper script');
            event.preventDefault();
            
            const playerNameInput = document.getElementById('playerName');
            const playerNameDisplay = document.getElementById('playerNameDisplay');
            const welcomeScreen = document.getElementById('welcomeScreen');
            const gameScreen = document.getElementById('gameScreen');
            const elevatorShaft = document.querySelector('.elevator-shaft');
            const elevator = document.getElementById('elevator');
            
            try {
                const playerName = playerNameInput ? (playerNameInput.value.trim() || 'ANONYMOUS') : 'ANONYMOUS';
                if (playerNameDisplay) playerNameDisplay.textContent = playerName;
                if (welcomeScreen) welcomeScreen.classList.add('hidden');
                if (gameScreen) gameScreen.classList.remove('hidden');
                console.log('Game started via helper!');
                
                if (window.gameState) {
                    window.gameState.gameActive = true;
                    window.gameState.currentDepth = 0;
                    window.gameState.descentSpeed = 5;
                    window.gameState.leviathanDistance = window.gameState.maxLeviathanDistance || 100;
        
                    if (!window.gameLoopStarted) {
                        window.gameLoopStarted = true;
                        console.log('EMERGENCY: Setting up backup game loop');
                        
                        const updateDepth = () => {
                            if (!window.gameState || !window.gameState.gameActive) return;
                            
                            window.gameState.currentDepth += window.gameState.descentSpeed / 100;
                            const currentDepthDisplay = document.getElementById('currentDepth');
                            if (currentDepthDisplay) {
                                currentDepthDisplay.textContent = Math.floor(window.gameState.currentDepth);
                            }
                            
                            window.gameState.descentSpeed = Math.min(40, window.gameState.descentSpeed + 0.01);
                            
                            requestAnimationFrame(updateDepth);
                        };
                        
                        requestAnimationFrame(updateDepth);
                    }
                }
                
                if (window.startGameManually) {
                    window.startGameManually();
                }
            } catch (error) {
                console.error('Error in helper start:', error);
            }
        };
        
        console.log('Helper click handler attached');
    } else {
        console.error('Start button not found by helper');
    }
}); 