// All DOM rendering lives here

let activeTab = "contracts";

document.addEventListener("click", (e) => {
  const tabBtn = e.target.closest(".tab-btn");
  if (tabBtn) {
    activeTab = tabBtn.dataset.tab;
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.toggle("active", b === tabBtn));
    render();
    closeSidebar();
  }
});

function openSidebar() {
  document.getElementById("sidebar").classList.add("open");
  document.getElementById("sidebar-backdrop").classList.remove("hidden");
}
function closeSidebar() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("sidebar-backdrop").classList.add("hidden");
}
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  if (sidebar.classList.contains("open")) closeSidebar();
  else openSidebar();
}

document.getElementById("nav-toggle").addEventListener("click", toggleSidebar);
document.getElementById("sidebar-backdrop").addEventListener("click", closeSidebar);

function render() {
  renderStats();
  renderTabContent();
  renderLog();
  renderBurnOverlay();
  if (phoneOpenContact === "__requests__") renderDrugRequestsView();
  if (phoneOpenContact === "__gunorders__") renderGunOrdersView();
  if (phoneOpenContact === "__watchorders__") renderWatchOrdersView();
  if (phoneOpenContact === "__home__") renderPhoneHome();
  if (phoneOpenContact === "__books__") renderBooksView();
}

function renderStats() {
  const tierIdx = currentTierIndex();
  const tier = TIERS[tierIdx];
  const nextTier = TIERS[tierIdx + 1];
  const repPct = nextTier
    ? Math.min(100, ((state.rep - tier.repReq) / (nextTier.repReq - tier.repReq)) * 100)
    : 100;

  document.getElementById("stats").innerHTML = `
    <div class="stat">
      <span class="stat-label">Cash</span>
      <span class="stat-value cash">${fmt(state.cash)}</span>
    </div>
    <div class="stat">
      <span class="stat-label">Bank</span>
      <span class="stat-value bank">${fmt(state.bankBalance)}</span>
    </div>
    <div class="stat heat-stat">
      <span class="stat-label">Suspicion</span>
      <div class="heat-bar"><div class="heat-fill" style="width:${state.heat}%"></div></div>
    </div>
    <div class="stat">
      <span class="stat-label">${tier.name}</span>
      <div class="rep-bar"><div class="rep-fill" style="width:${repPct}%"></div></div>
    </div>
    <div class="stat">
      <span class="stat-label">📍 ${(CITIES.find((c) => c.id === state.currentCity) || CITIES[0]).name}</span>
    </div>
  `;
}

function renderTabContent() {
  const el = document.getElementById("tab-content");

  // The game loop re-renders every second, which would otherwise wipe out
  // whatever the player is mid-typing into a field inside this tab.
  const active = document.activeElement;
  const preserve =
    active && el.contains(active) && active.id
      ? { id: active.id, value: active.value, selStart: active.selectionStart, selEnd: active.selectionEnd }
      : null;

  if (activeTab === "contracts") el.innerHTML = contractsTabHTML();
  else if (activeTab === "arsenal") el.innerHTML = arsenalTabHTML();
  else if (activeTab === "flex") el.innerHTML = flexTabHTML();
  else if (activeTab === "bank") el.innerHTML = bankTabHTML();
  else if (activeTab === "casino") el.innerHTML = casinoTabHTML();
  else if (activeTab === "businesses") el.innerHTML = businessesTabHTML();
  else if (activeTab === "housing") el.innerHTML = housingTabHTML();
  else if (activeTab === "bills") el.innerHTML = billsTabHTML();
  else if (activeTab === "world") el.innerHTML = worldTabHTML();
  else if (activeTab === "laylow") el.innerHTML = laylowTabHTML();
  else if (activeTab === "profile") el.innerHTML = profileTabHTML();
  bindTabEvents();

  if (preserve) {
    const restored = document.getElementById(preserve.id);
    if (restored) {
      restored.value = preserve.value;
      restored.focus();
      if (typeof restored.setSelectionRange === "function" && restored.type !== "number") {
        try {
          restored.setSelectionRange(preserve.selStart, preserve.selEnd);
        } catch (e) {}
      }
    }
  }
}

function contractsTabHTML() {
  const tierIdx = currentTierIndex();
  const burned = Date.now() < state.burnedUntil;
  let activeHTML = "";

  if (burned) {
    const remain = Math.ceil((state.burnedUntil - Date.now()) / 1000);
    activeHTML = `<div class="active-contract burned">Lying low... back in ${remain}s</div>`;
  } else if (state.activeContracts.length > 0) {
    activeHTML = state.activeContracts.map((ac) => {
      const c = findContractById(ac.contractId);
      if (!c) return "";
      if (ac.ready) {
        return `
          <div class="active-contract ready">
            <div class="active-title">Job ready: ${c.name} — finish it to collect</div>
            <button class="btn mg-action" data-action="play-contract" data-id="${ac.contractId}">Play Contract</button>
          </div>`;
      }
      const elapsed = Date.now() - ac.startedAt;
      const pct = Math.min(100, (elapsed / ac.duration) * 100);
      const remain = Math.max(0, Math.ceil((ac.duration - elapsed) / 1000));
      return `
        <div class="active-contract">
          <div class="active-title">In progress: ${c.name} — ${remain}s left</div>
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        </div>`;
    }).join("");
  }

  const atCapacity = state.activeContracts.length >= MAX_ACTIVE_CONTRACTS;
  const special = currentSpecialContract();
  const specialCompleted = state.lastSpecialSlotCompleted === currentSpecialSlot();
  const specialRepReq = Math.max(TIERS[special.tier].repReq, special.unlockRep || 0);
  const specialLocked = special.tier > tierIdx || state.rep < specialRepReq;
  const specialTaken = state.activeContracts.some((ac) => ac.contractId === special.id);
  const specialDisabled = specialLocked || specialCompleted || specialTaken || atCapacity || burned;
  const specialChance = Math.round(
    Math.max(0.05, Math.min(0.97, special.baseChance + weaponBonus() - Math.min(state.heat / 250, 0.3))) * 100
  );
  const rotationRemain = Math.max(0, (nextSpecialRotationAt() - Date.now()) / 1000);
  const specialCard = `
    <div class="card special-contract ${specialLocked ? "locked" : ""} ${specialCompleted ? "owned" : ""}">
      <div class="card-title">⭐ ${special.name}</div>
      <div class="card-row">Tier: ${TIERS[special.tier].name}</div>
      <div class="card-row">Payout: ${fmt(special.payout)}</div>
      <div class="card-row">Time: ${special.duration}s</div>
      <div class="card-row">Odds: ${specialChance}% · Heat +${special.heat}</div>
      <div class="card-row">Rotates in ${formatDuration(rotationRemain)}</div>
      ${
        specialCompleted
          ? `<button class="btn equipped" disabled>Completed — Check Back Later</button>`
          : specialLocked
          ? `<div class="locked-tag">Requires ${specialRepReq} rep</div>`
          : `<button class="btn" data-action="take-contract" data-id="${special.id}" ${specialDisabled ? "disabled" : ""}>Take Special Contract</button>`
      }
    </div>`;

  const city = CITIES.find((c) => c.id === state.currentCity) || CITIES[0];
  const cityBanner = `<div class="card-row city-banner">📍 Currently in <strong>${city.name}</strong>${city.id !== "detroit" ? ` — <span class="hint" style="display:inline">${city.desc}</span>` : ""}</div>`;
  const normalRotationRemain = Math.max(0, (nextNormalRotationAt() - Date.now()) / 1000);

  const cityContracts = currentCityContracts(state.currentCity);
  const cards = cityContracts.map((c) => {
    const repReq = Math.max(TIERS[c.tier].repReq, c.unlockRep || 0);
    const locked = c.tier > tierIdx || state.rep < repReq;
    const taken = state.activeContracts.some((ac) => ac.contractId === c.id);
    const disabled = locked || taken || atCapacity || burned;
    const chance = Math.round(
      Math.max(0.05, Math.min(0.97, c.baseChance + weaponBonus() - Math.min(state.heat / 250, 0.3))) * 100
    );
    return `
      <div class="card ${locked ? "locked" : ""}">
        <div class="card-title">${c.name}</div>
        <div class="card-row">Tier: ${TIERS[c.tier].name}</div>
        <div class="card-row">Payout: ${fmt(c.payout)}</div>
        <div class="card-row">Time: ${c.duration}s</div>
        <div class="card-row">Odds: ${chance}% · Heat +${c.heat}</div>
        ${
          locked
            ? `<div class="locked-tag">Requires ${repReq} rep</div>`
            : `<button class="btn" data-action="take-contract" data-id="${c.id}" ${disabled ? "disabled" : ""}>Take Contract</button>`
        }
      </div>`;
  }).join("");

  return `${cityBanner}${activeHTML}<h3 class="cat-heading">Special Contract</h3><div class="grid">${specialCard}</div><h3 class="cat-heading">Available — new targets in ${formatDuration(normalRotationRemain)}</h3><div class="grid">${cards}</div>`;
}

function arsenalTabHTML() {
  const cards = WEAPONS.map((w) => {
    const owned = state.ownedWeapons.includes(w.id);
    const equipped = state.equippedWeapon === w.id;
    const locked = state.rep < w.repReq;
    let btn;
    if (equipped) btn = `<button class="btn equipped" disabled>Equipped</button>`;
    else if (owned) btn = `<button class="btn" data-action="equip-weapon" data-id="${w.id}">Equip</button>`;
    else if (locked) btn = `<div class="locked-tag">Requires ${w.repReq} rep</div>`;
    else btn = `<button class="btn" data-action="buy-weapon" data-id="${w.id}" ${state.cash < weaponPrice(w) ? "disabled" : ""}>Buy — ${fmt(weaponPrice(w))}</button>`;

    const sellBtn =
      owned && !w.starter
        ? `<button class="btn sell" data-action="sell-weapon" data-id="${w.id}">Sell — ${fmt(Math.round(w.cost * SELL_RATE))}</button>`
        : "";

    return `
      <div class="card ${locked ? "locked" : ""} ${owned ? "owned" : ""}">
        <div class="art-box">${itemArtSVG(w.id)}</div>
        <div class="card-title">${w.name}</div>
        <div class="card-row">Success bonus: +${Math.round(w.bonus * 100)}%</div>
        ${btn}
        ${sellBtn}
      </div>`;
  }).join("");
  return `<div class="grid">${cards}</div>`;
}

