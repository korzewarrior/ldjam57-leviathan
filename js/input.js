let mouseIsInGameArea = true;
let lastKnownMouseX = window.innerWidth / 2;
let elevatorX = 50;
function setPosition(clientX, elevatorShaft, elevator) {
    const xPosition = mouseIsInGameArea ? clientX : lastKnownMouseX;
    
    const rect = elevatorShaft.getBoundingClientRect();
    const shaftLeft = rect.left;
    const shaftWidth = rect.width;
    
    const elevatorWidth = elevator.offsetWidth;
    const halfElevatorWidth = elevatorWidth / 2;
    
    const relativeX = xPosition - shaftLeft;
    
    const constrainedX = Math.max(halfElevatorWidth, Math.min(relativeX, shaftWidth - halfElevatorWidth));
    
    
    const currentTransform = elevator.style.transform;
    const rotationMatch = currentTransform.match(/rotate\(([^)]+)\)/);
    const currentRotation = rotationMatch ? rotationMatch[1] : '0deg';
    
    
    elevator.style.left = `${constrainedX}px`;
    
    
    elevatorX = (constrainedX / shaftWidth) * 100;
    return elevatorX;
}
function setupInputHandlers(gameState, elevatorShaft, elevator) {
    
    elevatorShaft.addEventListener('mousemove', e => {
        lastKnownMouseX = e.clientX;
        if (gameState.gameActive) {
            gameState.elevatorX = setPosition(e.clientX, elevatorShaft, elevator);
        }
    });
    
    elevatorShaft.addEventListener('touchmove', e => {
        e.preventDefault();
        if (e.touches.length > 0) {
            lastKnownMouseX = e.touches[0].clientX;
            if (gameState.gameActive) {
                gameState.elevatorX = setPosition(e.touches[0].clientX, elevatorShaft, elevator);
            }
        }
    });
    
    elevatorShaft.addEventListener('mouseenter', () => {
        mouseIsInGameArea = true;
    });
    
    elevatorShaft.addEventListener('mouseleave', () => {
        mouseIsInGameArea = false;
    });
    
    window.addEventListener('mousemove', (e) => {
        if (gameState.gameActive) {
            lastKnownMouseX = e.clientX;
            if (!mouseIsInGameArea && gameState.isPhasing) {
                gameState.elevatorX = setPosition(e.clientX, elevatorShaft, elevator);
            }
        }
    });
    
    window.addEventListener('touchstart', (e) => {
        if (gameState.gameActive && gameState.canPhase) {
            gameState.isPhasing = true;
            
            
            gameState.normalSpeed = gameState.descentSpeed;
            
            
            if (gameState.phaseBoostActive !== undefined) {
                gameState.phaseBoostActive = true;
                gameState.phaseBoostDuration = gameState.maxPhaseBoostDuration || 10;
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
    
    window.addEventListener('touchend', () => {
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
    
    window.addEventListener('touchmove', (e) => {
        if (gameState.gameActive && e.touches.length > 0) {
            lastKnownMouseX = e.touches[0].clientX;
            gameState.elevatorX = setPosition(e.touches[0].clientX, elevatorShaft, elevator);
            e.preventDefault();
        }
    }, { passive: false });
    
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
    
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
    
    document.addEventListener('dragstart', e => e.preventDefault());
    document.addEventListener('drag', e => e.preventDefault());
    document.addEventListener('drop', e => e.preventDefault());
    document.addEventListener('dragover', e => e.preventDefault());
}
export { 
    setupInputHandlers, 
    setPosition 
}; 