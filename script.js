const STORAGE_KEYS = {
  players: "truco_players",
  latestDraw: "truco_latest_draw",
  bracket: "truco_bracket",
  introDone: "truco_intro_seen"
};

let players = load(STORAGE_KEYS.players, []);
let latestDraw = load(STORAGE_KEYS.latestDraw, []);
let bracketState = load(STORAGE_KEYS.bracket, {
  semi1Winner: "",
  semi2Winner: "",
  finalWinner: ""
});

const intro = document.getElementById("intro");
const app = document.getElementById("app");
const introParticles = document.getElementById("introParticles");
const tabButtons = document.querySelectorAll(".tab-btn");
const panels = document.querySelectorAll(".tab-panel");

const playerNameInput = document.getElementById("playerName");
const addPlayerBtn = document.getElementById("addPlayerBtn");
const playersTableBody = document.getElementById("playersTableBody");
const scoreTableBody = document.getElementById("scoreTableBody");

const drawTeamsBtn = document.getElementById("drawTeamsBtn");
const shuffleAnimation = document.getElementById("shuffleAnimation");
const drawResults = document.getElementById("drawResults");

const bracketBoard = document.getElementById("bracketBoard");

init();

function init() {
  setupIntro();
  setupTabs();
  bindActions();
  renderPlayers();
  renderScore();
  renderDraw();
  renderBracket();
}

function setupIntro() {
  createParticles();

  // Mantem a intro por ~3.7s na primeira visita.
  const alreadySeen = sessionStorage.getItem(STORAGE_KEYS.introDone);
  if (alreadySeen) {
    intro.classList.add("hidden");
    app.classList.remove("hidden");
    return;
  }

  setTimeout(() => {
    intro.classList.add("fade-out");
    setTimeout(() => {
      intro.classList.add("hidden");
      app.classList.remove("hidden");
      sessionStorage.setItem(STORAGE_KEYS.introDone, "1");
    }, 780);
  }, 3700);
}

function createParticles() {
  const amount = 70;
  for (let i = 0; i < amount; i += 1) {
    const particle = document.createElement("span");
    particle.className = "particle";
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.top = `${Math.random() * 100 + 40}%`;
    particle.style.animationDuration = `${3 + Math.random() * 5}s`;
    particle.style.animationDelay = `${Math.random() * 2}s`;
    particle.style.opacity = String(0.2 + Math.random() * 0.8);
    introParticles.appendChild(particle);
  }
}

function setupTabs() {
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const { tab } = btn.dataset;
      tabButtons.forEach((b) => b.classList.remove("active"));
      panels.forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(tab).classList.add("active");
    });
  });
}

function bindActions() {
  addPlayerBtn.addEventListener("click", addPlayer);
  playerNameInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") addPlayer();
  });

  drawTeamsBtn.addEventListener("click", performDraw);
}

function addPlayer() {
  const name = playerNameInput.value.trim();
  if (!name) return;

  const duplicate = players.some((player) => player.name.toLowerCase() === name.toLowerCase());
  if (duplicate) {
    alert("Esse participante ja foi cadastrado.");
    return;
  }

  players.push({
    id: crypto.randomUUID(),
    name,
    points: 0,
    wins: 0
  });

  playerNameInput.value = "";
  persistPlayers();
  renderPlayers();
  renderScore();
}

function removePlayer(playerId) {
  const row = document.querySelector(`[data-row='${playerId}']`);
  if (row) {
    row.classList.add("exit");
  }

  setTimeout(() => {
    players = players.filter((player) => player.id !== playerId);

    // Remove referencias invalidadas em sorteio e chave.
    latestDraw = latestDraw.filter((team) => team.every((member) => players.some((p) => p.name === member)));
    bracketState = {
      semi1Winner: "",
      semi2Winner: "",
      finalWinner: ""
    };

    persistPlayers();
    save(STORAGE_KEYS.latestDraw, latestDraw);
    save(STORAGE_KEYS.bracket, bracketState);
    renderPlayers();
    renderScore();
    renderDraw();
    renderBracket();
  }, 260);
}

