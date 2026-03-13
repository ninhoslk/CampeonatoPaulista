// ── State ──
const STORAGE_KEY = "truco-championship";
let state = loadState() || {
  players: [],
  matches: [],
  bracket: {
    semi1: { teamA: "", teamB: "" },
    semi2: { teamA: "", teamB: "" },
    final: { teamA: "", teamB: "" },
  },
};
let activeTab = "participants";

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
function uuid() {
  return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ── Intro ──
document.addEventListener("DOMContentLoaded", () => {
  createParticles();
  setTimeout(() => {
    const intro = document.getElementById("intro");
    intro.classList.add("hidden");
    setTimeout(() => {
      intro.style.display = "none";
      document.getElementById("app").classList.add("visible");
    }, 800);
  }, 4500);
  initTabs();
  renderTab();
});

function createParticles() {
  const container = document.querySelector("#intro .particles");
  for (let i = 0; i < 40; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    const size = Math.random() * 4 + 1;
    p.style.cssText = `left:${Math.random()*100}%;top:${Math.random()*100}%;width:${size}px;height:${size}px;animation-duration:${Math.random()*3+2}s;animation-delay:${Math.random()*2}s;`;
    container.appendChild(p);
  }
}

// ── Tabs ──
function initTabs() {
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      activeTab = btn.dataset.tab;
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderTab();
    });
  });
}

function renderTab() {
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
  const panel = document.getElementById("tab-" + activeTab);
  if (panel) {
    panel.classList.add("active");
    if (activeTab === "participants") renderParticipants();
    else if (activeTab === "scores") renderScores();
    else if (activeTab === "draw") renderDraw();
    else if (activeTab === "bracket") renderBracket();
  }
}

// ── Participants ──
function renderParticipants() {
  const list = document.getElementById("player-list");
  const count = document.getElementById("player-count");
  list.innerHTML = "";
  if (state.players.length === 0) {
    list.innerHTML = '<div class="empty-msg">Nenhum jogador cadastrado</div>';
  } else {
    state.players.forEach((p, i) => {
      const row = document.createElement("div");
      row.className = "table-row";
      row.style.animationDelay = (i * 0.05) + "s";
      row.innerHTML = `
        <div class="player-name">
          <div class="player-avatar">👤</div>
          ${esc(p.name)}
        </div>
        <button class="btn btn-ghost btn-icon" onclick="removePlayer('${p.id}')" title="Remover">🗑️</button>
      `;
      list.appendChild(row);
    });
  }
  const n = state.players.length;
  count.textContent = `${n} jogador${n !== 1 ? "es" : ""} cadastrado${n !== 1 ? "s" : ""}`;
}

function addPlayer() {
  const input = document.getElementById("player-input");
  const name = input.value.trim();
  if (!name) return;
  state.players.push({ id: uuid(), name, points: 0, wins: 0 });
  input.value = "";
  saveState();
  renderParticipants();
}

function removePlayer(id) {
  state.players = state.players.filter(p => p.id !== id);
  saveState();
  renderParticipants();
}

// ── Scores ──
function renderScores() {
  const list = document.getElementById("score-list");
  list.innerHTML = "";
  const sorted = [...state.players].sort((a, b) => b.points - a.points || b.wins - a.wins);
  if (sorted.length === 0) {
    list.innerHTML = '<div class="empty-msg">Adicione jogadores primeiro</div>';
    return;
  }
  sorted.forEach((p, i) => {
    const row = document.createElement("div");
    row.className = "table-row";
    row.style.animationDelay = (i * 0.05) + "s";
    const crownHtml = i === 0 && sorted.length > 1 ? '<span class="crown">👑</span>' : '';
    row.innerHTML = `
      <div class="player-name">${crownHtml}${esc(p.name)}</div>
      <div class="score-value" id="pts-${p.id}">${p.points}</div>
      <div class="wins-value">${p.wins}</div>
      <div class="score-actions">
        <button class="btn btn-outline btn-icon" onclick="updateScore('${p.id}',1)">+</button>
        <button class="btn btn-outline btn-icon" onclick="updateScore('${p.id}',-1)">−</button>
        <button class="btn btn-ghost btn-icon" onclick="addWin('${p.id}')" title="Vitória">🏆</button>
      </div>
    `;
    list.appendChild(row);
  });
}

function updateScore(id, delta) {
  const p = state.players.find(x => x.id === id);
  if (p) {
    p.points = Math.max(0, p.points + delta);
    saveState();
    renderScores();
  }
}

function addWin(id) {
  const p = state.players.find(x => x.id === id);
  if (p) {
    p.wins++;
    saveState();
    renderScores();
  }
}

