// GitHub Sync Module for Darts Interview Assistant
// Pushes event data to GitHub for TV displays to consume

const GitHubSync = {
  token: null,
  owner: 'dowdarts',
  repo: 'darts-interview-assistant',
  branch: 'main',
  filePath: 'event-data.json',
  
  init() {
    // Load token from localStorage
    this.token = localStorage.getItem('githubToken');
  },
  
  setToken(token) {
    this.token = token;
    localStorage.setItem('githubToken', token);
  },
  
  hasToken() {
    return !!this.token;
  },
  
  async pushEventData(eventData) {
    if (!this.token) {
      console.warn('No GitHub token set. TV sync disabled.');
      return;
    }
    
    try {
      // Get current file SHA (needed for update)
      const getUrl = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${this.filePath}`;
      let sha = null;
      
      try {
        const getResponse = await fetch(getUrl, {
          headers: {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        if (getResponse.ok) {
          const data = await getResponse.json();
          sha = data.sha;
        }
      } catch (e) {
        // File doesn't exist yet, that's ok
      }
      
      // Prepare commit
      const content = btoa(unescape(encodeURIComponent(JSON.stringify(eventData, null, 2))));
      const message = `Update event data - ${new Date().toLocaleTimeString()}`;
      
      const body = {
        message,
        content,
        branch: this.branch
      };
      
      if (sha) body.sha = sha;
      
      // Push to GitHub
      const putResponse = await fetch(getUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      
      if (putResponse.ok) {
        console.log('✓ Event data synced to GitHub');
      } else {
        console.error('GitHub sync failed:', await putResponse.text());
      }
    } catch (error) {
      console.error('GitHub sync error:', error);
    }
  },
  
  buildEventData(appState) {
    const matches = appState.roundRobin.matches || [];
    const completedMatches = appState.roundRobin.completedMatches || [];
    const groupA = appState.roundRobin.groupA || [];
    const groupB = appState.roundRobin.groupB || [];
    
    // Calculate standings
    function getStandings(groupPlayers) {
      return groupPlayers.map(name => {
        let legsWon = 0, legsLost = 0, matchWins = 0, matchLosses = 0;
        completedMatches.forEach(m => {
          const isP1 = m.player1 === name;
          const isP2 = m.player2 === name;
          if (!isP1 && !isP2) return;
          
          if (m.winner === name) matchWins++; else matchLosses++;
          
          const myLegs = isP1 ? (m.score1 || 0) : (m.score2 || 0);
          const oppLegs = isP1 ? (m.score2 || 0) : (m.score1 || 0);
          legsWon += myLegs;
          legsLost += oppLegs;
        });
        
        const province = appState.roundRobin.playerProfiles?.[name]?.province || null;
        return { name, province, legsWon, legsLost, matchWins, matchLosses };
      }).sort((a, b) => b.legsWon - a.legsWon || b.matchWins - a.matchWins);
    }
    
    const standingsA = getStandings(groupA);
    const standingsB = getStandings(groupB);
    
    // Find current match (first incomplete)
    const currentMatch = matches.find(m => !m.completed) || null;
    
    // Recent completed matches (last 5)
    const recentMatches = completedMatches.slice(-5).reverse();
    
    // Upcoming matches (next 8)
    const upcomingMatches = matches.filter(m => !m.completed).slice(0, 8);
    
    // --- PAIR-BASED TV DISPLAY ---
    // eventStarted = true once any match result has been entered
    const eventStarted = completedMatches.length > 0;

    // Helper to build a compact match summary
    const toMatchSummary = (m) => m ? {
      matchNum: m.matchNum,
      board: m.board,
      time: m.time,
      player1: m.player1,
      player2: m.player2,
      player1Province: appState.roundRobin.playerProfiles?.[m.player1]?.province || null,
      player2Province: appState.roundRobin.playerProfiles?.[m.player2]?.province || null
    } : null;

    const allMatchesSorted = [...matches].sort((a, b) => a.matchNum - b.matchNum);

    // Current pair: first incomplete Board 1 match + its Board 2 companion
    const firstIncompleteBoard1 = allMatchesSorted.find(m => m.board === 1 && !m.completed) || null;
    let currentPair = null;
    let nextPair = null;

    if (firstIncompleteBoard1) {
      const companion = allMatchesSorted.find(
        m => m.matchNum === firstIncompleteBoard1.matchNum + 1
      );
      currentPair = {
        liveMatch: toMatchSummary(firstIncompleteBoard1),
        simultaneousMatch: (companion && !companion.completed) ? toMatchSummary(companion) : null
      };

      // Next pair: next incomplete Board 1 match after the current one
      const nextBoard1 = allMatchesSorted.find(
        m => m.board === 1 && !m.completed && m.matchNum > firstIncompleteBoard1.matchNum
      );
      if (nextBoard1) {
        const nextCompanion = allMatchesSorted.find(m => m.matchNum === nextBoard1.matchNum + 1);
        nextPair = {
          board1Match: toMatchSummary(nextBoard1),
          board2Match: nextCompanion ? toMatchSummary(nextCompanion) : null
        };
      }
    }

    // All pairs for pre-event full schedule (sorted by matchNum)
    const allPairs = [];
    for (let i = 0; i < allMatchesSorted.length; i += 2) {
      allPairs.push({
        board1: toMatchSummary(allMatchesSorted[i]),
        board2: toMatchSummary(allMatchesSorted[i + 1])
      });
    }
    // --- END PAIR-BASED TV DISPLAY ---

    // --- LIVE MATCH PROGRESS (for Jason's stream app) ---
    // Include the in-progress Board 1 match's current leg scores so Jason
    // can auto-update odds without inputting legs himself.
    let liveMatchProgress = null;
    if (appState.roundRobin.currentMatchState && firstIncompleteBoard1) {
      const state = appState.roundRobin.currentMatchState;
      liveMatchProgress = {
        matchNum:   firstIncompleteBoard1.matchNum,
        p1:         firstIncompleteBoard1.player1,
        p2:         firstIncompleteBoard1.player2,
        score1:     state.score1 || 0,
        score2:     state.score2 || 0,
        currentLeg: state.currentLeg || 1,
        legs: (state.legs || []).map(l => ({
          legNumber: l.legNumber,
          winner:    l.winner   // player name string
        }))
      };
    }

    return {
      timestamp: new Date().toISOString(),
      eventStarted,
      currentPair,
      nextPair,
      allPairs,
      liveMatchProgress,
      currentMatch: currentMatch ? {
        matchNum: currentMatch.matchNum,
        board: currentMatch.board,
        time: currentMatch.time,
        player1: currentMatch.player1,
        player2: currentMatch.player2,
        player1Province: appState.roundRobin.playerProfiles?.[currentMatch.player1]?.province || null,
        player2Province: appState.roundRobin.playerProfiles?.[currentMatch.player2]?.province || null,
        scorekeeper: currentMatch.scorekeeper || 'TBD'
      } : null,
      standingsA,
      standingsB,
      recentMatches: recentMatches.map(m => ({
        matchNum: m.matchNum,
        board: m.board,
        time: m.time,
        player1: m.player1,
        player2: m.player2,
        score1: m.score1,
        score2: m.score2,
        winner: m.winner,
        legs: (m.legs || []).map(l => ({ legNumber: l.legNumber, winner: l.winner }))
      })),
      upcomingMatches: upcomingMatches.map(m => ({
        matchNum: m.matchNum,
        board: m.board,
        time: m.time,
        player1: m.player1,
        player2: m.player2,
        player1Province: appState.roundRobin.playerProfiles?.[m.player1]?.province || null,
        player2Province: appState.roundRobin.playerProfiles?.[m.player2]?.province || null,
        scorekeeper: m.scorekeeper || 'TBD'
      })),
      knockout: appState.roundRobin.knockout || null,
      playerStats: [
        {name:'Drake Berry',     province:'NS',   careerAvg:72.42, careerCheckout:30.61, careerMatches:5,  careerMatchWins:4, notes:''},
        {name:'Cory Wallace',    province:'NB',   careerAvg:61.45, careerCheckout:30.86, careerMatches:6,  careerMatchWins:5, notes:''},
        {name:'Dana Moss',       province:'NB',   careerAvg:0,     careerCheckout:0,     careerMatches:0,  careerMatchWins:0, notes:''},
        {name:'Dee Cormier',     province:'NB',   careerAvg:70.80, careerCheckout:28.00, careerMatches:13, careerMatchWins:10, notes:''},
        {name:'Colby Burke',     province:'NFLD', careerAvg:0,     careerCheckout:0,     careerMatches:0,  careerMatchWins:0, notes:''},
        {name:'Wayne Champman',  province:'NB',   careerAvg:68.23, careerCheckout:24.84, careerMatches:7,  careerMatchWins:4, notes:''},
        {name:'Jordan Boyd',     province:'NS',   careerAvg:0,     careerCheckout:0,     careerMatches:0,  careerMatchWins:0, notes:''},
        {name:'Kevin Blanchard', province:'PE',   careerAvg:0,     careerCheckout:0,     careerMatches:0,  careerMatchWins:0, notes:''},
        {name:'Don Higgins',     province:'NB',   careerAvg:69.30, careerCheckout:27.91, careerMatches:6,  careerMatchWins:3, notes:''},
        {name:'Mark MacEachern', province:'PE',   careerAvg:56.84, careerCheckout:20.43, careerMatches:6,  careerMatchWins:1, notes:''}
      ]
    };
  }
};

// Auto-init on load
if (typeof window !== 'undefined') {
  window.GitHubSync = GitHubSync;
  GitHubSync.init();
}
