// ── Configuração do Firebase ──
const firebaseConfig = {
  apiKey: "AIzaSyCmc_HPJ_cp7JaAEkm7B0JNyorhdI9SAlQ",
  authDomain: "truco-paulista-d2183.firebaseapp.com",
  databaseURL: "https://truco-paulista-d2183-default-rtdb.firebaseio.com", 
  projectId: "truco-paulista-d2183",
  storageBucket: "truco-paulista-d2183.firebasestorage.app",
  messagingSenderId: "375752356559",
  appId: "1:375752356559:web:2cf2121a90bd2beebcfdba"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const dbRef = db.ref('truco-championship');

// ── State (Estado do App) ──
let state = {
  players: [],
  matches: [],
  bracket: {
    semi1: { teamA: "", teamB: "" },
    semi2: { teamA: "", teamB: "" },
    final: { teamA: "", teamB: "" },
  },
};
let activeTab = "participants";
let isInitialLoad = true; 

// ── Escutando Mudanças em Tempo Real (Onde a mágica acontece) ──
dbRef.on('value', (snapshot) => {
  const data = snapshot.val();
  if (data) {
    state = data;
    // Garante que as propriedades existam para não dar erro no render
    if (!state.players) state.players = [];
    if (!state.matches) state.matches = [];
    if (!state.bracket) state.bracket = { semi1: {}, semi2: {}, final: {} };
  }
  
  isInitialLoad = false;
  
  if (document.getElementById("tab-" + activeTab)) {
    renderTab();
  }
});

function saveState() {
  // Salva no Firebase e todos os usuários verão a mudança na hora
  dbRef.set(state).catch(error => {
    console.error("Erro ao salvar:", error);
  });
}

function uuid() {
  return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ── Ciclo de Vida / Intro ──
document.addEventListener("DOMContentLoaded", () => {
  createParticles();
  setTimeout(() => {
    const intro = document.getElementById("intro");
    if(intro) {
        intro.classList.add("hidden");
        setTimeout(() => {
          intro.style.display = "none";
          document.getElementById("app").classList.add("visible");
        }, 800);
    }
  }, 4500);
  initTabs();
  renderTab();
});

function createParticles() {
  const container = document.querySelector("#intro .particles");
  if(!container) return;
  for (let i = 0; i < 40; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    const size = Math.random() * 4 + 1;
    p.style.cssText = `left:${Math.random()*100}%;top:${Math.random()*100}%;width:${size}px;height:${size}px;animation-duration:${Math.random()*3+2}s;animation-delay:${Math.random()*2}s;`;
    container.appendChild(p);
  }
}

// ── Gerenciamento de Abas ──
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

// ── Aba Participantes ──
function renderParticipants() {
  const list = document.getElementById("player-list");
  const count = document.getElementById("player-count");
  if(!list) return;
  list.innerHTML = "";
  
  if (!state.players || state.players.length === 0) {
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
  const n = state.players ? state.players.length : 0;
  if(count) count.textContent = `${n} jogador${n !== 1 ? "es" : ""} cadastrado${n !== 1 ? "s" : ""}`;
}

function addPlayer() {
  const input = document.getElementById("player-input");
  const name = input.value.trim();
  if (!name) return;
  if (!state.players) state.players = [];
  state.players.push({ id: uuid(), name, points: 0, wins: 0 });
  input.value = "";
  saveState();
}

function removePlayer(id) {
  state.players = state.players.filter(p => p.id !== id);
  saveState();
}

// ── Aba Pontuação (Com o novo botão de remover vitória) ──
function renderScores() {
  const list = document.getElementById("score-list");
  if(!list) return;
  list.innerHTML = "";
  const sorted = [...(state.players || [])].sort((a, b) => b.points - a.points || b.wins - a.wins);
  
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
      <div class="score-value">${p.points}</div>
      <div class="wins-value">${p.wins}</div>
      <div class="score-actions">
        <button class="btn btn-outline btn-icon" onclick="updateScore('${p.id}',1)" title="Adicionar Ponto">+</button>
        <button class="btn btn-outline btn-icon" onclick="updateScore('${p.id}',-1)" title="Remover Ponto">−</button>
        <button class="btn btn-ghost btn-icon" onclick="updateWin('${p.id}', 1)" title="Adicionar Vitória">🏆</button>
        <button class="btn btn-ghost btn-icon" onclick="updateWin('${p.id}', -1)" title="Remover Vitória">❌</button>
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
  }
}

function updateWin(id, delta) {
  const p = state.players.find(x => x.id === id);
  if (p) {
    p.wins = Math.max(0, p.wins + delta);
    saveState();
  }
}

// ── Aba Sorteio ──
function renderDraw() {
  const results = document.getElementById("draw-results");
  const hint = document.getElementById("draw-hint");
  if(!results) return;
  
  hint.textContent = (state.players || []).length < 4 ? "Mínimo de 4 jogadores para sortear" : "";
  results.innerHTML = "";
  
  (state.matches || []).forEach((m, i) => {
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
  if (!state.players || state.players.length < 4) return;
  const btn = document.getElementById("draw-btn");
  const shuffleEl = document.getElementById("shuffle-anim");
  const results = document.getElementById("draw-results");
  
  btn.disabled = true;
  btn.textContent = "⏳ Sorteando...";
  results.innerHTML = "";
  shuffleEl.style.display = "flex";

  setTimeout(() => {
    const shuffled = [...state.players].sort(() => Math.random() - 0.5);
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
  }, 2000);
}

// ── Aba Chaveamento ──
function renderBracket() {
  const b = state.bracket;
  renderBracketCard("semi1", "Semifinal 1", b.semi1);
  renderBracketCard("semi2", "Semifinal 2", b.semi2);
  renderBracketCard("final", "Final", b.final);
  renderChampion();
}

function renderBracketCard(key, label, data) {
  const el = document.getElementById("bracket-" + key);
  if(!el) return;
  el.innerHTML = `<div class="b-label">${label}</div>`;
  if (!data || !data.teamA) {
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
    if (state.bracket.final.winner &&
        state.bracket.final.winner !== state.bracket.final.teamA &&
        state.bracket.final.winner !== state.bracket.final.teamB) {
      delete state.bracket.final.winner;
    }
  }

  saveState();
}

function renderChampion() {
  const el = document.getElementById("champion");
  if(!el) return;
  if (state.bracket && state.bracket.final && state.bracket.final.winner) {
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

// ── Auxiliares ──
function esc(str) {
  if(!str) return "";
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && document.activeElement && document.activeElement.id === "player-input") {
    addPlayer();
  }
});
