// Core game state & logic

const SAVE_KEY = "hitman_empire_save_v1";

function freshWallet() {
  const wallet = {};
  for (const c of CRYPTOS) {
    wallet[c.id] = { amount: 0, price: c.startPrice, history: [c.startPrice] };
  }
  return wallet;
}

function freshState() {
  return {
    cash: 500,
    wallet: freshWallet(),
    bankBalance: 0,
    nextInterestAt: null,
    heat: 0,
    rep: 0,
    ownedWeapons: ["w1"],
    equippedWeapon: "w1",
    ownedFlex: [],
    activeContract: null, // { contractId, startedAt, duration }
    burnedUntil: 0,
    log: [],
    tickCount: 0,
    housingType: null, // "rent" | "own" | null
    housingId: null,
    nextBillAt: null,
    stats: { contractsCompleted: 0, contractsFailed: 0, timesBurned: 0, totalEarned: 0 },
    phone: { threads: {}, nextJobBonus: 0 },
    agents: {},
    nextAgentPayoutAt: null,
    businesses: [],
    nextBusinessPayoutAt: null,
  };
}

let state = freshState();

function save() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

function load() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (raw) {
    try {
      const loaded = JSON.parse(raw);
      state = Object.assign(freshState(), loaded);
    } catch (e) {
      console.warn("save corrupted, starting fresh");
    }
  }
}

function addLog(msg, type = "info") {
  state.log.unshift({ msg, type, t: Date.now() });
  state.log = state.log.slice(0, 40);
}

function fmt(n) {
  return "$" + Math.round(n).toLocaleString();
}

function currentTierIndex() {
  return tierForRep(state.rep);
}

function sumFlexEffect(key) {
  let total = 0;
  for (const cat of Object.values(FLEX_ITEMS)) {
    for (const item of cat) {
      if (state.ownedFlex.includes(item.id) && item[key]) total += item[key];
    }
  }
  return total;
}

function weaponBonus() {
  const w = WEAPONS.find((w) => w.id === state.equippedWeapon);
  return w ? w.bonus : 0;
}

function currentHouse() {
  if (!state.housingType) return null;
  const list = state.housingType === "rent" ? HOUSES.rent : HOUSES.buy;
  return list.find((h) => h.id === state.housingId) || null;
}

function businessOwned(id) {
  return state.businesses.includes(id);
}

function businessPerk(perk) {
  const b = BUSINESSES.find((b) => b.perk === perk && businessOwned(b.id));
  return b ? b.perkAmount : 0;
}

function businessHeatReduction() {
  let total = 0;
  for (const id of state.businesses) {
    const b = BUSINESSES.find((b) => b.id === id);
    if (b) total += b.heatReduction;
  }
  return total;
}

function totalHeatReduction() {
  const house = currentHouse();
  return sumFlexEffect("heatReduction") + (house ? house.heatReduction : 0) + businessHeatReduction();
}

function walletValue() {
  let total = 0;
  for (const c of CRYPTOS) {
    const w = state.wallet[c.id];
    if (w) total += w.amount * w.price;
  }
  return total;
}

function netWorth() {
  let total = state.cash + state.bankBalance + walletValue();
  for (const id of state.ownedWeapons) {
    const w = WEAPONS.find((w) => w.id === id);
    if (w && !w.starter) total += w.cost;
  }
  for (const id of state.ownedFlex) {
    for (const cat of Object.values(FLEX_ITEMS)) {
      const item = cat.find((i) => i.id === id);
      if (item) total += item.cost;
    }
  }
  const house = currentHouse();
  if (house && state.housingType === "own") total += house.cost;
  return total;
}

// ---------- Contracts ----------

function takeContract(contractId) {
  if (state.activeContract) return;
  if (Date.now() < state.burnedUntil) return;
  const c = CONTRACTS.find((c) => c.id === contractId);
  if (!c) return;
  if (currentTierIndex() < c.tier) return;
  state.activeContract = { contractId, startedAt: Date.now(), duration: c.duration * 1000 };
  addLog(`Took contract: ${c.name}`, "info");
  save();
  render();
}

function playContract() {
  const ac = state.activeContract;
  if (!ac || !ac.ready) return;
  const c = CONTRACTS.find((c) => c.id === ac.contractId);
  if (!c) return;
  openMinigameModal(c, (performance) => {
    closeMinigameModal();
    resolveContract(performance);
  });
}

