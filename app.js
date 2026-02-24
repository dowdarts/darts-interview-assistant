// Darts Interview Assistant SPA
// Vanilla JS, state-driven, mobile-first, modular

// --- GLOBAL STATE ---
const appState = {
  screen: "mainMenu", // mainMenu | playerEntry | setup | match | interview | questionBank | roundRobinSetup | roundRobinMatch
  players: [], // Array of {name: string, group: string}
  config: {
    matchType: "matchPlay", // Only matchPlay for v1
    mode: null, // bestOf | playAll
    totalLegs: null,
    legsToWin: null,
    player1: "",
    player2: "",
    selectedGroup: null // Filter players by group
  },
  score: {
    player1: 0,
    player2: 0
  },
  currentLeg: 1,
  legs: [],
  interview: {
    questions: [],
    currentQuestionIndex: 0
  },
  roundRobin: {
    active: false,
    groupA: [], // 5 players
    groupB: [], // 5 players
    matches: [], // Array of {matchNum, player1, player2, board, winner, score1, score2, completed}
    currentMatchIndex: 0,
    completedMatches: [] // Stores results for contextual questions
  }
};

// --- QUESTION BANK ---
const questionBank = {
  highScoring: [
    (data) => `Talk us through that ${data.highScore || "big score"} — did it shift momentum?`,
    (data) => `That ${data.highScore || "big score"} was massive, ${data.playerName}. Was that the turning point?`,
    (data) => "Was scoring the key difference tonight?",
    (data) => `How important were those big scores against ${data.opponent}?`,
    (data) => `That ${data.highScore} in leg ${data.legNumber} — walk us through how that felt going in.`,
    (data) => `Leg ${data.legNumber}, you hit ${data.highScore}. What was the pressure like at that moment?`
  ],
  bigFinish: [
    (data) => `That ${data.bigFinish} checkout — talk us through it!`,
    (data) => `${data.bigFinish} to finish, what was going through your mind?`,
    (data) => `How crucial was that ${data.bigFinish} finish in this ${data.matchScore} victory?`,
    (data) => `Leg ${data.legNumber}, ${data.bigFinish} to win it. Walk us through that checkout.`,
    (data) => `That ${data.bigFinish} in leg ${data.legNumber} — was that under pressure against ${data.opponent}?`
  ],
  highAverage: [
    (data) => `You averaged ${data.highAverage} tonight — is that your best form this season?`,
    (data) => `A ${data.highAverage} average against ${data.opponent}, are you pleased with that?`,
    (data) => `That ${data.highAverage} average shows real quality. What's clicking for you right now?`
  ],
  lowDartLeg: [
    (data) => `${data.lowDartLeg} darts to win that leg — that's clinical finishing, ${data.playerName}!`,
    (data) => `A ${data.lowDartLeg}-darter! Talk us through that leg.`,
    (data) => `That ${data.lowDartLeg}-dart leg was crucial in this ${data.matchScore} win. How did you find that rhythm?`,
    (data) => `${data.lowDartLeg} darts — is that one of your best legs of the season?`,
    (data) => `Leg ${data.legNumber}, you took it in ${data.lowDartLeg} darts. How did you approach that one?`,
    (data) => `${data.lowDartLeg} darts in leg ${data.legNumber} against ${data.opponent} — that's world-class, ${data.playerName}.`
  ],
  comeback: [
    (data) => `You turned it around for the ${data.matchScore} win. When did momentum shift?`,
    (data) => "What adjustment sparked the comeback?",
    (data) => `${data.opponent} had you under pressure. How did you fight back?`,
    (data) => `Leg ${data.legNumber} seemed to be the turning point. What changed for you there?`
  ],
  matchDart: [
    (data) => `Match dart against ${data.opponent} — what goes through your mind?`,
    (data) => "What goes through your mind on match dart?",
    (data) => `You held your nerve on the big stage. How do you stay so composed?`,
    (data) => `Leg ${data.legNumber}, match dart to seal it. Talk us through that final moment.`
  ],
  doublesBattle: [
    (data) => `The doubles were tough tonight. How did you stay patient against ${data.opponent}?`,
    (data) => `It was a battle on the doubles. What kept you focused?`,
    (data) => `You found the doubles when it mattered most in that ${data.matchScore} win. How?`,
    (data) => `Leg ${data.legNumber} was a real doubles battle. How did you stay composed?`
  ],
  upset: [
    (data) => `A ${data.matchScore} victory over ${data.opponent} — did being the underdog motivate you?`,
    (data) => "Did being the underdog motivate you?",
    (data) => `You've just beaten ${data.opponent}. What does this win mean to you?`
  ],
  mentalStrength: [
    (data) => `You showed incredible mental strength tonight, ${data.playerName}. Where does that come from?`,
    (data) => `That ${data.matchScore} win required real character. How did you dig deep?`,
    (data) => "What keeps you mentally strong under pressure?",
    (data) => `Leg ${data.legNumber} tested your mental game. How did you stay focused?`
  ],
  turningPoint: [
    (data) => `There was a clear turning point in this match. When did you feel it shift?`,
    (data) => `${data.playerName}, what was the key moment in this ${data.matchScore} victory?`,
    (data) => "When did you know you had this match won?",
    (data) => `Was leg ${data.legNumber} the moment that changed everything for you?`
  ],
  general: [
    (data) => `You managed to walk out of that match with a ${data.matchScore} win over ${data.opponent}. How does this win feel for you right now?`,
    (data) => `A ${data.matchScore} victory tonight. How important is this result?`,
    (data) => `${data.playerName}, brilliant performance. What does this mean moving forward?`,
    (data) => `You've beaten ${data.opponent} ${data.matchScore}. What's next for you?`,
    (data) => "How important is this result?",
    (data) => "What does this mean moving forward?"
  ],
  roundRobin: [
    (data) => data.nextOpponent ? `You've just taken a ${data.matchScore} win over ${data.opponent}. You're playing ${data.nextOpponent} on board ${data.nextBoard} next — how does this result set you up for that match?` : null,
    (data) => data.nextOpponent ? `That's match ${data.matchNumber} done, ${data.matchScore}. With ${data.nextOpponent} coming up in match ${data.nextMatchNum}, how are you feeling about your form?` : null,
    (data) => data.nextOpponent ? `${data.opponent} is behind you now. Does beating them give you confidence going into ${data.nextOpponent}?` : null,
    (data) => data.nextBoard === 2 ? `Your next match is on board ${data.nextBoard} against ${data.nextOpponent}. How do you adjust when you're not on the main stage?` : null,
    (data) => data.nextBoard === 1 ? `You're back on board 1 next against ${data.nextOpponent}. Does playing on the live stream board change your approach?` : null,
    (data) => data.matchNumber ? `This is match ${data.matchNumber} of the round robin. How are you pacing yourself through this tournament format?` : null,
    (data) => data.nextOpponent ? `You've got ${data.nextOpponent} waiting for you. What adjustments do you need to make?` : null
  ]
};

