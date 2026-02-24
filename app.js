// Darts Interview Assistant SPA
// Vanilla JS, state-driven, mobile-first, modular

// --- GLOBAL STATE ---
const appState = {
  screen: "mainMenu", // mainMenu | playerEntry | setup | match | interview
  players: [], // All tournament player names
  config: {
    matchType: "matchPlay", // Only matchPlay for v1
    mode: null, // bestOf | playAll
    totalLegs: null,
    legsToWin: null,
    player1: "",
    player2: ""
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
  }
}

// --- MAIN MENU ---
function renderMainMenu() {
  const div = document.createElement("div");
  div.className = "screen";
  div.innerHTML = `
    <h1>Darts Interview Assistant</h1>
    <button id="startTournamentBtn" class="button">Start Tournament</button>
  `;
  div.querySelector("#startTournamentBtn").onclick = () => {
    resetState();
    appState.screen = "playerEntry";
    render();
  };
  return div;
}

// --- PLAYER ENTRY SCREEN ---
function renderPlayerEntry() {
  const div = document.createElement("div");
  div.className = "screen";
  div.innerHTML = `
    <h2>Enter All Player Names</h2>
    <form id="playerForm" autocomplete="off">
      <div id="playerInputs"></div>
      <button type="button" id="addPlayerBtn" class="button">Add Player</button>
      <div class="sticky-bottom">
        <button type="submit" class="button">Continue</button>
      </div>
    </form>
  `;
  const playerInputsDiv = div.querySelector("#playerInputs");
  // Save player library to localStorage
  function savePlayerLibrary() {
    const toSave = appState.players.map((n, i) => n.trim() ? n.trim() : `Player ${i+1}`);
    localStorage.setItem("dartsPlayerLibrary", JSON.stringify(toSave));
  }
  // Render current player fields
  function renderInputs() {
    playerInputsDiv.innerHTML = "";
    appState.players.forEach((name, idx) => {
      const row = document.createElement("div");
      row.className = "row";
      row.style.marginBottom = "0.5em";
      row.innerHTML = `
        <input type="text" value="${name}" maxlength="20" data-idx="${idx}" placeholder="Player ${idx+1}" style="flex:1;">
        <button type="button" class="button" data-remove="${idx}" style="width:2.5em;padding:0 0.5em;margin-left:0.5em;">&times;</button>
      `;
      // Remove player
      row.querySelector("[data-remove]").onclick = (e) => {
        appState.players.splice(idx, 1);
        renderInputs();
        savePlayerLibrary();
      };
      // Edit player
      row.querySelector("input").oninput = (e) => {
        appState.players[idx] = e.target.value;
        savePlayerLibrary();
      };
      playerInputsDiv.appendChild(row);
    });
  }
  // Add player
  div.querySelector("#addPlayerBtn").onclick = () => {
    appState.players.push("");
    renderInputs();
    savePlayerLibrary();
  };
  // Initial: at least 2
  if (appState.players.length < 2) {
    appState.players = ["", ""];
  }
  renderInputs();
  // Continue to setup
  div.querySelector("#playerForm").onsubmit = (e) => {
    e.preventDefault();
    // Allow blank names, but require at least 2 players
    if (appState.players.length < 2) {
      alert("Enter at least two players.");
      return;
    }
    // Auto-name blanks as Player 1, Player 2, ...
    appState.players = appState.players.map((n, i) => n.trim() ? n.trim() : `Player ${i+1}`);
    savePlayerLibrary();
    appState.screen = "setup";
    render();
  };
  return div;
}

// --- SETUP SCREEN ---
function renderSetup() {
  const div = document.createElement("div");
  div.className = "screen";
  div.innerHTML = `
    <h2>Setup Match</h2>
    <button id="returnPlayerLibBtn" class="button" style="margin-bottom:1em;background:var(--panel);color:var(--accent2);border:1px solid var(--accent2);">Return to Player Library</button>
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
    <select id="player1">
      ${appState.players.map((n, i) => `<option value="${n}">${n || `Player ${i+1}`}</option>`).join("")}
    </select>
    <label>Player 2</label>
    <select id="player2">
      ${appState.players.map((n, i) => `<option value="${n}">${n || `Player ${i+1}`}</option>`).join("")}
    </select>
    <div class="sticky-bottom">
      <button id="beginMatchBtn" class="button">Start Match</button>
    </div>
  `;
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
  appState.players = savedPlayers ? JSON.parse(savedPlayers) : [];
  appState.config = {
    matchType: "matchPlay",
    mode: null,
    totalLegs: null,
    legsToWin: null,
    player1: "",
    player2: ""
  };
  appState.score = { player1: 0, player2: 0 };
  appState.currentLeg = 1;
  appState.legs = [];
  appState.interview = { questions: [], currentQuestionIndex: 0 };
}

// --- INIT ---
window.addEventListener("DOMContentLoaded", () => {
  // Restore player library on load
  const savedPlayers = localStorage.getItem("dartsPlayerLibrary");
  if (savedPlayers) {
    appState.players = JSON.parse(savedPlayers);
  }
  render();
});