function flexCategoryHTML(catName, items) {
  const cards = items
    .map((item) => {
      const owned = state.ownedFlex.includes(item.id);
      const price = flexPrice(item, catName.toLowerCase());
      const effects = [];
      if (item.heatReduction) effects.push(`-${Math.round(item.heatReduction * 100)}% heat gain`);
      if (item.payoutBoost) effects.push(`+${Math.round(item.payoutBoost * 100)}% payout`);
      if (item.repBoost) effects.push(`+${Math.round(item.repBoost * 100)}% rep`);
      return `
        <div class="card ${owned ? "owned" : ""}">
          <div class="art-box">${itemArtSVG(item.id)}</div>
          <div class="card-title">${item.name}</div>
          <div class="card-row">${effects.join(" · ") || "Pure status"}</div>
          ${
            owned
              ? `<button class="btn equipped" disabled>Owned</button>
                 <button class="btn sell" data-action="sell-flex" data-id="${item.id}">Sell — ${fmt(Math.round(item.cost * SELL_RATE))}</button>`
              : `<button class="btn" data-action="buy-flex" data-id="${item.id}" ${state.cash < price ? "disabled" : ""}>Buy — ${fmt(price)}</button>`
          }
        </div>`;
    })
    .join("");
  return `<h3 class="cat-heading">${catName}</h3><div class="grid">${cards}</div>`;
}

let flexView = "cars";
const FLEX_CATEGORIES = [
  { key: "cars", label: "Cars", items: () => FLEX_ITEMS.cars },
  { key: "jets", label: "Jets", items: () => FLEX_ITEMS.jets },
  { key: "watches", label: "Watches", items: () => FLEX_ITEMS.watches },
  { key: "necklaces", label: "Necklaces", items: () => FLEX_ITEMS.necklaces },
  { key: "clothes", label: "Clothes", items: () => FLEX_ITEMS.clothes },
];

function flexTabHTML() {
  const nav = `
    <div class="casino-nav">
      ${FLEX_CATEGORIES.map((cat) => {
        const owned = cat.items().filter((i) => state.ownedFlex.includes(i.id)).length;
        return `<button class="btn ${flexView === cat.key ? "equipped" : ""}" data-action="flex-view" data-view="${cat.key}">${cat.label} (${owned}/${cat.items().length})</button>`;
      }).join("")}
    </div>`;
  const active = FLEX_CATEGORIES.find((c) => c.key === flexView) || FLEX_CATEGORIES[0];
  return nav + flexCategoryHTML(active.label, active.items());
}

function bankTabHTML() {
  const remain = state.nextInterestAt ? Math.max(0, Math.ceil((state.nextInterestAt - Date.now()) / 1000)) : null;
  return `
    <div class="atm-panel">
      <div class="atm-screen">
        <div class="atm-line">CASH ON HAND</div>
        <div class="atm-amount">${fmt(state.cash)}</div>
        <div class="atm-line">BANK BALANCE</div>
        <div class="atm-amount">${fmt(state.bankBalance)}</div>
        ${
          state.bankBalance > 0
            ? `<div class="hint">+${Math.round(BANK_INTEREST_RATE * 100)}% interest in ${remain}s</div>`
            : `<div class="hint">Deposit cash to start earning ${Math.round(BANK_INTEREST_RATE * 100)}% interest every ${BANK_INTEREST_CYCLE_SECONDS}s. Banked cash is also safe if your cover gets blown.</div>`
        }
      </div>
      <div class="atm-keypad">
        <button class="btn" data-action="deposit-bank" data-amount="1000">Deposit ${fmt(1000)}</button>
        <button class="btn" data-action="deposit-bank" data-amount="10000">Deposit ${fmt(10000)}</button>
        <button class="btn sell" data-action="withdraw-bank" data-amount="1000">Withdraw ${fmt(1000)}</button>
        <button class="btn sell" data-action="withdraw-bank" data-amount="10000">Withdraw ${fmt(10000)}</button>
      </div>
      <div class="atm-custom">
        <input type="number" id="bank-custom-amount" class="atm-input" placeholder="Custom amount" min="1" />
        <button class="btn" data-action="deposit-bank-custom">Deposit</button>
        <button class="btn sell" data-action="withdraw-bank-custom">Withdraw</button>
      </div>
      <div class="hint">ATM withdrawals take a ${Math.round(ATM_FEE_RATE * 100)}% fee.</div>
    </div>`;
}

let casinoView = "blackjack";

function cardHTML(card) {
  const red = card.suit === "♥" || card.suit === "♦";
  return `<div class="playing-card ${red ? "red" : ""}"><span>${card.rank}</span><span>${card.suit}</span></div>`;
}

function casinoTabHTML() {
  const nav = `
    <div class="casino-nav">
      <button class="btn ${casinoView === "blackjack" ? "equipped" : ""}" data-action="casino-view" data-view="blackjack">Blackjack</button>
      <button class="btn ${casinoView === "slots" ? "equipped" : ""}" data-action="casino-view" data-view="slots">Slots</button>
      <button class="btn ${casinoView === "roulette" ? "equipped" : ""}" data-action="casino-view" data-view="roulette">Roulette</button>
      <button class="btn ${casinoView === "highlow" ? "equipped" : ""}" data-action="casino-view" data-view="highlow">High-Low</button>
      <button class="btn ${casinoView === "sportsbook" ? "equipped" : ""}" data-action="casino-view" data-view="sportsbook">Sportsbook</button>
    </div>`;
  const body =
    casinoView === "blackjack" ? blackjackHTML()
    : casinoView === "slots" ? slotsHTML()
    : casinoView === "highlow" ? highlowHTML()
    : casinoView === "sportsbook" ? sportsbookHTML()
    : rouletteHTML();
  return nav + body;
}

function sportsbookHTML() {
  const board = currentSportsBoard();
  const rotationRemain = Math.max(0, (nextSportsRotationAt() - Date.now()) / 1000);

  if (sportsGame) {
    const m = sportsGame.matchup;
    const live = sportsGame.phase === "live";
    const teamName = sportsGame.side === "A" ? m.teamA : m.teamB;
    const resultCls = sportsGame.resultText ? (sportsGame.resultText.includes("won") ? "great" : "fail") : "";
    const matchupLabel = m.sport === "ufc" ? `${m.teamA} vs ${m.teamB}` : `${m.teamA} vs ${m.teamB}`;
    return `
      <div class="casino-table">
        <div class="cat-heading">${m.sport === "ufc" ? "🥊" : "🏀"} ${matchupLabel}</div>
        <div class="card-row">Bet ${fmt(sportsGame.bet)} on ${teamName}</div>
        ${live ? `<div class="hint">${m.sport === "ufc" ? "Fight" : "Game"} in progress...</div>` : ""}
        ${sportsGame.resultText ? `<div class="mg-result-text ${resultCls}">${sportsGame.resultText}</div>` : ""}
        ${!live ? `<button class="btn" data-action="sports-new">Back to Board</button>` : ""}
      </div>`;
  }

  function matchupCard(m) {
    const multA = sportsMultiplier(m.probA);
    const multB = sportsMultiplier(1 - m.probA);
    const locked = state.sportsBetsPlaced.includes(m.id);
    const selA = sportsSelection && sportsSelection.matchupId === m.id && sportsSelection.side === "A";
    const selB = sportsSelection && sportsSelection.matchupId === m.id && sportsSelection.side === "B";
    return `
      <div class="card ${locked ? "locked" : ""}">
        <div class="card-title">${m.teamA} vs ${m.teamB}</div>
        ${
          locked
            ? `<div class="locked-tag">Already bet — locked until next rotation</div>`
            : `<div class="crypto-action-group">
                <button class="btn ${selA ? "equipped" : ""}" data-action="sports-select" data-id="${m.id}" data-side="A">${m.teamA} — ${multA.toFixed(2)}x</button>
                <button class="btn ${selB ? "equipped" : ""}" data-action="sports-select" data-id="${m.id}" data-side="B">${m.teamB} — ${multB.toFixed(2)}x</button>
              </div>`
        }
      </div>`;
  }

  const nbaGames = board.filter((g) => g.sport === "nba");
  const ufcFights = board.filter((g) => g.sport === "ufc");
  const selMatch = sportsSelection ? board.find((g) => g.id === sportsSelection.matchupId) : null;
  const selLabel = selMatch ? (sportsSelection.side === "A" ? selMatch.teamA : selMatch.teamB) : null;

  return `
    <div class="card-row">Board refreshes in ${formatDuration(rotationRemain)}.</div>
    <h3 class="cat-heading">🏀 NBA</h3>
    <div class="grid">${nbaGames.map(matchupCard).join("")}</div>
    <h3 class="cat-heading">🥊 UFC</h3>
    <div class="grid">${ufcFights.map(matchupCard).join("")}</div>
    <div class="card-row">Bet: ${selLabel ? `${selLabel} to win` : "None selected — tap a team or fighter"} ${
      selLabel ? `<button class="btn sell" data-action="sports-clear" style="margin-left:8px">Clear Bet</button>` : ""
    }</div>
    <div class="crypto-action-group">
      <button class="btn" data-action="sports-bet" data-amount="100" ${!selLabel || state.cash < 100 ? "disabled" : ""}>Bet ${fmt(100)}</button>
      <button class="btn" data-action="sports-bet" data-amount="500" ${!selLabel || state.cash < 500 ? "disabled" : ""}>Bet ${fmt(500)}</button>
      <button class="btn" data-action="sports-bet" data-amount="2000" ${!selLabel || state.cash < 2000 ? "disabled" : ""}>Bet ${fmt(2000)}</button>
      <button class="btn" data-action="sports-bet" data-amount="10000" ${!selLabel || state.cash < 10000 ? "disabled" : ""}>Bet ${fmt(10000)}</button>
    </div>
    <div class="atm-custom">
      <input type="number" id="sports-custom-amount" class="atm-input" placeholder="Custom amount" min="1" />
      <button class="btn" data-action="sports-bet-custom" ${!selLabel ? "disabled" : ""}>Bet</button>
    </div>`;
}

function highlowHTML() {
  if (!highlowGame) {
    return `
      <div class="casino-table">
        <div class="card-row">Guess higher or lower than the shown card. Each correct guess grows your multiplier — cash out anytime, or bust and lose it all.</div>
        <div class="crypto-action-group">
          <button class="btn" data-action="highlow-start" data-amount="100" ${state.cash < 100 ? "disabled" : ""}>Bet ${fmt(100)}</button>
          <button class="btn" data-action="highlow-start" data-amount="500" ${state.cash < 500 ? "disabled" : ""}>Bet ${fmt(500)}</button>
          <button class="btn" data-action="highlow-start" data-amount="2000" ${state.cash < 2000 ? "disabled" : ""}>Bet ${fmt(2000)}</button>
          <button class="btn" data-action="highlow-start" data-amount="10000" ${state.cash < 10000 ? "disabled" : ""}>Bet ${fmt(10000)}</button>
        </div>
      </div>`;
  }

  const playing = highlowGame.phase === "playing";
  const resultCls = highlowGame.resultText
    ? highlowGame.resultText.startsWith("Cashed")
      ? "great"
      : "fail"
    : "";
  const potentialPayout = Math.round(highlowGame.bet * highlowGame.multiplier * HIGHLOW_MULTIPLIER_STEP);

  return `
    <div class="casino-table">
      <div class="cat-heading">Streak Multiplier: ${highlowGame.multiplier.toFixed(2)}x</div>
      <div class="highlow-card">${highlowCardLabel(highlowGame.currentCard)}</div>
      <div class="card-row">Bet ${fmt(highlowGame.bet)} — cash out now for ${fmt(Math.round(highlowGame.bet * highlowGame.multiplier))}</div>
      ${highlowGame.resultText ? `<div class="mg-result-text ${resultCls}">${highlowGame.resultText}</div>` : ""}
      <div class="crypto-action-group">
        ${
          playing
            ? `
              <button class="btn" data-action="highlow-guess" data-dir="higher">Higher</button>
              <button class="btn" data-action="highlow-guess" data-dir="lower">Lower</button>
              <button class="btn sell" data-action="highlow-cashout">Cash Out</button>`
            : `<button class="btn" data-action="highlow-new">New Round</button>`
        }
      </div>
      ${playing ? `<div class="hint">Next correct guess pays ${fmt(potentialPayout)} if you keep going.</div>` : ""}
    </div>`;
}

