// MECHE MECHE - Lógica principal do jogo
// Autor: Gerado por IA

// --- Seletores de elementos ---
const playerForm = document.getElementById('player-form');
const playerNameInput = document.getElementById('player-name');
const playerList = document.getElementById('player-list');
const startGameBtn = document.getElementById('start-game');
const playerSetupSection = document.getElementById('player-setup');
const gameSection = document.getElementById('game-section');
const finishGameBtn = document.getElementById('finish-game');
const resetAllBtn = document.getElementById('reset-all');
const showRankingBtn = document.getElementById('show-ranking');
const roundInfo = document.getElementById('round-info');
const currentRoundSpan = document.getElementById('current-round');
const pointsList = document.getElementById('points-list');
const scoreForm = document.getElementById('score-form');
const playersScoreInputs = document.getElementById('players-score-inputs');
const scoreTable = document.getElementById('score-table');
const rankingModal = document.getElementById('ranking-modal');
const closeRankingBtn = document.getElementById('close-ranking');
const rankingList = document.getElementById('ranking-list');
const finishModal = document.getElementById('finish-modal');
const finishScoreTable = document.getElementById('finish-score-table');
const continueGameBtn = document.getElementById('continue-game');
const confirmFinishBtn = document.getElementById('confirm-finish');
const winnerModal = document.getElementById('winner-modal');
const winnerName = document.getElementById('winner-name');
const newGameBtn = document.getElementById('new-game-btn');
const confettiContainer = document.getElementById('confetti-canvas-container');

// --- Estado do Jogo ---
let players = [];
let rounds = [];
let currentRound = 1;
let editingPlayerIndex = null;
let selectedPoints = null;

// --- Local Storage Helpers ---
const STORAGE_KEY = 'mechemeche_data';
function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ players, rounds, currentRound }));
}
function loadFromStorage() {
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
  if (data) {
    players = data.players || [];
    rounds = data.rounds || [];
    currentRound = data.currentRound || 1;
  }
}
function clearStorage() {
  localStorage.removeItem(STORAGE_KEY);
}

// --- Cadastro de Jogadores ---
function renderPlayerList() {
  playerList.innerHTML = '';
  players.forEach((player, idx) => {
    const li = document.createElement('li');
    li.textContent = player.name;
    const actions = document.createElement('span');
    actions.className = 'player-actions';
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Editar';
    editBtn.className = 'edit';
    editBtn.onclick = () => editPlayer(idx);
    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'Remover';
    removeBtn.onclick = () => removePlayer(idx);
    actions.appendChild(editBtn);
    actions.appendChild(removeBtn);
    li.appendChild(actions);
    playerList.appendChild(li);
  });
  startGameBtn.disabled = players.length < 2;
  playerNameInput.disabled = players.length >= 5;
  playerForm.querySelector('button[type="submit"]').disabled = players.length >= 5;
}

playerForm.onsubmit = function(e) {
  e.preventDefault();
  const name = playerNameInput.value.trim();
  if (!name) return;
  if (players.length >= 5) return;
  if (editingPlayerIndex !== null) {
    players[editingPlayerIndex].name = name;
    editingPlayerIndex = null;
    startGameBtn.textContent = 'Iniciar Partida';
  } else {
    players.push({ name, total: 0 });
  }
  playerNameInput.value = '';
  renderPlayerList();
  saveToStorage();
};

function editPlayer(idx) {
  playerNameInput.value = players[idx].name;
  editingPlayerIndex = idx;
  startGameBtn.textContent = 'Salvar Alteração';
}
function removePlayer(idx) {
  players.splice(idx, 1);
  renderPlayerList();
  saveToStorage();
}

startGameBtn.onclick = function() {
  if (players.length < 2) return;
  // Zera dados antigos
  rounds = [];
  currentRound = 1;
  players.forEach(p => p.total = 0);
  saveToStorage();
  showGameSection();
  renderGame();
};

function showGameSection() {
  playerSetupSection.classList.add('hidden');
  gameSection.classList.remove('hidden');
}
function showPlayerSetup() {
  playerSetupSection.classList.remove('hidden');
  gameSection.classList.add('hidden');
}

// --- Gerenciamento de Rodadas ---
function renderGame() {
  currentRoundSpan.textContent = currentRound;
  selectedPoints = Array(players.length).fill(null);
  renderPointsAvailable();
  renderScoreInputs();
  renderScoreTable();
}

function getPointsAvailable(numPlayers) {
  // Exemplo: 5 jogadores: [50, 40, 30, 20, 10]
  return Array.from({length: numPlayers}, (_, i) => (numPlayers - i) * 10);
}

