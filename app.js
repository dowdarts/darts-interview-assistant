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
    groupA: [], // 5 players (names as strings for backward compatibility)
    groupB: [], // 5 players
    playerProfiles: {}, // Map of player name -> {province: string}
    matches: [], // Array of {matchNum, player1, player2, board, winner, score1, score2, completed, legs}
    currentMatchIndex: 0,
    completedMatches: [] // Stores results for contextual questions
  }
};

// --- PRESET EVENTS ---
const presetEvents = {
  event4: {
    label: "Event 4",
    format: { type: "bestOf", totalLegs: 5 },
    groupA: [
      { name: "Drake Berry",  province: "NS"   },
      { name: "Cory Wallace", province: "NB"   },
      { name: "Dana Moss",    province: "NB"   },
      { name: "Dee Cormier",  province: "NB"   },
      { name: "Colby Burke",  province: "NFLD" }
    ],
    groupB: [
      { name: "Wayne Champman",   province: "NB" },
      { name: "Jordan Boyd",      province: "NS" },
      { name: "Kevin Blanchard",  province: "PE" },
      { name: "Don Higgins",      province: "NB" },
      { name: "Mark MacEachern",  province: "PE" }
    ],
    matches: [
      { matchNum: 1,  time: "9:00 AM",  board: 1, player1: "Drake Berry",      player2: "Cory Wallace"    },
      { matchNum: 2,  time: "9:00 AM",  board: 2, player1: "Wayne Champman",   player2: "Jordan Boyd"     },
      { matchNum: 3,  time: "9:25 AM",  board: 1, player1: "Drake Berry",      player2: "Dana Moss"       },
      { matchNum: 4,  time: "9:25 AM",  board: 2, player1: "Wayne Champman",   player2: "Kevin Blanchard" },
      { matchNum: 5,  time: "9:50 AM",  board: 1, player1: "Jordan Boyd",      player2: "Kevin Blanchard" },
      { matchNum: 6,  time: "9:50 AM",  board: 2, player1: "Cory Wallace",     player2: "Dana Moss"       },
      { matchNum: 7,  time: "10:15 AM", board: 1, player1: "Cory Wallace",     player2: "Dee Cormier"     },
      { matchNum: 8,  time: "10:15 AM", board: 2, player1: "Jordan Boyd",      player2: "Don Higgins"     },
      { matchNum: 9,  time: "10:40 AM", board: 1, player1: "Mark MacEachern",  player2: "Wayne Champman"  },
      { matchNum: 10, time: "10:40 AM", board: 2, player1: "Colby Burke",      player2: "Drake Berry"     },
      { matchNum: 11, time: "11:05 AM", board: 1, player1: "Mark MacEachern",  player2: "Jordan Boyd"     },
      { matchNum: 12, time: "11:05 AM", board: 2, player1: "Colby Burke",      player2: "Cory Wallace"    },
      { matchNum: 13, time: "11:30 AM", board: 1, player1: "Colby Burke",      player2: "Dana Moss"       },
      { matchNum: 14, time: "11:30 AM", board: 2, player1: "Mark MacEachern",  player2: "Kevin Blanchard" },
      { matchNum: 15, time: "11:55 AM", board: 1, player1: "Kevin Blanchard",  player2: "Don Higgins"     },
      { matchNum: 16, time: "11:55 AM", board: 2, player1: "Dana Moss",        player2: "Dee Cormier"     },
      { matchNum: 17, time: "12:20 PM", board: 1, player1: "Don Higgins",      player2: "Wayne Champman"  },
      { matchNum: 18, time: "12:20 PM", board: 2, player1: "Dee Cormier",      player2: "Drake Berry"     },
      { matchNum: 19, time: "12:45 PM", board: 1, player1: "Dee Cormier",      player2: "Colby Burke"     },
      { matchNum: 20, time: "12:45 PM", board: 2, player1: "Don Higgins",      player2: "Mark MacEachern" }
    ]
  }
};

// --- LOAD PRESET EVENT ---
function loadPresetEvent(eventKey) {
  const preset = presetEvents[eventKey];
  if (!preset) return;

  appState.roundRobin.playerProfiles = {};

  appState.roundRobin.groupA = preset.groupA.map(p => {
    if (p.province) appState.roundRobin.playerProfiles[p.name] = { province: p.province };
    return p.name;
  });
  appState.roundRobin.groupB = preset.groupB.map(p => {
    if (p.province) appState.roundRobin.playerProfiles[p.name] = { province: p.province };
    return p.name;
  });

  appState.roundRobin.format = { ...preset.format };

  appState.roundRobin.matches = preset.matches.map(m => ({
    matchNum: m.matchNum,
    player1:  m.player1,
    player2:  m.player2,
    board:    m.board,
    time:     m.time,
    winner:   null,
    score1:   0,
    score2:   0,
    completed: false,
    legs:     []
  }));

  appState.roundRobin.completedMatches = [];
  appState.roundRobin.currentMatchIndex = 0;
  appState.roundRobin.currentMatchState = null;
  appState.roundRobin.active = false;
  appState.roundRobin.knockout = null;

  saveRoundRobinState();
}

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
    (data) => `That ${data.bigFinish || "big finish"} checkout — talk us through it!`,
    (data) => `${data.bigFinish || "Big finish"} to finish, what was going through your mind?`,
    (data) => `How crucial was that ${data.bigFinish || "big finish"} finish in this ${data.matchScore} victory?`,
    (data) => `Leg ${data.legNumber}, ${data.bigFinish || "big finish"} to win it. Walk us through that checkout.`,
    (data) => `That ${data.bigFinish || "big finish"} in leg ${data.legNumber} — was that under pressure against ${data.opponent}?`
  ],
  highAverage: [
    (data) => `You averaged ${data.highAverage || "well"} tonight — is that your best form this season?`,
    (data) => `A ${data.highAverage || "strong"} average against ${data.opponent}, are you pleased with that?`,
    (data) => `That ${data.highAverage || "high"} average shows real quality. What's clicking for you right now?`
  ],
  lowDartLeg: [
    (data) => `${data.lowDartLeg || "Quick"} darts to win that leg — that's clinical finishing, ${data.playerName}!`,
    (data) => `A ${data.lowDartLeg || "quick"}-darter! Talk us through that leg.`,
    (data) => `That ${data.lowDartLeg || "quick"}-dart leg was crucial in this ${data.matchScore} win. How did you find that rhythm?`,
    (data) => `${data.lowDartLeg || "Quick"} darts — is that one of your best legs of the season?`,
    (data) => `Leg ${data.legNumber}, you took it in ${data.lowDartLeg || "quick"} darts. How did you approach that one?`,
    (data) => `${data.lowDartLeg || "Quick"} darts in leg ${data.legNumber} against ${data.opponent} — that's world-class, ${data.playerName}.`
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
    // ---- NEXT MATCH context ----
    (data) => data.nextOpponent ? `You've just taken a ${data.matchScore} win over ${data.opponent}. You're playing ${data.nextOpponent} on board ${data.nextBoard} next — how does this result set you up for that match?` : null,
    (data) => data.nextOpponent ? `That's match ${data.matchNumber} done at ${data.matchScore}. With ${data.nextOpponent} coming up in match ${data.nextMatchNum}, how are you feeling about your form?` : null,
    (data) => data.nextOpponent ? `${data.opponent} is behind you now. Does beating them give you confidence going into ${data.nextOpponent}?` : null,
    (data) => data.nextOpponent && data.nextOpponentRecord ? `${data.nextOpponent} is sitting at ${data.nextOpponentRecord} right now. How do you approach that matchup knowing their record?` : null,
    (data) => data.nextBoard1Opponent ? `Your next board 1 match is against ${data.nextBoard1Opponent}${data.nextBoard1Province ? ` from ${data.nextBoard1Province}` : ''} — what do you know about them?` : null,
    (data) => data.nextBoard === 1 ? `You're back on the livestream board next against ${data.nextOpponent}. Does being watched by camera change anything for you?` : null,
    (data) => data.nextBoard === 2 ? `Next up is ${data.nextOpponent} on board ${data.nextBoard}. How do you stay sharp when you're not on the main stage?` : null,
    (data) => data.nextMatchTime && data.nextOpponent ? `You've got ${data.nextOpponent} at ${data.nextMatchTime}. Is there anything you'll do differently going into that one?` : null,

    // ---- RECORD / STANDINGS context ----
    (data) => data.tournamentRecord ? `You're sitting at ${data.tournamentRecord} in the round robin. How does that affect you going into your next match?` : null,
    (data) => data.tournamentRecord && data.nextOpponent ? `With a ${data.tournamentRecord} record, you're facing ${data.nextOpponent} next. How confident are you feeling?` : null,
    (data) => data.isLastMatch && data.tournamentRecord ? `This brings you to ${data.tournamentRecord} in the round robin — that's your final match done. How do you feel about your day overall?` : null,
    (data) => data.tournamentRecord ? `${data.tournamentRecord} in round robin play — are you satisfied with how you've performed today?` : null,
    (data) => data.playerRank && data.totalPlayers ? `You're ranked ${data.playerRank} out of ${data.totalPlayers} right now. Does knowing where you stand affect your mindset?` : null,
    (data) => data.tournamentWins >= 2 ? `You're on a ${data.tournamentWins}-win run today. Is the momentum building for you?` : null,
    (data) => data.tournamentLosses >= 1 && data.tournamentWins >= 1 ? `You've had wins and losses today — how do you reset mentally between matches in this format?` : null,

    // ---- ALREADY PLAYED context ----
    (data) => data.alreadyPlayedCount > 1 ? `You've played ${data.alreadyPlayedCount} matches today. How are you managing your energy and focus through the round robin?` : null,
    (data) => data.alreadyPlayed && data.alreadyPlayed.length > 1 ? `Coming into this against ${data.opponent} — having already played ${data.alreadyPlayed.map(o => o.name).slice(0, -1).join(', ')} earlier — how did you adjust your game?` : null,
    (data) => data.alreadyPlayedCount === 1 ? `That was only your second match today — are you starting to find your rhythm in this tournament?` : null,

    // ---- REMAINING MATCHES context ----
    (data) => data.remainingMatchCount > 1 ? `You've still got ${data.remainingMatchCount} matches left today. How important is it to bank this win for your confidence?` : null,
    (data) => data.remainingMatchCount === 1 ? `One match left after this. With a ${data.tournamentRecord} record, what do you need to do in that final match?` : null,
    (data) => data.remainingMatchCount === 0 && data.isLastMatch ? `That was your last match of the day. Looking back, what defines your tournament today?` : null,

    // ---- PROVINCE context ----
    (data) => data.opponentProvince && data.playerProvince && data.opponentProvince !== data.playerProvince ? `${data.playerProvince} versus ${data.opponentProvince} — does that inter-province rivalry add extra edge to a win like this?` : null,
    (data) => data.opponentProvince ? `You just beat ${data.opponentProvince}'s ${data.opponent} ${data.matchScore}. How does that feel?` : null,
    (data) => data.nextOpponentProvince && data.nextOpponent && data.nextOpponentProvince !== data.playerProvince ? `Next up is ${data.nextOpponentProvince}'s ${data.nextOpponent}. Is there any extra motivation when it's another inter-province clash?` : null,
    (data) => data.playerProvince ? `Representing ${data.playerProvince} here today with that ${data.matchScore} win — how important is it to fly the flag for your province?` : null,

    // ---- FORMAT context ----
    (data) => data.matchNumber ? `This is match ${data.matchNumber} of the round robin. How are you pacing yourself through this format?` : null,
    (data) => `In the round robin format, every match matters. How do you keep your head up when you know there's another match right around the corner?`,

    // ---- WHITEWASH / DOMINANT WIN (3-0) ----
    (data) => data.isWhitewash ? `${data.winnerLegs}-${data.loserLegs} — a clean sweep over ${data.opponent}. Was there ever a moment where you felt them trying to get back into it?` : null,
    (data) => data.isWhitewash ? `You didn't drop a single leg against ${data.opponent}. How dominant did that feel from the oche?` : null,
    (data) => data.isWhitewash ? `That's a whitewash — ${data.winnerLegs}-${data.loserLegs}. Does a win like that give you a mental edge for the rest of today's matches?` : null,
    (data) => data.isWhitewash ? `${data.opponent} couldn't get a leg on the board. What was your mindset going into each leg knowing you had that kind of control?` : null,
    (data) => data.isWhitewash && data.nextOpponent ? `After a ${data.winnerLegs}-${data.loserLegs} whitewash, you go into the match against ${data.nextOpponent} in great form — is that momentum something you feed off?` : null,

    // ---- 5TH LEG DECIDER (went 2-2) ----
    (data) => data.isDecider ? `It went all the way to the deciding leg — ${data.winnerLegs}-${data.loserLegs}. What was going through your head stepping up to throw in that final leg?` : null,
    (data) => data.isDecider ? `You and ${data.opponent} took it to a decider. At 2-2, how did you reset your mindset before that fifth leg?` : null,
    (data) => data.isDecider ? `The decider — that's the ultimate test. How do you handle the pressure of a final-leg situation?` : null,
    (data) => data.isDecider ? `When it gets to that fifth leg, is it just pure instinct, or do you have a specific routine to settle yourself?` : null,
    (data) => data.isDecider && data.nextOpponent ? `You had to dig really deep for that decider win. Does going through a five-legger toughen you up for your next match against ${data.nextOpponent}?` : null,

    // ---- COMEBACK FROM 0-2 ----
    (data) => data.isComeback ? `You were 0-2 down against ${data.opponent} and came back to win ${data.winnerLegs}-${data.loserLegs}. At two legs down, did you believe you could still win this match?` : null,
    (data) => data.isComeback ? `Most players would go into their shell at 0-2 — you turned it around. What flipped for you in that third leg?` : null,
    (data) => data.isComeback ? `That comeback from 0-2 — ${data.winnerLegs}-${data.loserLegs} — is one of the best moments today. Where does that kind of fight come from, ${data.playerName}?` : null,
    (data) => data.isComeback ? `Two legs down and you still believed. How important is self-belief in a round robin format where momentum can swing so fast?` : null,
    (data) => data.isComeback && data.opponent ? `${data.opponent} had you on the ropes at 0-2. Was there one shot, one checkout, one moment that turned the tide?` : null,

    // ---- SURRENDERED LEAD BUT STILL WON (2-0 up, went 2-2, still won) ----
    (data) => data.isSurrender ? `You had ${data.opponent} 2-0, they pulled it back to 2-2, but you took the decider. How did you stay composed when they levelled it?` : null,
    (data) => data.isSurrender ? `Going 2-0 up and then watching ${data.opponent} claw it back to 2-2 — what was your mental state going into that final leg?` : null,
    (data) => data.isSurrender ? `You let a 2-0 lead slip to 2-2, but you still won the match. Is a win like that more satisfying or more nerve-wracking?` : null,
    (data) => data.isSurrender ? `At 2-2, what did you tell yourself before stepping up in the deciding leg? You'd been there before — you were the one leading 2-0.` : null,
    (data) => data.isSurrender ? `${data.opponent} found a way back from 2-0 down to level it — but you kept your nerve. How important is it not to panic when a lead slips like that?` : null,

    // ---- NAIL-BITER (1-1 and close throughout) ----
    (data) => data.isNailBiter ? `That was a real nail-biter — you and ${data.opponent} went blow for blow. What separates you when it gets that tight?` : null,
    (data) => data.isNailBiter ? `${data.winnerLegs}-${data.loserLegs} — every leg was contested. How do you stay focused when the match stays so tight for so long?` : null,
    (data) => data.isNailBiter ? `You were never more than one leg apart in that match. How do you mentally handle that kind of back-and-forth pressure against ${data.opponent}?` : null,
    (data) => data.isNailBiter ? `In a close match like that, is it about your own game or reading your opponent's? What was the key for you in getting over the line?` : null,
    (data) => data.isNailBiter && data.nextOpponent ? `After a tight ${data.winnerLegs}-${data.loserLegs} battle, you roll straight into ${data.nextOpponent} — does grinding out a close win leave anything in the tank?` : null,

    // ---- LEAD CHANGES (back and forth match) ----
    (data) => data.hadLeadChanges ? `That match had the lead flipping multiple times. How do you stay grounded when a match swings like that?` : null,
    (data) => data.hadLeadChanges ? `You and ${data.opponent} traded legs back and forth — the momentum kept shifting. What kept you believing you'd come out on top?` : null,
  ]
};