function blackjackHTML() {
  if (!bjGame) {
    return `
      <div class="casino-table">
        <div class="card-row">Place your bet to get dealt in. Blackjack pays 3:2, dealer stands on 17.</div>
        <div class="crypto-action-group">
          <button class="btn" data-action="bj-start" data-amount="100" ${state.cash < 100 ? "disabled" : ""}>Bet ${fmt(100)}</button>
          <button class="btn" data-action="bj-start" data-amount="500" ${state.cash < 500 ? "disabled" : ""}>Bet ${fmt(500)}</button>
          <button class="btn" data-action="bj-start" data-amount="2000" ${state.cash < 2000 ? "disabled" : ""}>Bet ${fmt(2000)}</button>
          <button class="btn" data-action="bj-start" data-amount="10000" ${state.cash < 10000 ? "disabled" : ""}>Bet ${fmt(10000)}</button>
          <button class="btn" data-action="bj-start" data-amount="50000" ${state.cash < 50000 ? "disabled" : ""}>Bet ${fmt(50000)}</button>
        </div>
      </div>`;
  }

  const dealerHidden = bjGame.phase === "playing";
  const dealerCardsHTML = bjGame.dealerCards
    .map((c, i) => (i === 1 && dealerHidden ? `<div class="playing-card back"></div>` : cardHTML(c)))
    .join("");
  const dealerTotal = dealerHidden ? "?" : bjHandTotal(bjGame.dealerCards);
  const canDouble = bjGame.phase === "playing" && bjGame.playerCards.length === 2 && state.cash >= bjGame.bet;
  const resultCls = bjGame.resultText
    ? bjGame.resultText.startsWith("You win") || bjGame.resultText.startsWith("Blackjack")
      ? "great"
      : bjGame.resultText.startsWith("Push")
      ? "ok"
      : "fail"
    : "";

  return `
    <div class="casino-table">
      <div class="cat-heading">Dealer (${dealerTotal})</div>
      <div class="card-hand">${dealerCardsHTML}</div>
      <div class="cat-heading">You (${bjHandTotal(bjGame.playerCards)}) — Bet ${fmt(bjGame.bet)}</div>
      <div class="card-hand">${bjGame.playerCards.map(cardHTML).join("")}</div>
      ${bjGame.resultText ? `<div class="mg-result-text ${resultCls}">${bjGame.resultText}</div>` : ""}
      <div class="crypto-action-group">
        ${
          bjGame.phase === "playing"
            ? `
              <button class="btn" data-action="bj-hit">Hit</button>
              <button class="btn" data-action="bj-stand">Stand</button>
              <button class="btn" data-action="bj-double" ${canDouble ? "" : "disabled"}>Double Down</button>`
            : `<button class="btn" data-action="bj-new">New Hand</button>`
        }
      </div>
    </div>`;
}

function slotsHTML() {
  const reelsHTML = slotGame
    ? slotGame.reels.map((r) => `<div class="slot-reel ${slotGame.phase === "spinning" ? "spinning" : ""}">${r.symbol}</div>`).join("")
    : `<div class="slot-reel">❔</div><div class="slot-reel">❔</div><div class="slot-reel">❔</div>`;

  const spinning = slotGame && slotGame.phase === "spinning";
  const resultCls = slotGame && slotGame.resultText
    ? slotGame.resultText.includes("JACKPOT")
      ? "great"
      : slotGame.resultText.includes("Close")
      ? "ok"
      : "fail"
    : "";

  const payoutTable = SLOT_SYMBOLS.map((s) => `<div class="card-row">${s.symbol}${s.symbol}${s.symbol} — ${s.payout}x</div>`).join("");

  return `
    <div class="casino-table">
      <div class="slot-machine">${reelsHTML}</div>
      ${slotGame && slotGame.resultText && !spinning ? `<div class="mg-result-text ${resultCls}">${slotGame.resultText}</div>` : ""}
      <div class="crypto-action-group">
        <button class="btn" data-action="slot-spin" data-amount="100" ${spinning || state.cash < 100 ? "disabled" : ""}>Spin ${fmt(100)}</button>
        <button class="btn" data-action="slot-spin" data-amount="500" ${spinning || state.cash < 500 ? "disabled" : ""}>Spin ${fmt(500)}</button>
        <button class="btn" data-action="slot-spin" data-amount="2000" ${spinning || state.cash < 2000 ? "disabled" : ""}>Spin ${fmt(2000)}</button>
      </div>
      <h3 class="cat-heading">Payouts (3 of a kind)</h3>
      ${payoutTable}
      <div class="hint">Any 2 matching returns half your bet.</div>
    </div>`;
}

function rouletteNumberCell(n) {
  const color = rouletteColor(n);
  const selected = rouletteSelection.type === "straight" && rouletteSelection.number === n;
  return `<div class="roulette-cell ${color} ${selected ? "selected" : ""}" data-action="roulette-select" data-type="straight" data-number="${n}">${n}${selected ? '<span class="roulette-chip"></span>' : ""}</div>`;
}

function rouletteHTML() {
  const spinning = rouletteGame && rouletteGame.phase === "spinning";
  const resultColorCls = rouletteGame && !spinning ? rouletteGame.resultColor : "";
  const resultNumberText = spinning ? "?" : rouletteGame ? rouletteGame.resultNumber : "–";

  const rows = [3, 2, 1].map((rowOffset) => {
    const cells = Array.from({ length: 12 }, (_, i) => rouletteNumberCell(i * 3 + rowOffset)).join("");
    return `<div class="roulette-row">${cells}</div>`;
  }).join("");

  const zeroCell = `<div class="roulette-cell green zero" data-action="roulette-select" data-type="straight" data-number="0">0${
    rouletteSelection.type === "straight" && rouletteSelection.number === 0 ? '<span class="roulette-chip"></span>' : ""
  }</div>`;

  const outsideBtns = ROULETTE_OUTSIDE_BETS.map((b) => {
    const selected = rouletteSelection.type === b.type;
    return `<button class="btn roulette-outside ${selected ? "equipped" : ""}" data-action="roulette-select" data-type="${b.type}">${b.label} (${b.mult - 1}:1)</button>`;
  }).join("");

  const betLabel = rouletteBetLabel();
  const resultCls = rouletteGame && !spinning
    ? rouletteGame.resultText.includes("WIN")
      ? "great"
      : "fail"
    : "";

  return `
    <div class="casino-table">
      <div class="roulette-result ${spinning ? "spinning" : resultColorCls}">${resultNumberText}</div>
      ${rouletteGame && rouletteGame.resultText && !spinning ? `<div class="mg-result-text ${resultCls}">${rouletteGame.resultText}</div>` : ""}
      <div class="roulette-table-felt">
        ${zeroCell}
        <div class="roulette-rows">${rows}</div>
      </div>
      <div class="crypto-action-group">${outsideBtns}</div>
      <div class="card-row">Bet: ${betLabel || "None selected — tap a number or an outside bet"} ${betLabel ? `<button class="btn sell" data-action="roulette-clear" style="margin-left:8px">Clear Bet</button>` : ""}</div>
      <div class="crypto-action-group">
        <button class="btn" data-action="roulette-spin" data-amount="100" ${!rouletteSelection.type || spinning || state.cash < 100 ? "disabled" : ""}>Spin ${fmt(100)}</button>
        <button class="btn" data-action="roulette-spin" data-amount="500" ${!rouletteSelection.type || spinning || state.cash < 500 ? "disabled" : ""}>Spin ${fmt(500)}</button>
        <button class="btn" data-action="roulette-spin" data-amount="2000" ${!rouletteSelection.type || spinning || state.cash < 2000 ? "disabled" : ""}>Spin ${fmt(2000)}</button>
        <button class="btn" data-action="roulette-spin" data-amount="5000" ${!rouletteSelection.type || spinning || state.cash < 5000 ? "disabled" : ""}>Spin ${fmt(5000)}</button>
      </div>
      <div class="hint">Straight number pays 35:1. Dozens pay 2:1. Red/Black/Odd/Even/1-18/19-36 pay 1:1.</div>
    </div>`;
}