function updatePoints(playerId, delta) {
  const player = players.find((p) => p.id === playerId);
  if (!player) return;

  player.points = Math.max(0, player.points + delta);
  persistPlayers();
  renderScore();
}

function registerWin(playerId) {
  const player = players.find((p) => p.id === playerId);
  if (!player) return;

  player.wins += 1;
  player.points += 3;
  persistPlayers();
  renderScore();
}

function performDraw() {
  if (players.length < 8) {
    alert("Cadastre no minimo 8 participantes para gerar duplas de semifinal.");
    return;
  }

  shuffleAnimation.classList.remove("hidden");
  drawResults.innerHTML = "";

  setTimeout(() => {
    const names = players.map((p) => p.name);
    const shuffled = shuffleArray([...names]);
    const teams = [];

    for (let i = 0; i < shuffled.length; i += 2) {
      if (shuffled[i + 1]) teams.push([shuffled[i], shuffled[i + 1]]);
    }

    latestDraw = teams;
    bracketState = {
      semi1Winner: "",
      semi2Winner: "",
      finalWinner: ""
    };

    save(STORAGE_KEYS.latestDraw, latestDraw);
    save(STORAGE_KEYS.bracket, bracketState);
    shuffleAnimation.classList.add("hidden");

    renderDraw();
    renderBracket();
  }, 1700);
}

function renderPlayers() {
  playersTableBody.innerHTML = "";

  if (!players.length) {
    playersTableBody.innerHTML = `<tr><td colspan="2">Nenhum jogador cadastrado.</td></tr>`;
    return;
  }

  players.forEach((player) => {
    const row = document.createElement("tr");
    row.className = "player-row enter";
    row.dataset.row = player.id;

    row.innerHTML = `
      <td>${escapeHtml(player.name)}</td>
      <td>
        <button class="action-btn" data-remove="${player.id}">Remover</button>
      </td>
    `;

    playersTableBody.appendChild(row);
  });

  playersTableBody.querySelectorAll("[data-remove]").forEach((button) => {
    button.addEventListener("click", () => removePlayer(button.dataset.remove));
  });
}

