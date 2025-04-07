// This is a standalone helper script to start the game directly
console.log('Start helper script loaded');

document.addEventListener('DOMContentLoaded', () => {
    console.log('Start helper initialized');
    
    // Find the button
    const startButton = document.getElementById('startButton');
    
    if (startButton) {
        console.log('Start button found by helper');
        
        // Replace any existing onclick handlers
        startButton.onclick = function(event) {
            console.log('Start button clicked via helper script');
            event.preventDefault();
            
            // Get required elements
            const playerNameInput = document.getElementById('playerName');
            const playerNameDisplay = document.getElementById('playerNameDisplay');
            const welcomeScreen = document.getElementById('welcomeScreen');
            const gameScreen = document.getElementById('gameScreen');
            const elevatorShaft = document.querySelector('.elevator-shaft');
            const elevator = document.getElementById('elevator');
            
            // Simple direct game start
            try {
                // Get player name
                const playerName = playerNameInput ? (playerNameInput.value.trim() || 'ANONYMOUS') : 'ANONYMOUS';
                if (playerNameDisplay) playerNameDisplay.textContent = playerName;
                
                // Switch screens
                if (welcomeScreen) welcomeScreen.classList.add('hidden');
                if (gameScreen) gameScreen.classList.remove('hidden');
                
                console.log('Game started via helper!');
                
                // EMERGENCY FIX: Force game loop to start
                if (window.gameState) {
                    window.gameState.gameActive = true;
                    window.gameState.currentDepth = 0;
                    window.gameState.descentSpeed = 5;
                    window.gameState.leviathanDistance = window.gameState.maxLeviathanDistance || 100;
                    
                    // Set up emergency game loop if needed
                    if (!window.gameLoopStarted) {
                        window.gameLoopStarted = true;
                        console.log('EMERGENCY: Setting up backup game loop');
                        
                        // Update depth display
                        const updateDepth = () => {
                            if (!window.gameState || !window.gameState.gameActive) return;
                            
                            window.gameState.currentDepth += window.gameState.descentSpeed / 100;
                            const currentDepthDisplay = document.getElementById('currentDepth');
                            if (currentDepthDisplay) {
                                currentDepthDisplay.textContent = Math.floor(window.gameState.currentDepth);
                            }
                            
                            // Simple descent speed increase
                            window.gameState.descentSpeed = Math.min(40, window.gameState.descentSpeed + 0.01);
                            
                            requestAnimationFrame(updateDepth);
                        };
                        
                        // Start the emergency loop
                        requestAnimationFrame(updateDepth);
                    }
                }
                
                // Try to call main startGame function if available
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