function skipMinigame() {
  closeMinigameModal();
  resolveContract(0.35);
}

function resolveContract(performance) {
  const ac = state.activeContract;
  if (!ac) return;
  const c = CONTRACTS.find((c) => c.id === ac.contractId);
  if (!c) {
    state.activeContract = null;
    return;
  }
  const heatPenalty = Math.min(state.heat / 250, 0.3); // high heat hurts odds
  const chanceBonus = (performance - 0.5) * 0.4; // mini-game performance: -0.2 to +0.2
  const crewBonus = state.phone.nextJobBonus || 0;
  const chance = Math.max(0.05, Math.min(0.97, c.baseChance + weaponBonus() - heatPenalty + chanceBonus + crewBonus));
  const success = Math.random() < chance;
  if (crewBonus > 0) {
    addLog(`Crew's backup paid off: +${Math.round(crewBonus * 100)}% odds`, "buy");
    state.phone.nextJobBonus = 0;
  }
  const heatReduction = Math.min(totalHeatReduction(), 0.6);
  const heatGain = c.heat * (1 - heatReduction);

  if (success) {
    const payoutBoost = sumFlexEffect("payoutBoost");
    const repBoost = sumFlexEffect("repBoost");
    const payoutMult = 0.85 + performance * 0.35; // mini-game performance: 0.85x to 1.2x
    const payout = Math.round(c.payout * (1 + payoutBoost) * payoutMult);
    const repGain = Math.round(c.rep * (1 + repBoost));
    state.cash += payout;
    state.rep += repGain;
    state.heat = Math.min(100, state.heat + heatGain);
    state.stats.contractsCompleted++;
    state.stats.totalEarned += payout;
    addLog(`✅ ${c.name} complete. +${fmt(payout)}, +${repGain} rep, +${Math.round(heatGain)} heat`, "success");
  } else {
    state.heat = Math.min(100, state.heat + heatGain * 1.5);
    state.stats.contractsFailed++;
    addLog(`❌ ${c.name} blown. No payout, +${Math.round(heatGain * 1.5)} heat`, "fail");
  }

  state.activeContract = null;

  if (state.heat >= 100) {
    triggerBurned();
  }

  save();
  render();
}

function triggerBurned() {
  const lost = Math.round(state.cash * 0.5);
  state.cash -= lost;
  state.rep = Math.round(state.rep * 0.9);
  state.heat = 50;
  state.burnedUntil = Date.now() + 15000;
  state.stats.timesBurned++;
  addLog(`🔥 BURNED. Cover blown — lost ${fmt(lost)}, forced to go dark for 15s.`, "burn");
}

// ---------- Gun shop ----------

function weaponPrice(w) {
  return Math.round(w.cost * (1 - businessPerk("weaponDiscount")));
}

function buyWeapon(id) {
  const w = WEAPONS.find((w) => w.id === id);
  if (!w || state.ownedWeapons.includes(id)) return;
  if (state.rep < w.repReq) return;
  const cost = weaponPrice(w);
  if (state.cash < cost) return;
  state.cash -= cost;
  state.ownedWeapons.push(id);
  state.equippedWeapon = id;
  addLog(`Bought and equipped ${w.name}`, "buy");
  save();
  render();
}

function equipWeapon(id) {
  if (!state.ownedWeapons.includes(id)) return;
  state.equippedWeapon = id;
  save();
  render();
}

function sellWeapon(id) {
  const w = WEAPONS.find((w) => w.id === id);
  if (!w || w.starter || !state.ownedWeapons.includes(id)) return;
  const refund = Math.round(w.cost * SELL_RATE);
  state.ownedWeapons = state.ownedWeapons.filter((x) => x !== id);
  if (state.equippedWeapon === id) state.equippedWeapon = "w1";
  state.cash += refund;
  addLog(`Sold ${w.name} for ${fmt(refund)}`, "sell");
  save();
  render();
}

// ---------- Flex shop ----------

function flexPrice(item, categoryName) {
  let discount = businessPerk("flexDiscount");
  if (categoryName === "cars") discount = 1 - (1 - discount) * (1 - businessPerk("carDiscount"));
  return Math.round(item.cost * (1 - discount));
}