function formatDuration(totalSeconds) {
  totalSeconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function housingTabHTML() {
  const rentals = rentedResidences();
  const owned = ownedResidence();
  let currentHTML = "";

  if (rentals.length || owned) {
    const rows = [...rentals, ...(owned ? [owned] : [])].map((residence) => {
      const h = houseData(residence);
      if (!h) return "";
      const due = residence.type === "rent" ? h.rentCost : h.taxCost;
      const label = residence.type === "rent" ? "Rent" : "Property tax";
      const remain = residence.nextBillAt ? Math.max(0, residence.nextBillAt - Date.now()) / 1000 : 0;
      const payable = remain * 1000 <= PAY_EARLY_WINDOW_MS;
      return `
        <div class="active-contract">
          <div class="active-title">${h.name} (${residence.type === "rent" ? "renting" : "owned"})</div>
          <div class="card-row">${label} due in ${formatDuration(remain)} — ${fmt(due)}</div>
          <div class="card-row">-${Math.round(h.heatReduction * 100)}% heat gain</div>
          ${!payable ? `<div class="hint">Payable within ${PAY_EARLY_WINDOW_HOURS}h of the due date</div>` : ""}
          <div class="crypto-action-group">
            <button class="btn" data-action="pay-bill-early" data-type="${residence.type}" data-id="${residence.id}" ${!payable || state.cash < due ? "disabled" : ""}>Pay ${label} Now — ${fmt(due)}</button>
            ${
              residence.type === "own"
                ? `<button class="btn sell" data-action="sell-house" data-id="${residence.id}">Sell house — ${fmt(Math.round(h.cost * SELL_RATE))}</button>`
                : `<button class="btn sell" data-action="move-out" data-id="${residence.id}">Move out</button>`
            }
          </div>
        </div>`;
    }).join("");
    currentHTML = rows;
  } else {
    currentHTML = `<div class="active-contract">No residence — heat decays slower once you have a place to lay low.</div>`;
  }

  const rentalCount = rentals.length;
  const rentCards = HOUSES.rent
    .map((h) => {
      const locked = state.rep < h.repReq;
      const active = rentals.some((r) => r.id === h.id);
      const full = !active && rentalCount >= MAX_RENTALS;
      return `
        <div class="card ${locked ? "locked" : ""} ${active ? "owned" : ""}">
          <div class="art-box">${itemArtSVG(h.id)}</div>
          <div class="card-title">${h.name}</div>
          <div class="card-row">Rent: ${fmt(h.rentCost)} / cycle · -${Math.round(h.heatReduction * 100)}% heat gain</div>
          ${
            active
              ? `<button class="btn equipped" disabled>Renting</button>`
              : locked
              ? `<div class="locked-tag">Requires ${h.repReq} rep</div>`
              : full
              ? `<div class="locked-tag">Max ${MAX_RENTALS} rentals at once</div>`
              : `<button class="btn" data-action="rent-house" data-id="${h.id}" ${state.cash < h.rentCost ? "disabled" : ""}>Rent — first payment ${fmt(h.rentCost)}</button>`
          }
        </div>`;
    })
    .join("");

  const buyCards = HOUSES.buy
    .map((h) => {
      const locked = state.rep < h.repReq;
      const isOwned = owned && owned.id === h.id;
      const full = !isOwned && !!owned;
      return `
        <div class="card ${locked ? "locked" : ""} ${isOwned ? "owned" : ""}">
          <div class="art-box">${itemArtSVG(h.id)}</div>
          <div class="card-title">${h.name}</div>
          <div class="card-row">Tax: ${fmt(h.taxCost)} / cycle · -${Math.round(h.heatReduction * 100)}% heat gain</div>
          ${
            isOwned
              ? `<button class="btn equipped" disabled>Owned</button>`
              : locked
              ? `<div class="locked-tag">Requires ${h.repReq} rep</div>`
              : full
              ? `<div class="locked-tag">Sell your house to buy another</div>`
              : `<button class="btn" data-action="buy-house" data-id="${h.id}" ${state.cash < housePrice(h) ? "disabled" : ""}>Buy — ${fmt(housePrice(h))}</button>`
          }
        </div>`;
    })
    .join("");

  const hasResidence = rentals.length > 0 || !!owned;
  const eventsThrown = houseEventsThrownToday();
  const atDailyCap = eventsThrown >= HOUSE_EVENTS_MAX_PER_DAY;
  const eventCards = HOUSE_EVENTS.map(
    (ev) => `
      <div class="card">
        <div class="card-title">${ev.name}</div>
        <div class="card-row">${ev.desc}</div>
        <div class="card-row">+${ev.repGain} rep · ${fmt(ev.cashRange[0])}–${fmt(ev.cashRange[1])} from guests · +${ev.heatGain} heat</div>
        <button class="btn" data-action="throw-house-event" data-id="${ev.id}" ${!hasResidence || atDailyCap || state.cash < ev.cost ? "disabled" : ""}>Throw — ${fmt(ev.cost)}</button>
      </div>`
  ).join("");
  const eventsHeading = `Throw an Event (${eventsThrown}/${HOUSE_EVENTS_MAX_PER_DAY} today)`;
  const eventsSection = !hasResidence
    ? `<h3 class="cat-heading">${eventsHeading}</h3><div class="card-row">Get a place first — no venue, no party.</div>`
    : atDailyCap
    ? `<h3 class="cat-heading">${eventsHeading}</h3><div class="card-row">You've hit today's limit — come back tomorrow.</div><div class="grid">${eventCards}</div>`
    : `<h3 class="cat-heading">${eventsHeading}</h3><div class="grid">${eventCards}</div>`;

  return `${currentHTML}
    ${eventsSection}
    <h3 class="cat-heading">Rentals (${rentalCount}/${MAX_RENTALS})</h3><div class="grid">${rentCards}</div>
    <h3 class="cat-heading">Own (${owned ? 1 : 0}/1)</h3><div class="grid">${buyCards}</div>`;
}

function billsTabHTML() {
  const rentals = rentedResidences();
  const owned = ownedResidence();
  const allResidences = [...rentals, ...(owned ? [owned] : [])];

  const houseRows = allResidences.map((residence) => {
    const h = houseData(residence);
    if (!h) return "";
    const due = residence.type === "rent" ? h.rentCost : h.taxCost;
    const label = residence.type === "rent" ? "Rent" : "Property Tax";
    const remain = residence.nextBillAt ? Math.max(0, residence.nextBillAt - Date.now()) / 1000 : 0;
    const payable = remain * 1000 <= PAY_EARLY_WINDOW_MS;
    return `
      <div class="card">
        <div class="card-title">${h.name}</div>
        <div class="card-row">${label} — due in ${formatDuration(remain)}</div>
        ${!payable ? `<div class="hint">Payable within ${PAY_EARLY_WINDOW_HOURS}h of the due date</div>` : ""}
        <button class="btn" data-action="pay-bill-early" data-type="${residence.type}" data-id="${residence.id}" ${!payable || state.cash < due ? "disabled" : ""}>Pay Now — ${fmt(due)}</button>
      </div>`;
  }).join("");

  const ownedCars = FLEX_ITEMS.cars.filter((c) => state.ownedFlex.includes(c.id));
  const carRows = ownedCars.map((c) => {
    const due = carInsuranceCost(c);
    const nextAt = state.carBills[c.id];
    const remain = nextAt ? Math.max(0, nextAt - Date.now()) / 1000 : 0;
    const payable = remain * 1000 <= PAY_EARLY_WINDOW_MS;
    return `
      <div class="card">
        <div class="card-title">${c.name}</div>
        <div class="card-row">Insurance — due in ${formatDuration(remain)}</div>
        ${!payable ? `<div class="hint">Payable within ${PAY_EARLY_WINDOW_HOURS}h of the due date</div>` : ""}
        <button class="btn" data-action="pay-car-bill" data-id="${c.id}" ${!payable || state.cash < due ? "disabled" : ""}>Pay Now — ${fmt(due)}</button>
      </div>`;
  }).join("");

  const agentRows = state.hiredAgents.map((unit) => {
    const type = AGENTS.find((a) => a.id === unit.typeId);
    if (!type) return "";
    const due = agentSalaryCost(type);
    const remain = unit.nextBillAt ? Math.max(0, unit.nextBillAt - Date.now()) / 1000 : 0;
    const payable = remain * 1000 <= PAY_EARLY_WINDOW_MS;
    return `
      <div class="card">
        <div class="card-title">${type.name}</div>
        <div class="card-row">Salary — due in ${formatDuration(remain)}</div>
        <div class="card-row hint">Miss it and they quit.</div>
        ${!payable ? `<div class="hint">Payable within ${PAY_EARLY_WINDOW_HOURS}h of the due date</div>` : ""}
        <button class="btn" data-action="pay-agent-salary" data-id="${unit.id}" ${!payable || state.cash < due ? "disabled" : ""}>Pay Now — ${fmt(due)}</button>
      </div>`;
  }).join("");

  const totalDaily =
    allResidences.reduce((s, r) => { const h = houseData(r); return s + (h ? (r.type === "rent" ? h.rentCost : h.taxCost) : 0); }, 0) +
    ownedCars.reduce((s, c) => s + carInsuranceCost(c), 0) +
    state.hiredAgents.reduce((s, u) => { const t = AGENTS.find((a) => a.id === u.typeId); return s + (t ? agentSalaryCost(t) : 0); }, 0);

  return `
    <div class="active-contract"><div class="active-title">Total bills: ${fmt(totalDaily)} / day</div></div>
    <h3 class="cat-heading">Houses</h3>
    <div class="grid">${houseRows || `<div class="card-row">No residence.</div>`}</div>
    <h3 class="cat-heading">Cars</h3>
    <div class="grid">${carRows || `<div class="card-row">No cars owned.</div>`}</div>
    <h3 class="cat-heading">Workers</h3>
    <div class="grid">${agentRows || `<div class="card-row">No agents hired.</div>`}</div>`;
}

function profileTabHTML() {
  const tierIdx = currentTierIndex();
  const tier = TIERS[tierIdx];
  const level = levelForRep(state.rep);
  const levelPct = Math.min(100, ((state.rep % REP_PER_LEVEL) / REP_PER_LEVEL) * 100);
  const rentals = rentedResidences();
  const owned = ownedResidence();
  const equippedW = WEAPONS.find((w) => w.id === state.equippedWeapon);

  const ownedWeaponsHTML = state.ownedWeapons
    .map((id) => {
      const w = WEAPONS.find((w) => w.id === id);
      return w ? `<div class="owned-item">${itemArtSVG(id, 40)}<span>${w.name}${id === state.equippedWeapon ? " (equipped)" : ""}</span></div>` : "";
    })
    .join("");

  const FLEX_CAT_LABELS = { cars: "Cars", jets: "Jets", watches: "Watches", necklaces: "Necklaces", clothes: "Clothes" };
  const ownedFlexByCategoryHTML = Object.entries(FLEX_ITEMS)
    .map(([key, items]) => {
      const ownedInCat = items.filter((i) => state.ownedFlex.includes(i.id));
      const grid = ownedInCat.length
        ? ownedInCat.map((item) => `<div class="owned-item">${itemArtSVG(item.id, 40)}<span>${item.name}</span></div>`).join("")
        : `<div class="card-row">None owned yet.</div>`;
      return `<h3 class="cat-heading">${FLEX_CAT_LABELS[key] || key} (${ownedInCat.length}/${items.length})</h3><div class="owned-grid">${grid}</div>`;
    })
    .join("");

  const residenceNames = [...rentals, ...(owned ? [owned] : [])]
    .map((r) => {
      const h = houseData(r);
      return h ? `${h.name} (${r.type === "rent" ? "renting" : "owned"})` : "";
    })
    .filter(Boolean)
    .join(" · ");

  return `
    <div class="vault-hero">
      <div class="vault-hero-main">
        <div class="vault-level-ring">
          <span class="vault-level-num">${level}</span>
          <span class="vault-level-label">LVL</span>
        </div>
        <div class="vault-hero-info">
          <div class="vault-tier-name">${tier.name}</div>
          <div class="vault-rep-row">
            <div class="rep-bar"><div class="rep-fill" style="width:${levelPct}%"></div></div>
            <span class="vault-rep-num">${state.rep.toLocaleString()} / ${MAX_REP.toLocaleString()} rep</span>
          </div>
        </div>
      </div>
      <div class="vault-networth">
        <span class="stat-label">Net Worth</span>
        <span class="stat-value cash vault-networth-num">${fmt(netWorth())}</span>
      </div>
    </div>

    <div class="vault-stat-grid">
      <div class="vault-stat-card"><span class="stat-label">Contracts Done</span><span class="stat-value">${state.stats.contractsCompleted}</span></div>
      <div class="vault-stat-card"><span class="stat-label">Contracts Failed</span><span class="stat-value">${state.stats.contractsFailed}</span></div>
      <div class="vault-stat-card"><span class="stat-label">Times Burned</span><span class="stat-value">${state.stats.timesBurned}</span></div>
      <div class="vault-stat-card"><span class="stat-label">Total Earned</span><span class="stat-value cash">${fmt(state.stats.totalEarned)}</span></div>
    </div>

    <h3 class="cat-heading">Sales</h3>
    <div class="vault-stat-grid">
      <div class="vault-stat-card"><span class="stat-label">Drug Sales</span><span class="stat-value cash">${fmt(state.stats.drugSalesTotal)}</span></div>
      <div class="vault-stat-card"><span class="stat-label">Gun Sales</span><span class="stat-value cash">${fmt(state.stats.gunSalesTotal)}</span></div>
      <div class="vault-stat-card"><span class="stat-label">Watch Sales</span><span class="stat-value cash">${fmt(state.stats.watchSalesTotal)}</span></div>
    </div>

    <h3 class="cat-heading">Residence</h3>
    <div class="card-row">${residenceNames || "No residence"}</div>

    <h3 class="cat-heading">Equipped Weapon</h3>
    <div class="card-row">${equippedW ? equippedW.name : "None"}</div>

    <h3 class="cat-heading">Arsenal Owned (${state.ownedWeapons.length})</h3>
    <div class="owned-grid">${ownedWeaponsHTML}</div>

    ${ownedFlexByCategoryHTML}

    <h3 class="cat-heading">Product on Hand</h3>
    <div class="card-row">${DRUGS.map((d) => `${d.name}: ${state.drugInventory[d.id] || 0} ${d.unit}${(state.drugInventory[d.id] || 0) === 1 ? "" : "s"}`).join(" · ")}</div>

    <h3 class="cat-heading">Arms on Hand</h3>
    <div class="card-row">${ARMS_CATALOG.map((g) => `${g.name}: ${state.armsInventory[g.id] || 0}`).join(" · ")}</div>

    <h3 class="cat-heading">Watches on Hand</h3>
    <div class="card-row">${WATCH_SUPPLIER_CATALOG.map((w) => `${w.name}: ${state.watchInventory[w.id] || 0}`).join(" · ")}</div>

    <h3 class="cat-heading">Case File Backup</h3>
    <div class="card-row">This game saves only to this browser. Export your case file to carry it to another device or browser, or import one to restore it.</div>
    <div class="crypto-action-group">
      <button class="btn" data-action="export-save">Export Save File</button>
      <button class="btn" data-action="import-save-trigger">Import Save File</button>
      <button class="btn launder" data-action="show-save-code">Show Save Code</button>
    </div>
    <input type="file" id="import-save-input" accept=".json" style="display:none" />
    <div id="save-code-box"></div>
  `;
}

function showSaveCode() {
  const code = exportSaveCode();
  document.getElementById("save-code-box").innerHTML = `
    <div class="hint">Copy this code and paste it on another device/browser to restore this save:</div>
    <textarea readonly class="save-code-textarea" id="save-code-output">${code}</textarea>
    <button class="btn" data-action="copy-save-code">Copy Code</button>
    <div class="hint" style="margin-top:14px">Or paste a code here to load it (this overwrites your current save):</div>
    <textarea class="save-code-textarea" id="save-code-input" placeholder="Paste save code here"></textarea>
    <button class="btn sell" data-action="load-save-code">Load Code</button>
  `;
}

function laylowTabHTML() {
  const cards = LAYLOW_ACTIONS.map(
    (a) => `
      <div class="card">
        <div class="card-title">${a.name}</div>
        <div class="card-row">${a.desc}</div>
        <div class="card-row">-${a.heatRemoved} heat</div>
        <button class="btn" data-action="lay-low" data-id="${a.id}" ${state.cash < a.cost ? "disabled" : ""}>Pay ${fmt(a.cost)}</button>
      </div>`
  ).join("");

  const totalAgents = state.hiredAgents.length;
  const readyAgents = state.hiredAgents.filter(agentIsReady).length;
  const remain = state.nextAgentPayoutAt ? Math.max(0, Math.ceil((state.nextAgentPayoutAt - Date.now()) / 1000)) : null;
  const agentStatus =
    totalAgents > 0
      ? `<div class="active-contract"><div class="active-title">${readyAgents}/${totalAgents} agents field-ready</div><div class="card-row">Next payout in ${remain}s</div></div>`
      : `<div class="active-contract">No agents hired — you're doing every job yourself.</div>`;

  const agentCards = AGENTS.map((a) => {
    const owned = agentTypeCount(a.id);
    const locked = state.rep < a.repReq;
    const cost = Math.round(agentHireCost(a) * (1 - businessPerk("agentDiscount")));
    return `
      <div class="card ${locked ? "locked" : ""} ${owned > 0 ? "owned" : ""}">
        <div class="card-title">${a.name}${owned > 0 ? ` (${owned})` : ""}</div>
        <div class="card-row">${a.desc}</div>
        <div class="card-row">+${fmt(a.income)} / cycle · +${a.heat} heat / cycle</div>
        ${
          locked
            ? `<div class="locked-tag">Requires ${a.repReq} rep</div>`
            : `<button class="btn" data-action="hire-agent" data-id="${a.id}" ${state.cash < cost ? "disabled" : ""}>Hire — ${fmt(cost)}</button>`
        }
      </div>`;
  }).join("");

  return `
    <div class="grid">${cards}</div>
    <h3 class="cat-heading">Agents</h3>
    ${agentStatus}
    <div class="grid">${agentCards}</div>
    <h3 class="cat-heading">Your Roster</h3>
    <div class="card-row">Every agent needs a gun, clothing, and a car before they earn you anything.</div>
    <div class="grid">${agentRosterHTML()}</div>`;
}

function agentGearRow(unit, slot, catalog, currentId) {
  const current = catalog.find((g) => g.id === currentId);
  const options = catalog
    .map(
      (g) =>
        `<button class="btn ${g.id === currentId ? "equipped" : ""}" data-action="equip-agent" data-id="${unit.id}" data-slot="${slot}" data-gear="${g.id}" ${g.id === currentId || state.cash < g.cost ? "disabled" : ""}>${g.name} — ${fmt(g.cost)}</button>`
    )
    .join("");
  return `
    <div class="card-row">${slot === "gun" ? "Gun" : slot === "clothing" ? "Clothing" : "Car"}: ${current ? current.name : "None"}</div>
    <div class="crypto-action-group">${options}</div>`;
}

function agentRosterHTML() {
  if (state.hiredAgents.length === 0) return `<div class="card-row">No agents hired yet.</div>`;
  return state.hiredAgents
    .map((unit, idx) => {
      const type = AGENTS.find((a) => a.id === unit.typeId);
      const ready = agentIsReady(unit);
      return `
        <div class="card ${ready ? "owned" : ""}">
          <div class="card-title">${type ? type.name : "Agent"} #${idx + 1}</div>
          <div class="card-row">${ready ? `Field ready · +${Math.round(agentGearBonus(unit) * 100)}% income` : "Needs gear to work"}</div>
          ${agentGearRow(unit, "gun", AGENT_GEAR.guns, unit.gunId)}
          ${agentGearRow(unit, "clothing", AGENT_GEAR.clothing, unit.clothingId)}
          ${agentGearRow(unit, "car", AGENT_GEAR.cars, unit.carId)}
          <button class="btn sell" data-action="dismiss-agent" data-id="${unit.id}">Dismiss — ${fmt(type ? Math.round(type.cost * SELL_RATE) : 0)}</button>
        </div>`;
    })
    .join("");
}

function businessEffectiveIncome(b) {
  const condition = state.businessCondition[b.id] ?? 100;
  const mult = BUSINESS_CONDITION_MIN_INCOME_MULT + (1 - BUSINESS_CONDITION_MIN_INCOME_MULT) * (condition / 100);
  return Math.round(b.income * mult);
}

function businessesTabHTML() {
  const remain = state.nextBusinessPayoutAt ? Math.max(0, Math.ceil((state.nextBusinessPayoutAt - Date.now()) / 1000)) : null;
  const totalIncome = BUSINESSES.filter((b) => businessOwned(b.id)).reduce((sum, b) => sum + businessEffectiveIncome(b), 0);
  const status =
    state.businesses.length > 0
      ? `<div class="active-contract"><div class="active-title">${state.businesses.length} business${state.businesses.length === 1 ? "" : "es"} owned — ${fmt(totalIncome)} / cycle</div><div class="card-row">Next payout in ${remain}s</div></div>`
      : `<div class="active-contract">No businesses owned yet — pure income and a real cover.</div>`;

  const cards = BUSINESSES.map((b) => {
    const owned = businessOwned(b.id);
    const locked = state.rep < b.repReq;
    const condition = owned ? state.businessCondition[b.id] ?? 100 : 100;
    const maintainCost = businessMaintainCost(b);
    const shiftReady = owned && businessShiftReady(b.id);
    const shiftRemain = owned && !shiftReady ? Math.max(0, Math.ceil((state.businessShiftCooldown[b.id] - Date.now()) / 1000)) : 0;
    return `
      <div class="card ${locked ? "locked" : ""} ${owned ? "owned" : ""}">
        <div class="card-title">${b.name}</div>
        <div class="card-row">${b.desc}</div>
        <div class="card-row">+${fmt(b.income)} / cycle · -${Math.round(b.heatReduction * 100)}% heat gain</div>
        <div class="card-row">${b.perkLabel}</div>
        ${
          owned
            ? `
              <div class="card-row">Condition: ${Math.round(condition)}% — earning ${fmt(businessEffectiveIncome(b))} / cycle</div>
              <div class="heat-bar"><div class="heat-fill" style="width:${condition}%;background:${condition > 50 ? "linear-gradient(90deg, var(--neon-teal), #7fffb0)" : "linear-gradient(90deg, var(--neon-red), var(--neon-gold))"}"></div></div>
              <button class="btn" data-action="run-business-shift" data-id="${b.id}" ${shiftReady ? "" : "disabled"}>${shiftReady ? "Run a Shift" : `Shift cooldown — ${shiftRemain}s`}</button>
              <button class="btn" data-action="maintain-business" data-id="${b.id}" ${condition >= 100 || state.cash < maintainCost ? "disabled" : ""}>Maintain — ${fmt(maintainCost)}</button>
              <button class="btn sell" data-action="sell-business" data-id="${b.id}">Sell — ${fmt(Math.round(b.cost * SELL_RATE))}</button>`
            : locked
            ? `<div class="locked-tag">Requires ${b.repReq} rep</div>`
            : `<button class="btn" data-action="buy-business" data-id="${b.id}" ${state.cash < b.cost ? "disabled" : ""}>Buy — ${fmt(b.cost)}</button>`
        }
      </div>`;
  }).join("");

  return `${status}<div class="grid">${cards}</div>`;
}

const CITY_MAP_POS = {
  detroit: { x: 80, y: 110 },
  newyork: { x: 180, y: 50 },
  miami: { x: 210, y: 185 },
  losangeles: { x: 300, y: 90 },
  vegas: { x: 340, y: 155 },
  tokyo: { x: 530, y: 50 },
};
const CITY_ROUTES = [
  ["detroit", "newyork"],
  ["detroit", "miami"],
  ["detroit", "losangeles"],
  ["detroit", "vegas"],
  ["detroit", "tokyo"],
];

function territoryMapSVG(ownedJet) {
  const routeLines = CITY_ROUTES.map(([a, b]) => {
    const p1 = CITY_MAP_POS[a];
    const p2 = CITY_MAP_POS[b];
    return `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" class="map-route" />`;
  }).join("");

  const nodes = CITIES.map((c) => {
    const pos = CITY_MAP_POS[c.id];
    const here = state.currentCity === c.id;
    const locked = c.requiresJet && !ownedJet;
    const cls = here ? "map-node-here" : locked ? "map-node-locked" : "map-node-open";
    return `
      <g class="map-node ${cls}" data-action="travel-city" data-id="${c.id}">
        ${here ? `<circle cx="${pos.x}" cy="${pos.y}" r="22" class="map-node-pulse" />` : ""}
        <circle cx="${pos.x}" cy="${pos.y}" r="14" class="map-node-dot" />
        <text x="${pos.x}" y="${pos.y + 4}" class="map-node-icon">${locked ? "🔒" : here ? "📍" : "✈️"}</text>
        <text x="${pos.x}" y="${pos.y + 34}" class="map-node-label">${c.name}</text>
      </g>`;
  }).join("");

  return `<svg viewBox="0 0 600 225" class="territory-map">${routeLines}${nodes}</svg>`;
}

function worldTabHTML() {
  const ownedJet = hasPrivateJet();
  const map = territoryMapSVG(ownedJet);
  const cards = CITIES.map((c) => {
    const here = state.currentCity === c.id;
    const locked = c.requiresJet && !ownedJet;
    const cantAfford = !here && !locked && state.cash < TRAVEL_COST;
    return `
      <div class="card ${locked ? "locked" : ""} ${here ? "owned" : ""}">
        <div class="card-title">${c.name}</div>
        <div class="card-row">${c.desc}</div>
        ${c.requiresJet ? `<div class="card-row">Requires owning a private jet</div>` : ""}
        ${
          here
            ? `<button class="btn equipped" disabled>Currently Here</button>`
            : locked
            ? `<div class="locked-tag">Own a private jet to fly here</div>`
            : `<button class="btn" data-action="travel-city" data-id="${c.id}" ${cantAfford ? "disabled" : ""}>Fly Here — ${fmt(TRAVEL_COST)}</button>`
        }
      </div>`;
  }).join("");

  return `<div class="territory-map-wrap">${map}</div><div class="grid">${cards}</div>`;
}

function bindTabEvents() {
  document.querySelectorAll("[data-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      if (action === "take-contract") takeContract(id);
      else if (action === "play-contract") playContract(id);
      else if (action === "buy-weapon") buyWeapon(id);
      else if (action === "equip-weapon") equipWeapon(id);
      else if (action === "sell-weapon") sellWeapon(id);
      else if (action === "buy-flex") buyFlex(id);
      else if (action === "sell-flex") sellFlex(id);
      else if (action === "lay-low") doLayLow(id);
      else if (action === "hire-agent") hireAgent(id);
      else if (action === "dismiss-agent") dismissAgent(id);
      else if (action === "equip-agent") equipAgentGear(btn.dataset.id, btn.dataset.slot, btn.dataset.gear);
      else if (action === "buy-business") buyBusiness(id);
      else if (action === "sell-business") sellBusiness(id);
      else if (action === "maintain-business") maintainBusiness(id);
      else if (action === "run-business-shift") runBusinessShift(id);
      else if (action === "throw-house-event") throwHouseEvent(id);
      else if (action === "travel-city") travelToCity(id);
      else if (action === "export-save") exportSave();
      else if (action === "import-save-trigger") document.getElementById("import-save-input").click();
      else if (action === "show-save-code") showSaveCode();
      else if (action === "copy-save-code") {
        const out = document.getElementById("save-code-output");
        out.select();
        navigator.clipboard.writeText(out.value).catch(() => document.execCommand("copy"));
      } else if (action === "load-save-code") {
        const input = document.getElementById("save-code-input");
        importSaveCode(input.value);
      }
      else if (action === "pay-bill-early") payBillEarly(btn.dataset.type, id);
      else if (action === "pay-car-bill") payCarBillEarly(id);
      else if (action === "pay-agent-salary") payAgentSalaryEarly(id);
      else if (action === "rent-house") rentHouse(id);
      else if (action === "buy-house") buyHouse(id);
      else if (action === "sell-house") sellHouse(id);
      else if (action === "move-out") moveOut(id);
      else if (action === "deposit-bank") depositBank(Number(btn.dataset.amount));
      else if (action === "withdraw-bank") withdrawBank(Number(btn.dataset.amount));
      else if (action === "deposit-bank-custom") {
        const input = document.getElementById("bank-custom-amount");
        depositBank(Number(input.value));
        input.value = "";
      } else if (action === "withdraw-bank-custom") {
        const input = document.getElementById("bank-custom-amount");
        withdrawBank(Number(input.value));
        input.value = "";
      }
      else if (action === "flex-view") {
        flexView = btn.dataset.view;
        render();
      }
      else if (action === "casino-view") {
        casinoView = btn.dataset.view;
        render();
      } else if (action === "bj-start") startBlackjack(Number(btn.dataset.amount));
      else if (action === "bj-hit") bjHit();
      else if (action === "bj-stand") bjStand();
      else if (action === "bj-double") bjDouble();
      else if (action === "bj-new") bjNewRound();
      else if (action === "slot-spin") spinSlots(Number(btn.dataset.amount));
      else if (action === "roulette-select") selectRouletteBet(btn.dataset.type, btn.dataset.number);
      else if (action === "roulette-clear") clearRouletteBet();
      else if (action === "roulette-spin") spinRoulette(Number(btn.dataset.amount));
      else if (action === "highlow-start") startHighlow(Number(btn.dataset.amount));
      else if (action === "highlow-guess") highlowGuess(btn.dataset.dir);
      else if (action === "highlow-cashout") highlowCashOut();
      else if (action === "highlow-new") highlowNewRound();
      else if (action === "sports-select") selectSportsBet(id, btn.dataset.side);
      else if (action === "sports-clear") clearSportsBet();
      else if (action === "sports-bet") placeSportsBet(Number(btn.dataset.amount));
      else if (action === "sports-bet-custom") {
        const input = document.getElementById("sports-custom-amount");
        placeSportsBet(Number(input.value));
        input.value = "";
      }
      else if (action === "sports-new") newSportsRound();
    });
  });

  const importInput = document.getElementById("import-save-input");
  if (importInput) {
    importInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) importSaveFile(file);
    });
  }
}

