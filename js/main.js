import { initGame } from './game.js';
window.addEventListener('error', function(e) {
    console.error('Game error:', e.error?.message || 'Unknown error');
    
    
    if (e.error && e.error.message && e.error.message.includes('appendChild')) {
        alert('Game error: ' + e.error.message + '\nTry refreshing the page.');
    }
});
document.addEventListener('DOMContentLoaded', () => {
    try {
        initGame();
    } catch (error) {
        console.error('Error initializing game:', error);
    }
}); 