// --- RENDERER ---
function render() {
  const app = document.getElementById("app");
  app.innerHTML = "";
  switch (appState.screen) {
    case "mainMenu":
      app.appendChild(renderMainMenu());
      break;
    case "playerEntry":
      app.appendChild(renderPlayerEntry());
      break;
    case "setup":
      app.appendChild(renderSetup());
      break;
    case "match":
      app.appendChild(renderMatch());
      break;
    case "interview":
      app.appendChild(renderInterview());
      break;
    case "questionBank":
      app.appendChild(renderQuestionBank());
      break;
    case "roundRobinSetup":
      app.appendChild(renderRoundRobinSetup());
      break;
    case "roundRobinMatch":
      app.appendChild(renderRoundRobinMatch());
      break;
  }
}

// --- MAIN MENU ---
function renderMainMenu() {
  const div = document.createElement("div");
  div.className = "screen";
  div.innerHTML = `
    <h1>Darts Interview Assistant</h1>
    <button id="roundRobinBtn" class="button">Full Event</button>
    <button id="playerLibraryBtn" class="button">Player Library</button>
    <button id="questionBankBtn" class="button">Interview Questions</button>
  `;
  div.querySelector("#roundRobinBtn").onclick = () => {
    // Check if there's a saved tournament
    const savedRoundRobin = localStorage.getItem("dartsRoundRobinState");
    if (savedRoundRobin) {
      const parsed = JSON.parse(savedRoundRobin);
      // If there's an active tournament, ask to resume or start new
      if (parsed.matches && parsed.matches.length > 0 && !parsed.matches[parsed.matches.length - 1].completed) {
        if (confirm("Resume saved tournament? Click Cancel to start a new one.")) {
          appState.roundRobin = parsed;
          appState.screen = "roundRobinSetup";
          render();
          return;
        }
      }
    }
    // Reset round robin state for new tournament
    appState.roundRobin = {
      active: true,
      groupA: [],
      groupB: [],
      matches: [],
      currentMatchIndex: 0,
      completedMatches: []
    };
    localStorage.removeItem("dartsRoundRobinState");
    appState.screen = "roundRobinSetup";
    render();
  };
  div.querySelector("#playerLibraryBtn").onclick = () => {
    appState.screen = "playerEntry";
    render();
  };
  div.querySelector("#questionBankBtn").onclick = () => {
    appState.screen = "questionBank";
    render();
  };
  return div;
}

// --- PLAYER ENTRY SCREEN ---
function renderPlayerEntry() {
  const div = document.createElement("div");
  div.className = "screen";
  div.innerHTML = `
    <h2>Player Library</h2>
    <form id="playerForm" autocomplete="off">
      <div id="playerInputs"></div>
      <button type="button" id="addPlayerBtn" class="button">Add Player</button>
      <div class="sticky-bottom">
        <button type="button" id="backToMenuBtn" class="button" style="background:var(--panel);">Back to Menu</button>
      </div>
    </form>
  `;
  const playerInputsDiv = div.querySelector("#playerInputs");
  // Save player library to localStorage
  function savePlayerLibrary() {
    localStorage.setItem("dartsPlayerLibrary", JSON.stringify(appState.players));
  }
  // Render current player fields
  function renderInputs() {
    playerInputsDiv.innerHTML = "";
    appState.players.forEach((player, idx) => {
      const row = document.createElement("div");
      row.className = "row";
      row.style.marginBottom = "0.5em";
      row.style.display = "flex";
      row.style.gap = "0.5em";
      row.innerHTML = `
        <input type="text" value="${player.name || ''}" maxlength="20" data-idx="${idx}" placeholder="Player ${idx+1}" style="flex:1;">
        <select data-group="${idx}" style="width:7em;">
          <option value="">No Group</option>
          <option value="A" ${player.group === 'A' ? 'selected' : ''}>Group A</option>
          <option value="B" ${player.group === 'B' ? 'selected' : ''}>Group B</option>
          <option value="C" ${player.group === 'C' ? 'selected' : ''}>Group C</option>
          <option value="D" ${player.group === 'D' ? 'selected' : ''}>Group D</option>
        </select>
        <button type="button" class="button" data-remove="${idx}" style="width:2.5em;padding:0 0.5em;margin:0;">&times;</button>
      `;
      // Remove player
      row.querySelector("[data-remove]").onclick = (e) => {
        appState.players.splice(idx, 1);
        renderInputs();
        savePlayerLibrary();
      };
      // Edit player name
      row.querySelector("input").oninput = (e) => {
        appState.players[idx].name = e.target.value;
        savePlayerLibrary();
      };
      // Edit player group
      row.querySelector("select").onchange = (e) => {
        appState.players[idx].group = e.target.value;
        savePlayerLibrary();
      };
      playerInputsDiv.appendChild(row);
    });
  }
  // Add player
  div.querySelector("#addPlayerBtn").onclick = () => {
    appState.players.push({name: "", group: ""});
    renderInputs();
    savePlayerLibrary();
  };
  // Back to menu
  div.querySelector("#backToMenuBtn").onclick = () => {
    savePlayerLibrary();
    appState.screen = "mainMenu";
    render();
  };
  renderInputs();
  return div;
}