// ── Draw ──
function renderDraw() {
  const results = document.getElementById("draw-results");
  const hint = document.getElementById("draw-hint");
  const shuffleEl = document.getElementById("shuffle-anim");
  shuffleEl.style.display = "none";
  hint.textContent = state.players.length < 4 ? "Mínimo de 4 jogadores para sortear" : "";
  results.innerHTML = "";
  state.matches.forEach((m, i) => {
    const card = document.createElement("div");
    card.className = "match-card";
    card.style.animationDelay = (i * 0.15) + "s";
    card.innerHTML = `
      <div class="match-label">Mesa ${m.table}</div>
      <div class="match-teams">
        <div class="team"><div class="name">${esc(m.teamA[0])}</div><div class="sep">&amp;</div><div class="name">${esc(m.teamA[1])}</div></div>
        <div class="match-vs">⚔️</div>
        <div class="team"><div class="name">${esc(m.teamB[0])}</div><div class="sep">&amp;</div><div class="name">${esc(m.teamB[1])}</div></div>
      </div>
    `;
    results.appendChild(card);
  });
}

function drawTeams() {
  if (state.players.length < 4) return;
  const btn = document.getElementById("draw-btn");
  const shuffleEl = document.getElementById("shuffle-anim");
  const results = document.getElementById("draw-results");
  btn.disabled = true;
  btn.textContent = "⏳ Sorteando...";
  results.innerHTML = "";
  shuffleEl.style.display = "flex";

  setTimeout(() => {
    const shuffled = shuffle([...state.players]);
    const matches = [];
    for (let i = 0; i <= shuffled.length - 4; i += 4) {
      matches.push({
        id: "match-" + Date.now() + "-" + i,
        table: matches.length + 1,
        teamA: [shuffled[i].name, shuffled[i + 1].name],
        teamB: [shuffled[i + 2].name, shuffled[i + 3].name],
      });
    }
    state.matches = matches;

    // Auto-fill bracket
    if (matches.length >= 2) {
      state.bracket = {
        semi1: { teamA: matches[0].teamA.join(" & "), teamB: matches[0].teamB.join(" & ") },
        semi2: { teamA: matches[1].teamA.join(" & "), teamB: matches[1].teamB.join(" & ") },
        final: { teamA: "", teamB: "" },
      };
    }

    saveState();
    btn.disabled = false;
    btn.textContent = "🔀 Sortear Duplas";
    shuffleEl.style.display = "none";
    renderDraw();
  }, 2000);
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ── Bracket ──
function renderBracket() {
  const b = state.bracket;
  renderBracketCard("semi1", "Semifinal 1", b.semi1);
  renderBracketCard("semi2", "Semifinal 2", b.semi2);
  renderBracketCard("final", "Final", b.final);
  renderChampion();
}

function renderBracketCard(key, label, data) {
  const el = document.getElementById("bracket-" + key);
  el.innerHTML = `<div class="b-label">${label}</div>`;
  if (!data.teamA) {
    el.innerHTML += '<div class="bracket-waiting">Aguardando duplas</div>';
    return;
  }
  const wA = data.winner === data.teamA ? "winner" : "";
  const wB = data.winner === data.teamB ? "winner" : "";
  el.innerHTML += `
    <button class="bracket-team-btn ${wA}" onclick="setWinner('${key}','A')">${esc(data.teamA)}${wA ? ' 🏆' : ''}</button>
    <div class="bracket-vs">VS</div>
    <button class="bracket-team-btn ${wB}" onclick="setWinner('${key}','B')">${esc(data.teamB)}${wB ? ' 🏆' : ''}</button>
  `;
}

function setWinner(matchKey, side) {
  const match = state.bracket[matchKey];
  const winner = side === "A" ? match.teamA : match.teamB;
  if (!winner) return;
  match.winner = winner;

  if (matchKey === "semi1" || matchKey === "semi2") {
    state.bracket.final.teamA = state.bracket.semi1.winner || "";
    state.bracket.final.teamB = state.bracket.semi2.winner || "";
    // Clear final winner if semis changed
    if (state.bracket.final.winner &&
        state.bracket.final.winner !== state.bracket.final.teamA &&
        state.bracket.final.winner !== state.bracket.final.teamB) {
      delete state.bracket.final.winner;
    }
  }

  saveState();
  renderBracket();
}

function renderChampion() {
  const el = document.getElementById("champion");
  if (state.bracket.final.winner) {
    el.innerHTML = `
      <div class="champion-inner">
        <div class="champion-icon">👑</div>
        <div class="champion-label">Campeão</div>
        <div class="champion-name">${esc(state.bracket.final.winner)}</div>
      </div>
    `;
    el.style.display = "block";
  } else {
    el.style.display = "none";
  }
}

// ── Helpers ──
function esc(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

// Enter key for player input
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && document.activeElement && document.activeElement.id === "player-input") {
    addPlayer();
  }
});
