// Mini-games played to finish a contract once its timer completes.
// Each play*() function renders into `container` and calls onDone(performance)
// once, where performance is a 0..1 score fed back into resolveContract().

function clamp01(n) {
  return Math.max(0, Math.min(1, n));
}

function mgResultText(container, text, cls) {
  const el = document.createElement("div");
  el.className = `mg-result-text ${cls}`;
  el.textContent = text;
  container.appendChild(el);
}

// ---------- Timing bar ----------

function playTiming(container, tier, onDone) {
  const zoneWidth = [30, 24, 18, 14][tier];
  const loopMs = [1400, 1150, 950, 800][tier];
  const zoneLeft = 50 - zoneWidth / 2;

  container.innerHTML = `
    <div class="mg-timing-track">
      <div class="mg-timing-zone" style="left:${zoneLeft}%;width:${zoneWidth}%"></div>
      <div class="mg-timing-marker" id="mg-marker"></div>
    </div>
    <button class="btn mg-action" id="mg-strike">STRIKE</button>
  `;

  const marker = container.querySelector("#mg-marker");
  const startTime = performance.now();
  let raf = null;
  let done = false;

  function tick(now) {
    const elapsed = (now - startTime) % (loopMs * 2);
    const pct = elapsed < loopMs ? (elapsed / loopMs) * 100 : 100 - ((elapsed - loopMs) / loopMs) * 100;
    marker.style.left = pct + "%";
    if (!done) raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);

  container.querySelector("#mg-strike").addEventListener("click", () => {
    if (done) return;
    done = true;
    cancelAnimationFrame(raf);
    const markerPct = parseFloat(marker.style.left);
    const dist = Math.abs(markerPct - 50);
    const halfZone = zoneWidth / 2;
    let perf;
    if (dist <= halfZone) {
      perf = clamp01(1 - dist / halfZone);
      mgResultText(container, perf > 0.75 ? "PERFECT TIMING" : "SOLID HIT", perf > 0.75 ? "great" : "good");
    } else {
      perf = clamp01(0.35 - (dist - halfZone) / 100);
      mgResultText(container, "MISTIMED", "fail");
    }
    container.querySelector("#mg-strike").disabled = true;
    setTimeout(() => onDone(perf), 700);
  });
}

// ---------- Reflex click ----------

function playReflex(container, tier, onDone) {
  const thresholds = [
    [400, 700, 1000],
    [350, 600, 900],
    [300, 500, 750],
    [250, 420, 650],
  ][tier];

  container.innerHTML = `<div class="mg-reflex-box" id="mg-box">WAIT...</div>`;
  const box = container.querySelector("#mg-box");
  let flipped = false;
  let flipTime = 0;
  let done = false;

  const delay = 800 + Math.random() * 1600;
  const timer = setTimeout(() => {
    flipped = true;
    flipTime = performance.now();
    box.textContent = "STRIKE NOW";
    box.classList.add("mg-reflex-go");
  }, delay);

  box.addEventListener("click", () => {
    if (done) return;
    done = true;
    if (!flipped) {
      clearTimeout(timer);
      mgResultText(container, "TOO EARLY — THEY SAW YOU COMING", "fail");
      setTimeout(() => onDone(0), 700);
      return;
    }
    const reaction = performance.now() - flipTime;
    let perf;
    if (reaction <= thresholds[0]) {
      perf = 1;
      mgResultText(container, "LIGHTNING FAST", "great");
    } else if (reaction <= thresholds[1]) {
      perf = 0.7;
      mgResultText(container, "CLEAN HIT", "good");
    } else if (reaction <= thresholds[2]) {
      perf = 0.4;
      mgResultText(container, "SLOW", "ok");
    } else {
      perf = 0.15;
      mgResultText(container, "TOO SLOW", "fail");
    }
    setTimeout(() => onDone(perf), 700);
  });
}

// ---------- Pattern memory ----------

