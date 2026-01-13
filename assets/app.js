const upgradeData = [
  {
    id: 'scoop-bot',
    name: 'Scoop Bot',
    description: 'A pint-sized robot that never drops a cone.',
    baseCost: 15,
    costMultiplier: 1.25,
    perSecond: 0.4,
    perClick: 0,
    flavor: 'Nebula Vanilla',
  },
  {
    id: 'astro-freezer',
    name: 'Astro Freezer',
    description: 'Keeps the ice crystals spinning even while you nap.',
    baseCost: 50,
    costMultiplier: 1.3,
    perSecond: 1.4,
    perClick: 0,
    flavor: 'Comet Crunch',
  },
  {
    id: 'glitter-scooper',
    name: 'Glitter Scooper',
    description: 'Doubles the sparkle of every manual scoop.',
    baseCost: 35,
    costMultiplier: 1.32,
    perSecond: 0,
    perClick: 1,
    flavor: 'Starlight Swirl',
  },
  {
    id: 'moon-crew',
    name: 'Moon Crew',
    description: 'Three night-shift baristas from the Sea of Tranquility.',
    baseCost: 120,
    costMultiplier: 1.35,
    perSecond: 3.2,
    perClick: 0,
    flavor: 'Lunar Lavender',
  },
  {
    id: 'warp-blender',
    name: 'Warp Blender',
    description: 'Blends fifty milkshakes in the blink of a quasar.',
    baseCost: 240,
    costMultiplier: 1.38,
    perSecond: 6.5,
    perClick: 0,
    flavor: 'Photon Pistachio',
  },
  {
    id: 'galaxy-ad',
    name: 'Galaxy Ad Campaign',
    description: 'Influencers on every planet boost click power.',
    baseCost: 180,
    costMultiplier: 1.36,
    perSecond: 0,
    perClick: 2,
    flavor: 'Influencer Fudge',
  },
];

const milestones = [
  { threshold: 100, label: 'Sell 100 scoops' },
  { threshold: 400, label: 'Open 3 pop-up moons' },
  { threshold: 900, label: 'Launch the comet drive-thru' },
  { threshold: 1600, label: 'Host the Interstellar Sundae Festival' },
];

const crewMoods = ['Peppy', 'Giddy', 'Overcaffeinated', 'Stellar', 'Legendary'];

const state = {
  stardust: 0,
  totalScoops: 0,
  perClick: 1,
  perSecond: 0,
  upgrades: {},
  boost: {
    active: false,
    endsAt: 0,
    cooldownEndsAt: 0,
  },
};

const elements = {
  stardust: document.querySelector('#stardust-count'),
  perClick: document.querySelector('#per-click'),
  perSecond: document.querySelector('#per-second'),
  crewMood: document.querySelector('#crew-mood'),
  milestone: document.querySelector('#milestone'),
  milestoneBar: document.querySelector('#milestone-bar'),
  milestoneContainer: document.querySelector('.progress-bar'),
  scoopButton: document.querySelector('#scoop-button'),
  boostButton: document.querySelector('#boost-button'),
  boostStatus: document.querySelector('#boost-status'),
  boostTimer: document.querySelector('#boost-timer'),
  upgradeList: document.querySelector('#upgrade-list'),
  flavorList: document.querySelector('#flavor-list'),
  logLine: document.querySelector('#log-line'),
  resetButton: document.querySelector('#reset-button'),
};

const formatNumber = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });

function loadGame() {
  const saved = localStorage.getItem('starlight-scoop');
  if (!saved) return;
  try {
    const parsed = JSON.parse(saved);
    if (typeof parsed.stardust === 'number') state.stardust = parsed.stardust;
    if (typeof parsed.totalScoops === 'number') state.totalScoops = parsed.totalScoops;
    if (typeof parsed.perClick === 'number') state.perClick = parsed.perClick;
    if (typeof parsed.perSecond === 'number') state.perSecond = parsed.perSecond;
    if (parsed.upgrades && typeof parsed.upgrades === 'object') state.upgrades = parsed.upgrades;
    if (parsed.boost) state.boost = parsed.boost;
  } catch (error) {
    console.warn('Save data was malformed. Starting fresh.');
  }
}

function saveGame() {
  localStorage.setItem('starlight-scoop', JSON.stringify(state));
}

function getUpgradeCount(id) {
  return state.upgrades[id] || 0;
}

function getUpgradeCost(upgrade) {
  const count = getUpgradeCount(upgrade.id);
  return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, count));
}

function applyUpgrade(upgrade) {
  state.perSecond += upgrade.perSecond;
  state.perClick += upgrade.perClick;
  state.upgrades[upgrade.id] = getUpgradeCount(upgrade.id) + 1;
  logMessage(`${upgrade.name} online. Scooping efficiency up!`);
}

function logMessage(message) {
  elements.logLine.textContent = message;
}

function updateFlavorBoard() {
  elements.flavorList.innerHTML = '';
  const unlocked = upgradeData
    .filter((upgrade) => getUpgradeCount(upgrade.id) > 0)
    .map((upgrade) => upgrade.flavor);

  if (unlocked.length === 0) {
    const item = document.createElement('li');
    item.textContent = 'Unlock upgrades to discover new flavors.';
    elements.flavorList.append(item);
    return;
  }

  unlocked.forEach((flavor) => {
    const item = document.createElement('li');
    item.innerHTML = `<span>${flavor}</span><span>🍧</span>`;
    elements.flavorList.append(item);
  });
}

