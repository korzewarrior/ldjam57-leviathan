import { db } from './firebase-config.js';

// Local leaderboard storage
let leaderboard = [];
let localHighScore = 0;
// Add a cache flag to track if we've already loaded the leaderboard
let leaderboardLoaded = false;

// Initialize the local high score from localStorage
function initLocalHighScore() {
    try {
        const storedScore = localStorage.getItem('leviathanPersonalBest');
        if (storedScore !== null) {
            localHighScore = parseInt(storedScore, 10);
        }
        
        // Also initialize the local leaderboard if available
        const storedLeaderboard = localStorage.getItem('leviathanLocalLeaderboard');
        if (storedLeaderboard) {
            try {
                leaderboard = JSON.parse(storedLeaderboard);
                console.log('Loaded local leaderboard with ' + leaderboard.length + ' entries');
            } catch (e) {
                console.error('Failed to parse local leaderboard:', e);
                leaderboard = [];
            }
        }
    } catch (e) {
        console.error('Failed to load local high score:', e);
    }
    return localHighScore;
}

// Update the personal best display in the UI
function updatePersonalBestDisplay() {
    const personalBestDisplay = document.getElementById('personalBestValue');
    if (personalBestDisplay) {
        personalBestDisplay.textContent = Math.floor(localHighScore);
    }
}

// Check and update the local high score if needed
function updateLocalHighScore(playerName, depth) {
    if (depth > localHighScore) {
        try {
            localHighScore = depth;
            localStorage.setItem('leviathanPersonalBest', depth.toString());
            updatePersonalBestDisplay();
            return true; // Indicates a new personal best
        } catch (e) {
            console.error('Failed to save local high score:', e);
        }
    }
    return false; // Not a new personal best
}

async function loadLeaderboard() {
    try {
        // OFFLINE MODE: Load from local storage instead of Firebase
        console.log('Loading leaderboard in offline mode');
        
        // Try to get from firebase first (will fail in offline mode, which is fine)
        try {
            const leaderboardRef = db.collection('leaderboard');
            const snapshot = await leaderboardRef.orderBy('depth', 'desc').limit(100).get();
            
            if (!snapshot.empty) {
                leaderboard = [];
                snapshot.forEach(doc => {
                    leaderboard.push(doc.data());
                });
                console.log('Loaded leaderboard from Firebase');
                
                // Save to local storage as backup
                localStorage.setItem('leviathanLocalLeaderboard', JSON.stringify(leaderboard));
            }
        } catch (e) {
            console.log('Firebase unavailable, using local leaderboard');
            
            // Use local leaderboard from storage
            const storedLeaderboard = localStorage.getItem('leviathanLocalLeaderboard');
            if (storedLeaderboard) {
                try {
                    leaderboard = JSON.parse(storedLeaderboard);
                } catch (e) {
                    console.error('Failed to parse local leaderboard:', e);
                    leaderboard = [];
                }
            }
        }
    } catch (e) {
        console.error('Failed to load leaderboard:', e);
        leaderboard = [];
    }
}

async function displayLeaderboard() {
    const leaderboardList = document.getElementById('leaderboardList');
    leaderboardList.innerHTML = '';
    
    // Load leaderboard data if not already loaded
    if (!leaderboardLoaded) {
        await loadLeaderboard();
    }
    
    const topEntries = leaderboard.slice(0, 100);
    
    if (topEntries.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'leaderboard-empty';
        emptyMessage.textContent = '⚠️ YOUR ACCOUNT HAS BEEN BANNED FOR SUSPICIOUS ACTIVITY ⚠️';
        emptyMessage.style.color = '#ff0000';
        emptyMessage.style.textShadow = '0 0 5px rgba(255, 0, 0, 0.7)';
        emptyMessage.style.padding = '20px 10px';
        emptyMessage.style.fontWeight = 'bold';
        emptyMessage.style.border = '1px solid #ff0000';
        leaderboardList.appendChild(emptyMessage);
        return;
    }
    
    topEntries.forEach((entry, index) => {
        const entryElement = document.createElement('div');
        entryElement.className = 'leaderboard-entry';
        
        const rankElement = document.createElement('span');
        rankElement.className = 'leaderboard-rank';
        rankElement.textContent = `${index + 1}.`;
        
        const nameElement = document.createElement('span');
        nameElement.className = 'leaderboard-name';
        nameElement.textContent = entry.name;
        
        const depthElement = document.createElement('span');
        depthElement.className = 'leaderboard-depth';
        depthElement.textContent = `${Math.floor(entry.depth)}m`;
        
        entryElement.style.animationDelay = `${index * 0.1}s`;
        
        entryElement.appendChild(rankElement);
        entryElement.appendChild(nameElement);
        entryElement.appendChild(depthElement);
        leaderboardList.appendChild(entryElement);
    });
}

async function checkHighScore(playerName, depth) {
    if (!playerName.trim()) return false;
    
    // Check if it's a new personal best
    updateLocalHighScore(playerName, depth);
    
    const newScore = {
        name: playerName,
        depth: depth,
        date: new Date().toISOString()
    };
    
    try {
        // OFFLINE MODE: Add to local leaderboard instead of Firebase
        console.log('Saving score in offline mode:', newScore);
        
        // Try to add to Firebase (will fail in offline mode, which is fine)
        try {
            await db.collection('leaderboard').add(newScore);
        } catch (e) {
            console.log('Firebase unavailable, saving score locally only');
        }
        
        // Also save to local leaderboard
        leaderboard.push(newScore);
        
        // Sort leaderboard by depth in descending order
        leaderboard.sort((a, b) => b.depth - a.depth);
        
        // Save to local storage
        localStorage.setItem('leviathanLocalLeaderboard', JSON.stringify(leaderboard));
        
        // Find the player's rank
        const playerRank = leaderboard.findIndex(entry => 
            entry.name === newScore.name && 
            Math.abs(entry.depth - newScore.depth) < 0.1 &&
            entry.date === newScore.date);
        
        return playerRank < 100;
    } catch (e) {
        console.error('Failed to submit score:', e);
        return false;
    }
}

export { 
    loadLeaderboard, 
    displayLeaderboard, 
    checkHighScore,
    initLocalHighScore,
    updateLocalHighScore,
    updatePersonalBestDisplay
}; 