function buyFlex(id) {
  let item = null;
  let categoryName = null;
  for (const [catName, cat] of Object.entries(FLEX_ITEMS)) {
    const found = cat.find((i) => i.id === id);
    if (found) {
      item = found;
      categoryName = catName;
    }
  }
  if (!item || state.ownedFlex.includes(id)) return;
  const cost = flexPrice(item, categoryName);
  if (state.cash < cost) return;
  state.cash -= cost;
  state.ownedFlex.push(id);
  addLog(`Bought ${item.name}`, "buy");
  save();
  render();
}

function sellFlex(id) {
  let item = null;
  for (const cat of Object.values(FLEX_ITEMS)) {
    const found = cat.find((i) => i.id === id);
    if (found) item = found;
  }
  if (!item || !state.ownedFlex.includes(id)) return;
  const refund = Math.round(item.cost * SELL_RATE);
  state.ownedFlex = state.ownedFlex.filter((x) => x !== id);
  state.cash += refund;
  addLog(`Sold ${item.name} for ${fmt(refund)}`, "sell");
  save();
  render();
}

// ---------- Housing ----------

function rentHouse(id) {
  const h = HOUSES.rent.find((h) => h.id === id);
  if (!h || state.rep < h.repReq) return;
  if (state.cash < h.rentCost) return;
  state.cash -= h.rentCost;
  state.housingType = "rent";
  state.housingId = id;
  state.nextBillAt = Date.now() + BILL_CYCLE_SECONDS * 1000;
  addLog(`Moved into ${h.name} (renting) — first payment ${fmt(h.rentCost)}`, "buy");
  save();
  render();
}

function housePrice(h) {
  return Math.round(h.cost * (1 - businessPerk("houseDiscount")));
}

function buyHouse(id) {
  const h = HOUSES.buy.find((h) => h.id === id);
  if (!h || state.rep < h.repReq) return;
  const cost = housePrice(h);
  if (state.cash < cost) return;
  state.cash -= cost;
  state.housingType = "own";
  state.housingId = id;
  state.nextBillAt = Date.now() + BILL_CYCLE_SECONDS * 1000;
  addLog(`Bought ${h.name} for ${fmt(cost)}`, "buy");
  save();
  render();
}

function sellHouse() {
  if (state.housingType !== "own") return;
  const h = HOUSES.buy.find((h) => h.id === state.housingId);
  if (!h) return;
  const refund = Math.round(h.cost * SELL_RATE);
  state.cash += refund;
  addLog(`Sold ${h.name} for ${fmt(refund)}`, "sell");
  state.housingType = null;
  state.housingId = null;
  state.nextBillAt = null;
  save();
  render();
}

function moveOut() {
  if (state.housingType !== "rent") return;
  const h = HOUSES.rent.find((h) => h.id === state.housingId);
  addLog(`Moved out of ${h ? h.name : "your place"}`, "info");
  state.housingType = null;
  state.housingId = null;
  state.nextBillAt = null;
  save();
  render();
}

function payHouseBill() {
  const house = currentHouse();
  if (!house) {
    state.housingType = null;
    state.housingId = null;
    state.nextBillAt = null;
    return;
  }

  const due = state.housingType === "rent" ? house.rentCost : house.taxCost;
  const label = state.housingType === "rent" ? "rent" : "property tax";

  if (state.cash >= due) {
    state.cash -= due;
    addLog(`Paid ${label}: ${fmt(due)} — ${house.name}`, "bill");
  } else {
    state.heat = Math.min(100, state.heat + 10);
    if (state.housingType === "rent") {
      addLog(`Missed rent on ${house.name} — evicted! +10 heat`, "burn");
      state.housingType = null;
      state.housingId = null;
      state.nextBillAt = null;
      return;
    } else {
      addLog(`Missed property tax on ${house.name} — +10 heat`, "fail");
    }
  }

  state.nextBillAt = Date.now() + BILL_CYCLE_SECONDS * 1000;
}

function processBilling() {
  if (!state.housingType) return;
  if (!state.nextBillAt || Date.now() < state.nextBillAt) return;
  payHouseBill();
}

function payBillEarly() {
  if (!state.housingType) return;
  payHouseBill();
  save();
  render();
}

// ---------- Crypto ----------

