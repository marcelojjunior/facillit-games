// MECHE MECHE - Lógica principal do jogo
// Autor: Gerado por IA

// --- Seletores de elementos ---
const playerForm = document.getElementById('player-form');
const playerInput = document.getElementById('player-name');
const playersList = document.getElementById('player-list');
const startGameBtn = document.getElementById('start-game');
const playerSetupSection = document.getElementById('player-setup');
const gameSection = document.getElementById('game-section');
const finishGameBtn = document.getElementById('finish-game');
const resetAllBtn = document.getElementById('reset-all');
const roundInfo = document.getElementById('round-info');
const currentRoundSpan = document.getElementById('current-round');
const pointsList = document.getElementById('points-list');
const scoreForm = document.getElementById('score-form');
const playersScoreInputs = document.getElementById('players-score-inputs');
const scoreTable = document.getElementById('score-table');
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
let editingIndex = null;
let selectedPoints = null;
let bonusPoints = [];

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
function renderPlayers() {
  playersList.innerHTML = '';
  players.forEach((playerObj, idx) => {
    const player = typeof playerObj === 'string' ? { nome: playerObj, total: 0 } : playerObj;
    players[idx] = player; // Garante que todos são objetos
    const li = document.createElement('li');
    li.className = 'player-card';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'player-name';
    nameSpan.textContent = player.nome;
    nameSpan.style.marginRight = '18px';

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'player-actions';

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.className = 'action-btn edit';
    editBtn.innerHTML = '<i class="fas fa-pencil-alt"></i>';
    editBtn.title = 'Editar';
    editBtn.onclick = () => startEditPlayer(idx);

    // Remove button
    const removeBtn = document.createElement('button');
    removeBtn.className = 'action-btn remove';
    removeBtn.innerHTML = '<i class="fas fa-trash"></i>';
    removeBtn.title = 'Remover';
    removeBtn.onclick = () => removePlayer(idx);

    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(removeBtn);

    li.appendChild(nameSpan);
    li.appendChild(actionsDiv);
    playersList.appendChild(li);
  });
  startGameBtn.disabled = players.length < 2;
  playerInput.disabled = players.length >= 5;
  document.getElementById('add-player-btn').disabled = players.length >= 5;
}

function addPlayer(name) {
  if (!name.trim() || players.length >= 5) return;
  players.push({ nome: name.trim(), total: 0 });
  renderPlayers();
  playerInput.value = '';
  playerInput.focus();
}

function startEditPlayer(idx) {
  editingIndex = idx;
  playerInput.value = players[idx].nome;
  playerInput.focus();
  playerInput.select();
  document.getElementById('add-player-btn').innerHTML = '<i class="fas fa-check"></i>';
}

function finishEditPlayer(newName) {
  if (editingIndex === null || !newName.trim()) return;
  players[editingIndex].nome = newName.trim();
  editingIndex = null;
  renderPlayers();
  playerInput.value = '';
  document.getElementById('add-player-btn').innerHTML = '<i class="fas fa-plus"></i>';
}

function removePlayer(idx) {
  players.splice(idx, 1);
  renderPlayers();
}

playerForm.addEventListener('submit', function(e) {
  e.preventDefault();
  if (editingIndex !== null) {
    finishEditPlayer(playerInput.value);
  } else {
    addPlayer(playerInput.value);
  }
});

playerInput.addEventListener('input', function() {
  if (editingIndex !== null && playerInput.value.trim() === players[editingIndex].nome) {
    document.getElementById('add-player-btn').innerHTML = '<i class="fas fa-check"></i>';
  } else if (editingIndex !== null) {
    document.getElementById('add-player-btn').innerHTML = '<i class="fas fa-check"></i>';
  } else {
    document.getElementById('add-player-btn').innerHTML = '<i class="fas fa-plus"></i>';
  }
});

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
  if (!Array.isArray(bonusPoints) || bonusPoints.length !== players.length) {
    bonusPoints = Array(players.length).fill(false);
  }
  // Cria selects e listeners
  players.forEach((player, idx) => {
    const label = document.createElement('label');
    label.textContent = player.nome + ': ';
    const select = document.createElement('select');
    select.name = 'score-' + idx;
    select.dataset.playerIdx = idx;
    label.appendChild(select);

    // Botão de bônus
    const bonusBtn = document.createElement('button');
    bonusBtn.type = 'button';
    bonusBtn.className = 'bonus-btn';
    bonusBtn.innerHTML = bonusPoints[idx] ? '★ +10' : '☆ +10';
    bonusBtn.title = 'Marcar ponto adicional';
    bonusBtn.style.marginLeft = '8px';
    bonusBtn.onclick = () => {
      bonusPoints[idx] = !bonusPoints[idx];
      renderScoreInputs();
    };
    label.appendChild(bonusBtn);

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
      scores.push({ playerIdx: i, points: val, bonus: bonusPoints[i] ? 10 : 0 });
      usedPoints.push(val);
      // Remove pontos já pegos
      available = available.filter(p => p !== val);
    } else {
      scores.push({ playerIdx: i, points: null, bonus: bonusPoints[i] ? 10 : 0 });
    }
  }
  // Salva rodada
  rounds[currentRound-1] = { scores: scores.sort((a,b)=>a.playerIdx-b.playerIdx) };
  // Atualiza totais
  players.forEach((p, idx) => {
    p.total = 0;
    for (let r of rounds) {
      if (r && r.scores[idx].points) p.total += r.scores[idx].points;
      if (r && r.scores[idx].bonus) p.total += r.scores[idx].bonus;
    }
  });
  saveToStorage();
  currentRound++; // Avança para a próxima rodada
  bonusPoints = Array(players.length).fill(false); // Reseta bônus para próxima rodada
  renderGame();
};

