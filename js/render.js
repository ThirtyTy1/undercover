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
    <div class="stat">
      <span class="stat-label">Crypto</span>
      <span class="stat-value crypto">${fmt(walletValue())}</span>
    </div>
    <div class="stat heat-stat">
      <span class="stat-label">Suspicion</span>
      <div class="heat-bar"><div class="heat-fill" style="width:${state.heat}%"></div></div>
    </div>
    <div class="stat">
      <span class="stat-label">${tier.name}</span>
      <div class="rep-bar"><div class="rep-fill" style="width:${repPct}%"></div></div>
    </div>
  `;
}

function renderTabContent() {
  const el = document.getElementById("tab-content");
  if (activeTab === "contracts") el.innerHTML = contractsTabHTML();
  else if (activeTab === "arsenal") el.innerHTML = arsenalTabHTML();
  else if (activeTab === "flex") el.innerHTML = flexTabHTML();
  else if (activeTab === "crypto") el.innerHTML = cryptoTabHTML();
  else if (activeTab === "bank") el.innerHTML = bankTabHTML();
  else if (activeTab === "casino") el.innerHTML = casinoTabHTML();
  else if (activeTab === "businesses") el.innerHTML = businessesTabHTML();
  else if (activeTab === "housing") el.innerHTML = housingTabHTML();
  else if (activeTab === "laylow") el.innerHTML = laylowTabHTML();
  else if (activeTab === "profile") el.innerHTML = profileTabHTML();
  bindTabEvents();
}

function contractsTabHTML() {
  const tierIdx = currentTierIndex();
  const burned = Date.now() < state.burnedUntil;
  let activeHTML = "";

  if (burned) {
    const remain = Math.ceil((state.burnedUntil - Date.now()) / 1000);
    activeHTML = `<div class="active-contract burned">Lying low... back in ${remain}s</div>`;
  } else if (state.activeContract && state.activeContract.ready) {
    const c = CONTRACTS.find((c) => c.id === state.activeContract.contractId);
    activeHTML = `
      <div class="active-contract ready">
        <div class="active-title">Job ready: ${c.name} — finish it to collect</div>
        <button class="btn mg-action" data-action="play-contract">Play Contract</button>
      </div>`;
  } else if (state.activeContract) {
    const c = CONTRACTS.find((c) => c.id === state.activeContract.contractId);
    const elapsed = Date.now() - state.activeContract.startedAt;
    const pct = Math.min(100, (elapsed / state.activeContract.duration) * 100);
    const remain = Math.max(0, Math.ceil((state.activeContract.duration - elapsed) / 1000));
    activeHTML = `
      <div class="active-contract">
        <div class="active-title">In progress: ${c.name} — ${remain}s left</div>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
      </div>`;
  }

  const cards = CONTRACTS.map((c) => {
    const locked = c.tier > tierIdx;
    const disabled = locked || !!state.activeContract || burned;
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
            ? `<div class="locked-tag">Requires ${TIERS[c.tier].name} (${TIERS[c.tier].repReq} rep)</div>`
            : `<button class="btn" data-action="take-contract" data-id="${c.id}" ${disabled ? "disabled" : ""}>Take Contract</button>`
        }
      </div>`;
  }).join("");

  return `${activeHTML}<div class="grid">${cards}</div>`;
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

function flexTabHTML() {
  return (
    flexCategoryHTML("Cars", FLEX_ITEMS.cars) +
    flexCategoryHTML("Watches", FLEX_ITEMS.watches) +
    flexCategoryHTML("Necklaces", FLEX_ITEMS.necklaces) +
    flexCategoryHTML("Clothes", FLEX_ITEMS.clothes)
  );
}

function coinSparkline(history) {
  const max = Math.max(...history);
  const min = Math.min(...history);
  const range = max - min || 1;
  return history
    .map((p, i) => {
      const x = (i / (history.length - 1 || 1)) * 300;
      const y = 80 - ((p - min) / range) * 80;
      return `${x},${y}`;
    })
    .join(" ");
}