function tickCrypto() {
  for (const c of CRYPTOS) {
    const w = state.wallet[c.id];
    if (!w) continue;
    const change = c.drift + (Math.random() * 2 - 1) * c.volatility;
    w.price = Math.max(0.0001, w.price * (1 + change));
    w.history.push(w.price);
    if (w.history.length > 40) w.history.shift();
  }
}

function buyCrypto(coinId, amountCash) {
  const w = state.wallet[coinId];
  if (!w) return;
  amountCash = Math.min(amountCash, state.cash);
  if (amountCash <= 0) return;
  const bought = amountCash / w.price;
  state.cash -= amountCash;
  w.amount += bought;
  addLog(`Bought ${bought.toFixed(6)} ${coinId} for ${fmt(amountCash)}`, "buy");
  save();
  render();
}

function sellCrypto(coinId, amountCoin) {
  const w = state.wallet[coinId];
  if (!w) return;
  amountCoin = Math.min(amountCoin, w.amount);
  if (amountCoin <= 0) return;
  const proceeds = amountCoin * w.price;
  w.amount -= amountCoin;
  state.cash += proceeds;
  addLog(`Sold ${amountCoin.toFixed(6)} ${coinId} for ${fmt(proceeds)}`, "sell");
  save();
  render();
}

function launderCash(coinId, amountCash) {
  const w = state.wallet[coinId];
  if (!w) return;
  amountCash = Math.min(amountCash, state.cash);
  if (amountCash <= 0) return;
  const fee = 0.1 * (1 - businessPerk("launderDiscount"));
  const bought = (amountCash * (1 - fee)) / w.price;
  state.cash -= amountCash;
  w.amount += bought;
  state.heat = Math.max(0, state.heat - 15);
  addLog(`Laundered ${fmt(amountCash)} → ${bought.toFixed(6)} ${coinId}, -15 heat`, "launder");
  save();
  render();
}

// ---------- Bank / ATM ----------

function depositBank(amount) {
  amount = Math.min(amount, state.cash);
  if (amount <= 0) return;
  state.cash -= amount;
  state.bankBalance += amount;
  if (!state.nextInterestAt) state.nextInterestAt = Date.now() + BANK_INTEREST_CYCLE_SECONDS * 1000;
  addLog(`Deposited ${fmt(amount)} at the bank`, "bill");
  save();
  render();
}

function withdrawBank(amount) {
  amount = Math.min(amount, state.bankBalance);
  if (amount <= 0) return;
  const fee = Math.round(amount * ATM_FEE_RATE);
  state.bankBalance -= amount;
  state.cash += amount - fee;
  addLog(`ATM withdrawal ${fmt(amount)} (fee ${fmt(fee)})`, "bill");
  save();
  render();
}

function processBankInterest() {
  if (state.bankBalance <= 0 || !state.nextInterestAt) return;
  if (Date.now() < state.nextInterestAt) return;
  const interest = Math.round(state.bankBalance * BANK_INTEREST_RATE);
  state.bankBalance += interest;
  addLog(`Bank interest: +${fmt(interest)}`, "launder");
  state.nextInterestAt = Date.now() + BANK_INTEREST_CYCLE_SECONDS * 1000;
}

// ---------- Lay low ----------

function doLayLow(id) {
  const a = LAYLOW_ACTIONS.find((a) => a.id === id);
  if (!a) return;
  if (state.cash < a.cost) return;
  state.cash -= a.cost;
  state.heat = Math.max(0, state.heat - a.heatRemoved);
  addLog(`${a.name}: -${a.heatRemoved} heat`, "laylow");
  save();
  render();
}

// ---------- Agents ----------

function agentCount(id) {
  return state.agents[id] || 0;
}

function agentCost(agent) {
  return Math.round(agent.cost * Math.pow(AGENT_COST_GROWTH, agentCount(agent.id)));
}

function hireAgent(id) {
  const a = AGENTS.find((a) => a.id === id);
  if (!a || state.rep < a.repReq) return;
  const cost = Math.round(agentCost(a) * (1 - businessPerk("agentDiscount")));
  if (state.cash < cost) return;
  state.cash -= cost;
  state.agents[id] = agentCount(id) + 1;
  if (!state.nextAgentPayoutAt) state.nextAgentPayoutAt = Date.now() + AGENT_CYCLE_SECONDS * 1000;
  addLog(`Hired a ${a.name} for ${fmt(cost)}`, "buy");
  save();
  render();
}