// --- SETUP SCREEN ---
function renderSetup() {
  const div = document.createElement("div");
  div.className = "screen";
  div.innerHTML = `
    <h2>Setup Match</h2>
    <button id="returnPlayerLibBtn" class="button" style="margin-bottom:1em;background:var(--panel);color:var(--accent2);border:1px solid var(--accent2);">Player Library</button>
    <label>Filter by Group (Optional)</label>
    <select id="groupFilter">
      <option value="">All Players</option>
      <option value="A">Group A</option>
      <option value="B">Group B</option>
      <option value="C">Group C</option>
      <option value="D">Group D</option>
    </select>
    <label>Match Type</label>
    <div class="row">
      <button class="button matchtype-btn selected" data-type="matchPlay">Match Play</button>
      <button class="button matchtype-btn" data-type="setPlay">Set Play</button>
    </div>
    <div id="setPlayFields" style="display:none;">
      <label>Sets (Best Of)</label>
      <select id="totalSets">
        <option value="3">3</option>
        <option value="5">5</option>
        <option value="7">7</option>
      </select>
      <label>Legs per Set</label>
      <select id="legsPerSet">
        <option value="3">3</option>
        <option value="5">5</option>
      </select>
    </div>
    <div id="matchPlayFields">
      <label>Mode</label>
      <div class="row">
        <button class="button mode-btn" data-mode="bestOf">Best Of</button>
        <button class="button mode-btn" data-mode="playAll">Play All</button>
      </div>
      <label>Total Legs</label>
      <select id="totalLegs">
        <option value="3">3</option>
        <option value="5">5</option>
        <option value="7">7</option>
        <option value="9">9</option>
      </select>
    </div>
    <label>Player 1</label>
    <select id="player1"></select>
    <label>Player 2</label>
    <select id="player2"></select>
    <div class="sticky-bottom">
      <button id="beginMatchBtn" class="button">Start Match</button>
    </div>
  `;
  // Populate player dropdowns based on group filter
  function populatePlayerDropdowns() {
    const selectedGroup = div.querySelector("#groupFilter").value;
    const filteredPlayers = selectedGroup 
      ? appState.players.filter(p => p.group === selectedGroup)
      : appState.players;
    
    const p1Select = div.querySelector("#player1");
    const p2Select = div.querySelector("#player2");
    
    p1Select.innerHTML = filteredPlayers.map((p, i) => {
      const name = p.name || `Player ${i+1}`;
      return `<option value="${name}">${name}</option>`;
    }).join("");
    
    p2Select.innerHTML = filteredPlayers.map((p, i) => {
      const name = p.name || `Player ${i+1}`;
      return `<option value="${name}">${name}</option>`;
    }).join("");
  }
  
  // Initial population
  populatePlayerDropdowns();
  
  // Update when group filter changes
  div.querySelector("#groupFilter").onchange = () => {
    populatePlayerDropdowns();
  };
  
  // Return to player library
  div.querySelector("#returnPlayerLibBtn").onclick = () => {
    appState.screen = "playerEntry";
    render();
  };
  // Match type selection
  const setPlayFields = div.querySelector('#setPlayFields');
  const matchPlayFields = div.querySelector('#matchPlayFields');
  div.querySelectorAll(".matchtype-btn").forEach(btn => {
    btn.onclick = (e) => {
      appState.config.matchType = btn.dataset.type;
      div.querySelectorAll(".matchtype-btn").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      if (btn.dataset.type === "setPlay") {
        setPlayFields.style.display = "block";
        matchPlayFields.style.display = "none";
      } else {
        setPlayFields.style.display = "none";
        matchPlayFields.style.display = "block";
      }
    };
  });
  // Mode selection (only for match play)
  div.querySelectorAll(".mode-btn").forEach(btn => {
    btn.onclick = (e) => {
      appState.config.mode = btn.dataset.mode;
      div.querySelectorAll(".mode-btn").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
    };
  });
  // Start match
  div.querySelector("#beginMatchBtn").onclick = () => {
    const matchType = appState.config.matchType;
    const p1 = div.querySelector("#player1").value;
    const p2 = div.querySelector("#player2").value;
    if (p1 === p2) {
      alert("Select two different players.");
      return;
    }
    appState.config.player1 = p1;
    appState.config.player2 = p2;
    if (matchType === "matchPlay") {
      const mode = appState.config.mode;
      const totalLegs = parseInt(div.querySelector("#totalLegs").value, 10);
      if (!mode) {
        alert("Select a mode");
        return;
      }
      appState.config.totalLegs = totalLegs;
      if (mode === "bestOf") {
        appState.config.legsToWin = Math.ceil(totalLegs / 2);
      } else {
        appState.config.legsToWin = totalLegs;
      }
      appState.screen = "match";
      // Set up for match play
      appState.setPlay = undefined;
      render();
    } else if (matchType === "setPlay") {
      // Set play config
      const totalSets = parseInt(div.querySelector("#totalSets").value, 10);
      const legsPerSet = parseInt(div.querySelector("#legsPerSet").value, 10);
      appState.config.totalSets = totalSets;
      appState.config.legsPerSet = legsPerSet;
      appState.config.setsToWin = Math.ceil(totalSets / 2);
      // Reset set/leg state
      appState.setPlay = {
        currentSet: 1,
        setScores: { player1: 0, player2: 0 },
        legScores: { player1: 0, player2: 0 },
        currentLeg: 1
      };
      appState.screen = "match";
      render();
    }
  };
  // Default matchType
  appState.config.matchType = "matchPlay";
  return div;
}

// --- MATCH SCREEN ---
const momentCategories = [
  { key: "highScoring", label: "High Scoring" },
  { key: "bigFinish", label: "Big Finish" },
  { key: "doublesBattle", label: "Doubles Battle" },
  { key: "comeback", label: "Comeback" },
  { key: "highAverage", label: "High Average" },
  { key: "mentalStrength", label: "Mental Strength" },
  { key: "upset", label: "Upset" },
  { key: "turningPoint", label: "Turning Point" },
  { key: "matchDart", label: "Match Dart" },
  { key: "lowDartLeg", label: "Low Dart Leg" }
];