// --- HELP MODAL ---
function showHelp(title, body) {
  const overlay = document.createElement("div");
  overlay.className = "help-overlay";
  overlay.innerHTML = `
    <div class="help-modal">
      <div class="help-modal-title">${title}</div>
      <div class="help-modal-body">${body}</div>
      <button class="help-modal-close">Got It</button>
    </div>
  `;
  overlay.querySelector(".help-modal-close").onclick = () => overlay.remove();
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  document.getElementById("app").appendChild(overlay);
}

function bindHelpButtons(container) {
  container.querySelectorAll(".help-btn").forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      showHelp(btn.dataset.helpTitle, btn.dataset.helpBody);
    };
  });
}

// --- RENDERER ---
function render() {
  const app = document.getElementById("app");
  app.innerHTML = "";
  switch (appState.screen) {
    case "mainMenu":
      app.appendChild(renderMainMenu());
      break;
    case "matchList":
      app.appendChild(renderMatchList());
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
    case "roundRobinMatchComplete":
      app.appendChild(renderRoundRobinMatchComplete());
      break;
    case "board2Entry":
      app.appendChild(renderBoard2Entry());
      break;
    case "questionLibrary":
      app.appendChild(renderQuestionLibrary());
      break;
    case "knockoutStandings":
      app.appendChild(renderKnockoutStandings());
      break;
    case "knockoutBracket":
      app.appendChild(renderKnockoutBracket());
      break;
    case "knockoutMatch":
      app.appendChild(renderKnockoutMatch());
      break;
  }
}