function dismissAgent(id) {
  const a = AGENTS.find((a) => a.id === id);
  if (!a || agentCount(id) <= 0) return;
  const refund = Math.round(a.cost * SELL_RATE);
  state.agents[id] -= 1;
  state.cash += refund;
  addLog(`Dismissed a ${a.name}, ${fmt(refund)} severance`, "sell");
  save();
  render();
}

function processAgentPayout() {
  const total = AGENTS.reduce((sum, a) => sum + agentCount(a.id), 0);
  if (total <= 0) {
    state.nextAgentPayoutAt = null;
    return;
  }
  if (!state.nextAgentPayoutAt || Date.now() < state.nextAgentPayoutAt) return;

  let income = 0;
  let heatGain = 0;
  for (const a of AGENTS) {
    const count = agentCount(a.id);
    income += count * a.income;
    heatGain += count * a.heat;
  }
  state.cash += income;
  state.heat = Math.min(100, state.heat + heatGain);
  state.stats.totalEarned += income;
  addLog(`Your crew of agents delivered ${fmt(income)} (+${heatGain.toFixed(1)} heat)`, "success");
  state.nextAgentPayoutAt = Date.now() + AGENT_CYCLE_SECONDS * 1000;
}

// ---------- Businesses ----------

function buyBusiness(id) {
  const b = BUSINESSES.find((b) => b.id === id);
  if (!b || state.rep < b.repReq || businessOwned(id)) return;
  if (state.cash < b.cost) return;
  state.cash -= b.cost;
  state.businesses.push(id);
  if (!state.nextBusinessPayoutAt) state.nextBusinessPayoutAt = Date.now() + BUSINESS_CYCLE_SECONDS * 1000;
  addLog(`Acquired ${b.name} for ${fmt(b.cost)}`, "buy");
  save();
  render();
}

function sellBusiness(id) {
  const b = BUSINESSES.find((b) => b.id === id);
  if (!b || !businessOwned(id)) return;
  const refund = Math.round(b.cost * SELL_RATE);
  state.businesses = state.businesses.filter((x) => x !== id);
  state.cash += refund;
  addLog(`Sold ${b.name} for ${fmt(refund)}`, "sell");
  save();
  render();
}

function processBusinessPayout() {
  if (state.businesses.length === 0) {
    state.nextBusinessPayoutAt = null;
    return;
  }
  if (!state.nextBusinessPayoutAt || Date.now() < state.nextBusinessPayoutAt) return;

  let income = 0;
  for (const id of state.businesses) {
    const b = BUSINESSES.find((b) => b.id === id);
    if (b) income += b.income;
  }
  state.cash += income;
  state.stats.totalEarned += income;
  addLog(`Business income: +${fmt(income)}`, "success");
  state.nextBusinessPayoutAt = Date.now() + BUSINESS_CYCLE_SECONDS * 1000;
}

// ---------- Phone ----------

function ensurePhoneThread(contactId) {
  if (!state.phone.threads[contactId]) {
    const contact = CONTACTS.find((c) => c.id === contactId);
    state.phone.threads[contactId] = contact ? [{ from: "them", text: contact.intro }] : [];
  }
  return state.phone.threads[contactId];
}

function sendPhoneText(contactId) {
  const contact = CONTACTS.find((c) => c.id === contactId);
  if (!contact) return;
  const thread = ensurePhoneThread(contactId);
  thread.push({ from: "me", text: "Hey, you there?" });
  const reply = contact.texts[Math.floor(Math.random() * contact.texts.length)];
  thread.push({ from: "them", text: reply });
  save();
  renderPhoneThread(contactId);
}