function updateMilestone() {
  const next = milestones.find((entry) => state.totalScoops < entry.threshold) || milestones[milestones.length - 1];
  elements.milestone.textContent = next.label;
  const previousThreshold = milestones
    .filter((entry) => entry.threshold < next.threshold)
    .slice(-1)[0]?.threshold ?? 0;
  const progress = Math.min(
    100,
    ((state.totalScoops - previousThreshold) / (next.threshold - previousThreshold)) * 100,
  );
  elements.milestoneBar.style.width = `${progress}%`;
  elements.milestoneContainer.setAttribute('aria-valuenow', Math.floor(progress).toString());
}

function updateCrewMood() {
  const moodIndex = Math.min(crewMoods.length - 1, Math.floor(state.totalScoops / 400));
  elements.crewMood.textContent = crewMoods[moodIndex];
}

function updateUpgrades() {
  elements.upgradeList.innerHTML = '';
  upgradeData.forEach((upgrade) => {
    const card = document.createElement('div');
    card.className = 'upgrade-card';
    const cost = getUpgradeCost(upgrade);
    const count = getUpgradeCount(upgrade.id);
    card.innerHTML = `
      <div>
        <h3>${upgrade.name}</h3>
        <p>${upgrade.description}</p>
        <div class="upgrade-meta">
          <span>Owned: ${count}</span>
          <span>Cost: ${cost} ✨</span>
        </div>
      </div>
    `;
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Buy';
    button.disabled = state.stardust < cost;
    button.addEventListener('click', () => {
      if (state.stardust < cost) return;
      state.stardust -= cost;
      applyUpgrade(upgrade);
      updateUpgrades();
      updateStats();
      updateFlavorBoard();
      saveGame();
    });
    card.append(button);
    elements.upgradeList.append(card);
  });
}

function updateBoostUI(now) {
  if (state.boost.active) {
    const remainingMs = Math.max(0, state.boost.endsAt - now);
    elements.boostStatus.textContent = 'Sugar Rush active! +100% output';
    elements.boostTimer.textContent = formatTimer(remainingMs);
    elements.boostButton.disabled = true;
    return;
  }

  if (state.boost.cooldownEndsAt > now) {
    const remainingMs = state.boost.cooldownEndsAt - now;
    elements.boostStatus.textContent = 'Sugar Rush cooling down';
    elements.boostTimer.textContent = formatTimer(remainingMs);
    elements.boostButton.disabled = true;
    return;
  }

  elements.boostStatus.textContent = 'Boost ready';
  elements.boostTimer.textContent = '00:00';
  elements.boostButton.disabled = false;
}

function updateStats() {
  elements.stardust.textContent = formatNumber.format(state.stardust);
  elements.perClick.textContent = formatNumber.format(state.perClick);
  elements.perSecond.textContent = formatNumber.format(state.perSecond);
  updateMilestone();
  updateCrewMood();
}

function formatTimer(milliseconds) {
  const totalSeconds = Math.ceil(milliseconds / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function addScoops(amount) {
  state.stardust += amount;
  state.totalScoops += amount;
}

function handleScoop() {
  const multiplier = state.boost.active ? 2 : 1;
  addScoops(state.perClick * multiplier);
  logMessage('Scoop delivered! Stardust sprinkles everywhere.');
  updateStats();
  updateUpgrades();
  saveGame();
}

function startBoost() {
  const now = Date.now();
  if (state.boost.active || state.boost.cooldownEndsAt > now) return;
  state.boost.active = true;
  state.boost.endsAt = now + 20000;
  state.boost.cooldownEndsAt = now + 60000;
  logMessage('Sugar Rush engaged. Double output for 20 seconds!');
  saveGame();
}

function resetGame() {
  state.stardust = 0;
  state.totalScoops = 0;
  state.perClick = 1;
  state.perSecond = 0;
  state.upgrades = {};
  state.boost = { active: false, endsAt: 0, cooldownEndsAt: 0 };
  logMessage('Fresh cart deployed. Ready for a new run.');
  saveGame();
  updateStats();
  updateUpgrades();
  updateFlavorBoard();
}

function gameLoop(timestamp) {
  const multiplier = state.boost.active ? 2 : 1;
  if (!gameLoop.lastTime) gameLoop.lastTime = timestamp;
  const delta = (timestamp - gameLoop.lastTime) / 1000;
  if (delta >= 1) {
    const ticks = Math.floor(delta);
    addScoops(state.perSecond * ticks * multiplier);
    gameLoop.lastTime = timestamp;
    updateStats();
    updateUpgrades();
    saveGame();
  }

  const now = Date.now();
  if (state.boost.active && now >= state.boost.endsAt) {
    state.boost.active = false;
  }
  updateBoostUI(now);
  requestAnimationFrame(gameLoop);
}

function init() {
  loadGame();
  elements.scoopButton.addEventListener('click', handleScoop);
  elements.boostButton.addEventListener('click', startBoost);
  elements.resetButton.addEventListener('click', resetGame);
  updateStats();
  updateUpgrades();
  updateFlavorBoard();
  updateBoostUI(Date.now());
  requestAnimationFrame(gameLoop);
}

init();