function renderPointsAvailable() {
  pointsList.innerHTML = '';
  let used = Array.isArray(selectedPoints) ? selectedPoints.filter(pt => pt !== null) : [];
  let available = getPointsAvailable(players.length).filter(pt => !used.includes(pt));
  available.forEach(pt => {
    const li = document.createElement('li');
    li.textContent = pt + ' pts';
    pointsList.appendChild(li);
  });
  if (available.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'Nenhuma pontuação disponível';
    pointsList.appendChild(li);
  }
}

function renderScoreInputs() {
  playersScoreInputs.innerHTML = '';
  if (!Array.isArray(selectedPoints) || selectedPoints.length !== players.length) {
    selectedPoints = Array(players.length).fill(null);
  }
  // Cria selects e listeners
  players.forEach((player, idx) => {
    const label = document.createElement('label');
    label.textContent = player.name + ': ';
    const select = document.createElement('select');
    select.name = 'score-' + idx;
    select.dataset.playerIdx = idx;
    label.appendChild(select);
    playersScoreInputs.appendChild(label);
  });

  function updateSelectOptions() {
    for (let i = 0; i < players.length; i++) {
      const select = playersScoreInputs.querySelector(`select[name="score-${i}"]`);
      const currentValue = selectedPoints[i];
      // Pontos já selecionados por outros jogadores
      const used = selectedPoints.filter((pt, idx2) => pt !== null && idx2 !== i);
      select.innerHTML = '<option value="">Nenhum</option>';
      getPointsAvailable(players.length).forEach(pt => {
        if (!used.includes(pt) || currentValue == pt) {
          select.innerHTML += `<option value="${pt}"${currentValue == pt ? ' selected' : ''}>${pt} pts</option>`;
        }
      });
      select.value = currentValue !== null ? currentValue : '';
    }
    renderPointsAvailable();
    renderScoreTable();
  }

  // Adiciona listeners
  playersScoreInputs.querySelectorAll('select').forEach((select, idx) => {
    select.addEventListener('change', function() {
      selectedPoints[idx] = select.value ? parseInt(select.value) : null;
      updateSelectOptions();
    });
  });

  updateSelectOptions();
}

scoreForm.onsubmit = function(e) {
  e.preventDefault();
  // Coleta pontuações
  const scores = [];
  const usedPoints = [];
  let available = getPointsAvailable(players.length);
  for (let i = 0; i < players.length; i++) {
    const select = scoreForm.querySelector(`select[name="score-${i}"]`);
    let val = select.value ? parseInt(select.value) : null;
    // Regras de exclusividade: só pode pegar o próximo ponto disponível
    if (val && !available.includes(val)) val = null;
    if (val) {
      scores.push({ playerIdx: i, points: val });
      usedPoints.push(val);
      // Remove pontos já pegos
      available = available.filter(p => p !== val);
    }
  }
  // Preenche com null para quem não pegou ponto
  for (let i = 0; i < players.length; i++) {
    if (!scores.find(s => s.playerIdx === i)) {
      scores.push({ playerIdx: i, points: null });
    }
  }
  // Salva rodada
  rounds[currentRound-1] = { scores: scores.sort((a,b)=>a.playerIdx-b.playerIdx) };
  // Atualiza totais
  players.forEach((p, idx) => {
    p.total = 0;
    for (let r of rounds) {
      if (r && r.scores[idx].points) p.total += r.scores[idx].points;
    }
  });
  saveToStorage();
  currentRound++; // Avança para a próxima rodada
  renderGame();
};

// --- Tabela de Pontuação e Histórico ---
function renderScoreTable() {
  scoreTable.innerHTML = '';
  // Cabeçalho
  const thead = document.createElement('thead');
  const trh = document.createElement('tr');
  trh.innerHTML = '<th>Jogador</th>';
  for (let i = 1; i <= Math.max(rounds.length, currentRound); i++) {
    trh.innerHTML += `<th>R${i}</th>`;
  }
  trh.innerHTML += '<th>Total</th>';
  thead.appendChild(trh);
  scoreTable.appendChild(thead);
  // Corpo
  const tbody = document.createElement('tbody');
  players.forEach((player, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${player.name}</td>`;
    let total = 0;
    for (let i = 0; i < Math.max(rounds.length, currentRound); i++) {
      let pts = null;
      if (i < rounds.length && rounds[i]?.scores[idx]) {
        pts = rounds[i].scores[idx].points;
      } else if (i === currentRound - 1 && Array.isArray(selectedPoints)) {
        pts = selectedPoints[idx];
      }
      tr.innerHTML += `<td>${pts ? pts : '-'}</td>`;
      if (pts) total += pts;
    }
    tr.innerHTML += `<td class="total">${total}</td>`;
    tbody.appendChild(tr);
  });
  scoreTable.appendChild(tbody);
}

// --- Finalizar Partida ---
finishGameBtn.onclick = function() {
  renderFinishScoreTable();
  finishModal.classList.remove('hidden');
};

function renderFinishScoreTable() {
  finishScoreTable.innerHTML = '';
  // Cabeçalho
  const thead = document.createElement('thead');
  const trh = document.createElement('tr');
  trh.innerHTML = '<th>Jogador</th>';
  for (let i = 1; i <= Math.max(rounds.length, currentRound); i++) {
    trh.innerHTML += `<th>R${i}</th>`;
  }
  trh.innerHTML += '<th>Total</th>';
  thead.appendChild(trh);
  finishScoreTable.appendChild(thead);
  // Corpo
  const tbody = document.createElement('tbody');
  players.forEach((player, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${player.name}</td>`;
    let total = 0;
    for (let i = 0; i < Math.max(rounds.length, currentRound); i++) {
      let pts = null;
      if (i < rounds.length && rounds[i]?.scores[idx]) {
        pts = rounds[i].scores[idx].points;
      } else if (i === currentRound - 1 && Array.isArray(selectedPoints)) {
        pts = selectedPoints[idx];
      }
      tr.innerHTML += `<td>${pts ? pts : '-'}</td>`;
      if (pts) total += pts;
    }
    tr.innerHTML += `<td class="total">${total}</td>`;
    tbody.appendChild(tr);
  });
  finishScoreTable.appendChild(tbody);
}

