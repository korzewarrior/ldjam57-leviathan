// Input handling for player movement and phasing
let mouseIsInGameArea = true;
let lastKnownMouseX = window.innerWidth / 2;
let elevatorX = 50;

// Function to set the elevator's position based on mouse input
function setPosition(clientX, elevatorShaft, elevator) {
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
    return elevatorX;
}

// Setup input event listeners
function setupInputHandlers(gameState, elevatorShaft, elevator) {
    // Mouse movement in shaft
    elevatorShaft.addEventListener('mousemove', e => {
        lastKnownMouseX = e.clientX;
        if (gameState.gameActive) {
            gameState.elevatorX = setPosition(e.clientX, elevatorShaft, elevator);
        }
    });

    // Touch movement in shaft
    elevatorShaft.addEventListener('touchmove', e => {
        e.preventDefault();
        if (e.touches.length > 0) {
            lastKnownMouseX = e.touches[0].clientX;
            if (gameState.gameActive) {
                gameState.elevatorX = setPosition(e.touches[0].clientX, elevatorShaft, elevator);
            }
        }
    });

    // Track when mouse enters game area
    elevatorShaft.addEventListener('mouseenter', () => {
        mouseIsInGameArea = true;
    });

    // Track when mouse leaves game area
    elevatorShaft.addEventListener('mouseleave', () => {
        mouseIsInGameArea = false;
    });

    // Global mouse movement for elevator control even outside game area
    window.addEventListener('mousemove', (e) => {
        if (gameState.gameActive) {
            lastKnownMouseX = e.clientX;
            if (!mouseIsInGameArea && gameState.isPhasing) {
                gameState.elevatorX = setPosition(e.clientX, elevatorShaft, elevator);
            }
        }
    });

    // Touch start for phasing
    window.addEventListener('touchstart', (e) => {
        if (gameState.gameActive && gameState.canPhase) {
            gameState.isPhasing = true;
            
            // Save normal speed before activating the boost
            gameState.normalSpeed = gameState.descentSpeed;
            
            // Add phase boost effect
            if (gameState.phaseBoostActive !== undefined) {
                gameState.phaseBoostActive = true;
                gameState.phaseBoostDuration = gameState.maxPhaseBoostDuration || 10;
            }
            
            // Add phase effect to elevator
            const elevator = document.getElementById('elevator');
            if (elevator) {
                elevator.classList.add('phasing');
                elevator.classList.remove('normalizing-speed');
                
                // Add or update the trail element
                let trail = elevator.querySelector('.trail');
                if (!trail) {
                    trail = document.createElement('div');
                    trail.className = 'trail';
                    elevator.appendChild(trail);
                }
                
                // Start creating bubbles on touch devices
                if (!gameState.bubbleInterval && typeof createBubble === 'function') {
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
            
            if (e.touches.length > 0) {
                lastKnownMouseX = e.touches[0].clientX;
            }
            e.preventDefault();
        }
    }, { passive: false });

    // Touch end to release phase
    window.addEventListener('touchend', () => {
        gameState.isPhasing = false;
        
        // Remove phase effect from elevator
        const elevator = document.getElementById('elevator');
        if (elevator) {
            elevator.classList.remove('phasing');
            
            // Remove trail element
            const trail = elevator.querySelector('.trail');
            if (trail) {
                elevator.removeChild(trail);
            }
        }
        
        // Clear bubble interval for touch
        if (gameState.bubbleInterval) {
            clearInterval(gameState.bubbleInterval);
            gameState.bubbleInterval = null;
        }
    });

    // Touch move for elevator control
    window.addEventListener('touchmove', (e) => {
        if (gameState.gameActive && e.touches.length > 0) {
            lastKnownMouseX = e.touches[0].clientX;
            gameState.elevatorX = setPosition(e.touches[0].clientX, elevatorShaft, elevator);
            e.preventDefault();
        }
    }, { passive: false });

    // Prevent context menu
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });

    // Debug mode toggle with 'd' key
    document.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'd') {
            gameState.debugMode = !gameState.debugMode;
            
            if (gameState.debugMode) {
                if (gameState.updateDebugVisuals) {
                    gameState.updateDebugVisuals();
                }
            } else {
                const debugElements = document.querySelectorAll('.debug-box');
                debugElements.forEach(element => element.remove());
            }
        }
    });

    // Prevent drag behaviors
    document.addEventListener('dragstart', e => e.preventDefault());
    document.addEventListener('drag', e => e.preventDefault());
    document.addEventListener('drop', e => e.preventDefault());
    document.addEventListener('dragover', e => e.preventDefault());
}

export { 
    setupInputHandlers, 
    setPosition 
}; 