// --- Tabela de Pontuação e Histórico ---
function renderScoreTable() {
  scoreTable.innerHTML = '';
  // Cabeçalho
  const thead = document.createElement('thead');
  const trh = document.createElement('tr');
  trh.innerHTML = '<th>Jogador</th>';
  for (let i = 1; i <= rounds.length; i++) {
    trh.innerHTML += `<th>R${i}</th>`;
  }
  trh.innerHTML += '<th>Total</th>';
  thead.appendChild(trh);
  scoreTable.appendChild(thead);
  // Corpo
  const tbody = document.createElement('tbody');
  players.forEach((player, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${player.nome}</td>`;
    let total = 0;
    for (let i = 0; i < rounds.length; i++) {
      let pts = null;
      let bonus = null;
      if (i < rounds.length && rounds[i]?.scores[idx]) {
        pts = rounds[i].scores[idx].points;
        bonus = rounds[i].scores[idx].bonus;
      }
      let cell = '-';
      if (pts !== null && pts !== undefined) {
        cell = pts;
        if (bonus && bonus > 0) {
          cell += ` (+${bonus})`;
        }
        total += pts + (bonus || 0);
      } else if (bonus && bonus > 0) {
        cell = `(+${bonus})`;
        total += bonus;
      }
      tr.innerHTML += `<td>${cell}</td>`;
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
  // Atualiza totais antes de exibir
  players.forEach((p, idx) => {
    if (typeof p === 'object') {
      p.total = 0;
      for (let r of rounds) {
        if (r && r.scores[idx].points) p.total += r.scores[idx].points;
        if (r && r.scores[idx].bonus) p.total += r.scores[idx].bonus;
      }
    }
  });
  // Cabeçalho
  const thead = document.createElement('thead');
  const trh = document.createElement('tr');
  trh.innerHTML = '<th>Posição</th><th>Jogador</th><th>Pontuação</th>';
  thead.appendChild(trh);
  finishScoreTable.appendChild(thead);
  // Corpo
  const tbody = document.createElement('tbody');
  // Ordena jogadores por pontuação decrescente
  const ranking = players
    .map((p, idx) => ({ nome: typeof p === 'string' ? p : p.nome || p, total: typeof p === 'object' ? p.total : 0 }))
    .sort((a, b) => b.total - a.total);
  let pos = 1;
  let lastScore = null;
  let realPos = 1;
  ranking.forEach((p, idx) => {
    if (lastScore !== null && p.total < lastScore) {
      realPos = pos;
    }
    const tr = document.createElement('tr');
    const nomeCapitalizado = p.nome.charAt(0).toUpperCase() + p.nome.slice(1).toLowerCase();
    tr.innerHTML = `<td style='font-weight:700;'>${realPos}º</td><td style='padding: 10px 18px;'>${nomeCapitalizado}</td><td class="total" style='padding: 10px 18px;'>${p.total}</td>`;
    tbody.appendChild(tr);
    lastScore = p.total;
    pos++;
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
  let winnerNames = winners.map(w => w.nome.charAt(0).toUpperCase() + w.nome.slice(1).toLowerCase());

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
  // winnerNames agora é sempre array de string
  let nomes = Array.isArray(winnerNames) ? winnerNames.join(', ') : winnerNames;
  winnerName.textContent = nomes;
  winnerModal.classList.remove('hidden');
  startConfetti();
}

newGameBtn.onclick = function() {
  winnerModal.classList.add('hidden');
  stopConfetti();
  showPlayerSetup();
  renderPlayers();
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
  if (confirm('Tem certeza que deseja reiniciar a partida? Isso irá zerar as rodadas e pontuações, mas manterá os jogadores.')) {
    rounds = [];
    currentRound = 1;
    editingIndex = null;
    players.forEach(p => p.total = 0);
    selectedPoints = null;
    saveToStorage();
    showPlayerSetup();
    renderPlayers();
  }
};

// --- Inicialização ---
function init() {
  loadFromStorage();
  if (players.length >= 2 && rounds.length > 0) {
    showGameSection();
    renderGame();
  } else {
    showPlayerSetup();
    renderPlayers();
  }
}

init(); 