function renderMatch() {
  const div = document.createElement("div");
  div.className = "screen";
  const p1 = appState.config.player1;
  const p2 = appState.config.player2;
  let leg, totalLegs, score;
  let setPlayMode = appState.config.matchType === "setPlay";
  if (setPlayMode) {
    // Set play: use setPlay state
    leg = appState.setPlay.currentLeg;
    totalLegs = appState.config.legsPerSet;
    score = appState.setPlay.legScores;
  } else {
    leg = appState.currentLeg;
    totalLegs = appState.config.totalLegs;
    score = appState.score;
  }
  // State for this leg
  let selectedWinner = null;
  let selectedMoments = [];
  let highScoreValue = "";

  div.innerHTML = `
    <div class="scoreboard">
      <span class="leg-number">${setPlayMode ? `Set ${appState.setPlay.currentSet} / ${appState.config.totalSets} - Leg ${leg} / ${totalLegs}` : `Leg ${leg} / ${totalLegs}`}</span>
      <span>${p1}: <b>${setPlayMode ? appState.setPlay.setScores.player1 : score.player1}</b> &nbsp;|&nbsp; ${p2}: <b>${setPlayMode ? appState.setPlay.setScores.player2 : score.player2}</b></span>
    </div>
    <label>Who won this leg?</label>
    <div class="row">
      <button class="button winner-btn" data-winner="player1">${p1}</button>
      <button class="button winner-btn" data-winner="player2">${p2}</button>
    </div>
    <label>Memorable Moments</label>
    <div class="col-2" id="momentBtns"></div>
    <div id="highScoreInput" style="display:none; margin-bottom:1em;"></div>
    <div class="sticky-bottom">
      <button id="nextLegBtn" class="button">${setPlayMode ? "Next Leg/Set" : "Next Leg"}</button>
    </div>
  `;
  // Winner selection
  div.querySelectorAll(".winner-btn").forEach(btn => {
    btn.onclick = () => {
      selectedWinner = btn.dataset.winner;
      div.querySelectorAll(".winner-btn").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
    };
  });
  // Moment buttons
  const momentBtnsDiv = div.querySelector("#momentBtns");
  // Map to store moment values for this leg
  let momentValues = {};
  momentCategories.forEach(cat => {
    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.alignItems = "center";
    wrapper.style.gap = "0.5em";
    const btn = document.createElement("button");
    btn.className = "moment-btn button";
    btn.textContent = cat.label;
    btn.dataset.key = cat.key;
    wrapper.appendChild(btn);
    // Inline input for value moments
    let input = null;
    if (["highScoring","bigFinish","highAverage","lowDartLeg"].includes(cat.key)) {
      input = document.createElement("input");
      input.type = "text";
      input.placeholder = cat.key === "lowDartLeg" ? "Darts" : cat.label + " value";
      input.style.display = "none";
      input.style.width = "5em";
      input.style.fontSize = "1em";
      input.style.background = "#232834";
      input.style.color = "#fff";
      input.style.border = "1px solid #444";
      input.style.borderRadius = "0.7em";
      input.style.padding = "0.3em 0.7em";
      input.oninput = (e) => {
        momentValues[cat.key] = e.target.value;
      };
      wrapper.appendChild(input);
    }
    btn.onclick = () => {
      btn.classList.toggle("selected");
      if (btn.classList.contains("selected")) {
        selectedMoments.push(cat.key);
        if (input) {
          input.style.display = "inline-block";
          input.focus();
        }
      } else {
        selectedMoments = selectedMoments.filter(k => k !== cat.key);
        if (input) {
          input.style.display = "none";
          input.value = "";
        }
        delete momentValues[cat.key];
      }
      // Show high score input if highScoring selected (legacy, now handled by inline input)
      if (selectedMoments.includes("highScoring")) {
        showHighScoreInput();
      } else {
        hideHighScoreInput();
      }
    };
    momentBtnsDiv.appendChild(wrapper);
  });
  // High score input
  function showHighScoreInput() {
    const el = div.querySelector("#highScoreInput");
    el.style.display = "block";
    el.innerHTML = `<input type="number" min="100" max="180" id="highScoreVal" placeholder="High Score (e.g. 180)">`;
    el.querySelector("#highScoreVal").oninput = (e) => {
      highScoreValue = e.target.value;
    };
  }
  function hideHighScoreInput() {
    const el = div.querySelector("#highScoreInput");
    el.style.display = "none";
    highScoreValue = "";
  }
  // Next Leg/Set logic
  div.querySelector("#nextLegBtn").onclick = () => {
    if (!selectedWinner) {
      alert("Select a winner for this leg.");
      return;
    }
    // Save leg
    const legObj = {
      legNumber: leg,
      winner: selectedWinner,
      moments: [...selectedMoments],
      momentValues: { ...momentValues },
      setNumber: setPlayMode ? appState.setPlay.currentSet : undefined
    };
    appState.legs.push(legObj);
    if (setPlayMode) {
      // Set play: update leg score
      appState.setPlay.legScores[selectedWinner]++;
      // Check if set is won
      const legsToWinSet = Math.ceil(appState.config.legsPerSet / 2);
      if (appState.setPlay.legScores[selectedWinner] >= legsToWinSet) {
        // Set won
        appState.setPlay.setScores[selectedWinner]++;
        // Reset leg scores
        appState.setPlay.legScores = { player1: 0, player2: 0 };
        appState.setPlay.currentSet++;
        appState.setPlay.currentLeg = 1;
        // Check if match is won
        if (appState.setPlay.setScores[selectedWinner] >= appState.config.setsToWin) {
          appState.screen = "interview";
          generateInterviewQuestions();
          render();
          return;
        }
      } else {
        appState.setPlay.currentLeg++;
      }
    } else {
      // Match play logic
      appState.score[selectedWinner]++;
      appState.currentLeg++;
      // End match?
      if (appState.config.mode === "bestOf") {
        if (appState.score[selectedWinner] >= appState.config.legsToWin) {
          appState.screen = "interview";
          generateInterviewQuestions();
          render();
          return;
        }
      } else {
        if (appState.currentLeg > appState.config.totalLegs) {
          appState.screen = "interview";
          generateInterviewQuestions();
          render();
          return;
        }
      }
    }
    render();
  };
  return div;
}

// --- INTERVIEW SCREEN ---
function renderInterview() {
  const div = document.createElement("div");
  div.className = "screen";
  const questions = appState.interview.questions;
  const idx = appState.interview.currentQuestionIndex;
  const total = questions.length;
  const q = questions[idx];
  div.innerHTML = `
    <h2>Interview</h2>
    <div style="margin-bottom:1em;">Question ${idx + 1} of ${total}</div>
    <div style="font-size:1.2em; margin-bottom:2em;">${q}</div>
    <div class="sticky-bottom">
      <button id="nextQBtn" class="button">${idx === total - 1 ? "Finish Interview" : "Next Question"}</button>
      <button id="endBtn" class="button" style="background:var(--accent2);color:#222;">End Interview</button>
    </div>
  `;
  div.querySelector("#nextQBtn").onclick = () => {
    if (idx === total - 1) {
      resetState();
      appState.screen = "mainMenu";
      render();
    } else {
      appState.interview.currentQuestionIndex++;
      render();
    }
  };
  div.querySelector("#endBtn").onclick = () => {
    resetState();
    appState.screen = "mainMenu";
    render();
  };
  return div;
}

// --- INTERVIEW QUESTION GENERATION ---
function generateInterviewQuestions() {
  // Interview only the match winner
  let matchWinner = null;
  let winnerScore, loserScore;
  if (appState.config.matchType === "setPlay" && appState.setPlay) {
    matchWinner = appState.setPlay.setScores.player1 > appState.setPlay.setScores.player2 ? "player1" : "player2";
    winnerScore = appState.setPlay.setScores[matchWinner];
    loserScore = matchWinner === "player1" ? appState.setPlay.setScores.player2 : appState.setPlay.setScores.player1;
  } else {
    matchWinner = appState.score.player1 > appState.score.player2 ? "player1" : "player2";
    winnerScore = appState.score[matchWinner];
    loserScore = matchWinner === "player1" ? appState.score.player2 : appState.score.player1;
  }
  // Get player names
  const playerName = appState.config[matchWinner];
  const opponent = matchWinner === "player1" ? appState.config.player2 : appState.config.player1;
  const matchScore = `${winnerScore}-${loserScore}`;
  
  // 1. Count frequency of each moment for legs won by match winner
  const freq = {};
  const momentData = {};
  const momentLegNumbers = {}; // Track which leg each moment occurred in
  appState.legs.forEach(leg => {
    if (leg.winner === matchWinner) {
      leg.moments.forEach(m => {
        freq[m] = (freq[m] || 0) + 1;
        // Store value for this moment type (use last occurrence)
        if (!momentData[m]) momentData[m] = [];
        momentData[m].push(leg.momentValues && leg.momentValues[m] ? leg.momentValues[m] : undefined);
        // Store leg number for this moment
        if (!momentLegNumbers[m]) momentLegNumbers[m] = [];
        momentLegNumbers[m].push(leg.legNumber);
      });
    }
  });
  // 2. Sort categories by frequency
  const sortedCats = Object.keys(freq).sort((a, b) => freq[b] - freq[a]);
  // 3. Take top categories (max 4)
  const selectedCats = sortedCats.slice(0, 4);
  // 4. Pull one random question per category, filling in values
  const questions = [];
  const usedQuestions = new Set(); // Track used questions to avoid duplicates
  selectedCats.forEach(cat => {
    if (questionBank[cat] && questionBank[cat].length) {
      // Build data object with all available context
      let data = {
        playerName: playerName,
        opponent: opponent,
        matchScore: matchScore,
        legNumber: momentLegNumbers[cat] ? momentLegNumbers[cat][momentLegNumbers[cat].length - 1] : undefined
      };
      
      // Add specific moment values
      if (cat === "highScoring") {
        const vals = momentData[cat] || [];
        data.highScore = vals.length ? vals[vals.length-1] : undefined;
      }
      if (cat === "bigFinish") {
        const vals = momentData[cat] || [];
        data.bigFinish = vals.length ? vals[vals.length-1] : undefined;
      }
      if (cat === "highAverage") {
        const vals = momentData[cat] || [];
        data.highAverage = vals.length ? vals[vals.length-1] : undefined;
      }
      if (cat === "lowDartLeg") {
        const vals = momentData[cat] || [];
        data.lowDartLeg = vals.length ? vals[vals.length-1] : undefined;
      }
      
      const qArr = questionBank[cat];
      // Select random question and fill in data
      let q = qArr[Math.floor(Math.random() * qArr.length)](data);
      questions.push(q);
      usedQuestions.add(q);
    }
  });
  // 5. Fill with general if < 4, ensuring no duplicates
  while (questions.length < 4) {
    const qArr = questionBank.general;
    let attempts = 0;
    let q;
    const data = {
      playerName: playerName,
      opponent: opponent,
      matchScore: matchScore
    };
    do {
      q = qArr[Math.floor(Math.random() * qArr.length)](data);
      attempts++;
    } while (usedQuestions.has(q) && attempts < 20);
    if (!usedQuestions.has(q)) {
      questions.push(q);
      usedQuestions.add(q);
    } else {
      break; // Exit if can't find unique question after 20 attempts
    }
  }
  appState.interview.questions = questions;
  appState.interview.currentQuestionIndex = 0;
}