// --- MAIN MENU ---
function renderMainMenu() {
  const div = document.createElement("div");
  div.className = "screen";
  div.style.justifyContent = "center";
  div.style.minHeight = "95vh";
  div.style.textAlign = "center";
  div.innerHTML = `
    <div style="margin-bottom:2.5em;">
      <div style="font-family:var(--font-display);font-size:0.75em;letter-spacing:0.2em;color:var(--text-muted);text-transform:uppercase;margin-bottom:0.4em;">AADS Darts</div>
      <h1 style="font-size:2.2em;margin-bottom:0.1em;">Interview<br>Assistant</h1>
      <div style="width:70px;height:3px;background:linear-gradient(90deg,var(--orange),var(--orange-glow));border-radius:2px;margin:0.6em auto 0;box-shadow:0 0 12px var(--orange);"></div>
    </div>
    <button id="roundRobinBtn" class="button" style="max-width:360px;margin:0 auto var(--gap);">Round Robin Event</button>
    <button id="questionBankBtn" class="button btn-secondary" style="max-width:360px;margin:0 auto;">Interview Questions</button>
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
  div.querySelector("#questionBankBtn").onclick = () => {
    appState.screen = "questionBank";
    render();
  };
  return div;
}

// --- MATCH LIST (main hub) ---
function renderMatchList() {
  const matches = appState.roundRobin.matches || [];
  const completedCount = matches.filter(m => m.completed).length;
  const totalCount = matches.length;
  const allDone = completedCount === totalCount && totalCount > 0;

  // A match is available to start if the previous match is done (or it's the first)
  function isAvailable(idx) {
    if (matches[idx].completed) return false; // already done
    if (idx === 0) return true;
    return matches[idx - 1].completed === true;
  }

  const div = document.createElement("div");
  div.className = "screen";

  // — header —
  div.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.4em;flex-wrap:wrap;gap:0.5em;">
      <div>
        <div style="font-family:var(--font-display);font-size:0.72em;letter-spacing:0.18em;color:var(--text-muted);text-transform:uppercase;margin-bottom:0.2em;">AADS Darts</div>
        <h1 style="font-size:1.85em;margin:0;display:flex;align-items:center;gap:0.4em;">Event 4 <button class="help-btn" data-help-title="Match List" data-help-body="Matches unlock one at a time as they complete. Tap an available match to score it live, leg by leg.&lt;br&gt;&lt;br&gt;Tap any &lt;b&gt;completed match&lt;/b&gt; (green) to edit it. Board 2 matches use a quick score-entry screen — enter final legs won by each player.">?</button></h1>
      </div>
      <div style="display:flex;gap:0.35em;flex-wrap:wrap;">
        <button id="syncBtn" style="width:auto;padding:0.45em 1em;margin:0;background:${GitHubSync.hasToken()?'#1a3a1a':'#1a1a1a'};border:1px solid ${GitHubSync.hasToken()?'#4caf50':'var(--divider)'};color:${GitHubSync.hasToken()?'#4caf50':'var(--text-muted)'};font-size:0.78em;border-radius:10px;box-shadow:none;text-transform:uppercase;letter-spacing:0.06em;">${GitHubSync.hasToken()?'✓ TV Sync':'TV Sync'}</button>
        <button id="resetBtn" style="width:auto;padding:0.45em 1em;margin:0;background:#1a1a1a;border:1px solid var(--divider);color:var(--text-muted);font-size:0.78em;border-radius:10px;box-shadow:none;text-transform:uppercase;letter-spacing:0.06em;">Reset</button>
        <button id="qlBtn" style="width:auto;padding:0.45em 1em;margin:0;background:#1a1a1a;border:1px solid var(--orange);color:var(--orange);font-size:0.78em;border-radius:10px;box-shadow:none;text-transform:uppercase;letter-spacing:0.06em;">Questions</button>
      </div>
    </div>
    <div style="height:2px;background:linear-gradient(90deg,var(--orange),var(--orange-glow));border-radius:2px;margin-bottom:1.1em;box-shadow:0 0 10px var(--orange);"></div>

    ${allDone ? `
    <div style="background:rgba(76,175,80,0.12);border:1.5px solid #4caf50;border-radius:12px;padding:0.8em 1.2em;margin-bottom:0.6em;font-family:var(--font-display);font-size:0.9em;color:#4caf50;letter-spacing:0.04em;text-transform:uppercase;">
      ✓ Event Complete — All ${totalCount} matches done
    </div>
    <button id="knockoutBtn" class="button" style="margin-bottom:0.8em;background:linear-gradient(135deg,#b8860b,#d4a017);color:#000;">🏆 Knockout Stage →</button>` : `
    <div style="background:var(--card-black);border:1px solid var(--divider);border-radius:12px;padding:0.65em 1.2em;margin-bottom:1em;display:flex;justify-content:space-between;align-items:center;">
      <span style="font-family:var(--font-display);font-size:0.82em;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;">Progress</span>
      <span style="font-family:var(--font-display);font-weight:700;color:var(--orange);">${completedCount} / ${totalCount}</span>
    </div>`}

    <div id="matchListItems"></div>
  `;

  // Build match items
  const listEl = div.querySelector("#matchListItems");

  // Separate matches into upcoming and completed
  const upcomingMatches = [];
  const completedMatches = [];
  
  matches.forEach((match, idx) => {
    const available = isAvailable(idx);
    const done = match.completed;
    const locked = !done && !available;
    
    if (done) {
      completedMatches.push({ match, idx, available, done, locked });
    } else {
      upcomingMatches.push({ match, idx, available, done, locked });
    }
  });

  // Render function for a match card
  function renderMatchCard(matchObj) {
    const { match, idx, available, done, locked } = matchObj;
    const isBoard1 = match.board === 1;

    const item = document.createElement("div");
    item.style.cssText = `
      display:flex; align-items:stretch; background:${done ? '#111' : available ? 'var(--card-black)' : '#0f0f0f'};
      border-radius:12px; margin-bottom:0.55em;
      border:1px solid ${done ? '#1e2e1e' : available ? 'var(--divider)' : '#1a1a1a'};
      border-left:4px solid ${done ? '#2a5a2a' : isBoard1 ? (available ? 'var(--orange)' : '#5a2a00') : (available ? '#555' : '#2a2a2a')};
      opacity:${locked ? '0.45' : '1'};
      overflow:hidden; cursor:${(available || done) ? 'pointer' : 'default'};
      transition:box-shadow 0.15s, transform 0.12s;
    `;

    const p1Province = getPlayerProvince(match.player1);
    const p2Province = getPlayerProvince(match.player2);
    const boardLabel = isBoard1
      ? `<span style="display:inline-flex;align-items:center;gap:0.3em;background:${available ? 'var(--orange)' : '#3a1800'};color:${available ? '#000' : '#8a4a00'};font-family:var(--font-display);font-size:0.68em;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;padding:0.2em 0.65em;border-radius:20px;">● Board 1 LIVE</span>`
      : `<span style="display:inline-flex;align-items:center;background:#1a1a1a;color:var(--text-muted);font-family:var(--font-display);font-size:0.68em;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:0.2em 0.65em;border-radius:20px;border:1px solid #2a2a2a;">Board 2</span>`;

    let rightSide = '';
    if (done) {
      const wName = match.winner || '';
      rightSide = `
        <div style="display:flex;flex-direction:column;align-items:flex-end;justify-content:center;padding:0.7em 0.9em;min-width:70px;gap:0.1em;">
          <div style="font-family:var(--font-display);font-size:1.4em;font-weight:900;color:#4caf50;line-height:1;">${match.score1}–${match.score2}</div>
          <div style="font-family:var(--font-display);font-size:0.62em;color:#4caf50;letter-spacing:0.05em;text-transform:uppercase;text-align:right;">${wName.split(' ').pop()}</div>
          <div style="font-family:var(--font-display);font-size:0.6em;color:var(--text-muted);letter-spacing:0.06em;text-transform:uppercase;margin-top:0.15em;">✎ Edit</div>
        </div>`;
    } else if (available) {
      rightSide = `
        <div style="display:flex;align-items:center;justify-content:center;padding:0.7em 0.9em;min-width:56px;">
          <div style="font-family:var(--font-display);font-weight:900;color:var(--orange);font-size:1.5em;line-height:1;">›</div>
        </div>`;
    } else {
      rightSide = `
        <div style="display:flex;align-items:center;justify-content:center;padding:0.7em 0.9em;min-width:48px;">
          <div style="color:#333;font-size:1em;">🔒</div>
        </div>`;
    }

    item.innerHTML = `
      <div style="flex:1;padding:0.7em 0.9em;">
        <div style="display:flex;align-items:center;gap:0.55em;margin-bottom:0.3em;">
          <span style="font-family:var(--font-display);font-size:0.72em;font-weight:700;color:${available && isBoard1 ? 'var(--orange)' : 'var(--text-muted)'};letter-spacing:0.08em;text-transform:uppercase;">M${match.matchNum}</span>
          <span style="font-size:0.68em;color:var(--text-muted);">${match.time || ''}</span>
          ${boardLabel}
        </div>
        <div style="font-family:var(--font-display);font-size:0.98em;font-weight:700;color:${done ? '#666' : available ? 'var(--white)' : '#555'};letter-spacing:0.02em;">
          ${match.player1}${p1Province ? `<span style="font-size:0.72em;color:${available ? 'var(--orange)' : '#555'};margin-left:0.3em;">${p1Province}</span>` : ''}
          <span style="color:var(--text-muted);font-size:0.8em;margin:0 0.3em;">vs</span>
          ${match.player2}${p2Province ? `<span style="font-size:0.72em;color:${available ? 'var(--orange)' : '#555'};margin-left:0.3em;">${p2Province}</span>` : ''}
        </div>
      </div>
      ${rightSide}
    `;

    if (available || done) {
      item.addEventListener("pointerdown", () => { item.style.transform = "scale(0.98)"; item.style.boxShadow = done ? "0 0 0 2px rgba(76,175,80,0.35)" : "0 0 0 2px rgba(242,101,34,0.4)"; });
      item.addEventListener("pointerup",   () => { item.style.transform = ""; item.style.boxShadow = ""; });
      item.addEventListener("pointerleave",() => { item.style.transform = ""; item.style.boxShadow = ""; });
      item.onclick = () => {
        appState.roundRobin.currentMatchIndex = idx;
        if (done && match.board === 1) {
          // Edit mode: restore legs, un-complete match
          const originalLegs = JSON.parse(JSON.stringify(match.legs || []));
          appState.roundRobin.completedMatches = appState.roundRobin.completedMatches
            .filter(m => !(m.matchNum === match.matchNum && m.board === match.board));
          match.completed = false;
          match.winner = null;
          match.score1 = 0;
          match.score2 = 0;
          match.legs = [];
          appState.roundRobin.currentMatchState = {
            player1: match.player1, player2: match.player2,
            score1: 0, score2: 0, currentLeg: 1, legs: [],
            editMode: true, originalLegs
          };
          appState.screen = "roundRobinMatch";
        } else if (done && match.board === 2) {
          // Edit mode for board 2 — pre-fill handled in renderBoard2Entry
          appState.roundRobin.currentMatchState = null;
          appState.screen = "board2Entry";
        } else {
          appState.roundRobin.currentMatchState = null;
          appState.screen = match.board === 1 ? "roundRobinMatch" : "board2Entry";
        }
        render();
      };
    }

    return item;
  }

  // Render upcoming matches section (if any)
  if (upcomingMatches.length > 0) {
    const upcomingHeader = document.createElement("div");
    upcomingHeader.style.cssText = `
      font-family:var(--font-display);
      font-size:0.78em;
      letter-spacing:0.12em;
      color:var(--orange);
      text-transform:uppercase;
      margin-bottom:0.6em;
      padding-bottom:0.4em;
      border-bottom:1px solid var(--divider);
    `;
    upcomingHeader.textContent = "Upcoming Matches";
    listEl.appendChild(upcomingHeader);
    
    upcomingMatches.forEach(matchObj => {
      listEl.appendChild(renderMatchCard(matchObj));
    });
  }

  // Render completed matches section (if any)
  if (completedMatches.length > 0) {
    const completedHeader = document.createElement("div");
    completedHeader.style.cssText = `
      font-family:var(--font-display);
      font-size:0.78em;
      letter-spacing:0.12em;
      color:var(--text-muted);
      text-transform:uppercase;
      margin:${upcomingMatches.length > 0 ? '1.2em' : '0'} 0 0.6em;
      padding-bottom:0.4em;
      border-bottom:1px solid var(--divider);
    `;
    completedHeader.textContent = "Completed Matches";
    listEl.appendChild(completedHeader);
    
    completedMatches.forEach(matchObj => {
      listEl.appendChild(renderMatchCard(matchObj));
    });
  }

  // TV Sync button
  div.querySelector("#syncBtn").onclick = () => {
    const currentToken = GitHubSync.token || '';
    const msg = currentToken 
      ? `TV Sync is ${GitHubSync.hasToken() ? 'ACTIVE' : 'INACTIVE'}.\n\nGitHub Token: ${currentToken.substring(0,8)}...\n\nTo update or disable, enter a new token below (or leave blank to disable):`
      : `TV Sync enables live updates on your TV displays and OBS overlays.\n\nYou need a GitHub Personal Access Token:\n1. Go to github.com → Settings → Developer settings\n2. Personal access tokens → Tokens (classic)\n3. Generate new token\n4. Check 'repo' permission\n5. Copy the token and paste it below:`;
    
    const token = prompt(msg, currentToken);
    if (token === null) return; // cancelled
    if (token.trim() === '') {
      GitHubSync.setToken('');
      alert('TV Sync disabled.');
    } else {
      GitHubSync.setToken(token.trim());
      // Immediate sync
      const eventData = GitHubSync.buildEventData(appState);
      GitHubSync.pushEventData(eventData)
        .then(() => alert('✓ TV Sync enabled! Your displays will update automatically.'))
        .catch(err => alert('Sync failed. Check your token and try again.\n\nError: ' + err.message));
    }
    render();
  };

  // Reset button
  div.querySelector("#resetBtn").onclick = () => {
    if (confirm("Reset Event 4? All progress will be cleared.")) {
      localStorage.removeItem("dartsRoundRobinState");
      loadPresetEvent("event4");
      render();
    }
  };
  if (allDone) {
    div.querySelector("#knockoutBtn").onclick = () => {
      appState.screen = "knockoutStandings";
      render();
    };
  }

  div.querySelector("#qlBtn").onclick = () => {
    appState._prevScreen = "matchList";
    appState.screen = "questionLibrary";
    render();
  };

  bindHelpButtons(div);
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
  const progressPct = Math.round(((idx + 1) / total) * 100);
  const isLast = idx === total - 1;
  const isFirst = idx === 0;

  const legNotes = appState.interview.legNotes || [];
  const subject = appState.interview.subject || null;

  const subjectHTML = subject ? `
    <div class="interview-subject-card">
      <div class="interview-subject-top">
        <div class="interview-subject-name-block">
          <div class="interview-subject-name">${subject.name}</div>
          ${subject.province ? `<div class="interview-subject-province">${subject.province}</div>` : ''}
        </div>
        <div class="interview-subject-result">
          <div class="interview-subject-score">${subject.winnerScore} &ndash; ${subject.loserScore}</div>
          <div class="interview-subject-vs">def. ${subject.opponent}</div>
        </div>
      </div>
      <div class="interview-subject-stats">
        <div class="interview-subject-stat"><span class="stat-val">${subject.wins}W</span><span class="stat-lbl">${subject.losses}L</span></div>
        <div class="interview-subject-stat-divider"></div>
        <div class="interview-subject-stat"><span class="stat-val">#${subject.rank}</span><span class="stat-lbl">of ${subject.totalPlayers}</span></div>
        <div class="interview-subject-stat-divider"></div>
        <div class="interview-subject-stat"><span class="stat-val">M${subject.matchNum}</span><span class="stat-lbl">Match</span></div>
      </div>
    </div>` : '';

  const notesHTML = legNotes.length > 0 ? `
    <div class="leg-notes-panel">
      <div class="leg-notes-header">Match Notes</div>
      ${legNotes.map(n => `
        <div class="leg-note-item">
          <span class="leg-note-leg">Leg ${n.legNumber}</span>
          <span class="leg-note-text">${n.note}</span>
        </div>`).join('')}
    </div>` : '';

  div.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5em;">
      <div style="font-family:var(--font-display);font-size:0.72em;letter-spacing:0.15em;color:var(--text-muted);text-transform:uppercase;display:flex;align-items:center;gap:0.4em;">Interview <button class="help-btn" data-help-title="Interview Guide" data-help-body="Read each question to the player. The card at the top shows their result and current standing.&lt;br&gt;&lt;br&gt;Match notes below serve as talking points. Tap &lt;b&gt;Next Question&lt;/b&gt; to advance, &lt;b&gt;Prev&lt;/b&gt; to go back, or &lt;b&gt;End Interview&lt;/b&gt; to return to the match list.">?</button></div>
      <div style="font-family:var(--font-display);font-size:0.75em;color:var(--text-muted);">${idx + 1} / ${total}</div>
    </div>
    <div class="interview-progress-bar-wrap">
      <div class="interview-progress-bar-fill" style="width:${progressPct}%"></div>
    </div>
    ${subjectHTML}
    ${notesHTML}
    <div class="interview-question">${q}</div>
    <div class="sticky-bottom">
      <button id="nextQBtn" class="button">${isLast ? "✓ Finish Interview" : "Next Question →"}</button>
      <div style="display:flex;gap:0.7em;margin-top:0.5em;">
        <button id="prevQBtn" class="button btn-secondary" style="flex:1;${isFirst ? 'opacity:0.35;pointer-events:none;' : ''}">← Prev</button>
        <button id="endBtn" class="button btn-accent" style="flex:2;">End Interview</button>
      </div>
    </div>
  `;

  // Helper: navigate away from interview back to match list
  function leaveInterview() {
    if (appState.roundRobin && appState.roundRobin.matches && appState.roundRobin.matches.length > 0) {
      appState.screen = "matchList";
    } else {
      resetState();
      appState.screen = "mainMenu";
    }
    render();
  }

  div.querySelector("#nextQBtn").onclick = () => {
    if (isLast) {
      leaveInterview();
    } else {
      appState.interview.currentQuestionIndex++;
      render();
    }
  };

  // Previous question — go back one
  div.querySelector("#prevQBtn").onclick = () => {
    if (!isFirst) {
      appState.interview.currentQuestionIndex--;
      render();
    }
  };

  // End early
  div.querySelector("#endBtn").onclick = () => {
    leaveInterview();
  };

  bindHelpButtons(div);
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
    <h2>Round Robin Event Setup</h2>
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
      <label style="display:block;margin-bottom:0.75em;font-weight:bold;">Load Preset Event</label>
      <div style="display:flex;gap:0.5em;flex-wrap:wrap;margin-bottom:1em;">
        <button class="button preset-btn" data-event="event4" style="padding:0.5em 1.2em;">Event 4</button>
      </div>
      <label style="display:block;margin-bottom:0.5em;font-weight:bold;border-top:1px solid #444;padding-top:0.75em;">Or Upload JSON (future events)</label>
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
  
  // Initialize playerProfiles if undefined
  if (!appState.roundRobin.playerProfiles) {
    appState.roundRobin.playerProfiles = {};
  }
  
  // Render Group A fields
  appState.roundRobin.groupA.forEach((name, i) => {
    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.gap = "0.5em";
    wrapper.style.marginBottom = "0.5em";
    
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.value = name;
    nameInput.placeholder = `Group A Player ${i+1}`;
    nameInput.style.flex = "2";
    nameInput.oninput = (e) => {
      const oldName = appState.roundRobin.groupA[i];
      const newName = e.target.value;
      appState.roundRobin.groupA[i] = newName;
      
      // Update profile key if name changed
      if (oldName && appState.roundRobin.playerProfiles[oldName]) {
        appState.roundRobin.playerProfiles[newName] = appState.roundRobin.playerProfiles[oldName];
        delete appState.roundRobin.playerProfiles[oldName];
      }
      
      generateMatchSchedule();
    };
    
    const provinceInput = document.createElement("input");
    provinceInput.type = "text";
    provinceInput.value = appState.roundRobin.playerProfiles?.[name]?.province || "";
    provinceInput.placeholder = "Province";
    provinceInput.style.flex = "1";
    provinceInput.oninput = (e) => {
      const playerName = appState.roundRobin.groupA[i];
      if (playerName) {
        if (!appState.roundRobin.playerProfiles[playerName]) {
          appState.roundRobin.playerProfiles[playerName] = {};
        }
        appState.roundRobin.playerProfiles[playerName].province = e.target.value;
      }
    };
    
    wrapper.appendChild(nameInput);
    wrapper.appendChild(provinceInput);
    groupADiv.appendChild(wrapper);
  });
  
  // Render Group B fields
  appState.roundRobin.groupB.forEach((name, i) => {
    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.gap = "0.5em";
    wrapper.style.marginBottom = "0.5em";
    
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.value = name;
    nameInput.placeholder = `Group B Player ${i+1}`;
    nameInput.style.flex = "2";
    nameInput.oninput = (e) => {
      const oldName = appState.roundRobin.groupB[i];
      const newName = e.target.value;
      appState.roundRobin.groupB[i] = newName;
      
      // Update profile key if name changed
      if (oldName && appState.roundRobin.playerProfiles[oldName]) {
        appState.roundRobin.playerProfiles[newName] = appState.roundRobin.playerProfiles[oldName];
        delete appState.roundRobin.playerProfiles[oldName];
      }
      
      generateMatchSchedule();
    };
    
    const provinceInput = document.createElement("input");
    provinceInput.type = "text";
    provinceInput.value = appState.roundRobin.playerProfiles?.[name]?.province || "";
    provinceInput.placeholder = "Province";
    provinceInput.style.flex = "1";
    provinceInput.oninput = (e) => {
      const playerName = appState.roundRobin.groupB[i];
      if (playerName) {
        if (!appState.roundRobin.playerProfiles[playerName]) {
          appState.roundRobin.playerProfiles[playerName] = {};
        }
        appState.roundRobin.playerProfiles[playerName].province = e.target.value;
      }
    };
    
    wrapper.appendChild(nameInput);
    wrapper.appendChild(provinceInput);
    groupBDiv.appendChild(wrapper);
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
  
  // Preset Event Buttons
  div.querySelectorAll(".preset-btn").forEach(btn => {
    btn.onclick = () => {
      const eventKey = btn.dataset.event;
      if (confirm(`Load ${presetEvents[eventKey].label}? This will replace any current setup.`)) {
        loadPresetEvent(eventKey);
        // Re-render the full setup screen with loaded data
        appState.screen = "roundRobinSetup";
        render();
      }
    };
  });

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
        
        // Reset player profiles
        appState.roundRobin.playerProfiles = {};
        
        // Populate groups - support both formats (strings or objects with name/province)
        appState.roundRobin.groupA = data.groupA.map(player => {
          if (typeof player === 'string') {
            return player;
          } else if (player.name) {
            // New format with province data
            if (player.province) {
              appState.roundRobin.playerProfiles[player.name] = { province: player.province };
            }
            return player.name;
          }
          return "";
        });
        
        appState.roundRobin.groupB = data.groupB.map(player => {
          if (typeof player === 'string') {
            return player;
          } else if (player.name) {
            // New format with province data
            if (player.province) {
              appState.roundRobin.playerProfiles[player.name] = { province: player.province };
            }
            return player.name;
          }
          return "";
        });
        
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
        
        // Re-render inputs and schedule with province fields
        groupADiv.innerHTML = "";
        groupBDiv.innerHTML = "";
        
        appState.roundRobin.groupA.forEach((name, i) => {
          const wrapper = document.createElement("div");
          wrapper.style.display = "flex";
          wrapper.style.gap = "0.5em";
          wrapper.style.marginBottom = "0.5em";
          
          const nameInput = document.createElement("input");
          nameInput.type = "text";
          nameInput.value = name;
          nameInput.placeholder = `Group A Player ${i+1}`;
          nameInput.style.flex = "2";
          nameInput.oninput = (e) => {
            const oldName = appState.roundRobin.groupA[i];
            const newName = e.target.value;
            appState.roundRobin.groupA[i] = newName;
            
            // Update profile key if name changed
            if (oldName && appState.roundRobin.playerProfiles[oldName]) {
              appState.roundRobin.playerProfiles[newName] = appState.roundRobin.playerProfiles[oldName];
              delete appState.roundRobin.playerProfiles[oldName];
            }
            
            generateMatchSchedule();
          };
          
          const provinceInput = document.createElement("input");
          provinceInput.type = "text";
          provinceInput.value = appState.roundRobin.playerProfiles?.[name]?.province || "";
          provinceInput.placeholder = "Province";
          provinceInput.style.flex = "1";
          provinceInput.oninput = (e) => {
            const playerName = appState.roundRobin.groupA[i];
            if (playerName) {
              if (!appState.roundRobin.playerProfiles[playerName]) {
                appState.roundRobin.playerProfiles[playerName] = {};
              }
              appState.roundRobin.playerProfiles[playerName].province = e.target.value;
            }
          };
          
          wrapper.appendChild(nameInput);
          wrapper.appendChild(provinceInput);
          groupADiv.appendChild(wrapper);
        });
        
        appState.roundRobin.groupB.forEach((name, i) => {
          const wrapper = document.createElement("div");
          wrapper.style.display = "flex";
          wrapper.style.gap = "0.5em";
          wrapper.style.marginBottom = "0.5em";
          
          const nameInput = document.createElement("input");
          nameInput.type = "text";
          nameInput.value = name;
          nameInput.placeholder = `Group B Player ${i+1}`;
          nameInput.style.flex = "2";
          nameInput.oninput = (e) => {
            const oldName = appState.roundRobin.groupB[i];
            const newName = e.target.value;
            appState.roundRobin.groupB[i] = newName;
            
            // Update profile key if name changed
            if (oldName && appState.roundRobin.playerProfiles[oldName]) {
              appState.roundRobin.playerProfiles[newName] = appState.roundRobin.playerProfiles[oldName];
              delete appState.roundRobin.playerProfiles[oldName];
            }
            
            generateMatchSchedule();
          };
          
          const provinceInput = document.createElement("input");
          provinceInput.type = "text";
          provinceInput.value = appState.roundRobin.playerProfiles?.[name]?.province || "";
          provinceInput.placeholder = "Province";
          provinceInput.style.flex = "1";
          provinceInput.oninput = (e) => {
            const playerName = appState.roundRobin.groupB[i];
            if (playerName) {
              if (!appState.roundRobin.playerProfiles[playerName]) {
                appState.roundRobin.playerProfiles[playerName] = {};
              }
              appState.roundRobin.playerProfiles[playerName].province = e.target.value;
            }
          };
          
          wrapper.appendChild(nameInput);
          wrapper.appendChild(provinceInput);
          groupBDiv.appendChild(wrapper);
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
      matchDiv.className = "match-item";
      const isCompleted = match.completed;
      
      if (isCompleted) {
        matchDiv.style.background = "rgba(0,255,100,0.1)";
        matchDiv.style.opacity = "0.7";
      }
      
      const timeDisplay = match.time ? `<span style="color:var(--text-muted);margin:0 0.3em;">•</span><span style="color:var(--text-muted);font-size:0.9em;">${match.time}</span>` : '';
      const completedBadge = isCompleted ? `<span style="color:#0f0;margin-right:0.3em;">✓</span>` : '';
      const scoreDisplay = isCompleted && match.score1 !== undefined ? `<span style="color:var(--text-muted);margin:0 0.3em;">${match.score1}-${match.score2}</span>` : '';
      
      matchDiv.innerHTML = `
        <div class="match-item-content">
          ${completedBadge}
          <span style="color:var(--accent);font-weight:bold;">M${match.matchNum}</span>
          <span style="color:var(--text-muted);margin:0 0.2em;">•</span>
          <span>${match.player1} vs ${match.player2}</span>
          ${scoreDisplay}
          ${timeDisplay}
        </div>
        <span class="match-item-board" style="color:${match.board === 1 ? 'var(--accent)' : 'var(--text-muted)'};">B${match.board}</span>
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
  
  const state = appState.roundRobin.currentMatchState;
  const format = appState.roundRobin.format;
  
  // State for this leg
  let selectedWinner = null;
  let legConfirmed = false;
  let currentLeg = {
    winner: null,
    moments: [],
    momentValues: {},
    legNumber: state.currentLeg,
    note: ""
  };
  
  const p1Province = getPlayerProvince(currentMatch.player1);
  const p2Province = getPlayerProvince(currentMatch.player2);
  const p1Rec = getPlayerTournamentRecord(currentMatch.player1);
  const p2Rec = getPlayerTournamentRecord(currentMatch.player2);

  div.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.8em;">
      <div>
        <div style="font-family:var(--font-display);font-size:0.75em;letter-spacing:0.12em;color:var(--text-muted);text-transform:uppercase;">Match ${currentMatch.matchNum} · ${currentMatch.time || ''}</div>
      </div>
      <div style="display:flex;gap:0.5em;align-items:center;">
        ${state.editMode ? '<span style="background:#1a1a00;border:1px solid #888600;color:#ccc000;font-size:0.68em;padding:0.25em 0.7em;border-radius:20px;font-family:var(--font-display);letter-spacing:0.1em;text-transform:uppercase;">✎ Editing</span>' : ''}
        ${currentMatch.board === 1 ? '<span class="live-badge">LIVE – Board 1</span>' : '<span style="background:#1a1a1a;border:1px solid var(--divider);color:var(--text-muted);font-size:0.72em;padding:0.3em 0.8em;border-radius:20px;font-family:var(--font-display);letter-spacing:0.08em;text-transform:uppercase;">Board 2</span>'}
      </div>
    </div>
    <div class="broadcast-score">
      <div class="broadcast-player">
        <div class="broadcast-player-name">${currentMatch.player1}${p1Province ? `<div style="color:var(--orange);font-size:0.72em;letter-spacing:0.1em;margin-top:0.1em;">${p1Province}</div>` : ''}</div>
        <div class="broadcast-player-score ${state.score1 > state.score2 ? 'leading' : ''}" id="score1Display">${state.score1}</div>
        <div style="font-size:0.72em;color:var(--text-muted);font-family:var(--font-display);letter-spacing:0.06em;">${p1Rec.record}</div>
      </div>
      <div class="vs-badge">VS</div>
      <div class="broadcast-player">
        <div class="broadcast-player-name">${currentMatch.player2}${p2Province ? `<div style="color:var(--orange);font-size:0.72em;letter-spacing:0.1em;margin-top:0.1em;">${p2Province}</div>` : ''}</div>
        <div class="broadcast-player-score ${state.score2 > state.score1 ? 'leading' : ''}" id="score2Display">${state.score2}</div>
        <div style="font-size:0.72em;color:var(--text-muted);font-family:var(--font-display);letter-spacing:0.06em;">${p2Rec.record}</div>
      </div>
    </div>
    <div class="leg-badge">Leg ${state.currentLeg} of ${format?.totalLegs || 5}</div>
    <div class="help-label-row"><label>Leg Winner</label><button class="help-btn" data-help-title="Leg Winner" data-help-body="Tap the name of the player who won this leg. A green ring confirms your pick. You must select a winner before confirming the leg.">?</button></div>
    <div class="row">
      <button class="button winner-btn" data-winner="${currentMatch.player1}">${currentMatch.player1}</button>
      <button class="button winner-btn" data-winner="${currentMatch.player2}">${currentMatch.player2}</button>
    </div>
    <div class="help-label-row"><label>Memorable Moments</label><button class="help-btn" data-help-title="Memorable Moments" data-help-body="Select the tags that best reflect what happened in this leg — only tag what you actually saw during the match.&lt;br&gt;&lt;br&gt;For &lt;b&gt;High Scoring&lt;/b&gt;, &lt;b&gt;Big Finish&lt;/b&gt;, &lt;b&gt;High Average&lt;/b&gt;, or &lt;b&gt;Low Dart Leg&lt;/b&gt; — a value field appears next to the button. Enter the number (e.g. 180, 121 finish, 14 darts).&lt;br&gt;&lt;br&gt;These moments shape the interview questions generated after the match.">?</button></div>
    <div class="col-2" id="momentBtns"></div>
    <div style="margin-top:0.6em;margin-bottom:0.3em;">
      <div style="display:flex;align-items:center;gap:0.5em;margin-bottom:0.5em;">
        <button id="noteToggleBtn" class="button btn-secondary" style="margin:0;flex:1;">📝 Add Note for Leg ${state.currentLeg}</button>
        <button class="help-btn" data-help-title="Leg Notes" data-help-body="Add a private note about anything notable in this leg — missed doubles, key checkouts, pressure moments, crowd reaction.&lt;br&gt;&lt;br&gt;Notes appear on the interview screen to help guide your questions.">?</button>
      </div>
      <div id="noteArea" style="display:none;">
        <textarea id="legNoteInput" rows="3" placeholder="Type your notes for this leg..." style="width:100%;background:#1a1a1a;color:var(--white);border:1.5px solid var(--divider);border-radius:10px;padding:0.75em 1em;font-family:var(--font-main);font-size:0.95em;line-height:1.5;resize:vertical;box-sizing:border-box;"></textarea>
      </div>
    </div>
    <div class="sticky-bottom">
      <button id="nextLegBtn" class="button">Confirm Leg</button>
      <div style="display:flex;gap:0.6em;margin-top:0.5em;">
        <button id="undoLegBtn" class="button btn-secondary" style="flex:1;${state.legs.length === 0 ? 'opacity:0.35;pointer-events:none;' : ''}">← Last Leg</button>
        <button id="skipMatchBtn" class="button btn-secondary" style="flex:1;">Skip Match</button>
      </div>
    </div>
  `;
  
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
  
  // If edit mode: pre-select the previous leg's winner, moments, note
  if (state.editMode && state.originalLegs) {
    const prevLeg = state.originalLegs[state.currentLeg - 1];
    if (prevLeg) {
      selectedWinner = prevLeg.winner;
      currentLeg.winner = prevLeg.winner;
      currentLeg.moments = [...(prevLeg.moments || [])];
      currentLeg.momentValues = {...(prevLeg.momentValues || {})};
      currentLeg.note = prevLeg.note || "";
      div.querySelectorAll(".winner-btn").forEach(btn => {
        if (btn.dataset.winner === prevLeg.winner) btn.classList.add("selected");
      });
      // Pre-select moment buttons + restore value inputs
      div.querySelectorAll(".moment-btn").forEach(btn => {
        if (currentLeg.moments.includes(btn.dataset.key)) {
          btn.classList.add("selected");
          const inp = btn.parentElement.querySelector("input[type=text]");
          if (inp && currentLeg.momentValues[btn.dataset.key]) {
            inp.style.display = "inline-block";
            inp.value = currentLeg.momentValues[btn.dataset.key];
          }
        }
      });
      if (currentLeg.note) {
        const noteArea = div.querySelector("#noteArea");
        const noteInput = div.querySelector("#legNoteInput");
        if (noteArea) noteArea.style.display = "block";
        if (noteInput) noteInput.value = currentLeg.note;
      }
    }
  }

  // Note toggle
  div.querySelector("#noteToggleBtn").onclick = () => {
    const noteArea = div.querySelector("#noteArea");
    const open = noteArea.style.display !== "none";
    noteArea.style.display = open ? "none" : "block";
    if (!open) div.querySelector("#legNoteInput").focus();
  };
  div.querySelector("#legNoteInput").oninput = (e) => {
    currentLeg.note = e.target.value;
  };

  // Undo last leg
  div.querySelector("#undoLegBtn").onclick = () => {
    if (state.legs.length === 0) return;
    const last = state.legs.pop();
    if (last.winner === currentMatch.player1) state.score1--;
    else state.score2--;
    state.currentLeg--;
    appState.roundRobin.currentMatchState = state;
    render();
  };

  // Skip match — return to list without completing
  div.querySelector("#skipMatchBtn").onclick = () => {
    if (confirm("Skip this match? It will remain open to complete later.")) {
      appState.roundRobin.currentMatchState = null;
      appState.screen = "matchList";
      render();
    }
  };

  // Next leg button with two-step confirmation
  const nextLegBtn = div.querySelector("#nextLegBtn");
  nextLegBtn.onclick = () => {
    if (!legConfirmed) {
      // First click: Confirm the leg
      
      // Check if match is already decided (someone has enough legs to win)
      let matchAlreadyDecided = false;
      if (format.type === "bestOf") {
        const needed = Math.ceil(format.totalLegs / 2);
        if (state.score1 >= needed || state.score2 >= needed) {
          matchAlreadyDecided = true;
        }
      } else {
        if (state.score1 >= format.legsToWin || state.score2 >= format.legsToWin) {
          matchAlreadyDecided = true;
        }
      }
      
      // If match is already decided and no winner selected, skip remaining legs
      if (matchAlreadyDecided && !selectedWinner) {
        finishMatch();
        return;
      }
      
      if (!selectedWinner) {
        alert("Please select a leg winner first.");
        return;
      }
      legConfirmed = true;
      nextLegBtn.textContent = "Next Leg";
      nextLegBtn.style.background = "linear-gradient(135deg, var(--orange), var(--orange-glow))";
    } else {
      // Second click: Process the leg
      state.legs.push({
        winner: currentLeg.winner,
        moments: [...currentLeg.moments],
        momentValues: {...currentLeg.momentValues},
        legNumber: currentLeg.legNumber,
        note: currentLeg.note || ""
      });
      
      if (currentLeg.winner === currentMatch.player1) state.score1++;
      else state.score2++;
      
      checkMatchEnd();
    }
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
    
    // Go straight to interview (skip match complete screen)
    appState.roundRobin.currentMatchState = null;
    generateRoundRobinInterview(currentMatch);
    appState.screen = "interview";
    render();
  }
  
  function moveToNextMatch() {
    appState.roundRobin.currentMatchIndex++;
    appState.roundRobin.currentMatchState = null;
    appState.screen = "roundRobinMatch";
    render();
  }

  bindHelpButtons(div);
  return div;
}

// --- RENDER ROUND ROBIN MATCH COMPLETE ---
function renderRoundRobinMatchComplete() {
  const matchData = appState.roundRobin.matchCompleteData;
  const div = document.createElement("div");
  div.className = "screen";

  // Build quick standings snippet (top 3)
  const standings = getPlayerStandings();
  const top3 = standings.slice(0, 3).map((s, i) => 
    `<div style="display:flex;justify-content:space-between;padding:0.35em 0;border-bottom:1px solid var(--divider);">
      <span style="color:var(--text-muted);font-size:0.82em;font-family:var(--font-display);letter-spacing:0.03em;">${i+1}. ${s.name}${s.province ? ` <em style="color:var(--orange);font-style:normal;">(${s.province})</em>` : ''}</span>
      <span style="font-family:var(--font-display);font-weight:700;font-size:0.85em;color:${s.wins > s.losses ? '#4caf50' : 'var(--text-muted)'};">${s.record}</span>
    </div>`).join('');

  const player1Province = getPlayerProvince(matchData.player1);
  const player2Province = getPlayerProvince(matchData.player2);
  
  div.innerHTML = `
    <div class="match-complete-card">
      <div style="font-family:var(--font-display);font-size:0.8em;letter-spacing:0.12em;color:var(--text-muted);text-transform:uppercase;margin-bottom:0.5em;">Match ${matchData.matchNum} Complete</div>
      <div class="match-complete-winner">${matchData.winner}</div>
      <div class="match-complete-score">${matchData.score1} – ${matchData.score2}</div>
      <div style="color:var(--text-muted);font-size:0.82em;margin-top:0.4em;letter-spacing:0.05em;text-transform:uppercase;">
        ${matchData.player1}${player1Province ? ` · ${player1Province}` : ''} vs ${matchData.player2}${player2Province ? ` · ${player2Province}` : ''} · Board ${matchData.board}
      </div>
    </div>
    ${standings.length > 0 ? `
    <div style="background:var(--card-black);border:1px solid var(--divider);border-radius:var(--button-radius);padding:1em 1.2em;margin-bottom:var(--gap);">
      <div style="font-family:var(--font-display);font-size:0.82em;font-weight:700;color:var(--orange);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:0.6em;">Current Standings</div>
      ${top3}
    </div>` : ''}
    <div class="sticky-bottom">
      ${matchData.board === 1 ? 
        '<button id="continueToInterviewBtn" class="button">Continue to Interview</button>' :
        '<button id="nextMatchBtn" class="button">Next Match</button>'
      }
    </div>
  `;
  
  if (matchData.board === 1) {
    div.querySelector("#continueToInterviewBtn").onclick = () => {
      generateRoundRobinInterview(matchData);
      appState.screen = "interview";
      render();
    };
  } else {
    div.querySelector("#nextMatchBtn").onclick = () => {
      moveToNextMatch();
    };
  }
  
  return div;
}

// --- RENDER BOARD 2 ENTRY ---
function renderBoard2Entry() {
  const div = document.createElement("div");
  div.className = "screen";

  // The currently selected match IS the board 2 match (user tapped it from matchList)
  const currentIdx = appState.roundRobin.currentMatchIndex;
  const board2Match = appState.roundRobin.matches[currentIdx];

  if (!board2Match || board2Match.board !== 2) {
    appState.screen = "matchList";
    render();
    return div;
  }

  div.innerHTML = `
    <div class="card">
      <div style="font-family:var(--font-display);font-size:0.8em;letter-spacing:0.12em;color:var(--text-muted);text-transform:uppercase;margin-bottom:0.3em;">Board 2 · Match ${board2Match.matchNum}</div>
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:1.2em;">
        <span style="font-family:var(--font-display);font-size:1.3em;">${board2Match.player1}</span>
        <span style="color:var(--text-muted);font-size:0.8em;">vs</span>
        <span style="font-family:var(--font-display);font-size:1.3em;">${board2Match.player2}</span>
      </div>
      <div style="color:var(--text-muted);font-size:0.82em;margin-bottom:1.4em;display:flex;align-items:center;gap:0.5em;">${board2Match.time || ''} · Enter legs won by each player <button class="help-btn" data-help-title="Board 2 Score Entry" data-help-body="Enter the number of legs won by each player. Scores cannot be a tie.&lt;br&gt;&lt;br&gt;Tap &lt;b&gt;Confirm Score&lt;/b&gt; to save the result, or &lt;b&gt;Skip&lt;/b&gt; to come back and enter it later.">?</button></div>

      <div class="b2-score-row">
        <span class="b2-player-label">${board2Match.player1}</span>
        <input class="b2-score-num" type="number" id="score1" min="0" max="5" value="${board2Match.completed ? board2Match.score1 : 0}" inputmode="numeric">
      </div>
      <div class="b2-score-row">
        <span class="b2-player-label">${board2Match.player2}</span>
        <input class="b2-score-num" type="number" id="score2" min="0" max="5" value="${board2Match.completed ? board2Match.score2 : 0}" inputmode="numeric">
      </div>
    </div>

    <div class="sticky-bottom">
      <button id="confirmScoreBtn" class="button">Confirm Score</button>
      <button id="skipBtn" class="button btn-secondary">Skip (Enter Later)</button>
    </div>
  `;

  // Clear on focus so typing replaces the value; restore 0 if left empty
  ["#score1", "#score2"].forEach(id => {
    const el = div.querySelector(id);
    el.addEventListener("focus", () => { el.value = ""; });
    el.addEventListener("blur",  () => { if (el.value === "" || isNaN(parseInt(el.value))) el.value = "0"; });
  });

  div.querySelector("#confirmScoreBtn").onclick = () => {
    const score1 = parseInt(div.querySelector("#score1").value);
    const score2 = parseInt(div.querySelector("#score2").value);

    if (score1 === score2) {
      alert("Scores cannot be tied. Please enter the correct final score.");
      return;
    }
    if (score1 < 0 || score2 < 0) {
      alert("Scores must be 0 or greater.");
      return;
    }

    board2Match.completed = true;
    board2Match.score1 = score1;
    board2Match.score2 = score2;
    board2Match.winner = score1 > score2 ? board2Match.player1 : board2Match.player2;
    board2Match.legs = [];

    appState.roundRobin.completedMatches = appState.roundRobin.completedMatches
      .filter(m => !(m.matchNum === board2Match.matchNum && m.board === board2Match.board));
    appState.roundRobin.completedMatches.push({...board2Match});
    saveRoundRobinState();

    appState.screen = "matchList";
    render();
  };

  div.querySelector("#skipBtn").onclick = () => {
    appState.screen = "matchList";
    render();
  };

  bindHelpButtons(div);
  return div;
}


// --- QUESTION LIBRARY SCREEN ---
function renderQuestionLibrary() {
  const div = document.createElement("div");
  div.className = "screen";

  const categoryLabels = {
    highScoring:   "High Scoring",
    bigFinish:     "Big Finish",
    highAverage:   "High Average",
    lowDartLeg:    "Quick Leg",
    comeback:      "Comeback",
    matchDart:     "Match Dart",
    doublesBattle: "Doubles Battle",
    upset:         "Upset",
    mentalStrength:"Mental Strength",
    turningPoint:  "Turning Point",
    general:       "General",
    roundRobin:    "Round Robin / Context"
  };

  // Dummy data so all template functions evaluate to readable strings
  const d = {
    playerName:"[Player]", opponent:"[Opponent]", matchScore:"3-1",
    matchNumber:5, board:1, legNumber:3,
    highScoring:"180", bigFinish:"121", highAverage:"95.4", lowDartLeg:"9",
    tournamentRecord:"2-1", tournamentWins:2, tournamentLosses:1,
    playerProvince:"NS", opponentProvince:"NB",
    nextOpponent:"[Next Opponent]", nextBoard:1, nextMatchNum:7, nextMatchTime:"10:15 AM",
    nextOpponentRecord:"1-2", nextOpponentWins:1, nextOpponentProvince:"PE",
    nextBoard1Opponent:"[Next Opponent]", nextBoard1Province:"PE", nextBoard1Time:"10:15 AM",
    isLastMatch:true, alreadyPlayedCount:2,
    alreadyPlayed:[{name:"Player A"},{name:"Player B"}],
    remainingMatchCount:1, playerRank:2, totalPlayers:10,
    isWhitewash:true, isDecider:true, isComeback:true,
    isSurrender:true, isNailBiter:true, hadLeadChanges:true,
    winnerLegs:3, loserLegs:2
  };

  // Build sorted category list
  const sortedCats = Object.keys(questionBank)
    .sort((a, b) => (categoryLabels[a] || a).localeCompare(categoryLabels[b] || b));

  let sectionsHTML = "";
  sortedCats.forEach(cat => {
    const label = categoryLabels[cat] || cat;
    const qs = questionBank[cat]
      .map(fn => typeof fn === "function" ? fn(d) : fn)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
    if (!qs.length) return;
    sectionsHTML += `
      <div class="ql-category">
        <div class="ql-category-label">${label}</div>
        ${qs.map(q => `<div class="ql-question">${q}</div>`).join("")}
      </div>`;
  });

  div.innerHTML = `
    <div style="display:flex;align-items:center;gap:0.75em;margin-bottom:1em;">
      <button id="qlBackBtn" class="button btn-secondary" style="width:auto;padding:0.4em 1em;margin:0;font-size:0.85em;">← Back</button>
      <div>
        <div style="font-family:var(--font-display);font-size:0.72em;letter-spacing:0.15em;color:var(--text-muted);text-transform:uppercase;">Reference</div>
        <div style="font-family:var(--font-display);font-size:1.1em;font-weight:700;">Question Library</div>
      </div>
    </div>
    ${sectionsHTML}
  `;

  div.querySelector("#qlBackBtn").onclick = () => {
    appState.screen = appState._prevScreen || "matchList";
    render();
  };

  return div;
}

// --- KNOCKOUT STANDINGS SCREEN ---
function renderKnockoutStandings() {
  const div = document.createElement("div");
  div.className = "screen";
  const groupA = appState.roundRobin.groupA || [];
  const groupB = appState.roundRobin.groupB || [];
  const sA = getGroupStandingsByLegs(groupA);
  const sB = getGroupStandingsByLegs(groupB);

  function rowHTML(p, i) {
    const q = i < 4;
    return `
      <div class="ko-stand-row ${q ? 'ko-qualifies' : ''}">
        <span class="ko-rank">${i+1}</span>
        <div class="ko-player-cell">
          <div class="ko-player-name">${p.name}${q ? '<span class="ko-qual-badge">Q</span>' : ''}</div>
          ${p.province ? `<div class="ko-prov">${p.province}</div>` : ''}
        </div>
        <span class="ko-stat-muted">${p.matchWins+p.matchLosses}</span>
        <span class="ko-stat-green">${p.matchWins}</span>
        <span class="ko-legs">${p.legsWon}</span>
      </div>`;
  }

  function groupTableHTML(standings, label) {
    return `
      <div class="ko-group-block">
        <div class="ko-group-label">Group ${label}</div>
        <div class="ko-stand-table">
          <div class="ko-stand-header">
            <span class="ko-rank"></span>
            <span style="font-family:var(--font-display);font-size:0.7em;color:var(--text-muted);text-transform:uppercase;">Player</span>
            <span class="ko-stat-muted" style="font-size:0.7em;text-transform:uppercase;">P</span>
            <span class="ko-stat-muted" style="font-size:0.7em;text-transform:uppercase;">MW</span>
            <span class="ko-legs" style="font-size:0.7em;color:var(--orange);text-transform:uppercase;">Legs</span>
          </div>
          ${standings.map((p,i) => rowHTML(p,i)).join('')}
        </div>
      </div>`;
  }

  const ko = appState.roundRobin.knockout;
  div.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1em;">
      <button id="backBtn" style="background:transparent;border:none;color:var(--text-muted);font-size:1em;padding:0;width:auto;box-shadow:none;margin:0;font-family:var(--font-display);letter-spacing:0.04em;">← Back</button>
      <div style="font-family:var(--font-display);font-size:0.72em;letter-spacing:0.18em;color:var(--text-muted);text-transform:uppercase;">Knockout Seeding</div>
    </div>
    <h2 style="margin:0 0 0.2em;font-size:1.35em;">Group Standings</h2>
    <div style="font-size:0.82em;color:var(--text-muted);margin-bottom:1.2em;">Ranked by legs won. Top 4 from each group qualify.</div>
    ${groupTableHTML(sA,'A')}
    ${groupTableHTML(sB,'B')}
    <div class="sticky-bottom">
      <button id="genBracketBtn" class="button" style="background:linear-gradient(135deg,#b8860b,#d4a017);color:#000;">${ko && ko.generated ? '🏆 View Knockout Bracket →' : '🏆 Generate Knockout Bracket →'}</button>
    </div>
  `;
  div.querySelector("#backBtn").onclick = () => { appState.screen = "matchList"; render(); };
  div.querySelector("#genBracketBtn").onclick = () => {
    if (!ko || !ko.generated) generateKnockoutBracket();
    appState.screen = "knockoutBracket";
    render();
  };
  return div;
}