function sendPhoneMoney(contactId, amount) {
  const contact = CONTACTS.find((c) => c.id === contactId);
  if (!contact) return;
  amount = Math.min(amount, state.cash);
  if (amount <= 0) return;
  state.cash -= amount;

  let effectMsg = "";
  if (contact.effect === "heat") {
    const reduced = Math.min(PHONE_HEAT_CAP, Math.round(amount / 500) * PHONE_HEAT_PER_500);
    state.heat = Math.max(0, state.heat - reduced);
    effectMsg = ` (-${reduced} heat)`;
  } else if (contact.effect === "boost") {
    const boost = Math.min(PHONE_BOOST_PER_1000 * Math.round(amount / 1000), PHONE_BOOST_CAP);
    state.phone.nextJobBonus = Math.min(PHONE_BOOST_CAP, state.phone.nextJobBonus + boost);
    effectMsg = ` (+${Math.round(state.phone.nextJobBonus * 100)}% next job)`;
  }

  const thread = ensurePhoneThread(contactId);
  thread.push({ from: "me", text: `Sent ${fmt(amount)}` });
  const reply = contact.thanks[Math.floor(Math.random() * contact.thanks.length)];
  thread.push({ from: "them", text: reply });

  addLog(`Sent ${fmt(amount)} to ${contact.name}${effectMsg}`, "buy");
  save();
  render();
  renderPhoneThread(contactId);
}

// ---------- Casino ----------
// Blackjack/slots round state is intentionally not persisted — a reload just clears the table.

let bjGame = null; // { bet, playerCards, dealerCards, phase: 'playing'|'dealer'|'done', resultText }
let slotGame = null; // { bet, reels, phase: 'spinning'|'done', resultText }

function bjDrawCard() {
  const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
  const suits = ["♠", "♥", "♦", "♣"];
  return { rank: ranks[Math.floor(Math.random() * ranks.length)], suit: suits[Math.floor(Math.random() * suits.length)] };
}