// --- STATE RESET ---
function resetState() {
  appState.screen = "mainMenu";
  // Restore player library from localStorage if available
  const savedPlayers = localStorage.getItem("dartsPlayerLibrary");
  if (savedPlayers) {
    const parsed = JSON.parse(savedPlayers);
    // Handle legacy format (array of strings) or new format (array of objects)
    appState.players = parsed.map(p => 
      typeof p === 'string' ? {name: p, group: ''} : p
    );
  } else {
    appState.players = [];
  }
  appState.config = {
    matchType: "matchPlay",
    mode: null,
    totalLegs: null,
    legsToWin: null,
    player1: "",
    player2: "",
    selectedGroup: null
  };
  appState.score = { player1: 0, player2: 0 };
  appState.currentLeg = 1;
  appState.legs = [];
  appState.interview = { questions: [], currentQuestionIndex: 0 };
}

// --- QUESTION BANK SCREEN ---
function renderQuestionBank() {
  const div = document.createElement("div");
  div.className = "screen";
  
  // Sample data for displaying questions
  const sampleData = {
    playerName: "[Player Name]",
    opponent: "[Opponent Name]",
    matchScore: "[4-2]",
    highScore: "[180]",
    bigFinish: "[170]",
    highAverage: "[105]",
    lowDartLeg: "[12]",
    legNumber: "[2]",
    nextOpponent: "[Next Opponent]",
    nextBoard: 2,
    nextMatchNum: 15,
    matchNumber: 8
  };
  
  // Category labels
  const categoryLabels = {
    highScoring: "High Scoring",
    bigFinish: "Big Finish",
    highAverage: "High Average",
    lowDartLeg: "Low Dart Leg",
    comeback: "Comeback",
    matchDart: "Match Dart",
    doublesBattle: "Doubles Battle",
    upset: "Upset",
    mentalStrength: "Mental Strength",
    turningPoint: "Turning Point",
    general: "General Questions",
    roundRobin: "Round Robin Tournament Context"
  };
  
  div.innerHTML = `
    <h2>Interview Questions</h2>
    <p style="color:var(--text-muted);margin-bottom:1.5em;">All available interview questions organized by category.</p>
    <div id="questionsContainer"></div>
    <div class="sticky-bottom">
      <button id="backBtn" class="button">Back to Menu</button>
    </div>
  `;
  
  const container = div.querySelector("#questionsContainer");
  
  // Render each category
  Object.keys(questionBank).forEach((category) => {
    const categoryDiv = document.createElement("div");
    categoryDiv.style.marginBottom = "2em";
    
    const heading = document.createElement("h3");
    heading.textContent = categoryLabels[category] || category;
    heading.style.fontSize = "1.1em";
    heading.style.color = "var(--accent)";
    heading.style.marginBottom = "0.5em";
    categoryDiv.appendChild(heading);
    
    const list = document.createElement("ol");
    list.style.lineHeight = "1.8";
    list.style.paddingLeft = "1.5em";
    list.style.color = "var(--text)";
    
    questionBank[category].forEach((questionFunc) => {
      const questionText = questionFunc(sampleData);
      if (questionText) { // Only display non-null questions
        const li = document.createElement("li");
        li.textContent = questionText;
        li.style.marginBottom = "0.5em";
        list.appendChild(li);
      }
    });
    
    categoryDiv.appendChild(list);
    container.appendChild(categoryDiv);
  });
  
  div.querySelector("#backBtn").onclick = () => {
    appState.screen = "mainMenu";
    render();
  };
  return div;
}