// --- KNOCKOUT BRACKET SCREEN ---
function renderKnockoutBracket() {
  const div = document.createElement("div");
  div.className = "screen";
  const ko = appState.roundRobin.knockout;
  if (!ko || !ko.generated) { appState.screen = "knockoutStandings"; render(); return div; }
  autoFillKnockoutPlayers();
  const bracket = ko.bracket;

  function matchCard(m) {
    const done = m.completed;
    const canPlay = !done && m.player1 && m.player2;
    const pending = !done && (!m.player1 || !m.player2);
    const p1 = m.player1 || m.seedLabel?.split(' vs ')[0] || '?';
    const p2 = m.player2 || m.seedLabel?.split(' vs ')[1] || '?';
    const prov1 = m.player1 ? getPlayerProvince(m.player1) : '';
    const prov2 = m.player2 ? getPlayerProvince(m.player2) : '';
    const fmtLabel = m.format.setsToWin === 3 ? 'BO5 Sets' : 'BO3 Sets';
    return `
      <div class="ko-match-card ${done?'ko-done':canPlay?'ko-available':'ko-pending'}" data-id="${m.id}">
        <div class="ko-match-label">${m.label} <span class="ko-seed-label">${m.seedLabel}</span> <span class="ko-format-label">${fmtLabel}</span></div>
        <div class="ko-match-player ${done && m.winner===m.player1?'ko-winner':''}">
          <span class="ko-match-name">${p1}${prov1?`<span class="ko-match-prov">${prov1}</span>`:''}</span>
          ${done?`<span class="ko-match-score ${m.winner===m.player1?'ko-score-w':'ko-score-l'}">${m.score1}</span>`:''}
        </div>
        <div class="ko-match-player ${done && m.winner===m.player2?'ko-winner':''}">
          <span class="ko-match-name">${p2}${prov2?`<span class="ko-match-prov">${prov2}</span>`:''}</span>
          ${done?`<span class="ko-match-score ${m.winner===m.player2?'ko-score-w':'ko-score-l'}">${m.score2}</span>`:''}
        </div>
        ${pending?`<div class="ko-match-pending">Awaiting results</div>`:''}
        ${canPlay?`<div class="ko-match-tap">Tap to score →</div>`:''}
        ${done?`<div class="ko-match-tap ko-match-tap-edit">✎ Edit result</div>`:''}
      </div>`;
  }

  function roundSection(title, ids) {
    return `<div class="ko-round-section">
      <div class="ko-round-label">${title}</div>
      <div>${ids.map(id => matchCard(bracket.find(m=>m.id===id))).join('')}</div>
    </div>`;
  }

  div.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1em;">
      <button id="backBtn" style="background:transparent;border:none;color:var(--text-muted);font-size:1em;padding:0;width:auto;box-shadow:none;margin:0;font-family:var(--font-display);letter-spacing:0.04em;">← Back</button>
      <div style="font-family:var(--font-display);font-size:0.72em;letter-spacing:0.18em;color:var(--text-muted);text-transform:uppercase;">Knockout Stage</div>
    </div>
    <h2 style="margin:0 0 0.2em;font-size:1.35em;">🏆 Knockout Bracket</h2>
    <div style="font-size:0.82em;color:var(--text-muted);margin-bottom:1.2em;">Tap an available match to score it live, leg by leg.</div>
    ${roundSection('Quarter Finals',['qf1','qf2','qf3','qf4'])}
    ${roundSection('Semi Finals',['sf1','sf2'])}
    ${roundSection('Final',['final'])}
  `;

  div.querySelector("#backBtn").onclick = () => { appState.screen = "knockoutStandings"; render(); };

  div.querySelectorAll(".ko-match-card").forEach(card => {
    const id = card.dataset.id;
    const match = bracket.find(m => m.id === id);
    if (!match) return;
    const canPlay = !match.completed && match.player1 && match.player2;
    const done = match.completed;
    if (!canPlay && !done) return;
    card.style.cursor = "pointer";
    card.addEventListener("pointerdown", () => card.style.transform = "scale(0.98)");
    card.addEventListener("pointerup",   () => card.style.transform = "");
    card.addEventListener("pointerleave",() => card.style.transform = "");
    card.onclick = () => {
      if (done) {
        // Edit: restore and re-enter
        match.completed = false; match.winner = null; match.legs = [];
        match.score1 = 0; match.score2 = 0;
        ko.currentMatchId = id;
        ko.currentMatchState = { score1:0, score2:0, currentSet:1, currentLeg:1, legScores:{player1:0,player2:0}, legs:[], editMode:false, originalLegs:null };
      } else {
        ko.currentMatchId = id;
        ko.currentMatchState = { score1:0, score2:0, currentSet:1, currentLeg:1, legScores:{player1:0,player2:0}, legs:[], editMode:false, originalLegs:null };
      }
      saveRoundRobinState();
      appState.screen = "knockoutMatch";
      render();
    };
  });

  return div;
}

// --- KNOCKOUT MATCH SCREEN (SET PLAY) ---
function renderKnockoutMatch() {
  const div = document.createElement("div");
  div.className = "screen";
  const ko = appState.roundRobin.knockout;
  if (!ko || !ko.currentMatchId) { appState.screen = "knockoutBracket"; render(); return div; }
  const match = ko.bracket.find(m => m.id === ko.currentMatchId);
  if (!match) { appState.screen = "knockoutBracket"; render(); return div; }

  const state = ko.currentMatchState;
  const format = match.format;
  const p1 = match.player1, p2 = match.player2;
  const p1Province = getPlayerProvince(p1), p2Province = getPlayerProvince(p2);
  const roundLabels = { qf:'Quarter Final', sf:'Semi Final', final:'Final' };
  const fmtLabel = `Best of ${format.setsToWin*2-1} Sets · Best of ${format.legsPerSet} Legs per Set`;

  let selectedWinner = null;
  let currentLeg = { winner:null, moments:[], momentValues:{}, legNumber: state.legs.length+1, setNumber: state.currentSet, note:"" };

  const legsInSetDisplay = `${state.legScores.player1}–${state.legScores.player2}`;
  const setScoreDisplay  = `${state.score1}–${state.score2}`;

  div.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.8em;">
      <div>
        <div style="font-family:var(--font-display);font-size:0.75em;letter-spacing:0.12em;color:var(--orange);text-transform:uppercase;">${roundLabels[match.round]||'Knockout'} · ${match.label}</div>
        <div style="font-size:0.7em;color:var(--text-muted);margin-top:0.1em;">${fmtLabel}</div>
      </div>
      <span class="live-badge">LIVE</span>
    </div>
    <div class="broadcast-score">
      <div class="broadcast-player">
        <div class="broadcast-player-name">${p1}${p1Province?`<div style="color:var(--orange);font-size:0.72em;letter-spacing:0.1em;margin-top:0.1em;">${p1Province}</div>`:''}</div>
        <div class="broadcast-player-score ${state.score1>state.score2?'leading':''}">${state.score1}</div>
        <div style="font-size:0.7em;color:var(--text-muted);font-family:var(--font-display);">Sets</div>
      </div>
      <div class="vs-badge">VS</div>
      <div class="broadcast-player">
        <div class="broadcast-player-name">${p2}${p2Province?`<div style="color:var(--orange);font-size:0.72em;letter-spacing:0.1em;margin-top:0.1em;">${p2Province}</div>`:''}</div>
        <div class="broadcast-player-score ${state.score2>state.score1?'leading':''}">${state.score2}</div>
        <div style="font-size:0.7em;color:var(--text-muted);font-family:var(--font-display);">Sets</div>
      </div>
    </div>
    <div class="leg-badge">Set ${state.currentSet} · Leg ${state.currentLeg} of ${format.legsPerSet} &nbsp;|&nbsp; Set Legs: ${legsInSetDisplay} &nbsp;|&nbsp; Sets: ${setScoreDisplay}</div>
    <div class="help-label-row"><label>Leg Winner</label><button class="help-btn" data-help-title="Leg Winner" data-help-body="Tap the player who won this leg. First to ${format.legsToWinSet} legs wins the set. First to ${format.setsToWin} sets wins the match.\n\nSet score is shown in the scoreboard above.">?</button></div>
    <div class="row">
      <button class="button winner-btn" data-winner="${p1}">${p1}</button>
      <button class="button winner-btn" data-winner="${p2}">${p2}</button>
    </div>
    <div class="help-label-row"><label>Memorable Moments</label><button class="help-btn" data-help-title="Memorable Moments" data-help-body="Select the tags that best reflect what happened in this leg. For scored moments enter the value in the field that appears next to the button.">?</button></div>
    <div class="col-2" id="momentBtns"></div>
    <div style="margin-top:0.5em;margin-bottom:0.3em;">
      <div style="display:flex;align-items:center;gap:0.5em;margin-bottom:0.5em;">
        <button id="noteToggleBtn" class="button btn-secondary" style="margin:0;flex:1;">📝 Add Note</button>
        <button class="help-btn" data-help-title="Leg Notes" data-help-body="Add a note about this leg — key moments, missed doubles etc. Notes appear on the interview screen.">?</button>
      </div>
      <div id="noteArea" style="display:none;">
        <textarea id="legNoteInput" rows="3" placeholder="Notes for this leg..." style="width:100%;background:#1a1a1a;color:var(--white);border:1.5px solid var(--divider);border-radius:10px;padding:0.75em 1em;font-family:var(--font-main);font-size:0.95em;line-height:1.5;resize:vertical;box-sizing:border-box;"></textarea>
      </div>
    </div>
    <div class="sticky-bottom">
      <button id="nextLegBtn" class="button">Confirm Leg</button>
      <div style="display:flex;gap:0.6em;margin-top:0.5em;">
        <button id="undoLegBtn" class="button btn-secondary" style="flex:1;${state.legs.length===0?'opacity:0.35;pointer-events:none;':''}">← Undo Leg</button>
        <button id="abandonBtn" class="button btn-secondary" style="flex:1;">✕ Abandon</button>
      </div>
    </div>
  `;

  // Winner buttons
  div.querySelectorAll(".winner-btn").forEach(btn => {
    btn.onclick = () => {
      selectedWinner = btn.dataset.winner;
      currentLeg.winner = selectedWinner;
      div.querySelectorAll(".winner-btn").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
    };
  });

  // Note toggle
  div.querySelector("#noteToggleBtn").onclick = () => {
    const area = div.querySelector("#noteArea");
    area.style.display = area.style.display === "none" ? "block" : "none";
  };
  div.querySelector("#legNoteInput").oninput = (e) => { currentLeg.note = e.target.value; };

  // Moment buttons
  const momentBtnsDiv = div.querySelector("#momentBtns");
  momentCategories.forEach(cat => {
    const wrapper = document.createElement("div");
    wrapper.style.cssText = "display:flex;align-items:center;gap:0.5em;";
    const btn = document.createElement("button");
    btn.className = "moment-btn button";
    btn.textContent = cat.label;
    btn.dataset.key = cat.key;
    wrapper.appendChild(btn);
    let input = null;
    if (["highScoring","bigFinish","highAverage","lowDartLeg"].includes(cat.key)) {
      input = document.createElement("input");
      input.type = "text";
      input.placeholder = cat.key === "lowDartLeg" ? "Darts" : cat.label + " value";
      input.style.cssText = "display:none;width:5em;font-size:1em;background:#232834;color:#fff;border:1px solid #444;border-radius:0.7em;padding:0.3em 0.7em;";
      input.oninput = (e) => { currentLeg.momentValues[cat.key] = e.target.value; };
      wrapper.appendChild(input);
    }
    btn.onclick = () => {
      if (currentLeg.moments.includes(cat.key)) {
        currentLeg.moments = currentLeg.moments.filter(m => m !== cat.key);
        btn.classList.remove("selected");
        if (input) { input.style.display = "none"; delete currentLeg.momentValues[cat.key]; }
      } else {
        currentLeg.moments.push(cat.key);
        btn.classList.add("selected");
        if (input) input.style.display = "inline-block";
      }
    };
    momentBtnsDiv.appendChild(wrapper);
  });

  // Undo last leg
  div.querySelector("#undoLegBtn").onclick = () => {
    if (state.legs.length === 0) return;
    state.legs.pop();
    recalcKnockoutState(state, format, p1);
    saveRoundRobinState();
    render();
  };

  // Abandon
  div.querySelector("#abandonBtn").onclick = () => {
    if (confirm("Abandon this match and return to the bracket?")) {
      ko.currentMatchId = null;
      ko.currentMatchState = null;
      saveRoundRobinState();
      appState.screen = "knockoutBracket";
      render();
    }
  };

  // Confirm leg
  div.querySelector("#nextLegBtn").onclick = () => {
    if (!selectedWinner) { alert("Select a leg winner first."); return; }
    currentLeg.legNumber = state.legs.length + 1;
    currentLeg.setNumber = state.currentSet;
    state.legs.push({ ...currentLeg, moments:[...currentLeg.moments], momentValues:{...currentLeg.momentValues} });

    // Update set legs
    if (selectedWinner === p1) state.legScores.player1++;
    else state.legScores.player2++;

    // Check set win
    if (state.legScores.player1 >= format.legsToWinSet) {
      state.score1++; state.legScores = { player1:0, player2:0 }; state.currentLeg = 1; state.currentSet++;
    } else if (state.legScores.player2 >= format.legsToWinSet) {
      state.score2++; state.legScores = { player1:0, player2:0 }; state.currentLeg = 1; state.currentSet++;
    } else {
      state.currentLeg++;
    }

    // Check match win
    if (state.score1 >= format.setsToWin || state.score2 >= format.setsToWin) {
      match.completed = true;
      match.score1 = state.score1;
      match.score2 = state.score2;
      match.winner = state.score1 > state.score2 ? p1 : p2;
      match.legs = state.legs;
      ko.currentMatchId = null;
      ko.currentMatchState = null;
      autoFillKnockoutPlayers();
      saveRoundRobinState();
      generateRoundRobinInterview(match);
      appState.screen = "interview";
      render();
    } else {
      saveRoundRobinState();
      render();
    }
  };

  bindHelpButtons(div);
  return div;
}

