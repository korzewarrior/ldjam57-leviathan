// Main entry point for the game
import { initGame } from './game.js';

// Simple error handler for critical errors only
window.addEventListener('error', function(e) {
    console.error('Game error:', e.error?.message || 'Unknown error');
    
    // Only show an alert for errors that would break the game
    if (e.error && e.error.message && e.error.message.includes('appendChild')) {
        alert('Game error: ' + e.error.message + '\nTry refreshing the page.');
    }
});

// Initialize the game when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        initGame();
    } catch (error) {
        console.error('Error initializing game:', error);
    }
}); 