function renderLog() {
  const el = document.getElementById("log");
  el.innerHTML = state.log
    .map((entry) => `<div class="log-entry log-${entry.type}">${entry.msg}</div>`)
    .join("");
}

function renderBurnOverlay() {
  const overlay = document.getElementById("burn-overlay");
  const burned = Date.now() < state.burnedUntil;
  overlay.classList.toggle("hidden", !burned);
}

function openMinigameModal(contract, onDone) {
  document.getElementById("mg-title").textContent = contract.mgTitle;
  document.getElementById("mg-flavor").textContent = contract.mgFlavor;
  document.getElementById("minigame-overlay").classList.remove("hidden");
  const skipBtn = document.getElementById("mg-skip");
  skipBtn.textContent = "Skip (small penalty)";
  skipBtn.onclick = null;

  const weapon = WEAPONS.find((w) => w.id === state.equippedWeapon);
  document.getElementById("mg-loadout").innerHTML = weapon
    ? `
      <div class="art-box mg-loadout-art">${itemArtSVG(weapon.id, 34)}</div>
      <div class="mg-loadout-text">
        <div class="mg-loadout-label">Armed With</div>
        <div class="mg-loadout-name">${weapon.name}</div>
      </div>
      <div class="mg-loadout-bonus">+${Math.round(weapon.bonus * 100)}%</div>`
    : "";

  const body = document.getElementById("mg-body");
  body.innerHTML = "";
  window.__mgDone = onDone;
  window.__mgSession = (window.__mgSession || 0) + 1;
  const session = window.__mgSession;
  startMinigame(contract, body, (perf) => {
    if (session !== window.__mgSession) return; // an abandoned/skipped minigame finishing late — ignore it
    if (window.__mgDone) {
      const done = window.__mgDone;
      window.__mgDone = null;
      done(perf);
    }
  });
}