// --- MOVE TO NEXT BOARD 1 MATCH ---
function moveToNextBoard1Match() {
  const currentIdx = appState.roundRobin.currentMatchIndex;
  const matches = appState.roundRobin.matches;
  
  // Find next Board 1 match that isn't completed
  let nextBoard1MatchIdx = -1;
  for (let i = currentIdx + 1; i < matches.length; i++) {
    if (matches[i].board === 1 && !matches[i].completed) {
      nextBoard1MatchIdx = i;
      break;
    }
  }
  
  if (nextBoard1MatchIdx !== -1) {
    // Found next Board 1 match
    appState.roundRobin.currentMatchIndex = nextBoard1MatchIdx;
    appState.roundRobin.currentMatchState = null;
    appState.screen = "roundRobinMatch";
    render();
  } else {
    // No more Board 1 matches, return to setup
    appState.screen = "roundRobinSetup";
    render();
  }
}

// --- SAVE ROUND ROBIN STATE ---
function saveRoundRobinState() {
  localStorage.setItem("dartsRoundRobinState", JSON.stringify(appState.roundRobin));
  
  // Sync to GitHub for TV displays
  if (window.GitHubSync && GitHubSync.hasToken()) {
    const eventData = GitHubSync.buildEventData(appState);
    GitHubSync.pushEventData(eventData).catch(err => console.error('GitHub sync failed:', err));
  }
}

