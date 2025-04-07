// Remove mouseIsInGameArea, lastKnownMouseX, elevatorX globals
// Remove setPosition function

// Function to update elevator's visual style based on percentage
function updateElevatorStyle(elevator, elevatorShaft, percentageX) {
    if (!elevator || !elevatorShaft) return;

    const rect = elevatorShaft.getBoundingClientRect();
    const shaftWidth = rect.width;
    const elevatorWidth = elevator.offsetWidth;
    const halfElevatorWidth = elevatorWidth / 2;

    // Convert percentage back to pixel position, constrained within shaft
    const targetX = (percentageX / 100) * shaftWidth;
    const constrainedX = Math.max(halfElevatorWidth, Math.min(targetX, shaftWidth - halfElevatorWidth));

    // Keep existing rotation if any
    const currentTransform = elevator.style.transform;
    const rotationMatch = currentTransform.match(/rotate\(([^)]+)\)/);
    const currentRotation = rotationMatch ? rotationMatch[1] : '0deg';

    // Set the left style (removing rotation from direct style if needed)
    elevator.style.left = `${constrainedX}px`;

    // Re-apply rotation if needed (or handle transform more robustly)
    // Assuming rotation isn't critical to horizontal position for now
    // elevator.style.transform = `translateX(-50%) rotate(${currentRotation})`; // Example if using transform for centering
}