function closeMinigameModal() {
  window.__mgSession = (window.__mgSession || 0) + 1;
  document.getElementById("minigame-overlay").classList.add("hidden");
  document.getElementById("mg-body").innerHTML = "";
  window.__mgDone = null;
}

function showMinigameResult(result) {
  document.getElementById("mg-title").textContent = result.success ? "CONTRACT COMPLETE" : "CONTRACT FAILED";
  document.getElementById("mg-flavor").textContent = result.contractName;
  document.getElementById("mg-loadout").innerHTML = "";
  document.getElementById("mg-body").innerHTML = `
    <div class="mg-result-screen">
      <div class="mg-result-icon">${result.success ? "✅" : "❌"}</div>
      <div class="mg-result-text ${result.success ? "great" : "fail"}">${result.success ? "PASSED" : "FAILED"}</div>
      <div class="mg-result-detail">${
        result.success ? `+${fmt(result.payout)} · +${result.repGain} rep · +${Math.round(result.heatGain)} heat` : `No payout · +${Math.round(result.heatGain)} heat`
      }</div>
    </div>`;
  const skipBtn = document.getElementById("mg-skip");
  skipBtn.textContent = "Continue";
  skipBtn.onclick = () => closeMinigameModal();
}

document.getElementById("mg-skip").addEventListener("click", () => {
  if (window.__mgDone) {
    window.__mgDone = null;
    skipMinigame();
  }
});

// ---------- Phone ----------

let phoneOpenContact = null;

function togglePhone() {
  const panel = document.getElementById("phone-panel");
  const opening = panel.classList.contains("hidden");
  panel.classList.toggle("hidden");
  if (opening) renderPhoneHome();
}

// Replacing phone-body's innerHTML resets its scroll position — this preserves it,
// so buying stock (etc.) mid-list doesn't jump the view back to the top.
function setPhoneBody(html) {
  const el = document.getElementById("phone-body");
  const scrollTop = el.scrollTop;
  el.innerHTML = html;
  el.scrollTop = scrollTop;
}

const HOME_APPS = [
  { icon: "📞", label: "Contacts", bg: "linear-gradient(160deg,#3ddc73,#1a8f45)" },
  { icon: "💬", label: "Messages", bg: "linear-gradient(160deg,#3ddc73,#1a8f45)" },
  { icon: "📷", label: "Evidence", bg: "linear-gradient(160deg,#5a5a5a,#181818)" },
  { icon: "🗒️", label: "Case Notes", bg: "linear-gradient(160deg,#ffd166,#c98f1a)" },
  { icon: "🕐", label: "Countdown", bg: "linear-gradient(160deg,#2e2e2e,#000)" },
  { icon: "⚙️", label: "Settings", bg: "linear-gradient(160deg,#9a9aa0,#4a4a50)" },
  { icon: "🗺️", label: "Routes", bg: "linear-gradient(160deg,#5ecbf5,#1a7fae)" },
  { icon: "💰", label: "Ledger", bg: "linear-gradient(160deg,#00e676,#0a8f45)", action: "open-books" },
];
const HOME_DOCK = [
  { icon: "📞", bg: "linear-gradient(160deg,#3ddc73,#1a8f45)" },
  { icon: "🧭", bg: "linear-gradient(160deg,#5ecbf5,#1a7fae)" },
  { icon: "💬", bg: "linear-gradient(160deg,#3ddc73,#1a8f45)" },
  { icon: "🎵", bg: "linear-gradient(160deg,#ff5e7a,#a8123a)" },
];