// --- CALCULATE PLAYER TOURNAMENT RECORD ---
function getPlayerTournamentRecord(playerName) {
  let wins = 0;
  let losses = 0;
  
  appState.roundRobin.completedMatches.forEach(match => {
    if (match.player1 === playerName) {
      if (match.winner === playerName) wins++;
      else losses++;
    } else if (match.player2 === playerName) {
      if (match.winner === playerName) wins++;
      else losses++;
    }
  });
  
  return { wins, losses, record: `${wins}-${losses}` };
}

// --- GET PLAYER PROVINCE ---
function getPlayerProvince(playerName) {
  return appState.roundRobin.playerProfiles?.[playerName]?.province || null;
}

// --- CHECK IF LAST MATCH FOR PLAYER ---
function isLastMatchForPlayer(playerName, currentMatchIndex) {
  let totalMatches = 0;
  let completedMatches = 0;
  appState.roundRobin.matches.forEach((match, idx) => {
    if (match.player1 === playerName || match.player2 === playerName) {
      totalMatches++;
      if (idx <= currentMatchIndex) completedMatches++;
    }
  });
  return completedMatches === totalMatches;
}

// --- GET OPPONENTS ALREADY PLAYED (for a player, up to and including currentMatchIndex) ---
function getAlreadyPlayedOpponents(playerName) {
  const opponents = [];
  appState.roundRobin.completedMatches.forEach(match => {
    if (match.player1 === playerName) opponents.push({ name: match.player2, result: match.winner === playerName ? 'W' : 'L', score: `${match.score1}-${match.score2}` });
    else if (match.player2 === playerName) opponents.push({ name: match.player1, result: match.winner === playerName ? 'W' : 'L', score: `${match.score2}-${match.score1}` });
  });
  return opponents;
}