// --- ROUND ROBIN SETUP SCREEN ---
function renderRoundRobinSetup() {
  const div = document.createElement("div");
  div.className = "screen";
  
  // Check if there's saved progress
  const hasProgress = appState.roundRobin.matches && appState.roundRobin.matches.length > 0;
  const completedCount = hasProgress ? appState.roundRobin.matches.filter(m => m.completed).length : 0;
  const totalMatches = hasProgress ? appState.roundRobin.matches.length : 20;
  
  div.innerHTML = `
    <h2>Full Event Setup</h2>
    <p style="color:var(--text-muted);margin-bottom:1em;">10 Players • 2 Groups of 5 • 20 Matches</p>
    
    ${hasProgress && completedCount > 0 ? `
    <div style="background:var(--accent);color:#000;padding:1em;border-radius:8px;margin-bottom:1.5em;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <strong>Tournament in Progress</strong>
          <p style="margin:0.25em 0 0 0;font-size:0.9em;">${completedCount} of ${totalMatches} matches completed</p>
        </div>
        <button id="clearProgressBtn" class="button" style="background:#fff;color:#000;padding:0.5em 1em;">Clear</button>
      </div>
    </div>
    ` : ''}
    
    <div style="background:var(--panel);padding:1em;border-radius:8px;margin-bottom:1.5em;">
      <label style="display:block;margin-bottom:0.5em;font-weight:bold;">Quick Setup: Upload JSON</label>
      <input type="file" id="jsonUpload" accept=".json" style="margin-bottom:0.5em;">
      <p id="uploadStatus" style="color:var(--text-muted);font-size:0.9em;margin:0;"></p>
    </div>
    
    <h3 style="font-size:1.1em;margin-bottom:0.5em;">Group A (5 Players)</h3>
    <div id="groupAInputs" style="margin-bottom:1.5em;"></div>
    
    <h3 style="font-size:1.1em;margin-bottom:0.5em;">Group B (5 Players)</h3>
    <div id="groupBInputs" style="margin-bottom:1.5em;"></div>
    
    <h3 style="font-size:1.1em;margin-bottom:0.5em;">Match Format</h3>
    <label>Format Type</label>
    <select id="formatType">
      <option value="bestOf">Best Of</option>
      <option value="playAll">Play All (First To)</option>
    </select>
    <div id="bestOfFields">
      <label>Best Of (Legs)</label>
      <input type="number" id="totalLegs" min="1" max="15" value="5">
    </div>
    <div id="playAllFields" style="display:none;">
      <label>First To (Legs)</label>
      <input type="number" id="legsToWin" min="1" max="11" value="3">
    </div>
    
    <h3 style="font-size:1.1em;margin-top:1.5em;margin-bottom:0.5em;">Match Schedule (20 Matches)</h3>
    <div id="matchSchedule" style="margin-bottom:1em;"></div>
    
    <div class="sticky-bottom">
      <button id="startRoundRobinBtn" class="button">${hasProgress && completedCount > 0 ? 'Resume Event' : 'Start Event'}</button>
      <button id="backBtn" class="button" style="background:var(--panel);margin-top:0.5em;">Back to Menu</button>
    </div>
  `;
  
  const groupADiv = div.querySelector("#groupAInputs");
  const groupBDiv = div.querySelector("#groupBInputs");
  const scheduleDiv = div.querySelector("#matchSchedule");
  const uploadStatus = div.querySelector("#uploadStatus");
  
  // Initialize groups if empty
  if (appState.roundRobin.groupA.length === 0) {
    appState.roundRobin.groupA = ["", "", "", "", ""];
    appState.roundRobin.groupB = ["", "", "", "", ""];
  }
  
  // Render Group A fields
  appState.roundRobin.groupA.forEach((name, i) => {
    const input = document.createElement("input");
    input.type = "text";
    input.value = name;
    input.placeholder = `Group A Player ${i+1}`;
    input.style.marginBottom = "0.5em";
    input.oninput = (e) => {
      appState.roundRobin.groupA[i] = e.target.value;
      generateMatchSchedule();
    };
    groupADiv.appendChild(input);
  });
  
  // Render Group B fields
  appState.roundRobin.groupB.forEach((name, i) => {
    const input = document.createElement("input");
    input.type = "text";
    input.value = name;
    input.placeholder = `Group B Player ${i+1}`;
    input.style.marginBottom = "0.5em";
    input.oninput = (e) => {
      appState.roundRobin.groupB[i] = e.target.value;
      generateMatchSchedule();
    };
    groupBDiv.appendChild(input);
  });
  
  // Format type toggle
  div.querySelector("#formatType").onchange = (e) => {
    const bestOfFields = div.querySelector("#bestOfFields");
    const playAllFields = div.querySelector("#playAllFields");
    if (e.target.value === "bestOf") {
      bestOfFields.style.display = "block";
      playAllFields.style.display = "none";
    } else {
      bestOfFields.style.display = "none";
      playAllFields.style.display = "block";
    }
  };
  
  // JSON Upload Handler
  div.querySelector("#jsonUpload").onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        
        // Validate JSON structure
        if (!data.groupA || !data.groupB || !data.format || !data.matches) {
          throw new Error("Missing required fields: groupA, groupB, format, or matches");
        }
        
        if (data.groupA.length !== 5 || data.groupB.length !== 5) {
          throw new Error("Each group must have exactly 5 players");
        }
        
        if (data.matches.length !== 20) {
          throw new Error("Must have exactly 20 matches");
        }
        
        // Populate groups
        appState.roundRobin.groupA = data.groupA;
        appState.roundRobin.groupB = data.groupB;
        
        // Populate format
        const formatSelect = div.querySelector("#formatType");
        if (data.format.type === "bestOf") {
          formatSelect.value = "bestOf";
          div.querySelector("#totalLegs").value = data.format.totalLegs || 5;
          div.querySelector("#bestOfFields").style.display = "block";
          div.querySelector("#playAllFields").style.display = "none";
        } else if (data.format.type === "playAll") {
          formatSelect.value = "playAll";
          div.querySelector("#legsToWin").value = data.format.legsToWin || 3;
          div.querySelector("#bestOfFields").style.display = "none";
          div.querySelector("#playAllFields").style.display = "block";
        }
        
        // Populate matches
        appState.roundRobin.matches = data.matches.map((m, idx) => ({
          matchNum: m.matchNum || idx + 1,
          player1: m.player1,
          player2: m.player2,
          board: m.board || 1,
          time: m.time || null,
          winner: null,
          score1: 0,
          score2: 0,
          completed: false
        }));
        
        // Re-render inputs and schedule
        groupADiv.innerHTML = "";
        groupBDiv.innerHTML = "";
        
        appState.roundRobin.groupA.forEach((name, i) => {
          const input = document.createElement("input");
          input.type = "text";
          input.value = name;
          input.placeholder = `Group A Player ${i+1}`;
          input.style.marginBottom = "0.5em";
          input.oninput = (e) => {
            appState.roundRobin.groupA[i] = e.target.value;
            generateMatchSchedule();
          };
          groupADiv.appendChild(input);
        });
        
        appState.roundRobin.groupB.forEach((name, i) => {
          const input = document.createElement("input");
          input.type = "text";
          input.value = name;
          input.placeholder = `Group B Player ${i+1}`;
          input.style.marginBottom = "0.5em";
          input.oninput = (e) => {
            appState.roundRobin.groupB[i] = e.target.value;
            generateMatchSchedule();
          };
          groupBDiv.appendChild(input);
        });
        
        renderSchedule();
        
        // Save to localStorage
        saveRoundRobinState();
        
        uploadStatus.textContent = "✓ JSON loaded successfully!";
        uploadStatus.style.color = "var(--accent)";
      } catch (error) {
        uploadStatus.textContent = `✗ Error: ${error.message}`;
        uploadStatus.style.color = "#ff4444";
      }
    };
    reader.readAsText(file);
  };
  
  // Generate match schedule
  function generateMatchSchedule() {
    const allPlayers = [...appState.roundRobin.groupA, ...appState.roundRobin.groupB];
    const matches = [];
    let matchNum = 1;
    
    // Generate all possible matches (each player plays every other player once)
    for (let i = 0; i < allPlayers.length; i++) {
      for (let j = i + 1; j < allPlayers.length; j++) {
        const board = matchNum <= 10 ? 1 : 2; // First 10 matches on Board 1
        matches.push({
          matchNum: matchNum,
          player1: allPlayers[i] || `Player ${i+1}`,
          player2: allPlayers[j] || `Player ${j+1}`,
          board: board,
          winner: null,
          score1: 0,
          score2: 0,
          completed: false
        });
        matchNum++;
        if (matchNum > 20) break;
      }
      if (matchNum > 20) break;
    }
    
    appState.roundRobin.matches = matches.slice(0, 20);
    renderSchedule();
  }
  
  function renderSchedule() {
    scheduleDiv.innerHTML = "";
    appState.roundRobin.matches.forEach((match) => {
      const matchDiv = document.createElement("div");
      const isCompleted = match.completed;
      const bgColor = isCompleted ? "rgba(0,255,100,0.1)" : "var(--panel)";
      const opacity = isCompleted ? "0.7" : "1";
      matchDiv.style.cssText = `padding:0.75em;margin-bottom:0.5em;background:${bgColor};border-radius:8px;display:flex;justify-content:space-between;align-items:center;opacity:${opacity};`;
      
      const timeDisplay = match.time ? `<span style="color:var(--text-muted);margin:0 0.5em;">•</span><span style="color:var(--text-muted);font-size:0.9em;">${match.time}</span>` : '';
      const completedBadge = isCompleted ? `<span style="color:#0f0;margin-right:0.5em;">✓</span>` : '';
      const scoreDisplay = isCompleted && match.score1 !== undefined ? `<span style="color:var(--text-muted);margin:0 0.5em;">${match.score1}-${match.score2}</span>` : '';
      
      matchDiv.innerHTML = `
        <div>
          ${completedBadge}
          <span style="color:var(--accent);font-weight:bold;">Match ${match.matchNum}</span>
          <span style="color:var(--text-muted);margin:0 0.5em;">•</span>
          <span>${match.player1} vs ${match.player2}</span>
          ${scoreDisplay}
          ${timeDisplay}
        </div>
        <span style="color:${match.board === 1 ? 'var(--accent)' : 'var(--text-muted)'};">Board ${match.board}</span>
      `;
      scheduleDiv.appendChild(matchDiv);
    });
  }
  
  generateMatchSchedule();
  
  // Start round robin
  div.querySelector("#startRoundRobinBtn").onclick = () => {
    const formatType = div.querySelector("#formatType").value;
    if (formatType === "bestOf") {
      appState.roundRobin.format = {
        type: "bestOf",
        totalLegs: parseInt(div.querySelector("#totalLegs").value)
      };
    } else {
      appState.roundRobin.format = {
        type: "playAll",
        legsToWin: parseInt(div.querySelector("#legsToWin").value)
      };
    }
    
    // Find first incomplete match or start from beginning
    let startIndex = appState.roundRobin.matches.findIndex(m => !m.completed);
    if (startIndex === -1) startIndex = 0;
    appState.roundRobin.currentMatchIndex = startIndex;
    
    saveRoundRobinState();
    appState.screen = "roundRobinMatch";
    render();
  };
  
  div.querySelector("#backBtn").onclick = () => {
    appState.screen = "mainMenu";
    render();
  };
  
  // Clear progress button (if exists)
  const clearBtn = div.querySelector("#clearProgressBtn");
  if (clearBtn) {
    clearBtn.onclick = () => {
      if (confirm("Clear tournament progress? This cannot be undone.")) {
        appState.roundRobin = {
          active: true,
          groupA: [],
          groupB: [],
          matches: [],
          currentMatchIndex: 0,
          completedMatches: []
        };
        localStorage.removeItem("dartsRoundRobinState");
        render();
      }
    };
  }
  
  return div;
}