function renderScore() {
  scoreTableBody.innerHTML = "";

  if (!players.length) {
    scoreTableBody.innerHTML = `<tr><td colspan="4">Sem dados de pontuacao.</td></tr>`;
    return;
  }

  const ranking = [...players].sort((a, b) => (b.points - a.points) || (b.wins - a.wins));

  ranking.forEach((player) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${escapeHtml(player.name)}</td>
      <td>${player.points}</td>
      <td>${player.wins}</td>
      <td>
        <button class="action-btn" data-plus="${player.id}">+1</button>
        <button class="action-btn" data-minus="${player.id}">-1</button>
        <button class="action-btn" data-win="${player.id}">Vitoria +3</button>
      </td>
    `;

    scoreTableBody.appendChild(row);
  });

  scoreTableBody.querySelectorAll("[data-plus]").forEach((button) => {
    button.addEventListener("click", () => updatePoints(button.dataset.plus, 1));
  });

  scoreTableBody.querySelectorAll("[data-minus]").forEach((button) => {
    button.addEventListener("click", () => updatePoints(button.dataset.minus, -1));
  });

  scoreTableBody.querySelectorAll("[data-win]").forEach((button) => {
    button.addEventListener("click", () => registerWin(button.dataset.win));
  });
}

function renderDraw() {
  drawResults.innerHTML = "";

  if (!latestDraw.length) {
    drawResults.innerHTML = `<p>Nenhum sorteio realizado ainda.</p>`;
    return;
  }

  const matches = [];
  for (let i = 0; i < latestDraw.length; i += 2) {
    const teamA = latestDraw[i];
    const teamB = latestDraw[i + 1];
    if (teamA && teamB) matches.push([teamA, teamB]);
  }

  matches.forEach((match, index) => {
    const card = document.createElement("article");
    card.className = "match-card";
    card.innerHTML = `
      <h3>Mesa ${index + 1}</h3>
      <p><strong>Dupla A:</strong> ${escapeHtml(match[0].join(" & "))}</p>
      <p><strong>Dupla B:</strong> ${escapeHtml(match[1].join(" & "))}</p>
    `;
    drawResults.appendChild(card);
  });
}

function renderBracket() {
  const s1A = latestDraw[0] ? latestDraw[0].join(" & ") : "Dupla 1";
  const s1B = latestDraw[1] ? latestDraw[1].join(" & ") : "Dupla 2";
  const s2A = latestDraw[2] ? latestDraw[2].join(" & ") : "Dupla 3";
  const s2B = latestDraw[3] ? latestDraw[3].join(" & ") : "Dupla 4";

  const canPlayFinal = Boolean(bracketState.semi1Winner && bracketState.semi2Winner);

  bracketBoard.innerHTML = `
    <section class="bracket-stage">
      <h3>Semifinal 1</h3>
      <div class="duel">
        <p>${escapeHtml(s1A)} <strong>vs</strong> ${escapeHtml(s1B)}</p>
        <div class="duel-buttons">
          <button class="action-btn" data-semi="semi1Winner" data-team="${escapeAttr(s1A)}">${escapeHtml(shortLabel(s1A))}</button>
          <button class="action-btn" data-semi="semi1Winner" data-team="${escapeAttr(s1B)}">${escapeHtml(shortLabel(s1B))}</button>
        </div>
      </div>
      <p>Vencedor: <strong>${escapeHtml(bracketState.semi1Winner || "A definir")}</strong></p>
    </section>

    <section class="bracket-stage">
      <h3>Semifinal 2</h3>
      <div class="duel">
        <p>${escapeHtml(s2A)} <strong>vs</strong> ${escapeHtml(s2B)}</p>
        <div class="duel-buttons">
          <button class="action-btn" data-semi="semi2Winner" data-team="${escapeAttr(s2A)}">${escapeHtml(shortLabel(s2A))}</button>
          <button class="action-btn" data-semi="semi2Winner" data-team="${escapeAttr(s2B)}">${escapeHtml(shortLabel(s2B))}</button>
        </div>
      </div>
      <p>Vencedor: <strong>${escapeHtml(bracketState.semi2Winner || "A definir")}</strong></p>
    </section>

    <section class="bracket-stage">
      <h3>Final</h3>
      <div class="duel">
        <p>${escapeHtml(bracketState.semi1Winner || "Vencedor Semi 1")} <strong>vs</strong> ${escapeHtml(bracketState.semi2Winner || "Vencedor Semi 2")}</p>
        <div class="duel-buttons">
          <button class="action-btn" data-final="${escapeAttr(bracketState.semi1Winner)}" ${canPlayFinal ? "" : "disabled"}>${escapeHtml(shortLabel(bracketState.semi1Winner || "Semi 1"))}</button>
          <button class="action-btn" data-final="${escapeAttr(bracketState.semi2Winner)}" ${canPlayFinal ? "" : "disabled"}>${escapeHtml(shortLabel(bracketState.semi2Winner || "Semi 2"))}</button>
        </div>
      </div>
      <p>Campeao: <strong>${escapeHtml(bracketState.finalWinner || "A definir")}</strong></p>
      ${bracketState.finalWinner ? `<div class="champion">🏆 ${escapeHtml(bracketState.finalWinner)}</div>` : ""}
    </section>
  `;

  bracketBoard.querySelectorAll("[data-semi]").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.semi;
      const team = button.dataset.team;
      if (!team || team.startsWith("Dupla")) return;
      bracketState[key] = team;
      bracketState.finalWinner = "";
      save(STORAGE_KEYS.bracket, bracketState);
      renderBracket();
    });
  });

  bracketBoard.querySelectorAll("[data-final]").forEach((button) => {
    button.addEventListener("click", () => {
      const team = button.dataset.final;
      if (!team) return;
      bracketState.finalWinner = team;
      save(STORAGE_KEYS.bracket, bracketState);
      renderBracket();
    });
  });
}

function shortLabel(team) {
  if (!team) return "Time";
  return team.length > 16 ? `${team.slice(0, 16)}...` : team;
}

function persistPlayers() {
  save(STORAGE_KEYS.players, players);
}

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(text) {
  return escapeHtml(text).replaceAll("`", "");
}