// --- GET UPCOMING MATCHES FOR A PLAYER (board 1 only, not yet played) ---
function getUpcomingMatches(playerName, afterIndex) {
  return appState.roundRobin.matches
    .filter((m, idx) => idx > afterIndex && !m.completed && (m.player1 === playerName || m.player2 === playerName))
    .map(m => ({
      matchNum: m.matchNum,
      time: m.time,
      board: m.board,
      opponent: m.player1 === playerName ? m.player2 : m.player1,
      opponentProvince: getPlayerProvince(m.player1 === playerName ? m.player2 : m.player1)
    }));
}

// --- GET FULL STANDINGS (all players sorted by wins then by losses) ---
function getPlayerStandings() {
  const groupA = appState.roundRobin.groupA || [];
  const groupB = appState.roundRobin.groupB || [];
  const allPlayers = [...groupA, ...groupB].filter(Boolean);
  if (!allPlayers.length) return [];
  const standings = allPlayers.map(name => {
    const rec = getPlayerTournamentRecord(name);
    return { name, wins: rec.wins, losses: rec.losses, record: rec.record, province: getPlayerProvince(name) };
  });
  standings.sort((a, b) => b.wins - a.wins || a.losses - b.losses);
  return standings;
}

// --- GROUP STANDINGS BY LEGS WON (for knockout seeding) ---
function getGroupStandingsByLegs(groupPlayers) {
  return groupPlayers.map(name => {
    let legsWon = 0, matchWins = 0, matchLosses = 0;
    appState.roundRobin.completedMatches.forEach(m => {
      const isP1 = m.player1 === name;
      const isP2 = m.player2 === name;
      if (!isP1 && !isP2) return;
      if (m.winner === name) matchWins++; else matchLosses++;
      legsWon += isP1 ? (m.score1 || 0) : (m.score2 || 0);
    });
    return { name, legsWon, matchWins, matchLosses, province: getPlayerProvince(name) };
  }).sort((a, b) => b.legsWon - a.legsWon || b.matchWins - a.matchWins);
}

