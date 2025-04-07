import { db } from './firebase-config.js';

let leaderboard = [];

async function loadLeaderboard() {
    try {
        const leaderboardRef = db.collection('leaderboard');
        const snapshot = await leaderboardRef.orderBy('depth', 'desc').limit(50).get();
        
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
    
    const topEntries = leaderboard.slice(0, 10);
    
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
        
        return playerRank < 10;
    } catch (e) {
        console.error('Failed to submit score to Firebase:', e);
        return false;
    }
}

export { 
    loadLeaderboard, 
    displayLeaderboard, 
    checkHighScore 
}; 