function cryptoTabHTML() {
  const coins = CRYPTOS.map((c) => {
    const w = state.wallet[c.id];
    const points = coinSparkline(w.history);
    const holdingsVal = w.amount * w.price;
    const priceStr = w.price >= 1 ? fmt(w.price) : "$" + w.price.toFixed(4);
    return `
      <div class="crypto-panel">
        <div class="crypto-coin-header">
          <div class="crypto-price">${c.name} (${c.id}) — ${priceStr}</div>
          <div class="card-row">Holdings: ${w.amount.toFixed(6)} ${c.id} (${fmt(holdingsVal)})</div>
        </div>
        <svg viewBox="0 0 300 80" class="sparkline"><polyline points="${points}" /></svg>
        <div class="crypto-actions">
          <div class="crypto-action-group">
            <button class="btn" data-action="buy-crypto" data-coin="${c.id}" data-amount="500">Buy ${fmt(500)}</button>
            <button class="btn" data-action="buy-crypto" data-coin="${c.id}" data-amount="5000">Buy ${fmt(5000)}</button>
            <button class="btn" data-action="buy-crypto-all" data-coin="${c.id}">Buy All Cash</button>
          </div>
          <div class="crypto-action-group">
            <button class="btn" data-action="sell-crypto-all" data-coin="${c.id}">Sell All ${c.id}</button>
          </div>
          <div class="crypto-action-group">
            <button class="btn launder" data-action="launder" data-coin="${c.id}" data-amount="2000">Launder ${fmt(2000)}</button>
            <button class="btn launder" data-action="launder-all" data-coin="${c.id}">Launder All Cash</button>
          </div>
        </div>
      </div>`;
  }).join("");

  return `${coins}<div class="hint">Laundering converts dirty cash into a coin at a 10% cut, and cools your heat by 15. Simulated prices — not live market data.</div>`;
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
        <button class="btn" data-action="deposit-bank-all">Deposit All Cash</button>
        <button class="btn sell" data-action="withdraw-bank" data-amount="1000">Withdraw ${fmt(1000)}</button>
        <button class="btn sell" data-action="withdraw-bank" data-amount="10000">Withdraw ${fmt(10000)}</button>
        <button class="btn sell" data-action="withdraw-bank-all">Withdraw All</button>
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
    </div>`;
  const body = casinoView === "blackjack" ? blackjackHTML() : casinoView === "slots" ? slotsHTML() : rouletteHTML();
  return nav + body;
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

function rouletteHTML() {
  const spinning = rouletteGame && rouletteGame.phase === "spinning";
  const resultColorCls = rouletteGame && !spinning ? rouletteGame.resultColor : "";
  const resultNumberText = spinning ? "?" : rouletteGame ? rouletteGame.resultNumber : "–";

  const numberCells = Array.from({ length: 37 }, (_, n) => n)
    .map((n) => {
      const color = rouletteColor(n);
      const selected = rouletteSelection.type === "straight" && rouletteSelection.number === n;
      return `<div class="roulette-cell ${color} ${selected ? "selected" : ""}" data-action="roulette-select" data-type="straight" data-number="${n}">${n}</div>`;
    })
    .join("");

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
      <div class="roulette-grid">${numberCells}</div>
      <div class="crypto-action-group">${outsideBtns}</div>
      <div class="card-row">Bet: ${betLabel || "None selected — tap a number or an outside bet"}</div>
      <div class="crypto-action-group">
        <button class="btn" data-action="roulette-spin" data-amount="100" ${!rouletteSelection.type || spinning || state.cash < 100 ? "disabled" : ""}>Spin ${fmt(100)}</button>
        <button class="btn" data-action="roulette-spin" data-amount="500" ${!rouletteSelection.type || spinning || state.cash < 500 ? "disabled" : ""}>Spin ${fmt(500)}</button>
        <button class="btn" data-action="roulette-spin" data-amount="2000" ${!rouletteSelection.type || spinning || state.cash < 2000 ? "disabled" : ""}>Spin ${fmt(2000)}</button>
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
  const house = currentHouse();
  let currentHTML = "";

  if (house) {
    const due = state.housingType === "rent" ? house.rentCost : house.taxCost;
    const label = state.housingType === "rent" ? "Rent" : "Property tax";
    const remain = state.nextBillAt ? Math.max(0, state.nextBillAt - Date.now()) / 1000 : 0;
    currentHTML = `
      <div class="active-contract">
        <div class="active-title">Current residence: ${house.name} (${state.housingType === "rent" ? "renting" : "owned"})</div>
        <div class="card-row">${label} due in ${formatDuration(remain)} — ${fmt(due)}</div>
        <div class="card-row">-${Math.round(house.heatReduction * 100)}% heat gain</div>
        <div class="crypto-action-group">
          <button class="btn" data-action="pay-bill-early" ${state.cash < due ? "disabled" : ""}>Pay ${label} Now — ${fmt(due)}</button>
          ${
            state.housingType === "own"
              ? `<button class="btn sell" data-action="sell-house">Sell house — ${fmt(Math.round(house.cost * SELL_RATE))}</button>`
              : `<button class="btn sell" data-action="move-out">Move out</button>`
          }
        </div>
      </div>`;
  } else {
    currentHTML = `<div class="active-contract">No residence — heat decays slower once you have a place to lay low.</div>`;
  }

  const rentCards = HOUSES.rent
    .map((h) => {
      const locked = state.rep < h.repReq;
      const active = state.housingType === "rent" && state.housingId === h.id;
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
              : `<button class="btn" data-action="rent-house" data-id="${h.id}" ${state.cash < h.rentCost ? "disabled" : ""}>Rent — first payment ${fmt(h.rentCost)}</button>`
          }
        </div>`;
    })
    .join("");

  const buyCards = HOUSES.buy
    .map((h) => {
      const locked = state.rep < h.repReq;
      const owned = state.housingType === "own" && state.housingId === h.id;
      return `
        <div class="card ${locked ? "locked" : ""} ${owned ? "owned" : ""}">
          <div class="art-box">${itemArtSVG(h.id)}</div>
          <div class="card-title">${h.name}</div>
          <div class="card-row">Tax: ${fmt(h.taxCost)} / cycle · -${Math.round(h.heatReduction * 100)}% heat gain</div>
          ${
            owned
              ? `<button class="btn equipped" disabled>Owned</button>`
              : locked
              ? `<div class="locked-tag">Requires ${h.repReq} rep</div>`
              : `<button class="btn" data-action="buy-house" data-id="${h.id}" ${state.cash < housePrice(h) ? "disabled" : ""}>Buy — ${fmt(housePrice(h))}</button>`
          }
        </div>`;
    })
    .join("");

  return `${currentHTML}
    <h3 class="cat-heading">Rentals</h3><div class="grid">${rentCards}</div>
    <h3 class="cat-heading">Own</h3><div class="grid">${buyCards}</div>`;
}