// --- ROUND ROBIN MATCH SCREEN ---
function renderRoundRobinMatch() {
  const currentMatch = appState.roundRobin.matches[appState.roundRobin.currentMatchIndex];
  
  // If no more matches, end
  if (!currentMatch) {
    appState.screen = "mainMenu";
    render();
    return document.createElement("div");
  }
  
  // Initialize match state
  if (!appState.roundRobin.currentMatchState) {
    appState.roundRobin.currentMatchState = {
      player1: currentMatch.player1,
      player2: currentMatch.player2,
      score1: 0,
      score2: 0,
      currentLeg: 1,
      legs: []
    };
  }
  
  const div = document.createElement("div");
  div.className = "screen";
  
  // State for this leg
  let selectedWinner = null;
  let currentLeg = {
    winner: null,
    moments: [],
    momentValues: {},
    legNumber: state.currentLeg
  };
  
  div.innerHTML = `
    <h2>Match ${currentMatch.matchNum} - Board ${currentMatch.board}</h2>
    <div class="score-panel">
      <div class="player-score">
        <span class="name">${currentMatch.player1}</span>
        <span class="score">${appState.roundRobin.currentMatchState.score1}</span>
      </div>
      <div class="vs">vs</div>
      <div class="player-score">
        <span class="name">${currentMatch.player2}</span>
        <span class="score">${appState.roundRobin.currentMatchState.score2}</span>
      </div>
    </div>
    <h3>Leg ${appState.roundRobin.currentMatchState.currentLeg}</h3>
    <label>Leg Winner</label>
    <div class="row">
      <button class="button winner-btn" data-winner="${currentMatch.player1}">${currentMatch.player1}</button>
      <button class="button winner-btn" data-winner="${currentMatch.player2}">${currentMatch.player2}</button>
    </div>
    <label>Memorable Moments (Optional)</label>
    <div class="col-2" id="momentBtns"></div>
    <div class="sticky-bottom">
      <button id="nextLegBtn" class="button">Next Leg</button>
      <button id="skipMatchBtn" class="button" style="background:var(--panel);margin-top:0.5em;">Skip Match</button>
    </div>
  `;
  
  const state = appState.roundRobin.currentMatchState;
  const format = appState.roundRobin.format;
  
  // Winner selection
  div.querySelectorAll(".winner-btn").forEach(btn => {
    btn.onclick = () => {
      selectedWinner = btn.dataset.winner;
      currentLeg.winner = selectedWinner;
      div.querySelectorAll(".winner-btn").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
    };
  });
  
  // Moment buttons
  const momentBtnsDiv = div.querySelector("#momentBtns");
  momentCategories.forEach(cat => {
    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.alignItems = "center";
    wrapper.style.gap = "0.5em";
    const btn = document.createElement("button");
    btn.className = "moment-btn button";
    btn.textContent = cat.label;
    btn.dataset.key = cat.key;
    wrapper.appendChild(btn);
    
    // Inline input for value moments
    let input = null;
    if (["highScoring","bigFinish","highAverage","lowDartLeg"].includes(cat.key)) {
      input = document.createElement("input");
      input.type = "text";
      input.placeholder = cat.key === "lowDartLeg" ? "Darts" : cat.label + " value";
      input.style.display = "none";
      input.style.width = "5em";
      input.style.fontSize = "1em";
      input.style.background = "#232834";
      input.style.color = "#fff";
      input.style.border = "1px solid #444";
      input.style.borderRadius = "0.7em";
      input.style.padding = "0.3em 0.7em";
      input.oninput = (e) => {
        currentLeg.momentValues[cat.key] = e.target.value;
      };
      wrapper.appendChild(input);
    }
    
    btn.onclick = () => {
      if (currentLeg.moments.includes(cat.key)) {
        // Deselect
        currentLeg.moments = currentLeg.moments.filter(m => m !== cat.key);
        btn.classList.remove("selected");
        if (input) {
          input.style.display = "none";
          delete currentLeg.momentValues[cat.key];
        }
      } else {
        // Select
        currentLeg.moments.push(cat.key);
        btn.classList.add("selected");
        if (input) input.style.display = "inline-block";
      }
    };
    
    momentBtnsDiv.appendChild(wrapper);
  });
  
  // Next leg button
  div.querySelector("#nextLegBtn").onclick = () => {
    if (!selectedWinner) {
      alert("Please select a leg winner first.");
      return;
    }
    
    state.legs.push(currentLeg);
    
    if (currentLeg.winner === currentMatch.player1) state.score1++;
    else state.score2++;
    
    checkMatchEnd();
  };
  
  function checkMatchEnd() {
    let matchOver = false;
    if (format.type === "bestOf") {
      const needed = Math.ceil(format.totalLegs / 2);
      if (state.score1 >= needed || state.score2 >= needed) matchOver = true;
    } else {
      if (state.score1 >= format.legsToWin || state.score2 >= format.legsToWin) matchOver = true;
    }
    
    if (matchOver) {
      finishMatch();
    } else {
      state.currentLeg++;
      render();
    }
  }
  
  function finishMatch() {
    currentMatch.completed = true;
    currentMatch.score1 = state.score1;
    currentMatch.score2 = state.score2;
    currentMatch.winner = state.score1 > state.score2 ? currentMatch.player1 : currentMatch.player2;
    currentMatch.legs = state.legs;
    
    appState.roundRobin.completedMatches.push({...currentMatch});
    
    // Save state after match completion
    saveRoundRobinState();
    
    // Only interview if on Board 1 (live stream board)
    if (currentMatch.board === 1) {
      // Generate interview questions with round robin context
      generateRoundRobinInterview(currentMatch);
      appState.screen = "interview";
    } else {
      // Skip interview for Board 2 matches
      moveToNextMatch();
    }
    
    appState.roundRobin.currentMatchState = null;
    render();
  }
  
  div.querySelector("#skipMatchBtn").onclick = () => {
    currentMatch.completed = true;
    saveRoundRobinState();
    moveToNextMatch();
  };
  
  function moveToNextMatch() {
    appState.roundRobin.currentMatchIndex++;
    appState.roundRobin.currentMatchState = null;
    appState.screen = "roundRobinMatch";
    render();
  }
  
  return div;
}