function bjHandTotal(cards) {
  let total = 0;
  let aces = 0;
  for (const c of cards) {
    if (c.rank === "A") {
      total += 11;
      aces++;
    } else if (c.rank === "K" || c.rank === "Q" || c.rank === "J") {
      total += 10;
    } else {
      total += Number(c.rank);
    }
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

function startBlackjack(bet) {
  bet = Math.floor(Math.min(bet, state.cash));
  if (bet <= 0 || (bjGame && bjGame.phase !== "done")) return;
  state.cash -= bet;
  bjGame = {
    bet,
    playerCards: [bjDrawCard(), bjDrawCard()],
    dealerCards: [bjDrawCard(), bjDrawCard()],
    phase: "playing",
    resultText: null,
  };
  save();
  if (bjHandTotal(bjGame.playerCards) === 21) {
    bjStand();
  } else {
    render();
  }
}

function bjHit() {
  if (!bjGame || bjGame.phase !== "playing") return;
  bjGame.playerCards.push(bjDrawCard());
  if (bjHandTotal(bjGame.playerCards) > 21) {
    bjFinish("bust");
  } else {
    render();
  }
}

function bjDouble() {
  if (!bjGame || bjGame.phase !== "playing" || bjGame.playerCards.length !== 2) return;
  if (state.cash < bjGame.bet) return;
  state.cash -= bjGame.bet;
  bjGame.bet *= 2;
  bjGame.playerCards.push(bjDrawCard());
  if (bjHandTotal(bjGame.playerCards) > 21) {
    bjFinish("bust");
  } else {
    bjStand();
  }
}

function bjStand() {
  if (!bjGame || bjGame.phase !== "playing") return;
  bjGame.phase = "dealer";
  while (bjHandTotal(bjGame.dealerCards) < 17) {
    bjGame.dealerCards.push(bjDrawCard());
  }
  const playerTotal = bjHandTotal(bjGame.playerCards);
  const dealerTotal = bjHandTotal(bjGame.dealerCards);
  const natural = bjGame.playerCards.length === 2 && playerTotal === 21;

  if (dealerTotal > 21 || playerTotal > dealerTotal) bjFinish("win", natural);
  else if (playerTotal < dealerTotal) bjFinish("lose");
  else bjFinish("push");
}

function bjFinish(outcome, natural) {
  bjGame.phase = "done";
  let payout = 0;
  if (outcome === "win") {
    payout = natural ? Math.round(bjGame.bet * 2.5) : bjGame.bet * 2;
    bjGame.resultText = natural ? `Blackjack! +${fmt(payout - bjGame.bet)}` : `You win! +${fmt(payout - bjGame.bet)}`;
  } else if (outcome === "push") {
    payout = bjGame.bet;
    bjGame.resultText = "Push — bet returned";
  } else if (outcome === "bust") {
    bjGame.resultText = `Bust! -${fmt(bjGame.bet)}`;
  } else {
    bjGame.resultText = `Dealer wins. -${fmt(bjGame.bet)}`;
  }
  state.cash += payout;
  addLog(`Blackjack: ${bjGame.resultText}`, payout > bjGame.bet ? "success" : payout === bjGame.bet ? "info" : "fail");
  save();
  render();
}

function bjNewRound() {
  bjGame = null;
  render();
}

function weightedSlotPick() {
  const totalWeight = SLOT_SYMBOLS.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * totalWeight;
  for (const item of SLOT_SYMBOLS) {
    if (r < item.weight) return item;
    r -= item.weight;
  }
  return SLOT_SYMBOLS[SLOT_SYMBOLS.length - 1];
}

function spinSlots(bet) {
  bet = Math.floor(Math.min(bet, state.cash));
  if (bet <= 0 || (slotGame && slotGame.phase === "spinning")) return;
  state.cash -= bet;

  const finalReels = [weightedSlotPick(), weightedSlotPick(), weightedSlotPick()];
  slotGame = { bet, reels: [weightedSlotPick(), weightedSlotPick(), weightedSlotPick()], phase: "spinning", resultText: null };
  save();
  render();

  setTimeout(() => {
    slotGame.reels = finalReels;
    slotGame.phase = "done";
    resolveSlots(finalReels, bet);
  }, 700);
}

function resolveSlots(reels, bet) {
  const [a, b, c] = reels;
  let payout = 0;
  if (a.symbol === b.symbol && b.symbol === c.symbol) {
    payout = bet * a.payout;
    slotGame.resultText = `${a.symbol}${a.symbol}${a.symbol} JACKPOT! +${fmt(payout - bet)}`;
  } else if (a.symbol === b.symbol || b.symbol === c.symbol || a.symbol === c.symbol) {
    payout = Math.round(bet * 0.5);
    slotGame.resultText = `Close — half your bet back`;
  } else {
    slotGame.resultText = `No match. -${fmt(bet)}`;
  }
  state.cash += payout;
  addLog(`Slots: ${slotGame.resultText}`, payout > bet ? "success" : payout > 0 ? "info" : "fail");
  save();
  render();
}

// ---------- Save file transfer ----------

function exportSave() {
  const data = JSON.stringify(state, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `undercover-save-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  addLog("Case file exported.", "info");
  save();
  render();
}

function exportSaveCode() {
  return btoa(unescape(encodeURIComponent(JSON.stringify(state))));
}

function importSaveFromText(text) {
  let loaded;
  try {
    loaded = JSON.parse(text);
  } catch (e) {
    alert("That doesn't look like a valid save file.");
    return false;
  }
  if (typeof loaded !== "object" || loaded === null || typeof loaded.cash !== "number") {
    alert("That doesn't look like a valid save file.");
    return false;
  }
  if (!confirm("This will overwrite your current progress. Continue?")) return false;

  state = Object.assign(freshState(), loaded);
  save();
  render();
  addLog("Case file imported.", "success");
  return true;
}

function importSaveCode(code) {
  let json;
  try {
    json = decodeURIComponent(escape(atob(code.trim())));
  } catch (e) {
    alert("That code doesn't look valid.");
    return false;
  }
  return importSaveFromText(json);
}

function importSaveFile(file) {
  const reader = new FileReader();
  reader.onload = () => importSaveFromText(reader.result);
  reader.readAsText(file);
}

// ---------- Game loop ----------

function gameTick() {
  state.tickCount++;

  // passive heat decay
  const decay = 0.3 * (1 + totalHeatReduction());
  state.heat = Math.max(0, state.heat - decay);

  // crypto price every 3 ticks
  if (state.tickCount % 3 === 0) tickCrypto();

  processBilling();
  processBankInterest();
  processAgentPayout();
  processBusinessPayout();

  // mark active contract ready once its timer completes (resolution now waits on the mini-game)
  if (state.activeContract && !state.activeContract.ready) {
    const elapsed = Date.now() - state.activeContract.startedAt;
    if (elapsed >= state.activeContract.duration) {
      state.activeContract.ready = true;
    }
  }

  save();
  render();
}

// ---------- Boot ----------

load();
setInterval(gameTick, 1000);
render();