continueGameBtn.onclick = function() {
  finishModal.classList.add('hidden');
};

confirmFinishBtn.onclick = function() {
  // Descobre o vencedor (maior pontuação) ANTES de zerar
  let max = Math.max(...players.map(p => p.total));
  let winners = players.filter(p => p.total === max);
  let winnerNames = winners.length === 1 ? winners[0].name : winners.map(p => p.name).join(', ');

  // Limpa apenas rounds e pontuação, mantém jogadores
  rounds = [];
  currentRound = 1;
  players.forEach(p => p.total = 0);
  selectedPoints = null;
  saveToStorage();
  finishModal.classList.add('hidden');
  // Mostrar modal de vencedor com nomes corretos
  showWinnerModal(winnerNames);
};

function showWinnerModal(winnerNames) {
  winnerName.textContent = winnerNames;
  winnerModal.classList.remove('hidden');
  startConfetti();
}

newGameBtn.onclick = function() {
  winnerModal.classList.add('hidden');
  stopConfetti();
  showPlayerSetup();
  renderPlayerList();
};

// Confete simples
let confettiInterval;
function startConfetti() {
  confettiContainer.innerHTML = '';
  let colors = ['#FFD700','#FF69B4','#00CFFF','#7CFC00','#FF6347'];
  let confettiPieces = [];
  for (let i = 0; i < 80; i++) {
    let div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.width = '10px';
    div.style.height = '18px';
    div.style.background = colors[Math.floor(Math.random()*colors.length)];
    div.style.left = Math.random()*100 + '%';
    div.style.top = (Math.random()*-40) + 'px';
    div.style.opacity = 0.8;
    div.style.borderRadius = '3px';
    div.style.transform = `rotate(${Math.random()*360}deg)`;
    confettiContainer.appendChild(div);
    confettiPieces.push({el:div, x:parseFloat(div.style.left), y:parseFloat(div.style.top), speed:1+Math.random()*2, rot:Math.random()*360, rotSpeed:Math.random()*6-3});
  }
  confettiInterval = setInterval(()=>{
    confettiPieces.forEach(piece => {
      piece.y += piece.speed;
      piece.rot += piece.rotSpeed;
      if (piece.y > 300) piece.y = Math.random()*-40;
      piece.el.style.top = piece.y + 'px';
      piece.el.style.transform = `rotate(${piece.rot}deg)`;
    });
  }, 16);
}
function stopConfetti() {
  clearInterval(confettiInterval);
  confettiContainer.innerHTML = '';
}

// --- Redefinir Tudo ---
resetAllBtn.onclick = function() {
  if (confirm('Tem certeza que deseja limpar todos os dados?')) {
    players = [];
    rounds = [];
    currentRound = 1;
    editingPlayerIndex = null;
    clearStorage();
    showPlayerSetup();
    renderPlayerList();
  }
};

// --- Ranking Final ---
showRankingBtn.onclick = showRanking;
closeRankingBtn.onclick = function() {
  rankingModal.classList.add('hidden');
};
function showRanking() {
  rankingList.innerHTML = '';
  const ranking = [...players].sort((a,b)=>b.total-a.total);
  ranking.forEach((p) => {
    const li = document.createElement('li');
    li.textContent = `${p.name}: ${p.total} pts`;
    rankingList.appendChild(li);
  });
  rankingModal.classList.remove('hidden');
}

// --- Inicialização ---
function init() {
  loadFromStorage();
  if (players.length >= 2 && rounds.length > 0) {
    showGameSection();
    renderGame();
  } else {
    showPlayerSetup();
    renderPlayerList();
  }
}

init(); 