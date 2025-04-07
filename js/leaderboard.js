import { db } from './firebase-config.js';

let leaderboard = [];
let localHighScore = 0;

// Initialize the local high score from localStorage
function initLocalHighScore() {
    try {
        const storedScore = localStorage.getItem('leviathanPersonalBest');
        if (storedScore !== null) {
            localHighScore = parseInt(storedScore, 10);
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
        const leaderboardRef = db.collection('leaderboard');
        const snapshot = await leaderboardRef.orderBy('depth', 'desc').limit(100).get();
        
        leaderboard = [];
        snapshot.forEach(doc => {
            leaderboard.push(doc.data());
        });
        
        console.log('Leaderboard loaded from Firebase');
    } catch (e) {
        console.error('Failed to load leaderboard from Firebase:', e);
        leaderboard = [];
    }
}

async function displayLeaderboard() {
    const leaderboardList = document.getElementById('leaderboardList');
    leaderboardList.innerHTML = '';
    
    // Make sure we have the latest data
    await loadLeaderboard();
    
    const topEntries = leaderboard.slice(0, 100);
    
    if (topEntries.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'leaderboard-empty';
        emptyMessage.textContent = 'NO RECORDS YET';
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
        // Add the new score to Firebase
        await db.collection('leaderboard').add(newScore);
        
        // Refresh our local copy of the leaderboard
        await loadLeaderboard();
        
        // Find the player's rank
        const playerRank = leaderboard.findIndex(entry => 
            entry.name === newScore.name && 
            Math.abs(entry.depth - newScore.depth) < 0.1 &&
            entry.date === newScore.date);
        
        return playerRank < 100;
    } catch (e) {
        console.error('Failed to submit score to Firebase:', e);
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