// --- SAVE ROUND ROBIN STATE ---
function saveRoundRobinState() {
  localStorage.setItem("dartsRoundRobinState", JSON.stringify(appState.roundRobin));
}

// --- GENERATE ROUND ROBIN INTERVIEW ---
function generateRoundRobinInterview(match) {
  const winner = match.winner;
  const loser = winner === match.player1 ? match.player2 : match.player1;
  const winnerScore = winner === match.player1 ? match.score1 : match.score2;
  const loserScore = winner === match.player1 ? match.score2 : match.score1;
  const matchScore = `${winnerScore}-${loserScore}`;
  
  const data = {
    playerName: winner,
    opponent: loser,
    matchScore: matchScore,
    matchNumber: match.matchNum,
    board: match.board
  };
  
  // Find next match for this player
  const nextMatch = appState.roundRobin.matches.find((m, idx) => 
    idx > appState.roundRobin.currentMatchIndex && 
    (m.player1 === winner || m.player2 === winner)
  );
  
  if (nextMatch) {
    data.nextOpponent = nextMatch.player1 === winner ? nextMatch.player2 : nextMatch.player1;
    data.nextBoard = nextMatch.board;
    data.nextMatchNum = nextMatch.matchNum;
  }
  
  // Collect moment data
  const momentData = {};
  const momentLegNumbers = {};
  match.legs.forEach((leg) => {
    if (leg.winner === winner) {
      leg.moments.forEach((m) => {
        const cat = m;
        if (!momentData[cat]) momentData[cat] = [];
        if (!momentLegNumbers[cat]) momentLegNumbers[cat] = [];
        momentData[cat].push(leg.momentValues[m] || "");
        momentLegNumbers[cat].push(leg.legNumber);
      });
    }
  });
  
  const questions = [];
  const usedQuestions = new Set();
  
  // Add round robin specific questions first
  if (questionBank.roundRobin) {
    questionBank.roundRobin.forEach((q) => {
      const question = q(data);
      if (question && !usedQuestions.has(q.toString())) {
        questions.push(question);
        usedQuestions.add(q.toString());
      }
    });
  }
  
  // Add standard moment-based questions
  Object.keys(momentData).forEach((cat) => {
    if (questionBank[cat]) {
      momentData[cat].forEach((val, idx) => {
        data[cat] = val;
        data.legNumber = momentLegNumbers[cat] ? momentLegNumbers[cat][idx] : undefined;
        
        const availableQuestions = questionBank[cat].filter((q) => !usedQuestions.has(q.toString()));
        if (availableQuestions.length > 0) {
          const q = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
          questions.push(q(data));
          usedQuestions.add(q.toString());
        }
      });
    }
  });
  
  // Add general questions
  const generalAvailable = questionBank.general.filter((q) => !usedQuestions.has(q.toString()));
  for (let i = 0; i < Math.min(2, generalAvailable.length); i++) {
    const q = generalAvailable[Math.floor(Math.random() * generalAvailable.length)];
    questions.push(q(data));
    usedQuestions.add(q.toString());
  }
  
  appState.interview.questions = questions;
  appState.interview.currentQuestionIndex = 0;
}

// --- INIT ---
window.addEventListener("DOMContentLoaded", () => {
  // Restore player library on load
  const savedPlayers = localStorage.getItem("dartsPlayerLibrary");
  if (savedPlayers) {
    const parsed = JSON.parse(savedPlayers);
    // Handle legacy format (array of strings) or new format (array of objects)
    appState.players = parsed.map(p => 
      typeof p === 'string' ? {name: p, group: ''} : p
    );
  }
  
  // Restore Round Robin state on load
  const savedRoundRobin = localStorage.getItem("dartsRoundRobinState");
  if (savedRoundRobin) {
    try {
      const parsed = JSON.parse(savedRoundRobin);
      // Only restore if there's an active tournament
      if (parsed.matches && parsed.matches.length > 0) {
        appState.roundRobin = parsed;
        // If tournament was in progress, go to appropriate screen
        if (parsed.currentMatchIndex < parsed.matches.length && !parsed.matches[parsed.matches.length - 1].completed) {
          appState.screen = "roundRobinSetup"; // Show setup screen with restored data
        }
      }
    } catch (e) {
      console.error("Failed to restore Round Robin state:", e);
    }
  }
  
  render();
});

