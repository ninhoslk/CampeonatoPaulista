// Banco de dados em LocalStorage
let players = JSON.parse(localStorage.getItem('truco_players')) || [];

// 1. ANIMAÇÃO DE ENTRADA
window.onload = () => {
    setTimeout(() => {
        const intro = document.getElementById('intro-screen');
        const app = document.getElementById('app');
        
        intro.style.transition = 'opacity 1s ease';
        intro.style.opacity = '0';
        
        setTimeout(() => {
            intro.style.display = 'none';
            app.classList.remove('hidden');
            renderAll();
        }, 1000);
    }, 3500);
};

// 2. NAVEGAÇÃO
function switchTab(tabId) {
    document.querySelectorAll('.tab-pane').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(`tab-${tabId}`).classList.add('active');
    event.currentTarget.classList.add('active');
}

// 3. JOGADORES
function addPlayer() {
    const name = document.getElementById('playerInput').value.trim();
    if (!name) return;

    players.push({
        id: Date.now(),
        name: name,
        points: 0,
        wins: 0
    });

    document.getElementById('playerInput').value = '';
    saveAndRender();
}

function removePlayer(id) {
    players = players.filter(p => p.id !== id);
    saveAndRender();
}

function updateScore(id, pts, win = 0) {
    const player = players.find(p => p.id === id);
    if (player) {
        player.points = Math.max(0, player.points + pts);
        player.wins = Math.max(0, player.wins + win);
        saveAndRender();
    }
}

// 4. SORTEIO
function handleShuffle() {
    if (players.length < 4) return alert("Mínimo de 4 jogadores!");

    const anim = document.getElementById('shuffle-anim');
    const results = document.getElementById('drawResults');
    
    results.innerHTML = '';
    anim.classList.remove('hidden');

    setTimeout(() => {
        anim.classList.add('hidden');
        const shuffled = [...players].sort(() => Math.random() - 0.5);
        
        for (let i = 0; i < shuffled.length - 3; i += 4) {
            const mNum = (i/4) + 1;
            results.innerHTML += `
                <div class="mesa">
                    <h3>Mesa ${mNum}</h3>
                    <p>🔵 ${shuffled[i].name} + ${shuffled[i+1].name}</p>
                    <div style="font-size: 0.7rem; color: #444; margin: 5px 0;">VERSUS</div>
                    <p>🔴 ${shuffled[i+2].name} + ${shuffled[i+3].name}</p>
                </div>
            `;
            // Alimenta a chave automaticamente com os primeiros sorteados
            if(mNum === 1) {
                document.getElementById('sf1-1').innerText = shuffled[i].name + " / " + shuffled[i+1].name;
                document.getElementById('sf1-2').innerText = shuffled[i+2].name + " / " + shuffled[i+3].name;
            }
            if(mNum === 2) {
                document.getElementById('sf2-1').innerText = shuffled[i].name + " / " + shuffled[i+1].name;
                document.getElementById('sf2-2').innerText = shuffled[i+2].name + " / " + shuffled[i+3].name;
            }
        }
    }, 2000);
}

// 5. LÓGICA DA CHAVE
function winMatch(matchId, nextSlotId) {
    const winner = prompt("Qual dupla venceu? (Digite 1 ou 2)");
    if(winner !== '1' && winner !== '2') return;

    const winTeamName = document.getElementById(`${matchId}-${winner}`).innerText;
    
    // Marca visualmente
    document.getElementById(`${matchId}-1`).classList.remove('winner');
    document.getElementById(`${matchId}-2`).classList.remove('winner');
    document.getElementById(`${matchId}-${winner}`).classList.add('winner');

    // Passa para a final
    if(nextSlotId === 'f1') document.getElementById('f-1').innerText = winTeamName;
    if(nextSlotId === 'f2') document.getElementById('f-2').innerText = winTeamName;
}

function winFinal() {
    const winner = prompt("Quem é o CAMPEÃO? (Digite 1 ou 2)");
    if(winner !== '1' && winner !== '2') return;

    const winTeamName = document.getElementById(`f-${winner}`).innerText;
    document.getElementById('champion-name').innerText = winTeamName;
    document.getElementById('champion-box').style.background = 'var(--primary)';
}

// 6. AUXILIARES
function saveAndRender() {
    localStorage.setItem('truco_players', JSON.stringify(players));
    renderAll();
}

function renderAll() {
    const pTable = document.getElementById('playerTable');
    const sTable = document.getElementById('scoreTable');
    
    pTable.innerHTML = '';
    sTable.innerHTML = '';

    players.forEach(p => {
        pTable.innerHTML += `
            <tr>
                <td>${p.name}</td>
                <td class="text-right"><button class="btn-win" onclick="removePlayer(${p.id})">Remover</button></td>
            </tr>
        `;

        sTable.innerHTML += `
            <tr>
                <td>${p.name}</td>
                <td>${p.points}</td>
                <td>${p.wins}</td>
                <td class="text-center">
                    <button class="btn-win" onclick="updateScore(${p.id}, 1)">+ Ponto</button>
                    <button class="btn-win" onclick="updateScore(${p.id}, 0, 1)" style="color:var(--neon)">+ Vitória</button>
                </td>
            </tr>
        `;
    });
}
