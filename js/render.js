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
  else if (activeTab === "crypto") el.innerHTML = cryptoTabHTML();
  else if (activeTab === "bank") el.innerHTML = bankTabHTML();
  else if (activeTab === "casino") el.innerHTML = casinoTabHTML();
  else if (activeTab === "businesses") el.innerHTML = businessesTabHTML();
  else if (activeTab === "housing") el.innerHTML = housingTabHTML();
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
  } else if (state.activeContract && state.activeContract.ready) {
    const c = findContractById(state.activeContract.contractId);
    activeHTML = `
      <div class="active-contract ready">
        <div class="active-title">Job ready: ${c.name} — finish it to collect</div>
        <button class="btn mg-action" data-action="play-contract">Play Contract</button>
      </div>`;
  } else if (state.activeContract) {
    const c = findContractById(state.activeContract.contractId);
    const elapsed = Date.now() - state.activeContract.startedAt;
    const pct = Math.min(100, (elapsed / state.activeContract.duration) * 100);
    const remain = Math.max(0, Math.ceil((state.activeContract.duration - elapsed) / 1000));
    activeHTML = `
      <div class="active-contract">
        <div class="active-title">In progress: ${c.name} — ${remain}s left</div>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
      </div>`;
  }

  const special = currentSpecialContract();
  const specialCompleted = state.lastSpecialSlotCompleted === currentSpecialSlot();
  const specialRepReq = Math.max(TIERS[special.tier].repReq, special.unlockRep || 0);
  const specialLocked = special.tier > tierIdx || state.rep < specialRepReq;
  const specialDisabled = specialLocked || specialCompleted || !!state.activeContract || burned;
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

  const cityContracts = CONTRACTS.filter((c) => (c.city || "detroit") === state.currentCity);
  const cards = cityContracts.map((c) => {
    const repReq = Math.max(TIERS[c.tier].repReq, c.unlockRep || 0);
    const locked = c.tier > tierIdx || state.rep < repReq;
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
            ? `<div class="locked-tag">Requires ${repReq} rep</div>`
            : `<button class="btn" data-action="take-contract" data-id="${c.id}" ${disabled ? "disabled" : ""}>Take Contract</button>`
        }
      </div>`;
  }).join("");

  return `${cityBanner}${activeHTML}<h3 class="cat-heading">Special Contract</h3><div class="grid">${specialCard}</div><h3 class="cat-heading">Available</h3><div class="grid">${cards}</div>`;
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
      return `
        <div class="active-contract">
          <div class="active-title">${h.name} (${residence.type === "rent" ? "renting" : "owned"})</div>
          <div class="card-row">${label} due in ${formatDuration(remain)} — ${fmt(due)}</div>
          <div class="card-row">-${Math.round(h.heatReduction * 100)}% heat gain</div>
          <div class="crypto-action-group">
            <button class="btn" data-action="pay-bill-early" data-type="${residence.type}" data-id="${residence.id}" ${state.cash < due ? "disabled" : ""}>Pay ${label} Now — ${fmt(due)}</button>
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

  return `${currentHTML}
    <h3 class="cat-heading">Rentals (${rentalCount}/${MAX_RENTALS})</h3><div class="grid">${rentCards}</div>
    <h3 class="cat-heading">Own (${owned ? 1 : 0}/1)</h3><div class="grid">${buyCards}</div>`;
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

    <h3 class="cat-heading">Flex Owned (${state.ownedFlex.length})</h3>
    <div class="owned-grid">${ownedFlexHTML || '<div class="card-row">Nothing yet.</div>'}</div>

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

function worldTabHTML() {
  const ownedJet = hasPrivateJet();
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

  return `<div class="grid">${cards}</div>`;
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
      else if (action === "equip-agent") equipAgentGear(btn.dataset.id, btn.dataset.slot, btn.dataset.gear);
      else if (action === "buy-business") buyBusiness(id);
      else if (action === "sell-business") sellBusiness(id);
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

const HOME_APPS = [
  { icon: "📞", label: "Contacts", bg: "linear-gradient(160deg,#3ddc73,#1a8f45)" },
  { icon: "💬", label: "Messages", bg: "linear-gradient(160deg,#3ddc73,#1a8f45)" },
  { icon: "📷", label: "Evidence", bg: "linear-gradient(160deg,#5a5a5a,#181818)" },
  { icon: "🗒️", label: "Case Notes", bg: "linear-gradient(160deg,#ffd166,#c98f1a)" },
  { icon: "🕐", label: "Countdown", bg: "linear-gradient(160deg,#2e2e2e,#000)" },
  { icon: "⚙️", label: "Settings", bg: "linear-gradient(160deg,#9a9aa0,#4a4a50)" },
  { icon: "🗺️", label: "Routes", bg: "linear-gradient(160deg,#5ecbf5,#1a7fae)" },
  { icon: "💰", label: "Ledger", bg: "linear-gradient(160deg,#c14dff,#5a0aa8)" },
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
      <div class="home-app" data-action="open-contacts">
        <div class="home-app-icon" style="background:${a.bg}">${a.icon}</div>
        <div class="home-app-label">${a.label}</div>
      </div>`
  ).join("");
  const dockIcons = HOME_DOCK.map((a) => `<div class="home-dock-icon" style="background:${a.bg}" data-action="open-contacts">${a.icon}</div>`).join("");

  document.getElementById("phone-body").innerHTML = `
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
    </div>`;
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
  const specialRows = `
    <div class="phone-contact" data-contact="__requests__">
      <div class="phone-contact-name">Customers ${pendingCount > 0 ? `<span class="phone-badge">${pendingCount}</span>` : ""}</div>
      <div class="phone-contact-preview">${pendingCount > 0 ? `${pendingCount} buyer${pendingCount > 1 ? "s" : ""} waiting on you` : "No buyers right now"}</div>
    </div>
    <div class="phone-contact" data-contact="__plug__">
      <div class="phone-contact-name">The Plug <span class="phone-contact-role">Supplier</span></div>
      <div class="phone-contact-preview">Reup your stock</div>
    </div>
    <div class="phone-contact" data-contact="__armsdealer__">
      <div class="phone-contact-name">Arms Dealer <span class="phone-contact-role">Supplier</span></div>
      <div class="phone-contact-preview">Guns, wholesale</div>
    </div>
    <div class="phone-contact" data-contact="__gunorders__">
      <div class="phone-contact-name">Gun Orders ${pendingGunOrders > 0 ? `<span class="phone-badge">${pendingGunOrders}</span>` : ""}</div>
      <div class="phone-contact-preview">${pendingGunOrders > 0 ? `${pendingGunOrders} order${pendingGunOrders > 1 ? "s" : ""} waiting on you` : "No orders right now"}</div>
    </div>
    <div class="phone-contact" data-contact="__watchsupplier__">
      <div class="phone-contact-name">Watch Supplier <span class="phone-contact-role">Supplier</span></div>
      <div class="phone-contact-preview">Timepieces, wholesale</div>
    </div>
    <div class="phone-contact" data-contact="__watchorders__">
      <div class="phone-contact-name">Watch Orders ${pendingWatchOrders > 0 ? `<span class="phone-badge">${pendingWatchOrders}</span>` : ""}</div>
      <div class="phone-contact-preview">${pendingWatchOrders > 0 ? `${pendingWatchOrders} order${pendingWatchOrders > 1 ? "s" : ""} waiting on you` : "No orders right now"}</div>
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

  document.getElementById("phone-body").innerHTML = `<div class="plug-panel">${rows}</div>`;
}

function renderGunOrdersView() {
  phoneOpenContact = "__gunorders__";
  document.getElementById("phone-title").textContent = "Gun Orders";
  document.getElementById("phone-back").classList.remove("hidden");

  if (state.gunOrders.length === 0) {
    document.getElementById("phone-body").innerHTML = `<div class="hint">No orders right now. Check back soon.</div>`;
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

  document.getElementById("phone-body").innerHTML = `<div class="plug-panel">${rows}</div>`;
}

function renderWatchOrdersView() {
  phoneOpenContact = "__watchorders__";
  document.getElementById("phone-title").textContent = "Watch Orders";
  document.getElementById("phone-back").classList.remove("hidden");

  if (state.watchOrders.length === 0) {
    document.getElementById("phone-body").innerHTML = `<div class="hint">No orders right now. Check back soon.</div>`;
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
function phoneGoBack() {
  if (phoneOpenContact === null) renderPhoneHome();
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
