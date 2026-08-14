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
    residences: [], // [{ type: "rent" | "own", id, nextBillAt }] — up to MAX_RENTALS rentals + 1 owned
    stats: { contractsCompleted: 0, contractsFailed: 0, timesBurned: 0, totalEarned: 0, drugSalesTotal: 0, gunSalesTotal: 0, watchSalesTotal: 0 },
    phone: { threads: {}, nextJobBonus: 0 },
    hiredAgents: [],
    nextAgentPayoutAt: null,
    businesses: [],
    nextBusinessPayoutAt: null,
    drugInventory: { weed: 0, pens: 0, shrooms: 0, coke: 0 },
    drugRequests: [],
    nextDrugRequestAt: null,
    armsInventory: { pistol: 0, smg: 0, shotgun: 0, rifle: 0, sniper: 0 },
    gunOrders: [],
    nextGunOrderAt: null,
    watchInventory: { watchcheap: 0, watchsteel: 0, watchgold: 0, watchdiamond: 0, watchiced: 0 },
    watchOrders: [],
    nextWatchOrderAt: null,
    currentCity: "detroit",
    highestTierSeen: 0,
    lastSpecialSlotCompleted: null,
    rivalsDefeated: [],
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
      state.stats = Object.assign(freshState().stats, loaded.stats || {});
      // Migrate old single-residence saves (housingType/housingId/nextBillAt) into the residences array.
      if (loaded.housingType && loaded.housingId && (!loaded.residences || loaded.residences.length === 0)) {
        state.residences = [{ type: loaded.housingType, id: loaded.housingId, nextBillAt: loaded.nextBillAt || Date.now() + BILL_CYCLE_SECONDS * 1000 }];
      }
      state.rep = Math.min(MAX_REP, state.rep);
      // Drop stale orders/stock referencing items removed from a catalog (e.g. Revolver).
      state.gunOrders = state.gunOrders.filter((o) => ARMS_CATALOG.some((g) => g.id === o.gunId));
    } catch (e) {
      console.warn("save corrupted, starting fresh");
    }
  }
}