function renderPhoneHome() {
  phoneOpenContact = "__home__";
  document.getElementById("phone-title").textContent = "";
  document.getElementById("phone-back").classList.add("hidden");

  const tierIdx = currentTierIndex();
  const tier = TIERS[tierIdx];
  const appIcons = HOME_APPS.map(
    (a) => `
      <div class="home-app" data-action="${a.action || "open-contacts"}">
        <div class="home-app-icon" style="background:${a.bg}">${a.icon}</div>
        <div class="home-app-label">${a.label}</div>
      </div>`
  ).join("");
  const dockIcons = HOME_DOCK.map((a) => `<div class="home-dock-icon" style="background:${a.bg}" data-action="open-contacts">${a.icon}</div>`).join("");

  setPhoneBody(`
    <div class="iphone-home">
      <div class="home-widgets">
        <div class="home-widget">
          <div class="home-widget-label">🔥 Suspicion</div>
          <div class="home-widget-value">${Math.round(state.heat)}%</div>
          <div class="heat-bar home-widget-bar"><div class="heat-fill" style="width:${state.heat}%"></div></div>
        </div>
        <div class="home-widget">
          <div class="home-widget-label">💰 Cash on Hand</div>
          <div class="home-widget-value">${fmt(state.cash)}</div>
          <div class="home-widget-sub">${tier.name}</div>
        </div>
      </div>
      <div class="home-app-grid">${appIcons}</div>
      <button class="home-search" data-action="open-contacts">🔍 Search</button>
      <div class="home-dock">${dockIcons}</div>
    </div>`);
}

function closePhone() {
  document.getElementById("phone-panel").classList.add("hidden");
}

function renderPhoneContacts() {
  phoneOpenContact = null;
  document.getElementById("phone-title").textContent = "Contacts";
  document.getElementById("phone-back").classList.remove("hidden");

  const pendingCount = state.drugRequests.length;
  const pendingGunOrders = state.gunOrders.length;
  const pendingWatchOrders = state.watchOrders.length;

  // Rows with a pending notification sort to the top (stable — ties keep their
  // original order), so new orders/buyers surface without hunting through the list.
  const rows = [
    {
      pending: pendingCount,
      html: `
        <div class="phone-contact" data-contact="__requests__">
          <div class="phone-contact-name">Customers ${pendingCount > 0 ? `<span class="phone-badge">${pendingCount}</span>` : ""}</div>
          <div class="phone-contact-preview">${pendingCount > 0 ? `${pendingCount} buyer${pendingCount > 1 ? "s" : ""} waiting on you` : "No buyers right now"}</div>
        </div>`,
    },
    {
      pending: 0,
      html: `
        <div class="phone-contact" data-contact="__plug__">
          <div class="phone-contact-name">The Plug <span class="phone-contact-role">Supplier</span></div>
          <div class="phone-contact-preview">Reup your stock</div>
        </div>`,
    },
    {
      pending: 0,
      html: `
        <div class="phone-contact" data-contact="__armsdealer__">
          <div class="phone-contact-name">Arms Dealer <span class="phone-contact-role">Supplier</span></div>
          <div class="phone-contact-preview">Guns, wholesale</div>
        </div>`,
    },
    {
      pending: pendingGunOrders,
      html: `
        <div class="phone-contact" data-contact="__gunorders__">
          <div class="phone-contact-name">Gun Orders ${pendingGunOrders > 0 ? `<span class="phone-badge">${pendingGunOrders}</span>` : ""}</div>
          <div class="phone-contact-preview">${pendingGunOrders > 0 ? `${pendingGunOrders} order${pendingGunOrders > 1 ? "s" : ""} waiting on you` : "No orders right now"}</div>
        </div>`,
    },
    {
      pending: 0,
      html: `
        <div class="phone-contact" data-contact="__watchsupplier__">
          <div class="phone-contact-name">Watch Supplier <span class="phone-contact-role">Supplier</span></div>
          <div class="phone-contact-preview">Timepieces, wholesale</div>
        </div>`,
    },
    {
      pending: pendingWatchOrders,
      html: `
        <div class="phone-contact" data-contact="__watchorders__">
          <div class="phone-contact-name">Watch Orders ${pendingWatchOrders > 0 ? `<span class="phone-badge">${pendingWatchOrders}</span>` : ""}</div>
          <div class="phone-contact-preview">${pendingWatchOrders > 0 ? `${pendingWatchOrders} order${pendingWatchOrders > 1 ? "s" : ""} waiting on you` : "No orders right now"}</div>
        </div>`,
    },
    ...CONTACTS.map((c) => {
      const thread = state.phone.threads[c.id];
      const preview = thread && thread.length ? thread[thread.length - 1].text : c.intro;
      return {
        pending: 0,
        html: `
          <div class="phone-contact" data-contact="${c.id}">
            <div class="phone-contact-name">${c.name} <span class="phone-contact-role">${c.role}</span></div>
            <div class="phone-contact-preview">${preview}</div>
          </div>`,
      };
    }),
  ];

  rows.sort((a, b) => b.pending - a.pending);

  setPhoneBody(rows.map((r) => r.html).join(""));
}

function renderPlugPanel() {
  phoneOpenContact = "__plug__";
  document.getElementById("phone-title").textContent = "The Plug";
  document.getElementById("phone-back").classList.remove("hidden");

  const rows = DRUGS.map((d) => {
    const owned = state.drugInventory[d.id] || 0;
    return `
      <div class="plug-row">
        <div class="plug-row-title">${d.name} <span class="plug-row-stock">${owned} ${d.unit}${owned === 1 ? "" : "s"} on hand</span></div>
        <div class="card-row">${fmt(d.buyPrice)} / ${d.unit}</div>
        <div class="crypto-action-group">
          <button class="btn" data-action="buy-drug" data-drug="${d.id}" data-qty="5" ${state.cash < d.buyPrice * 5 ? "disabled" : ""}>Buy 5 — ${fmt(d.buyPrice * 5)}</button>
          <button class="btn" data-action="buy-drug" data-drug="${d.id}" data-qty="20" ${state.cash < d.buyPrice * 20 ? "disabled" : ""}>Buy 20 — ${fmt(d.buyPrice * 20)}</button>
        </div>
      </div>`;
  }).join("");

  setPhoneBody(`<div class="plug-panel">${rows}</div>`);
}

function renderArmsDealerPanel() {
  phoneOpenContact = "__armsdealer__";
  document.getElementById("phone-title").textContent = "Arms Dealer";
  document.getElementById("phone-back").classList.remove("hidden");

  const rows = ARMS_CATALOG.map((g) => {
    const owned = state.armsInventory[g.id] || 0;
    return `
      <div class="plug-row">
        <div class="art-box">${itemArtSVG(g.id, 56)}</div>
        <div class="plug-row-title">${g.name} <span class="plug-row-stock">${owned} on hand</span></div>
        <div class="card-row">${fmt(g.buyPrice)} each</div>
        <div class="crypto-action-group">
          <button class="btn" data-action="buy-arms" data-gun="${g.id}" data-qty="1" ${state.cash < g.buyPrice ? "disabled" : ""}>Buy 1 — ${fmt(g.buyPrice)}</button>
          <button class="btn" data-action="buy-arms" data-gun="${g.id}" data-qty="5" ${state.cash < g.buyPrice * 5 ? "disabled" : ""}>Buy 5 — ${fmt(g.buyPrice * 5)}</button>
        </div>
      </div>`;
  }).join("");

  setPhoneBody(`<div class="plug-panel">${rows}</div>`);
}

function renderGunOrdersView() {
  phoneOpenContact = "__gunorders__";
  document.getElementById("phone-title").textContent = "Gun Orders";
  document.getElementById("phone-back").classList.remove("hidden");

  if (state.gunOrders.length === 0) {
    setPhoneBody(`<div class="hint">No orders right now. Check back soon.</div>`);
    return;
  }

  const rows = state.gunOrders
    .map((order) => {
      const g = ARMS_CATALOG.find((x) => x.id === order.gunId);
      const remain = Math.max(0, Math.ceil((order.expiresAt - Date.now()) / 1000));
      const haveEnough = (state.armsInventory[order.gunId] || 0) >= order.qty;
      const counterBtns = GUN_COUNTER_OPTIONS.map(
        (opt) =>
          `<button class="btn launder" data-action="counter-gun-order" data-id="${order.id}" data-pct="${opt.pct}" data-chance="${opt.chance}" ${haveEnough ? "" : "disabled"}>${opt.label} (${Math.round(opt.chance * 100)}%)</button>`
      ).join("");
      return `
        <div class="plug-row">
          <div class="art-box">${itemArtSVG(g.id, 56)}</div>
          <div class="plug-row-title">Wants ${order.qty} ${g.name}${order.qty > 1 ? "s" : ""}</div>
          <div class="card-row">Offering ${fmt(order.offerPrice)} · expires in ${remain}s</div>
          ${!haveEnough ? `<div class="locked-tag">Not enough ${g.name} in stock</div>` : ""}
          <div class="crypto-action-group">
            <button class="btn" data-action="accept-gun-order" data-id="${order.id}" ${haveEnough ? "" : "disabled"}>Accept — ${fmt(order.offerPrice)}</button>
            ${counterBtns}
            <button class="btn sell" data-action="decline-gun-order" data-id="${order.id}">Decline</button>
          </div>
        </div>`;
    })
    .join("");

  setPhoneBody(`<div class="plug-panel">${rows}</div>`);
}

function renderDrugRequestsView() {
  phoneOpenContact = "__requests__";
  document.getElementById("phone-title").textContent = "Customers";
  document.getElementById("phone-back").classList.remove("hidden");

  if (state.drugRequests.length === 0) {
    setPhoneBody(`<div class="hint">No buyers right now. Check back soon.</div>`);
    return;
  }

  const rows = state.drugRequests
    .map((req) => {
      const d = DRUGS.find((x) => x.id === req.drugId);
      const remain = Math.max(0, Math.ceil((req.expiresAt - Date.now()) / 1000));
      const haveEnough = (state.drugInventory[req.drugId] || 0) >= req.qty;
      const counterBtns = DRUG_COUNTER_OPTIONS.map(
        (opt) =>
          `<button class="btn launder" data-action="counter-drug-request" data-id="${req.id}" data-pct="${opt.pct}" data-chance="${opt.chance}" ${haveEnough ? "" : "disabled"}>${opt.label} (${Math.round(opt.chance * 100)}%)</button>`
      ).join("");
      return `
        <div class="plug-row">
          <div class="plug-row-title">Wants ${req.qty} ${d.unit}${req.qty > 1 ? "s" : ""} of ${d.name}</div>
          <div class="card-row">Offering ${fmt(req.offerPrice)} · expires in ${remain}s</div>
          ${!haveEnough ? `<div class="locked-tag">Not enough ${d.name} in stock</div>` : ""}
          <div class="crypto-action-group">
            <button class="btn" data-action="accept-drug-request" data-id="${req.id}" ${haveEnough ? "" : "disabled"}>Accept — ${fmt(req.offerPrice)}</button>
            ${counterBtns}
            <button class="btn sell" data-action="decline-drug-request" data-id="${req.id}">Decline</button>
          </div>
        </div>`;
    })
    .join("");

  setPhoneBody(`<div class="plug-panel">${rows}</div>`);
}