function setupInputHandlers(gameState, elevatorShaft, elevator) {

    // Ensure elevatorX is initialized (might be better done in game setup)
    if (gameState.elevatorX === undefined) {
       gameState.elevatorX = 50; // Center initial position
    }
    updateElevatorStyle(elevator, elevatorShaft, gameState.elevatorX); // Set initial style


    // --- Pointer Lock Implementation ---

    elevatorShaft.addEventListener('click', () => {
        if (gameState.gameActive && document.pointerLockElement !== elevatorShaft) {
            elevatorShaft.requestPointerLock()
                .catch(err => {
                    console.error("Failed to lock pointer:", err);
                });
        }
    });

    // Optional: Listen for lock/unlock events
    document.addEventListener('pointerlockchange', () => {
        if (document.pointerLockElement === elevatorShaft) {
            console.log('Pointer locked.');
            // You could add logic here if needed when lock activates
        } else {
            console.log('Pointer unlocked.');
            // You could add logic here if needed when lock deactivates (e.g., pause game)
        }
    }, false);

    document.addEventListener('pointerlockerror', (e) => {
        console.error('Pointer lock error:', e);
    }, false);

    // Use document mousemove for locked pointer input
    document.addEventListener('mousemove', (e) => {
        // Only move elevator if pointer is locked to the shaft and game is active
        if (document.pointerLockElement === elevatorShaft && gameState.gameActive) {
            const rect = elevatorShaft.getBoundingClientRect();
            const shaftWidth = rect.width;

            if (shaftWidth > 0) {
                // Calculate change based on movementX and shaft width
                const sensitivityMultiplier = 1.5; // Adjust this value to change sensitivity
                const deltaPercentage = (e.movementX * sensitivityMultiplier / shaftWidth) * 100;
                // Update gameState's elevator position (percentage)
                gameState.elevatorX = Math.max(0, Math.min(100, gameState.elevatorX + deltaPercentage));
                // Update the visual style
                updateElevatorStyle(elevator, elevatorShaft, gameState.elevatorX);
            }
            // Update lastKnownMouseX for consistency if needed elsewhere, though less relevant now
             // lastKnownMouseX = e.clientX; // Less critical with pointer lock
        }
        // Removed old window mousemove logic that used clientX when not phasing/out of area
    });


    // --- Touch Event Handlers (Updated) ---

    elevatorShaft.addEventListener('touchmove', e => {
        e.preventDefault(); // Prevent scrolling/etc.
        if (e.touches.length > 0 && gameState.gameActive) {
            const touch = e.touches[0];
            const rect = elevatorShaft.getBoundingClientRect();
            const shaftLeft = rect.left;
            const shaftWidth = rect.width;

            if (shaftWidth > 0) {
                const relativeX = touch.clientX - shaftLeft;
                // Calculate percentage position from touch
                const touchPercentage = (relativeX / shaftWidth) * 100;
                // Update gameState's elevator position (percentage), constrained 0-100
                gameState.elevatorX = Math.max(0, Math.min(100, touchPercentage));
                // Update the visual style
                updateElevatorStyle(elevator, elevatorShaft, gameState.elevatorX);
            }
        }
    }, { passive: false });


    // Removed elevatorShaft mouseenter/mouseleave listeners


    // --- Existing Listeners (Phasing, Debug, Context Menu, Drag) ---
    // Keep touchstart/touchend for phasing largely the same
    // Note: touchstart used lastKnownMouseX, which is removed. If phasing needs touch start position, retrieve it here.
     window.addEventListener('touchstart', (e) => {
        if (gameState.gameActive && gameState.canPhase) {
            gameState.isPhasing = true;
            gameState.normalSpeed = gameState.descentSpeed;
            if (gameState.phaseBoostActive !== undefined) {
                gameState.phaseBoostActive = true;
                gameState.phaseBoostDuration = gameState.maxPhaseBoostDuration || 10;
            }

            const currentElevator = document.getElementById('elevator'); // Use different var name
            if (currentElevator) {
                 currentElevator.classList.add('phasing');
                 currentElevator.classList.remove('normalizing-speed');
                 // Trail/propulsion/bubble logic remains the same
                 let trail = currentElevator.querySelector('.trail');
                 if (!trail) {
                     trail = document.createElement('div');
                     trail.className = 'trail';
                     currentElevator.appendChild(trail);
                 }
                 let propulsionTrail = currentElevator.querySelector('.propulsion-trail');
                 if (!propulsionTrail) {
                     propulsionTrail = document.createElement('div');
                     propulsionTrail.className = 'propulsion-trail';
                     currentElevator.appendChild(propulsionTrail);
                 }
                 if (!gameState.bubbleInterval && typeof createBubble === 'function') {
                     gameState.bubbleInterval = setInterval(() => {
                         if (gameState.isPhasing && gameState.gameActive) {
                             createBubble(currentElevator);
                         } else {
                             clearInterval(gameState.bubbleInterval);
                             gameState.bubbleInterval = null;
                         }
                     }, 200);
                 }
            }
             // If initial touch position is needed for something, get it here:
             // if (e.touches.length > 0) {
             //     const touch = e.touches[0];
             //     // const initialTouchX = touch.clientX; // Example
             // }
            e.preventDefault();
        }
    }, { passive: false });

    window.addEventListener('touchend', () => {
        // Logic remains the same
        gameState.isPhasing = false;
        const currentElevator = document.getElementById('elevator');
        if (currentElevator) {
            currentElevator.classList.remove('phasing');
            const trail = currentElevator.querySelector('.trail');
            if (trail) {
                currentElevator.removeChild(trail);
            }
        }
        if (gameState.bubbleInterval) {
            clearInterval(gameState.bubbleInterval);
            gameState.bubbleInterval = null;
        }
    });

    // Removed window touchmove listener as elevatorShaft touchmove handles it now

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
        // Allow Esc to exit pointer lock naturally
        // if (e.key === 'Escape') {
             // if (document.pointerLockElement === elevatorShaft) {
             //     document.exitPointerLock();
             // }
        // }
    });

    // Keep drag prevention listeners
    document.addEventListener('dragstart', e => e.preventDefault());
    document.addEventListener('drag', e => e.preventDefault());
    document.addEventListener('drop', e => e.preventDefault());
    document.addEventListener('dragover', e => e.preventDefault());
}

// Export the main setup function (and potentially updateElevatorStyle if needed elsewhere)
export {
    setupInputHandlers
    // updateElevatorStyle // Only export if needed by other modules
}; 