function addRep(amount) {
  state.rep = Math.max(0, Math.min(MAX_REP, state.rep + amount));
  const newTierIdx = tierForRep(state.rep);
  if (newTierIdx > state.highestTierSeen) {
    for (let i = state.highestTierSeen + 1; i <= newTierIdx; i++) {
      const bonus = 20000 * i;
      state.cash += bonus;
      addLog(`🎖️ PROMOTED TO ${TIERS[i].name} — +${fmt(bonus)} bonus`, "success");
    }
    state.highestTierSeen = newTierIdx;
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

function houseData(residence) {
  const list = residence.type === "rent" ? HOUSES.rent : HOUSES.buy;
  return list.find((h) => h.id === residence.id) || null;
}

function ownedResidence() {
  return state.residences.find((r) => r.type === "own") || null;
}

function rentedResidences() {
  return state.residences.filter((r) => r.type === "rent");
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

// ---------- Rival crews ----------

function rivalPenalty(effectType) {
  return RIVAL_CREWS.filter((r) => r.effect === effectType && !state.rivalsDefeated.includes(r.id)).reduce(
    (sum, r) => sum + r.amount,
    0
  );
}

function defeatRival(rivalId) {
  const r = RIVAL_CREWS.find((r) => r.id === rivalId);
  if (!r || state.rivalsDefeated.includes(rivalId)) return;
  if (state.rep < r.repReq) return;
  if (state.cash < r.cost) return;
  state.cash -= r.cost;
  state.rivalsDefeated.push(rivalId);
  addLog(`💀 Wiped out ${r.name} — that turf is yours now.`, "success");
  save();
  render();
}

function totalHeatReduction() {
  const residenceReduction = state.residences.reduce((sum, r) => {
    const h = houseData(r);
    return sum + (h ? h.heatReduction : 0);
  }, 0);
  return sumFlexEffect("heatReduction") + residenceReduction + businessHeatReduction();
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
  const owned = ownedResidence();
  if (owned) {
    const h = houseData(owned);
    if (h) total += h.cost;
  }
  return total;
}

// ---------- Contracts ----------

function takeContract(contractId) {
  if (state.activeContract) return;
  if (Date.now() < state.burnedUntil) return;
  const c = findContractById(contractId);
  if (!c) return;
  if (!c.special) {
    if ((c.city || "detroit") !== state.currentCity) return;
    if (!currentCityContracts(state.currentCity).some((v) => v.id === c.id)) return;
  }
  if (c.special && state.lastSpecialSlotCompleted === currentSpecialSlot()) return;
  if (currentTierIndex() < c.tier) return;
  if (c.unlockRep && state.rep < c.unlockRep) return;
  state.activeContract = { contractId, startedAt: Date.now(), duration: c.duration * 1000 };
  addLog(`Took contract: ${c.name}`, "info");
  save();
  render();
}

function findContractById(id) {
  return CONTRACTS.find((c) => c.id === id) || SPECIAL_CONTRACTS.find((c) => c.id === id);
}

function playContract() {
  const ac = state.activeContract;
  if (!ac || !ac.ready) return;
  const c = findContractById(ac.contractId);
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
  const c = findContractById(ac.contractId);
  if (!c) {
    state.activeContract = null;
    return;
  }
  const heatPenalty = Math.min(state.heat / 250, 0.3); // high heat hurts odds
  const chanceBonus = (performance - 0.5) * 0.4; // mini-game performance: -0.2 to +0.2
  const crewBonus = state.phone.nextJobBonus || 0;
  const chance = Math.max(0.05, Math.min(0.97, c.baseChance + weaponBonus() - heatPenalty + chanceBonus + crewBonus - rivalPenalty("odds")));
  const success = Math.random() < chance;
  if (crewBonus > 0) {
    addLog(`Crew's backup paid off: +${Math.round(crewBonus * 100)}% odds`, "buy");
    state.phone.nextJobBonus = 0;
  }
  const heatReduction = Math.min(totalHeatReduction(), 0.6);
  const heatGain = c.heat * (1 - heatReduction) * (1 + rivalPenalty("heat"));

  if (success) {
    const payoutBoost = sumFlexEffect("payoutBoost");
    const repBoost = sumFlexEffect("repBoost");
    const payoutMult = 0.85 + performance * 0.35; // mini-game performance: 0.85x to 1.2x
    const payout = Math.round(c.payout * (1 + payoutBoost) * payoutMult * (1 - rivalPenalty("payout")));
    const repGain = Math.round(c.rep * (1 + repBoost));
    state.cash += payout;
    addRep(repGain);
    state.heat = Math.min(100, state.heat + heatGain);
    state.stats.contractsCompleted++;
    state.stats.totalEarned += payout;
    if (c.special) state.lastSpecialSlotCompleted = currentSpecialSlot();
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

// ---------- World / travel ----------

function hasPrivateJet() {
  return FLEX_ITEMS.jets.some((j) => state.ownedFlex.includes(j.id));
}

function travelToCity(cityId) {
  const city = CITIES.find((c) => c.id === cityId);
  if (!city || city.id === state.currentCity) return;
  if (city.requiresJet && !hasPrivateJet()) return;
  if (state.cash < TRAVEL_COST) return;
  state.cash -= TRAVEL_COST;
  state.currentCity = cityId;
  addLog(`Flew to ${city.name} — ${fmt(TRAVEL_COST)}`, "buy");
  save();
  render();
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
  if (rentedResidences().some((r) => r.id === id)) return;
  if (rentedResidences().length >= MAX_RENTALS) return;
  state.cash -= h.rentCost;
  state.residences.push({ type: "rent", id, nextBillAt: Date.now() + BILL_CYCLE_SECONDS * 1000 });
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
  if (ownedResidence()) return;
  const cost = housePrice(h);
  if (state.cash < cost) return;
  state.cash -= cost;
  state.residences.push({ type: "own", id, nextBillAt: Date.now() + BILL_CYCLE_SECONDS * 1000 });
  addLog(`Bought ${h.name} for ${fmt(cost)}`, "buy");
  save();
  render();
}

function sellHouse(id) {
  const residence = state.residences.find((r) => r.type === "own" && r.id === id);
  if (!residence) return;
  const h = houseData(residence);
  if (!h) return;
  const refund = Math.round(h.cost * SELL_RATE);
  state.cash += refund;
  addLog(`Sold ${h.name} for ${fmt(refund)}`, "sell");
  state.residences = state.residences.filter((r) => r !== residence);
  save();
  render();
}

function moveOut(id) {
  const residence = state.residences.find((r) => r.type === "rent" && r.id === id);
  if (!residence) return;
  const h = houseData(residence);
  addLog(`Moved out of ${h ? h.name : "your place"}`, "info");
  state.residences = state.residences.filter((r) => r !== residence);
  save();
  render();
}

function payResidenceBill(residence) {
  const h = houseData(residence);
  if (!h) {
    state.residences = state.residences.filter((r) => r !== residence);
    return;
  }

  const due = residence.type === "rent" ? h.rentCost : h.taxCost;
  const label = residence.type === "rent" ? "rent" : "property tax";

  if (state.cash >= due) {
    state.cash -= due;
    addLog(`Paid ${label}: ${fmt(due)} — ${h.name}`, "bill");
  } else {
    state.heat = Math.min(100, state.heat + 10);
    if (residence.type === "rent") {
      addLog(`Missed rent on ${h.name} — evicted! +10 heat`, "burn");
      state.residences = state.residences.filter((r) => r !== residence);
      return;
    } else {
      addLog(`Missed property tax on ${h.name} — +10 heat`, "fail");
    }
  }

  residence.nextBillAt = Date.now() + BILL_CYCLE_SECONDS * 1000;
}

function processBilling() {
  for (const residence of [...state.residences]) {
    if (!residence.nextBillAt || Date.now() < residence.nextBillAt) continue;
    payResidenceBill(residence);
  }
}

function payBillEarly(type, id) {
  const residence = state.residences.find((r) => r.type === type && r.id === id);
  if (!residence) return;
  payResidenceBill(residence);
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

function agentTypeCount(typeId) {
  return state.hiredAgents.filter((u) => u.typeId === typeId).length;
}

function agentHireCost(type) {
  return Math.round(type.cost * Math.pow(AGENT_COST_GROWTH, agentTypeCount(type.id)));
}

function agentIsReady(unit) {
  return !!(unit.gunId && unit.clothingId && unit.carId);
}

function agentGearBonus(unit) {
  let bonus = 0;
  const gun = AGENT_GEAR.guns.find((g) => g.id === unit.gunId);
  const cloth = AGENT_GEAR.clothing.find((g) => g.id === unit.clothingId);
  const car = AGENT_GEAR.cars.find((g) => g.id === unit.carId);
  if (gun) bonus += gun.bonus;
  if (cloth) bonus += cloth.bonus;
  if (car) bonus += car.bonus;
  return bonus;
}

function hireAgent(typeId) {
  const type = AGENTS.find((a) => a.id === typeId);
  if (!type || state.rep < type.repReq) return;
  const cost = Math.round(agentHireCost(type) * (1 - businessPerk("agentDiscount")));
  if (state.cash < cost) return;
  state.cash -= cost;
  state.hiredAgents.push({
    id: "agent_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
    typeId,
    gunId: null,
    clothingId: null,
    carId: null,
  });
  if (!state.nextAgentPayoutAt) state.nextAgentPayoutAt = Date.now() + AGENT_CYCLE_SECONDS * 1000;
  addLog(`Hired a ${type.name} for ${fmt(cost)} — needs a gun, clothes, and a car before they can work`, "buy");
  save();
  render();
}

function dismissAgent(instanceId) {
  const idx = state.hiredAgents.findIndex((u) => u.id === instanceId);
  if (idx === -1) return;
  const unit = state.hiredAgents[idx];
  const type = AGENTS.find((a) => a.id === unit.typeId);
  const refund = type ? Math.round(type.cost * SELL_RATE) : 0;
  state.hiredAgents.splice(idx, 1);
  state.cash += refund;
  addLog(`Dismissed a ${type ? type.name : "agent"}, ${fmt(refund)} severance`, "sell");
  save();
  render();
}

function equipAgentGear(instanceId, slot, gearId) {
  const unit = state.hiredAgents.find((u) => u.id === instanceId);
  if (!unit) return;
  const catalog = slot === "gun" ? AGENT_GEAR.guns : slot === "clothing" ? AGENT_GEAR.clothing : AGENT_GEAR.cars;
  const item = catalog.find((g) => g.id === gearId);
  if (!item || state.cash < item.cost) return;
  state.cash -= item.cost;
  if (slot === "gun") unit.gunId = gearId;
  else if (slot === "clothing") unit.clothingId = gearId;
  else unit.carId = gearId;
  const type = AGENTS.find((a) => a.id === unit.typeId);
  addLog(`Equipped ${item.name} on your ${type ? type.name : "agent"}`, "buy");
  save();
  render();
}

function processAgentPayout() {
  if (state.hiredAgents.length === 0) {
    state.nextAgentPayoutAt = null;
    return;
  }
  if (!state.nextAgentPayoutAt || Date.now() < state.nextAgentPayoutAt) return;

  let income = 0;
  let heatGain = 0;
  let readyCount = 0;
  for (const unit of state.hiredAgents) {
    if (!agentIsReady(unit)) continue;
    const type = AGENTS.find((a) => a.id === unit.typeId);
    if (!type) continue;
    readyCount++;
    income += type.income * (1 + agentGearBonus(unit));
    heatGain += type.heat;
  }
  income = Math.round(income);
  state.cash += income;
  state.heat = Math.min(100, state.heat + heatGain);
  state.stats.totalEarned += income;
  addLog(`Your crew delivered ${fmt(income)} (${readyCount}/${state.hiredAgents.length} field-ready, +${heatGain.toFixed(1)} heat)`, "success");
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
  income = Math.round(income * (1 - rivalPenalty("business")));
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

// ---------- Roulette ----------

let rouletteGame = null; // { betType, betNumber, betAmount, phase: 'spinning'|'done', resultNumber, resultColor, resultText }
let rouletteSelection = { type: null, number: null };

function rouletteColor(n) {
  if (n === 0) return "green";
  return ROULETTE_RED_NUMBERS.includes(n) ? "red" : "black";
}

function clearRouletteBet() {
  if (rouletteGame && rouletteGame.phase === "spinning") return;
  rouletteSelection = { type: null, number: null };
  render();
}

function selectRouletteBet(type, number) {
  if (rouletteGame && rouletteGame.phase === "spinning") return;
  rouletteSelection = { type, number: number !== undefined && number !== null ? Number(number) : null };
  render();
}

function rouletteBetLabel() {
  if (!rouletteSelection.type) return null;
  if (rouletteSelection.type === "straight") return `Straight #${rouletteSelection.number}`;
  const bet = ROULETTE_OUTSIDE_BETS.find((b) => b.type === rouletteSelection.type);
  return bet ? bet.label : rouletteSelection.type;
}

function spinRoulette(amount) {
  if (!rouletteSelection.type) return;
  amount = Math.floor(Math.min(amount, state.cash));
  if (amount <= 0 || (rouletteGame && rouletteGame.phase === "spinning")) return;
  state.cash -= amount;

  const betType = rouletteSelection.type;
  const betNumber = rouletteSelection.number;
  const resultNumber = Math.floor(Math.random() * 37); // 0-36

  rouletteGame = { betType, betNumber, betAmount: amount, phase: "spinning", resultNumber: null, resultColor: null, resultText: null };
  save();
  render();

  setTimeout(() => {
    resolveRoulette(resultNumber, amount, betType, betNumber);
  }, 900);
}

function resolveRoulette(resultNumber, amount, betType, betNumber) {
  const color = rouletteColor(resultNumber);
  let win = false;
  let mult = 0;

  if (betType === "straight") {
    win = resultNumber === betNumber;
    mult = ROULETTE_STRAIGHT_MULT;
  } else {
    const bet = ROULETTE_OUTSIDE_BETS.find((b) => b.type === betType);
    mult = bet ? bet.mult : 0;
    if (betType === "red") win = color === "red";
    else if (betType === "black") win = color === "black";
    else if (betType === "odd") win = resultNumber !== 0 && resultNumber % 2 === 1;
    else if (betType === "even") win = resultNumber !== 0 && resultNumber % 2 === 0;
    else if (betType === "low") win = resultNumber >= 1 && resultNumber <= 18;
    else if (betType === "high") win = resultNumber >= 19 && resultNumber <= 36;
    else if (betType === "dozen1") win = resultNumber >= 1 && resultNumber <= 12;
    else if (betType === "dozen2") win = resultNumber >= 13 && resultNumber <= 24;
    else if (betType === "dozen3") win = resultNumber >= 25 && resultNumber <= 36;
  }

  const payout = win ? amount * mult : 0;
  state.cash += payout;

  rouletteGame.phase = "done";
  rouletteGame.resultNumber = resultNumber;
  rouletteGame.resultColor = color;
  rouletteGame.resultText = win
    ? `${resultNumber} ${color.toUpperCase()} — WIN +${fmt(payout - amount)}`
    : `${resultNumber} ${color.toUpperCase()} — No win, -${fmt(amount)}`;

  addLog(`Roulette: ${rouletteGame.resultText}`, win ? "success" : "fail");
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

// ---------- Drug dealing ----------

function buyDrug(drugId, qty) {
  const d = DRUGS.find((d) => d.id === drugId);
  if (!d) return;
  const cost = d.buyPrice * qty;
  if (state.cash < cost) return;
  state.cash -= cost;
  state.drugInventory[drugId] = (state.drugInventory[drugId] || 0) + qty;
  addLog(`Bought ${qty} ${d.unit}${qty > 1 ? "s" : ""} of ${d.name} from the Plug for ${fmt(cost)}`, "buy");
  save();
  render();
  if (phoneOpenContact === "__plug__") renderPlugPanel();
}

function maxDrugPending() {
  return Math.min(DRUG_REQUEST_MAX_PENDING_CAP, DRUG_REQUEST_BASE_PENDING + currentTierIndex());
}

function generateDrugRequest() {
  if (state.drugRequests.length >= maxDrugPending()) return;
  const d = DRUGS[Math.floor(Math.random() * DRUGS.length)];
  const [lo, hi] = DRUG_REQUEST_QTY_RANGE[d.id];
  const qty = lo + Math.floor(Math.random() * (hi - lo + 1));
  const priceFactor = 0.7 + Math.random() * 0.25; // customers lowball a bit
  const offerPrice = Math.round(d.baseSellPrice * qty * priceFactor);
  state.drugRequests.push({
    id: "req" + Date.now() + Math.floor(Math.random() * 1000),
    drugId: d.id,
    qty,
    offerPrice,
    expiresAt: Date.now() + DRUG_REQUEST_EXPIRE_SECONDS * 1000,
  });
  addLog(`New buyer wants ${qty} ${d.unit}${qty > 1 ? "s" : ""} of ${d.name}`, "info");
}

function processDrugRequests() {
  const before = state.drugRequests.length;
  state.drugRequests = state.drugRequests.filter((r) => Date.now() < r.expiresAt);
  if (state.drugRequests.length < before && phoneOpenContact === "__requests__") renderDrugRequestsView();

  if (!state.nextDrugRequestAt) {
    state.nextDrugRequestAt = Date.now() + (DRUG_REQUEST_MIN_GAP_SECONDS + Math.random() * (DRUG_REQUEST_MAX_GAP_SECONDS - DRUG_REQUEST_MIN_GAP_SECONDS)) * 1000;
    return;
  }
  if (Date.now() >= state.nextDrugRequestAt) {
    generateDrugRequest();
    state.nextDrugRequestAt = Date.now() + (DRUG_REQUEST_MIN_GAP_SECONDS + Math.random() * (DRUG_REQUEST_MAX_GAP_SECONDS - DRUG_REQUEST_MIN_GAP_SECONDS)) * 1000;
    if (phoneOpenContact === "__requests__") renderDrugRequestsView();
  }
}

function fulfillDrugSale(req, price) {
  const d = DRUGS.find((d) => d.id === req.drugId);
  state.drugInventory[req.drugId] -= req.qty;
  state.cash += price;
  state.heat = Math.min(100, state.heat + d.heat * req.qty);
  state.stats.totalEarned += price;
  state.stats.drugSalesTotal += price;
  return d;
}

function acceptDrugRequest(reqId) {
  const req = state.drugRequests.find((r) => r.id === reqId);
  if (!req) return;
  if ((state.drugInventory[req.drugId] || 0) < req.qty) return;
  const d = fulfillDrugSale(req, req.offerPrice);
  state.drugRequests = state.drugRequests.filter((r) => r.id !== reqId);
  addLog(`Sold ${req.qty} ${d.unit}${req.qty > 1 ? "s" : ""} of ${d.name} for ${fmt(req.offerPrice)}`, "success");
  save();
  render();
  if (phoneOpenContact === "__requests__") renderDrugRequestsView();
}

function counterDrugRequest(reqId, pct, chance) {
  const req = state.drugRequests.find((r) => r.id === reqId);
  if (!req) return;
  if ((state.drugInventory[req.drugId] || 0) < req.qty) return;
  const counterPrice = Math.round(req.offerPrice * (1 + pct));
  const success = Math.random() < chance;
  state.drugRequests = state.drugRequests.filter((r) => r.id !== reqId);

  if (success) {
    const d = fulfillDrugSale(req, counterPrice);
    addLog(`Countered and closed: ${req.qty} ${d.unit}${req.qty > 1 ? "s" : ""} of ${d.name} for ${fmt(counterPrice)}`, "success");
  } else {
    const d = DRUGS.find((d) => d.id === req.drugId);
    addLog(`Buyer walked on the counter for ${d.name}. No deal.`, "fail");
  }
  save();
  render();
  if (phoneOpenContact === "__requests__") renderDrugRequestsView();
}

function declineDrugRequest(reqId) {
  state.drugRequests = state.drugRequests.filter((r) => r.id !== reqId);
  addLog("Declined a buyer's request.", "info");
  save();
  render();
  if (phoneOpenContact === "__requests__") renderDrugRequestsView();
}

// ---------- Arms trafficking ----------

function buyArmsStock(gunId, qty) {
  const g = ARMS_CATALOG.find((g) => g.id === gunId);
  if (!g) return;
  const cost = g.buyPrice * qty;
  if (state.cash < cost) return;
  state.cash -= cost;
  state.armsInventory[gunId] = (state.armsInventory[gunId] || 0) + qty;
  addLog(`Bought ${qty} ${g.name}${qty > 1 ? "s" : ""} from the Arms Dealer for ${fmt(cost)}`, "buy");
  save();
  render();
  if (phoneOpenContact === "__armsdealer__") renderArmsDealerPanel();
}

function maxGunPending() {
  return Math.min(GUN_ORDER_MAX_PENDING_CAP, GUN_ORDER_BASE_PENDING + currentTierIndex());
}

function generateGunOrder() {
  if (state.gunOrders.length >= maxGunPending()) return;
  const g = ARMS_CATALOG[Math.floor(Math.random() * ARMS_CATALOG.length)];
  const [lo, hi] = GUN_ORDER_QTY_RANGE[g.id];
  const qty = lo + Math.floor(Math.random() * (hi - lo + 1));
  const priceFactor = 0.7 + Math.random() * 0.25;
  const offerPrice = Math.round(g.sellPrice * qty * priceFactor);
  state.gunOrders.push({
    id: "gorder" + Date.now() + Math.floor(Math.random() * 1000),
    gunId: g.id,
    qty,
    offerPrice,
    expiresAt: Date.now() + GUN_ORDER_EXPIRE_SECONDS * 1000,
  });
  addLog(`New order: buyer wants ${qty} ${g.name}${qty > 1 ? "s" : ""}`, "info");
}

function processGunOrders() {
  const before = state.gunOrders.length;
  state.gunOrders = state.gunOrders.filter((o) => Date.now() < o.expiresAt);
  if (state.gunOrders.length < before && phoneOpenContact === "__gunorders__") renderGunOrdersView();

  if (!state.nextGunOrderAt) {
    state.nextGunOrderAt = Date.now() + (GUN_ORDER_MIN_GAP_SECONDS + Math.random() * (GUN_ORDER_MAX_GAP_SECONDS - GUN_ORDER_MIN_GAP_SECONDS)) * 1000;
    return;
  }
  if (Date.now() >= state.nextGunOrderAt) {
    generateGunOrder();
    state.nextGunOrderAt = Date.now() + (GUN_ORDER_MIN_GAP_SECONDS + Math.random() * (GUN_ORDER_MAX_GAP_SECONDS - GUN_ORDER_MIN_GAP_SECONDS)) * 1000;
    if (phoneOpenContact === "__gunorders__") renderGunOrdersView();
  }
}

function fulfillGunOrder(order, price) {
  const g = ARMS_CATALOG.find((g) => g.id === order.gunId);
  state.armsInventory[order.gunId] -= order.qty;
  state.cash += price;
  state.heat = Math.min(100, state.heat + g.heat * order.qty);
  state.stats.totalEarned += price;
  state.stats.gunSalesTotal += price;
  return g;
}

function acceptGunOrder(orderId) {
  const order = state.gunOrders.find((o) => o.id === orderId);
  if (!order) return;
  if ((state.armsInventory[order.gunId] || 0) < order.qty) return;
  const g = fulfillGunOrder(order, order.offerPrice);
  state.gunOrders = state.gunOrders.filter((o) => o.id !== orderId);
  addLog(`Sold ${order.qty} ${g.name}${order.qty > 1 ? "s" : ""} for ${fmt(order.offerPrice)}`, "success");
  save();
  render();
  if (phoneOpenContact === "__gunorders__") renderGunOrdersView();
}

function counterGunOrder(orderId, pct, chance) {
  const order = state.gunOrders.find((o) => o.id === orderId);
  if (!order) return;
  if ((state.armsInventory[order.gunId] || 0) < order.qty) return;
  const counterPrice = Math.round(order.offerPrice * (1 + pct));
  const success = Math.random() < chance;
  state.gunOrders = state.gunOrders.filter((o) => o.id !== orderId);

  if (success) {
    const g = fulfillGunOrder(order, counterPrice);
    addLog(`Countered and closed: ${order.qty} ${g.name}${order.qty > 1 ? "s" : ""} for ${fmt(counterPrice)}`, "success");
  } else {
    const g = ARMS_CATALOG.find((g) => g.id === order.gunId);
    addLog(`Buyer walked on the counter for ${g.name}. No deal.`, "fail");
  }
  save();
  render();
  if (phoneOpenContact === "__gunorders__") renderGunOrdersView();
}

function declineGunOrder(orderId) {
  state.gunOrders = state.gunOrders.filter((o) => o.id !== orderId);
  addLog("Declined a gun order.", "info");
  save();
  render();
  if (phoneOpenContact === "__gunorders__") renderGunOrdersView();
}

// ---------- Watch dealing ----------

function buyWatchStock(watchId, qty) {
  const w = WATCH_SUPPLIER_CATALOG.find((w) => w.id === watchId);
  if (!w) return;
  const cost = w.buyPrice * qty;
  if (state.cash < cost) return;
  state.cash -= cost;
  state.watchInventory[watchId] = (state.watchInventory[watchId] || 0) + qty;
  addLog(`Bought ${qty} ${w.name}${qty > 1 ? "s" : ""} from the Watch Supplier for ${fmt(cost)}`, "buy");
  save();
  render();
  if (phoneOpenContact === "__watchsupplier__") renderWatchSupplierPanel();
}

function maxWatchPending() {
  return Math.min(WATCH_ORDER_MAX_PENDING_CAP, WATCH_ORDER_BASE_PENDING + currentTierIndex());
}

function generateWatchOrder() {
  if (state.watchOrders.length >= maxWatchPending()) return;
  const w = WATCH_SUPPLIER_CATALOG[Math.floor(Math.random() * WATCH_SUPPLIER_CATALOG.length)];
  const [lo, hi] = WATCH_ORDER_QTY_RANGE[w.id];
  const qty = lo + Math.floor(Math.random() * (hi - lo + 1));
  const priceFactor = 0.7 + Math.random() * 0.25;
  const offerPrice = Math.round(w.sellPrice * qty * priceFactor);
  state.watchOrders.push({
    id: "worder" + Date.now() + Math.floor(Math.random() * 1000),
    watchId: w.id,
    qty,
    offerPrice,
    expiresAt: Date.now() + WATCH_ORDER_EXPIRE_SECONDS * 1000,
  });
  addLog(`New order: buyer wants ${qty} ${w.name}${qty > 1 ? "s" : ""}`, "info");
}

function processWatchOrders() {
  const before = state.watchOrders.length;
  state.watchOrders = state.watchOrders.filter((o) => Date.now() < o.expiresAt);
  if (state.watchOrders.length < before && phoneOpenContact === "__watchorders__") renderWatchOrdersView();

  if (!state.nextWatchOrderAt) {
    state.nextWatchOrderAt = Date.now() + (WATCH_ORDER_MIN_GAP_SECONDS + Math.random() * (WATCH_ORDER_MAX_GAP_SECONDS - WATCH_ORDER_MIN_GAP_SECONDS)) * 1000;
    return;
  }
  if (Date.now() >= state.nextWatchOrderAt) {
    generateWatchOrder();
    state.nextWatchOrderAt = Date.now() + (WATCH_ORDER_MIN_GAP_SECONDS + Math.random() * (WATCH_ORDER_MAX_GAP_SECONDS - WATCH_ORDER_MIN_GAP_SECONDS)) * 1000;
    if (phoneOpenContact === "__watchorders__") renderWatchOrdersView();
  }
}

function fulfillWatchSale(order, price) {
  const w = WATCH_SUPPLIER_CATALOG.find((w) => w.id === order.watchId);
  state.watchInventory[order.watchId] -= order.qty;
  state.cash += price;
  state.heat = Math.min(100, state.heat + w.heat * order.qty);
  state.stats.totalEarned += price;
  state.stats.watchSalesTotal += price;
  return w;
}

function acceptWatchOrder(orderId) {
  const order = state.watchOrders.find((o) => o.id === orderId);
  if (!order) return;
  if ((state.watchInventory[order.watchId] || 0) < order.qty) return;
  const w = fulfillWatchSale(order, order.offerPrice);
  state.watchOrders = state.watchOrders.filter((o) => o.id !== orderId);
  addLog(`Sold ${order.qty} ${w.name}${order.qty > 1 ? "s" : ""} for ${fmt(order.offerPrice)}`, "success");
  save();
  render();
  if (phoneOpenContact === "__watchorders__") renderWatchOrdersView();
}

function counterWatchOrder(orderId, pct, chance) {
  const order = state.watchOrders.find((o) => o.id === orderId);
  if (!order) return;
  if ((state.watchInventory[order.watchId] || 0) < order.qty) return;
  const counterPrice = Math.round(order.offerPrice * (1 + pct));
  const success = Math.random() < chance;
  state.watchOrders = state.watchOrders.filter((o) => o.id !== orderId);

  if (success) {
    const w = fulfillWatchSale(order, counterPrice);
    addLog(`Countered and closed: ${order.qty} ${w.name}${order.qty > 1 ? "s" : ""} for ${fmt(counterPrice)}`, "success");
  } else {
    const w = WATCH_SUPPLIER_CATALOG.find((w) => w.id === order.watchId);
    addLog(`Buyer walked on the counter for ${w.name}. No deal.`, "fail");
  }
  save();
  render();
  if (phoneOpenContact === "__watchorders__") renderWatchOrdersView();
}

function declineWatchOrder(orderId) {
  state.watchOrders = state.watchOrders.filter((o) => o.id !== orderId);
  addLog("Declined a watch order.", "info");
  save();
  render();
  if (phoneOpenContact === "__watchorders__") renderWatchOrdersView();
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
  processDrugRequests();
  processGunOrders();
  processWatchOrders();

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
