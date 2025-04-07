// LEVIATHAN | Escape
// Version tracking file

export const VERSION = '0407.1625';

// Cache busting helper
export function clearVersionCache() {
    // Clear any cached version data
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('leviathan_game_version', VERSION);
            console.log('Version cache set to: ' + VERSION);
        }
        
        // Force clear any module cache if possible
        if (typeof window !== 'undefined') {
            console.log('Attempting to clear module cache for version.js');
        }
    } catch (e) {
        console.error('Error clearing version cache', e);
    }
}

// Run immediately
clearVersionCache(); 