// Leaderboard handling functionality
let leaderboard = [];

function loadLeaderboard() {
    const savedLeaderboard = localStorage.getItem('deepDescentLeaderboard');
    if (savedLeaderboard) {
        try {
            leaderboard = JSON.parse(savedLeaderboard);
        } catch (e) {
            leaderboard = [];
        }
    }
}

function saveLeaderboard() {
    try {
        localStorage.setItem('deepDescentLeaderboard', JSON.stringify(leaderboard));
    } catch (e) {
        console.error('Failed to save leaderboard:', e);
    }
}

function displayLeaderboard() {
    const leaderboardList = document.getElementById('leaderboardList');
    leaderboardList.innerHTML = '';
    
    const sortedLeaderboard = [...leaderboard].sort((a, b) => b.depth - a.depth);
    const topEntries = sortedLeaderboard.slice(0, 10);
    
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

function checkHighScore(playerName, depth) {
    if (!playerName.trim()) return false;
    
    const newScore = {
        name: playerName,
        depth: depth,
        date: new Date().toISOString()
    };
    
    leaderboard.push(newScore);
    
    const sortedLeaderboard = [...leaderboard].sort((a, b) => b.depth - a.depth);
    
    const playerRank = sortedLeaderboard.findIndex(entry => 
        entry.name === newScore.name && 
        Math.abs(entry.depth - newScore.depth) < 0.1 &&
        entry.date === newScore.date);
    
    leaderboard = sortedLeaderboard.slice(0, 50);
    saveLeaderboard();
    
    return playerRank < 10;
}

export { 
    loadLeaderboard, 
    saveLeaderboard, 
    displayLeaderboard, 
    checkHighScore 
}; 