function renderWatchSupplierPanel() {
  phoneOpenContact = "__watchsupplier__";
  document.getElementById("phone-title").textContent = "Watch Supplier";
  document.getElementById("phone-back").classList.remove("hidden");

  const rows = WATCH_SUPPLIER_CATALOG.map((w) => {
    const owned = state.watchInventory[w.id] || 0;
    return `
      <div class="plug-row">
        <div class="art-box">${itemArtSVG(w.id, 56)}</div>
        <div class="plug-row-title">${w.name} <span class="plug-row-stock">${owned} on hand</span></div>
        <div class="card-row">${fmt(w.buyPrice)} each</div>
        <div class="crypto-action-group">
          <button class="btn" data-action="buy-watch" data-watch="${w.id}" data-qty="1" ${state.cash < w.buyPrice ? "disabled" : ""}>Buy 1 — ${fmt(w.buyPrice)}</button>
          <button class="btn" data-action="buy-watch" data-watch="${w.id}" data-qty="5" ${state.cash < w.buyPrice * 5 ? "disabled" : ""}>Buy 5 — ${fmt(w.buyPrice * 5)}</button>
        </div>
      </div>`;
  }).join("");

  setPhoneBody(`<div class="plug-panel">${rows}</div>`);
}

function renderWatchOrdersView() {
  phoneOpenContact = "__watchorders__";
  document.getElementById("phone-title").textContent = "Watch Orders";
  document.getElementById("phone-back").classList.remove("hidden");

  if (state.watchOrders.length === 0) {
    setPhoneBody(`<div class="hint">No orders right now. Check back soon.</div>`);
    return;
  }

  const rows = state.watchOrders
    .map((order) => {
      const w = WATCH_SUPPLIER_CATALOG.find((x) => x.id === order.watchId);
      const remain = Math.max(0, Math.ceil((order.expiresAt - Date.now()) / 1000));
      const haveEnough = (state.watchInventory[order.watchId] || 0) >= order.qty;
      const counterBtns = WATCH_COUNTER_OPTIONS.map(
        (opt) =>
          `<button class="btn launder" data-action="counter-watch-order" data-id="${order.id}" data-pct="${opt.pct}" data-chance="${opt.chance}" ${haveEnough ? "" : "disabled"}>${opt.label} (${Math.round(opt.chance * 100)}%)</button>`
      ).join("");
      return `
        <div class="plug-row">
          <div class="art-box">${itemArtSVG(w.id, 56)}</div>
          <div class="plug-row-title">Wants ${order.qty} ${w.name}${order.qty > 1 ? "s" : ""}</div>
          <div class="card-row">Offering ${fmt(order.offerPrice)} · expires in ${remain}s</div>
          ${!haveEnough ? `<div class="locked-tag">Not enough ${w.name} in stock</div>` : ""}
          <div class="crypto-action-group">
            <button class="btn" data-action="accept-watch-order" data-id="${order.id}" ${haveEnough ? "" : "disabled"}>Accept — ${fmt(order.offerPrice)}</button>
            ${counterBtns}
            <button class="btn sell" data-action="decline-watch-order" data-id="${order.id}">Decline</button>
          </div>
        </div>`;
    })
    .join("");

  setPhoneBody(`<div class="plug-panel">${rows}</div>`);
}

function historySparkline(history, w, h) {
  if (history.length < 2) return "";
  const max = Math.max(...history);
  const min = Math.min(...history);
  const range = max - min || 1;
  return history
    .map((v, i) => {
      const x = (i / (history.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");
}

function renderBooksView() {
  phoneOpenContact = "__books__";
  document.getElementById("phone-title").textContent = "Books";
  document.getElementById("phone-back").classList.remove("hidden");

  const history = state.netWorthHistory.length ? state.netWorthHistory : [netWorth()];
  const points = historySparkline(history, 300, 90);
  const trend = history.length > 1 ? history[history.length - 1] - history[0] : 0;
  const trendCls = trend > 0 ? "great" : trend < 0 ? "fail" : "ok";

  setPhoneBody(`
    <div class="books-hero">
      <div class="home-widget-label">Net Worth</div>
      <div class="books-networth">${fmt(netWorth())}</div>
      <div class="mg-result-text ${trendCls}" style="font-size:0.75rem">${trend >= 0 ? "▲" : "▼"} ${fmt(Math.abs(trend))} over this session</div>
      <svg viewBox="0 0 300 90" class="books-chart"><polyline points="${points}" /></svg>
    </div>
    <h3 class="cat-heading">Revenue Streams (Lifetime)</h3>
    <div class="vault-stat-grid">
      <div class="vault-stat-card"><span class="stat-label">Total Earned</span><span class="stat-value cash">${fmt(state.stats.totalEarned)}</span></div>
      <div class="vault-stat-card"><span class="stat-label">Business Income</span><span class="stat-value cash">${fmt(state.stats.businessIncomeTotal)}</span></div>
      <div class="vault-stat-card"><span class="stat-label">Drug Sales</span><span class="stat-value cash">${fmt(state.stats.drugSalesTotal)}</span></div>
      <div class="vault-stat-card"><span class="stat-label">Gun Sales</span><span class="stat-value cash">${fmt(state.stats.gunSalesTotal)}</span></div>
      <div class="vault-stat-card"><span class="stat-label">Watch Sales</span><span class="stat-value cash">${fmt(state.stats.watchSalesTotal)}</span></div>
      <div class="vault-stat-card"><span class="stat-label">Cash + Bank</span><span class="stat-value cash">${fmt(state.cash + state.bankBalance)}</span></div>
    </div>
    <div class="hint">Net worth is sampled every 10s this session — the chart resets when you close the tab.</div>
  `);
}

function renderPhoneThread(contactId) {
  const contact = CONTACTS.find((c) => c.id === contactId);
  if (!contact) return;
  phoneOpenContact = contactId;
  ensurePhoneThread(contactId);

  document.getElementById("phone-title").textContent = contact.name;
  document.getElementById("phone-back").classList.remove("hidden");

  const thread = state.phone.threads[contactId];
  const bubbles = thread.map((m) => `<div class="phone-bubble ${m.from}">${m.text}</div>`).join("");

  document.getElementById("phone-body").innerHTML = `
    <div class="phone-thread">${bubbles}</div>
    <div class="phone-actions">
      <button class="btn" data-action="phone-text" data-contact="${contact.id}">Text</button>
      <button class="btn" data-action="phone-money" data-contact="${contact.id}" data-amount="500" ${state.cash < 500 ? "disabled" : ""}>Send ${fmt(500)}</button>
      <button class="btn" data-action="phone-money" data-contact="${contact.id}" data-amount="2000" ${state.cash < 2000 ? "disabled" : ""}>Send ${fmt(2000)}</button>
      <button class="btn" data-action="phone-money" data-contact="${contact.id}" data-amount="10000" ${state.cash < 10000 ? "disabled" : ""}>Send ${fmt(10000)}</button>
    </div>
    ${contact.effect === "heat" ? '<div class="hint">Money to Doc cools your heat.</div>' : ""}
    ${contact.effect === "boost" ? '<div class="hint">Money to Crew boosts your next job\'s odds.</div>' : ""}
  `;

  const body = document.getElementById("phone-body");
  const threadEl = body.querySelector(".phone-thread");
  if (threadEl) threadEl.scrollTop = threadEl.scrollHeight;
}

document.getElementById("phone-toggle").addEventListener("click", togglePhone);
document.getElementById("phone-close").addEventListener("click", closePhone);
function phoneGoBack() {
  if (phoneOpenContact === null) renderPhoneHome();
  else if (phoneOpenContact === "__books__") renderPhoneHome();
  else renderPhoneContacts();
}
document.getElementById("phone-back").addEventListener("click", phoneGoBack);

document.getElementById("phone-body").addEventListener("click", (e) => {
  const contactRow = e.target.closest("[data-contact]");
  const actionBtn = e.target.closest("[data-action]");
  if (actionBtn) {
    const action = actionBtn.dataset.action;
    const contactId = actionBtn.dataset.contact;
    if (action === "phone-text") sendPhoneText(contactId);
    else if (action === "phone-money") sendPhoneMoney(contactId, Number(actionBtn.dataset.amount));
    else if (action === "buy-drug") buyDrug(actionBtn.dataset.drug, Number(actionBtn.dataset.qty));
    else if (action === "accept-drug-request") acceptDrugRequest(actionBtn.dataset.id);
    else if (action === "counter-drug-request") counterDrugRequest(actionBtn.dataset.id, Number(actionBtn.dataset.pct), Number(actionBtn.dataset.chance));
    else if (action === "decline-drug-request") declineDrugRequest(actionBtn.dataset.id);
    else if (action === "buy-arms") buyArmsStock(actionBtn.dataset.gun, Number(actionBtn.dataset.qty));
    else if (action === "accept-gun-order") acceptGunOrder(actionBtn.dataset.id);
    else if (action === "counter-gun-order") counterGunOrder(actionBtn.dataset.id, Number(actionBtn.dataset.pct), Number(actionBtn.dataset.chance));
    else if (action === "decline-gun-order") declineGunOrder(actionBtn.dataset.id);
    else if (action === "buy-watch") buyWatchStock(actionBtn.dataset.watch, Number(actionBtn.dataset.qty));
    else if (action === "accept-watch-order") acceptWatchOrder(actionBtn.dataset.id);
    else if (action === "counter-watch-order") counterWatchOrder(actionBtn.dataset.id, Number(actionBtn.dataset.pct), Number(actionBtn.dataset.chance));
    else if (action === "decline-watch-order") declineWatchOrder(actionBtn.dataset.id);
    else if (action === "open-contacts") renderPhoneContacts();
    else if (action === "open-books") renderBooksView();
  } else if (contactRow) {
    const id = contactRow.dataset.contact;
    if (id === "__plug__") renderPlugPanel();
    else if (id === "__requests__") renderDrugRequestsView();
    else if (id === "__armsdealer__") renderArmsDealerPanel();
    else if (id === "__gunorders__") renderGunOrdersView();
    else if (id === "__watchsupplier__") renderWatchSupplierPanel();
    else if (id === "__watchorders__") renderWatchOrdersView();
    else renderPhoneThread(id);
  }
});