function profileTabHTML() {
  const tierIdx = currentTierIndex();
  const tier = TIERS[tierIdx];
  const level = Math.floor(state.rep / 50) + 1;
  const house = currentHouse();
  const equippedW = WEAPONS.find((w) => w.id === state.equippedWeapon);

  const ownedWeaponsHTML = state.ownedWeapons
    .map((id) => {
      const w = WEAPONS.find((w) => w.id === id);
      return w ? `<div class="owned-item">${itemArtSVG(id, 40)}<span>${w.name}${id === state.equippedWeapon ? " (equipped)" : ""}</span></div>` : "";
    })
    .join("");

  const ownedFlexHTML = state.ownedFlex
    .map((id) => {
      let item = null;
      for (const cat of Object.values(FLEX_ITEMS)) {
        const found = cat.find((i) => i.id === id);
        if (found) item = found;
      }
      return item ? `<div class="owned-item">${itemArtSVG(id, 40)}<span>${item.name}</span></div>` : "";
    })
    .join("");

  return `
    <div class="profile-header">
      <div class="profile-stat"><span class="stat-label">Level</span><span class="stat-value">${level}</span></div>
      <div class="profile-stat"><span class="stat-label">Tier</span><span class="stat-value">${tier.name}</span></div>
      <div class="profile-stat"><span class="stat-label">Reputation</span><span class="stat-value">${state.rep}</span></div>
      <div class="profile-stat"><span class="stat-label">Net Worth</span><span class="stat-value cash">${fmt(netWorth())}</span></div>
    </div>

    <div class="profile-header">
      <div class="profile-stat"><span class="stat-label">Contracts Done</span><span class="stat-value">${state.stats.contractsCompleted}</span></div>
      <div class="profile-stat"><span class="stat-label">Contracts Failed</span><span class="stat-value">${state.stats.contractsFailed}</span></div>
      <div class="profile-stat"><span class="stat-label">Times Burned</span><span class="stat-value">${state.stats.timesBurned}</span></div>
      <div class="profile-stat"><span class="stat-label">Total Earned</span><span class="stat-value cash">${fmt(state.stats.totalEarned)}</span></div>
    </div>

    <h3 class="cat-heading">Residence</h3>
    <div class="card-row">${house ? `${house.name} (${state.housingType === "rent" ? "renting" : "owned"})` : "No residence"}</div>

    <h3 class="cat-heading">Equipped Weapon</h3>
    <div class="card-row">${equippedW ? equippedW.name : "None"}</div>

    <h3 class="cat-heading">Arsenal Owned (${state.ownedWeapons.length})</h3>
    <div class="owned-grid">${ownedWeaponsHTML}</div>

    <h3 class="cat-heading">Flex Owned (${state.ownedFlex.length})</h3>
    <div class="owned-grid">${ownedFlexHTML || '<div class="card-row">Nothing yet.</div>'}</div>

    <h3 class="cat-heading">Product on Hand</h3>
    <div class="card-row">${DRUGS.map((d) => `${d.name}: ${state.drugInventory[d.id] || 0} ${d.unit}${(state.drugInventory[d.id] || 0) === 1 ? "" : "s"}`).join(" · ")}</div>

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

  const totalAgents = AGENTS.reduce((sum, a) => sum + agentCount(a.id), 0);
  const remain = state.nextAgentPayoutAt ? Math.max(0, Math.ceil((state.nextAgentPayoutAt - Date.now()) / 1000)) : null;
  const agentStatus =
    totalAgents > 0
      ? `<div class="active-contract"><div class="active-title">${totalAgents} agent${totalAgents === 1 ? "" : "s"} on payroll</div><div class="card-row">Next payout in ${remain}s</div></div>`
      : `<div class="active-contract">No agents hired — you're doing every job yourself.</div>`;

  const agentCards = AGENTS.map((a) => {
    const owned = agentCount(a.id);
    const locked = state.rep < a.repReq;
    const cost = Math.round(agentCost(a) * (1 - businessPerk("agentDiscount")));
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
        ${owned > 0 ? `<button class="btn sell" data-action="dismiss-agent" data-id="${a.id}">Dismiss — ${fmt(Math.round(a.cost * SELL_RATE))}</button>` : ""}
      </div>`;
  }).join("");

  return `
    <div class="grid">${cards}</div>
    <h3 class="cat-heading">Agents</h3>
    ${agentStatus}
    <div class="grid">${agentCards}</div>`;
}

function businessesTabHTML() {
  const remain = state.nextBusinessPayoutAt ? Math.max(0, Math.ceil((state.nextBusinessPayoutAt - Date.now()) / 1000)) : null;
  const totalIncome = BUSINESSES.filter((b) => businessOwned(b.id)).reduce((sum, b) => sum + b.income, 0);
  const status =
    state.businesses.length > 0
      ? `<div class="active-contract"><div class="active-title">${state.businesses.length} business${state.businesses.length === 1 ? "" : "es"} owned — ${fmt(totalIncome)} / cycle</div><div class="card-row">Next payout in ${remain}s</div></div>`
      : `<div class="active-contract">No businesses owned yet — pure income and a real cover.</div>`;

  const cards = BUSINESSES.map((b) => {
    const owned = businessOwned(b.id);
    const locked = state.rep < b.repReq;
    return `
      <div class="card ${locked ? "locked" : ""} ${owned ? "owned" : ""}">
        <div class="card-title">${b.name}</div>
        <div class="card-row">${b.desc}</div>
        <div class="card-row">+${fmt(b.income)} / cycle · -${Math.round(b.heatReduction * 100)}% heat gain</div>
        <div class="card-row">${b.perkLabel}</div>
        ${
          owned
            ? `<button class="btn equipped" disabled>Owned</button>
               <button class="btn sell" data-action="sell-business" data-id="${b.id}">Sell — ${fmt(Math.round(b.cost * SELL_RATE))}</button>`
            : locked
            ? `<div class="locked-tag">Requires ${b.repReq} rep</div>`
            : `<button class="btn" data-action="buy-business" data-id="${b.id}" ${state.cash < b.cost ? "disabled" : ""}>Buy — ${fmt(b.cost)}</button>`
        }
      </div>`;
  }).join("");

  return `${status}<div class="grid">${cards}</div>`;
}

function bindTabEvents() {
  document.querySelectorAll("[data-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      if (action === "take-contract") takeContract(id);
      else if (action === "play-contract") playContract();
      else if (action === "buy-weapon") buyWeapon(id);
      else if (action === "equip-weapon") equipWeapon(id);
      else if (action === "sell-weapon") sellWeapon(id);
      else if (action === "buy-flex") buyFlex(id);
      else if (action === "sell-flex") sellFlex(id);
      else if (action === "buy-crypto") buyCrypto(btn.dataset.coin, Number(btn.dataset.amount));
      else if (action === "buy-crypto-all") buyCrypto(btn.dataset.coin, state.cash);
      else if (action === "sell-crypto-all") sellCrypto(btn.dataset.coin, state.wallet[btn.dataset.coin].amount);
      else if (action === "launder") launderCash(btn.dataset.coin, Number(btn.dataset.amount));
      else if (action === "launder-all") launderCash(btn.dataset.coin, state.cash);
      else if (action === "lay-low") doLayLow(id);
      else if (action === "hire-agent") hireAgent(id);
      else if (action === "dismiss-agent") dismissAgent(id);
      else if (action === "buy-business") buyBusiness(id);
      else if (action === "sell-business") sellBusiness(id);
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
      else if (action === "pay-bill-early") payBillEarly();
      else if (action === "rent-house") rentHouse(id);
      else if (action === "buy-house") buyHouse(id);
      else if (action === "sell-house") sellHouse();
      else if (action === "move-out") moveOut();
      else if (action === "deposit-bank") depositBank(Number(btn.dataset.amount));
      else if (action === "deposit-bank-all") depositBank(state.cash);
      else if (action === "withdraw-bank") withdrawBank(Number(btn.dataset.amount));
      else if (action === "withdraw-bank-all") withdrawBank(state.bankBalance);
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
      else if (action === "roulette-spin") spinRoulette(Number(btn.dataset.amount));
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
  const body = document.getElementById("mg-body");
  body.innerHTML = "";
  window.__mgDone = onDone;
  startMinigame(contract, body, (perf) => {
    if (window.__mgDone) {
      const done = window.__mgDone;
      window.__mgDone = null;
      done(perf);
    }
  });
}

function closeMinigameModal() {
  document.getElementById("minigame-overlay").classList.add("hidden");
  document.getElementById("mg-body").innerHTML = "";
  window.__mgDone = null;
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
  if (opening) renderPhoneContacts();
}

function closePhone() {
  document.getElementById("phone-panel").classList.add("hidden");
}

function renderPhoneContacts() {
  phoneOpenContact = null;
  document.getElementById("phone-title").textContent = "Contacts";
  document.getElementById("phone-back").classList.add("hidden");

  const pendingCount = state.drugRequests.length;
  const specialRows = `
    <div class="phone-contact" data-contact="__requests__">
      <div class="phone-contact-name">Customers ${pendingCount > 0 ? `<span class="phone-badge">${pendingCount}</span>` : ""}</div>
      <div class="phone-contact-preview">${pendingCount > 0 ? `${pendingCount} buyer${pendingCount > 1 ? "s" : ""} waiting on you` : "No buyers right now"}</div>
    </div>
    <div class="phone-contact" data-contact="__plug__">
      <div class="phone-contact-name">The Plug <span class="phone-contact-role">Supplier</span></div>
      <div class="phone-contact-preview">Reup your stock</div>
    </div>`;

  const contactRows = CONTACTS.map((c) => {
    const thread = state.phone.threads[c.id];
    const preview = thread && thread.length ? thread[thread.length - 1].text : c.intro;
    return `
      <div class="phone-contact" data-contact="${c.id}">
        <div class="phone-contact-name">${c.name} <span class="phone-contact-role">${c.role}</span></div>
        <div class="phone-contact-preview">${preview}</div>
      </div>`;
  }).join("");

  document.getElementById("phone-body").innerHTML = specialRows + contactRows;
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

  document.getElementById("phone-body").innerHTML = `<div class="plug-panel">${rows}</div>`;
}

function renderDrugRequestsView() {
  phoneOpenContact = "__requests__";
  document.getElementById("phone-title").textContent = "Customers";
  document.getElementById("phone-back").classList.remove("hidden");

  if (state.drugRequests.length === 0) {
    document.getElementById("phone-body").innerHTML = `<div class="hint">No buyers right now. Check back soon.</div>`;
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

  document.getElementById("phone-body").innerHTML = `<div class="plug-panel">${rows}</div>`;
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
document.getElementById("phone-back").addEventListener("click", renderPhoneContacts);

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
  } else if (contactRow) {
    const id = contactRow.dataset.contact;
    if (id === "__plug__") renderPlugPanel();
    else if (id === "__requests__") renderDrugRequestsView();
    else renderPhoneThread(id);
  }
});