// --- GENERATE KNOCKOUT BRACKET ---
function generateKnockoutBracket() {
  const sA = getGroupStandingsByLegs(appState.roundRobin.groupA || []);
  const sB = getGroupStandingsByLegs(appState.roundRobin.groupB || []);
  const qfFmt   = { legsToWinSet: 3, setsToWin: 2, totalSets: 3, legsPerSet: 5 };
  const finalFmt = { legsToWinSet: 3, setsToWin: 3, totalSets: 5, legsPerSet: 5 };
  const mk = (id, round, num, label, p1, p2, seedLabel, fmt) => ({
    id, round, matchNum: num, label, seedLabel,
    player1: p1 || null, player2: p2 || null,
    completed: false, winner: null, score1: 0, score2: 0, legs: [],
    format: { ...fmt }
  });
  const bracket = [
    mk("qf1","qf",1,"QF 1", sA[0]?.name, sB[3]?.name, "A1 vs B4", qfFmt),
    mk("qf2","qf",2,"QF 2", sA[1]?.name, sB[2]?.name, "A2 vs B3", qfFmt),
    mk("qf3","qf",3,"QF 3", sA[2]?.name, sB[1]?.name, "A3 vs B2", qfFmt),
    mk("qf4","qf",4,"QF 4", sA[3]?.name, sB[0]?.name, "A4 vs B1", qfFmt),
    mk("sf1","sf",1,"SF 1", null, null, "QF1 W vs QF2 W", qfFmt),
    mk("sf2","sf",2,"SF 2", null, null, "QF3 W vs QF4 W", qfFmt),
    mk("final","final",1,"Final", null, null, "SF1 W vs SF2 W", finalFmt)
  ];
  appState.roundRobin.knockout = {
    generated: true, bracket,
    standingsA: sA, standingsB: sB,
    currentMatchId: null, currentMatchState: null
  };
  saveRoundRobinState();
}

// --- AUTO-FILL KNOCKOUT PLAYERS FROM COMPLETED ROUNDS ---
function autoFillKnockoutPlayers() {
  const ko = appState.roundRobin.knockout;
  if (!ko) return;
  const b = ko.bracket;
  const get = id => b.find(m => m.id === id);
  const qf1 = get("qf1"), qf2 = get("qf2"), sf1 = get("sf1");
  if (qf1.completed && qf2.completed && !sf1.player1) { sf1.player1 = qf1.winner; sf1.player2 = qf2.winner; }
  const qf3 = get("qf3"), qf4 = get("qf4"), sf2 = get("sf2");
  if (qf3.completed && qf4.completed && !sf2.player1) { sf2.player1 = qf3.winner; sf2.player2 = qf4.winner; }
  const fin = get("final");
  if (sf1.completed && sf2.completed && !fin.player1) { fin.player1 = sf1.winner; fin.player2 = sf2.winner; }
}

// --- RECALCULATE KNOCKOUT MATCH STATE FROM LEGS ---
function recalcKnockoutState(state, format, p1) {
  state.score1 = 0; state.score2 = 0;
  state.currentSet = 1;
  state.legScores = { player1: 0, player2: 0 };
  state.legs.forEach(leg => {
    if (leg.winner === p1) state.legScores.player1++;
    else state.legScores.player2++;
    if (state.legScores.player1 >= format.legsToWinSet) {
      state.score1++; state.legScores = { player1: 0, player2: 0 }; state.currentSet++;
    } else if (state.legScores.player2 >= format.legsToWinSet) {
      state.score2++; state.legScores = { player1: 0, player2: 0 }; state.currentSet++;
    }
  });
  state.currentLeg = state.legScores.player1 + state.legScores.player2 + 1;
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
  
  // Add tournament record (includes this match)
  const recordInfo = getPlayerTournamentRecord(winner);
  data.tournamentRecord = recordInfo.record;
  data.tournamentWins = recordInfo.wins;
  data.tournamentLosses = recordInfo.losses;
  
  // Add province information
  data.playerProvince = getPlayerProvince(winner);
  data.opponentProvince = getPlayerProvince(loser);
  
  // Check if this is the last match for this player
  data.isLastMatch = isLastMatchForPlayer(winner, appState.roundRobin.currentMatchIndex);

  // Opponents already played (with results)
  const alreadyPlayed = getAlreadyPlayedOpponents(winner);
  data.alreadyPlayed = alreadyPlayed;
  data.alreadyPlayedCount = alreadyPlayed.length;

  // All upcoming matches for this player (board 1 + board 2)
  const upcoming = getUpcomingMatches(winner, appState.roundRobin.currentMatchIndex);
  data.upcomingMatches = upcoming;
  data.remainingMatchCount = upcoming.length;

  // Full standings snapshot
  const standings = getPlayerStandings();
  data.standings = standings;
  const selfRank = standings.findIndex(s => s.name === winner) + 1;
  data.playerRank = selfRank;
  data.totalPlayers = standings.length;

  // Find next match for this player (any board)
  const nextMatch = appState.roundRobin.matches.find((m, idx) => 
    idx > appState.roundRobin.currentMatchIndex && 
    (m.player1 === winner || m.player2 === winner)
  );
  
  if (nextMatch) {
    data.nextOpponent = nextMatch.player1 === winner ? nextMatch.player2 : nextMatch.player1;
    data.nextBoard = nextMatch.board;
    data.nextMatchNum = nextMatch.matchNum;
    data.nextMatchTime = nextMatch.time;
    data.nextOpponentProvince = getPlayerProvince(data.nextOpponent);
    // Get next opponent's record so we can reference it
    const nextOppRecord = getPlayerTournamentRecord(data.nextOpponent);
    data.nextOpponentRecord = nextOppRecord.record;
    data.nextOpponentWins = nextOppRecord.wins;
  }

  // First upcoming board 1 match specifically (the livestream match)
  const nextBoard1 = upcoming.find(m => m.board === 1);
  if (nextBoard1) {
    data.nextBoard1Opponent = nextBoard1.opponent;
    data.nextBoard1Province = nextBoard1.opponentProvince;
    data.nextBoard1Time = nextBoard1.time;
  }

  // --- MATCH PATTERN DETECTION ---
  const legs = match.legs || [];
  let rWin = 0, rLoss = 0;
  let wasDown02 = false;   // winner trailed 0-2 at any point
  let wasUp20 = false;     // winner led 2-0 at any point
  let tiedAt22 = false;    // match reached 2-2
  let tiedAt11 = false;    // match reached 1-1
  let leadChanges = 0;
  let prevLeader = null;

  legs.forEach(leg => {
    if (leg.winner === winner) rWin++; else rLoss++;
    if (rWin === 0 && rLoss === 2) wasDown02 = true;
    if (rWin === 2 && rLoss === 0) wasUp20 = true;
    if (rWin === 2 && rLoss === 2) tiedAt22 = true;
    if (rWin === 1 && rLoss === 1) tiedAt11 = true;
    const curLeader = rWin > rLoss ? 'W' : rLoss > rWin ? 'L' : null;
    if (curLeader && curLeader !== prevLeader) { leadChanges++; prevLeader = curLeader; }
  });

  const totalLegsPlayed = winnerScore + loserScore;
  const maxLegs = (appState.roundRobin.format && appState.roundRobin.format.totalLegs) || 5;

  data.isWhitewash    = loserScore === 0;                          // 3-0
  data.isDecider      = tiedAt22 && totalLegsPlayed === maxLegs;   // went 2-2 then a decider
  data.isComeback     = wasDown02 && winnerScore > loserScore;     // came back from 0-2
  data.isSurrender    = wasUp20 && tiedAt22 && winnerScore > loserScore; // 2-0 up, let them tie 2-2, still won
  data.isNailBiter    = tiedAt11 && (winnerScore - loserScore) === 1;     // went 1-1 and close throughout
  data.hadLeadChanges = leadChanges >= 3;
  data.winnerLegs     = winnerScore;
  data.loserLegs      = loserScore;
  // -----------------------------------------------
  
  // Collect moment data
  const momentData = {};
  const momentLegNumbers = {};
  const momentFrequency = {};
  
  match.legs.forEach((leg) => {
    if (leg.winner === winner) {
      leg.moments.forEach((m) => {
        const cat = m;
        momentFrequency[cat] = (momentFrequency[cat] || 0) + 1;
        if (!momentData[cat]) momentData[cat] = [];
        if (!momentLegNumbers[cat]) momentLegNumbers[cat] = [];
        momentData[cat].push(leg.momentValues[m] || "");
        momentLegNumbers[cat].push(leg.legNumber);
      });
    }
  });
  
  // Sort moment categories by frequency (most frequent first)
  const sortedMoments = Object.keys(momentFrequency).sort((a, b) => momentFrequency[b] - momentFrequency[a]);
  
  const questions = [];
  const usedCategories = new Set();
  const usedQuestions = new Set();
  
  // Priority 1: Add moment-based questions (limit to top 4 most frequent)
  sortedMoments.slice(0, 4).forEach((cat) => {
    if (questionBank[cat] && questions.length < 4) {
      // Use the last occurrence of this moment
      const lastIdx = momentData[cat].length - 1;
      data[cat] = momentData[cat][lastIdx];
      data.legNumber = momentLegNumbers[cat][lastIdx];
      
      const availableQuestions = questionBank[cat].filter((q) => !usedQuestions.has(q.toString()));
      if (availableQuestions.length > 0) {
        const q = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
        questions.push(q(data));
        usedQuestions.add(q.toString());
        usedCategories.add(cat);
      }
    }
  });
  
  // Priority 2: Fill remaining slots with round robin specific questions
  // Filter to questions that produce non-null text AND haven't been used, then shuffle
  if (questions.length < 4 && questionBank.roundRobin) {
    const validRR = questionBank.roundRobin
      .filter(q => !usedQuestions.has(q.toString()))
      .map(q => ({ q, text: q(data) }))
      .filter(item => item.text)
      .sort(() => Math.random() - 0.5); // shuffle

    for (const item of validRR) {
      if (questions.length >= 4) break;
      questions.push(item.text);
      usedQuestions.add(item.q.toString());
    }
  }
  
  // Priority 3: Fill remaining slots with general questions
  if (questions.length < 4 && questionBank.general) {
    const validGeneral = questionBank.general
      .filter(q => !usedQuestions.has(q.toString()))
      .sort(() => Math.random() - 0.5);

    for (const q of validGeneral) {
      if (questions.length >= 4) break;
      const text = q(data);
      if (text) { questions.push(text); usedQuestions.add(q.toString()); }
    }
  }
  
  appState.interview.questions = questions;
  appState.interview.currentQuestionIndex = 0;

  // Store leg notes for the interview screen
  appState.interview.legNotes = (match.legs || [])
    .filter(l => l.note && l.note.trim())
    .map(l => ({ legNumber: l.legNumber, note: l.note.trim() }));

  // Store subject info for the interview header
  const subjectRecord = getPlayerTournamentRecord(winner);
  appState.interview.subject = {
    name: winner,
    province: getPlayerProvince(winner),
    opponent: loser,
    winnerScore: match.winner === match.player1 ? match.score1 : match.score2,
    loserScore:  match.winner === match.player1 ? match.score2 : match.score1,
    wins: subjectRecord.wins,
    losses: subjectRecord.losses,
    rank: standings.findIndex(s => s.name === winner) + 1,
    totalPlayers: standings.length,
    matchNum: match.matchNum
  };
}
window.addEventListener("DOMContentLoaded", () => {
  // Restore player library on load
  const savedPlayers = localStorage.getItem("dartsPlayerLibrary");
  if (savedPlayers) {
    try {
      const parsed = JSON.parse(savedPlayers);
      appState.players = parsed.map(p => typeof p === 'string' ? {name: p, group: ''} : p);
    } catch(e) {}
  }

  // Restore saved tournament OR auto-load Event 4
  const savedRoundRobin = localStorage.getItem("dartsRoundRobinState");
  let restored = false;
  if (savedRoundRobin) {
    try {
      const parsed = JSON.parse(savedRoundRobin);
      if (parsed && parsed.matches && parsed.matches.length > 0) {
        appState.roundRobin = parsed;
        // Ensure playerProfiles exists after restore
        if (!appState.roundRobin.playerProfiles) appState.roundRobin.playerProfiles = {};
        restored = true;
      }
    } catch(e) {
      console.error("Failed to restore Round Robin state:", e);
    }
  }

  if (!restored) {
    // Auto-load Event 4 as default
    loadPresetEvent("event4");
  }

  appState.screen = "matchList";
  render();
});

