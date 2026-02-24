// Darts Interview Assistant SPA
// Vanilla JS, state-driven, mobile-first, modular

// --- GLOBAL STATE ---
const appState = {
  screen: "mainMenu", // mainMenu | setup | match | interview
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
    () => "Was scoring the key difference tonight?"
  ],
  comeback: [
    () => "When did momentum shift?",
    () => "What adjustment sparked the comeback?"
  ],
  matchDart: [
    () => "What goes through your mind on match dart?"
  ],
  upset: [
    () => "Did being the underdog motivate you?"
  ],
  general: [
    () => "How important is this result?",
    () => "What does this mean moving forward?"
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
    <button id="startMatchBtn" class="button">Start New Match</button>
  `;
  div.querySelector("#startMatchBtn").onclick = () => {
    resetState();
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
    <label>Player 1 Name</label>
    <input id="player1" maxlength="20" placeholder="Player 1" autocomplete="off">
    <label>Player 2 Name</label>
    <input id="player2" maxlength="20" placeholder="Player 2" autocomplete="off">
    <div class="sticky-bottom">
      <button id="beginMatchBtn" class="button">Start Match</button>
    </div>
  `;
  // Mode selection
  div.querySelectorAll(".mode-btn").forEach(btn => {
    btn.onclick = (e) => {
      appState.config.mode = btn.dataset.mode;
      div.querySelectorAll(".mode-btn").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
    };
  });
  // Start match
  div.querySelector("#beginMatchBtn").onclick = () => {
    const mode = appState.config.mode;
    const totalLegs = parseInt(div.querySelector("#totalLegs").value, 10);
    const p1 = div.querySelector("#player1").value.trim() || "Player 1";
    const p2 = div.querySelector("#player2").value.trim() || "Player 2";
    if (!mode) {
      alert("Select a mode");
      return;
    }
    appState.config.totalLegs = totalLegs;
    appState.config.player1 = p1;
    appState.config.player2 = p2;
    if (mode === "bestOf") {
      appState.config.legsToWin = Math.ceil(totalLegs / 2);
    } else {
      appState.config.legsToWin = totalLegs;
    }
    appState.screen = "match";
    render();
  };
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
  { key: "matchDart", label: "Match Dart" }
];

function renderMatch() {
  const div = document.createElement("div");
  div.className = "screen";
  const p1 = appState.config.player1;
  const p2 = appState.config.player2;
  const leg = appState.currentLeg;
  const totalLegs = appState.config.totalLegs;
  const score = appState.score;
  // State for this leg
  let selectedWinner = null;
  let selectedMoments = [];
  let highScoreValue = "";

  div.innerHTML = `
    <div class="scoreboard">
      <span class="leg-number">Leg ${leg} / ${totalLegs}</span>
      <span>${p1}: <b>${score.player1}</b> &nbsp;|&nbsp; ${p2}: <b>${score.player2}</b></span>
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
      <button id="nextLegBtn" class="button">Next Leg</button>
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
  momentCategories.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = "moment-btn button";
    btn.textContent = cat.label;
    btn.dataset.key = cat.key;
    btn.onclick = () => {
      btn.classList.toggle("selected");
      if (btn.classList.contains("selected")) {
        selectedMoments.push(cat.key);
      } else {
        selectedMoments = selectedMoments.filter(k => k !== cat.key);
      }
      // Show high score input if highScoring selected
      if (selectedMoments.includes("highScoring")) {
        showHighScoreInput();
      } else {
        hideHighScoreInput();
      }
    };
    momentBtnsDiv.appendChild(btn);
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
  // Next Leg logic
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
      highScore: selectedMoments.includes("highScoring") && highScoreValue ? parseInt(highScoreValue, 10) : undefined
    };
    appState.legs.push(legObj);
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
  // 1. Count frequency of each moment
  const freq = {};
  appState.legs.forEach(leg => {
    leg.moments.forEach(m => {
      freq[m] = (freq[m] || 0) + 1;
    });
  });
  // 2. Sort categories by frequency
  const sortedCats = Object.keys(freq).sort((a, b) => freq[b] - freq[a]);
  // 3. Take top categories (max 4)
  const selectedCats = sortedCats.slice(0, 4);
  // 4. Pull one random question per category
  const questions = [];
  selectedCats.forEach(cat => {
    if (questionBank[cat] && questionBank[cat].length) {
      // Use leg data for highScoring
      let data = {};
      if (cat === "highScoring") {
        // Find highest highScore
        let max = 0;
        appState.legs.forEach(leg => {
          if (leg.highScore && leg.highScore > max) max = leg.highScore;
        });
        data.highScore = max || undefined;
      }
      const qArr = questionBank[cat];
      const q = qArr[Math.floor(Math.random() * qArr.length)](data);
      questions.push(q);
    }
  });
  // 5. Fill with general if < 4
  while (questions.length < 4) {
    const qArr = questionBank.general;
    const q = qArr[Math.floor(Math.random() * qArr.length)]();
    questions.push(q);
  }
  appState.interview.questions = questions;
  appState.interview.currentQuestionIndex = 0;
}

// --- STATE RESET ---
function resetState() {
  appState.screen = "mainMenu";
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
window.addEventListener("DOMContentLoaded", render);