function playPattern(container, tier, onDone) {
  const seqLen = [3, 4, 5, 6][tier];
  const colors = ["red", "purple", "teal", "gold"];
  const sequence = Array.from({ length: seqLen }, () => Math.floor(Math.random() * 4));

  container.innerHTML = `
    <div class="mg-pattern-grid">
      ${colors.map((c, i) => `<div class="mg-pad mg-pad-${c}" data-idx="${i}"></div>`).join("")}
    </div>
    <div class="mg-pattern-status" id="mg-status">Watch closely...</div>
  `;

  const pads = container.querySelectorAll(".mg-pad");
  const status = container.querySelector("#mg-status");
  let playerIdx = 0;
  let accepting = false;

  function flash(i, cb) {
    pads[i].classList.add("mg-pad-lit");
    setTimeout(() => {
      pads[i].classList.remove("mg-pad-lit");
      setTimeout(cb, 220);
    }, 480);
  }

  function playSequence(i) {
    if (i >= sequence.length) {
      accepting = true;
      status.textContent = "Your turn — repeat it";
      return;
    }
    flash(sequence[i], () => playSequence(i + 1));
  }
  setTimeout(() => playSequence(0), 500);

  pads.forEach((pad) => {
    pad.addEventListener("click", () => {
      if (!accepting) return;
      const idx = Number(pad.dataset.idx);
      pad.classList.add("mg-pad-lit");
      setTimeout(() => pad.classList.remove("mg-pad-lit"), 200);

      if (idx === sequence[playerIdx]) {
        playerIdx++;
        if (playerIdx >= sequence.length) {
          accepting = false;
          mgResultText(container, "CODE MATCHED", "great");
          setTimeout(() => onDone(1), 700);
        }
      } else {
        accepting = false;
        const perf = clamp01(playerIdx / sequence.length);
        mgResultText(container, "WRONG SEQUENCE", perf > 0.4 ? "ok" : "fail");
        setTimeout(() => onDone(perf * 0.8), 700);
      }
    });
  });
}

// ---------- Multi-target takedown ----------

function playTakedown(container, tier, onDone) {
  const total = [5, 6, 7, 8][tier];
  const visibleMs = [900, 780, 650, 550][tier];
  const gapMs = [350, 300, 260, 220][tier];

  container.innerHTML = `
    <div class="mg-takedown-field" id="mg-field"></div>
    <div class="mg-pattern-status" id="mg-status">Targets: 0 / ${total}</div>
  `;
  const field = container.querySelector("#mg-field");
  const status = container.querySelector("#mg-status");
  let hits = 0;
  let spawned = 0;

  function spawnOne() {
    if (spawned >= total) {
      setTimeout(() => {
        const perf = hits / total;
        mgResultText(container, perf >= 0.8 ? "AREA CLEARED" : perf >= 0.4 ? "MOSTLY CLEAR" : "TOO MANY LEFT STANDING", perf >= 0.8 ? "great" : perf >= 0.4 ? "ok" : "fail");
        setTimeout(() => onDone(perf), 700);
      }, 200);
      return;
    }
    spawned++;
    const target = document.createElement("div");
    target.className = "mg-target";
    const fw = field.clientWidth - 44;
    const fh = field.clientHeight - 44;
    target.style.left = Math.random() * Math.max(fw, 10) + "px";
    target.style.top = Math.random() * Math.max(fh, 10) + "px";
    let hit = false;
    target.addEventListener("click", () => {
      if (hit) return;
      hit = true;
      hits++;
      status.textContent = `Targets: ${hits} / ${total}`;
      target.remove();
    });
    field.appendChild(target);
    setTimeout(() => {
      if (!hit && target.parentNode) target.remove();
      setTimeout(spawnOne, gapMs);
    }, visibleMs);
  }
  setTimeout(spawnOne, 400);
}

const MINIGAME_PLAYERS = {
  timing: playTiming,
  reflex: playReflex,
  pattern: playPattern,
  takedown: playTakedown,
};

function startMinigame(contract, container, onDone) {
  const player = MINIGAME_PLAYERS[contract.minigame];
  if (!player) {
    onDone(0.5);
    return;
  }
  player(container, contract.tier, onDone);
}
