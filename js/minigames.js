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

// Shared enemy silhouette used by the shooting mini-games so the player is
// visibly firing on a person, not an abstract shape.
const ENEMY_SILHOUETTE_SVG = `
  <svg viewBox="0 0 100 100" class="mg-target-svg">
    <circle cx="50" cy="26" r="16" />
    <path d="M22,96 Q22,52 50,52 Q78,52 78,96 Z" />
  </svg>`;

function spawnMuzzleFlash(container, x, y) {
  const flash = document.createElement("div");
  flash.className = "mg-muzzle-flash";
  flash.style.left = x + "px";
  flash.style.top = y + "px";
  container.appendChild(flash);
  setTimeout(() => flash.remove(), 260);
}

function mgStale(session) {
  return session !== window.__mgSession;
}

// ---------- Charge & release ----------
// Hold to charge a power meter, release inside the gold zone. Too early = weak
// hit, too late = misfire. Rewards feel (press-hold-release) instead of a click.

function playCharge(container, tier, onDone, session) {
  const zoneStart = [66, 70, 73, 76, 79, 82][tier];
  const zoneEnd = [96, 95, 94, 93, 92, 91][tier];
  const fillPctPerSec = [130, 145, 160, 175, 190, 205][tier];

  container.innerHTML = `
    <div class="mg-charge-track">
      <div class="mg-charge-zone" style="bottom:${zoneStart}%;height:${zoneEnd - zoneStart}%"></div>
      <div class="mg-charge-fill" id="mg-fill"></div>
    </div>
    <button class="btn mg-action" id="mg-hold">HOLD TO CHARGE</button>
  `;
  const fill = container.querySelector("#mg-fill");
  const btn = container.querySelector("#mg-hold");
  let pct = 0;
  let holding = false;
  let done = false;
  let raf = null;
  let startT = 0;

  function tick(now) {
    if (mgStale(session) || done) return;
    if (!holding) return;
    pct = Math.min(102, ((now - startT) / 1000) * fillPctPerSec);
    fill.style.height = Math.min(100, pct) + "%";
    if (pct >= 102) {
      release();
      return;
    }
    raf = requestAnimationFrame(tick);
  }

  function startHold(e) {
    if (done || holding) return;
    e.preventDefault && e.preventDefault();
    holding = true;
    startT = performance.now();
    raf = requestAnimationFrame(tick);
  }

  function release() {
    if (done || !holding) return;
    holding = false;
    done = true;
    if (raf) cancelAnimationFrame(raf);
    btn.disabled = true;
    let perf;
    if (pct >= zoneStart && pct <= zoneEnd) {
      const center = (zoneStart + zoneEnd) / 2;
      perf = clamp01(1 - Math.abs(pct - center) / ((zoneEnd - zoneStart) / 2));
      mgResultText(container, perf > 0.75 ? "PERFECT SHOT" : "SOLID HIT", perf > 0.75 ? "great" : "good");
    } else if (pct < zoneStart) {
      perf = clamp01(0.3 * (pct / zoneStart));
      mgResultText(container, "UNDERCHARGED", "fail");
    } else {
      perf = clamp01(0.3 - (pct - zoneEnd) / 40);
      mgResultText(container, "OVERCHARGED — MISFIRE", "fail");
    }
    setTimeout(() => onDone(perf), 700);
  }

  btn.addEventListener("mousedown", startHold);
  btn.addEventListener("touchstart", startHold, { passive: false });
  btn.addEventListener("mouseup", release);
  btn.addEventListener("touchend", release);
}

// ---------- Drag to target ----------
// Drag a reticle across the field and let go on the mark. Precision-by-distance,
// with a totally different input (press-drag-release) from anything else here.

function playDrag(container, tier, onDone, session) {
  const targetSize = [78, 68, 60, 53, 47, 42][tier];

  container.innerHTML = `
    <div class="mg-drag-field" id="mg-drag-field">
      <div class="mg-drag-target" id="mg-drag-target" style="width:${targetSize}px;height:${targetSize}px;"></div>
      <div class="mg-drag-crosshair" id="mg-drag-crosshair"></div>
    </div>
    <div class="mg-pattern-status">Drag the reticle onto the mark and let go</div>
  `;
  const field = container.querySelector("#mg-drag-field");
  const target = container.querySelector("#mg-drag-target");
  const crosshair = container.querySelector("#mg-drag-crosshair");

  const fw = field.clientWidth || 300;
  const fh = field.clientHeight || 200;
  const tx = 16 + Math.random() * Math.max(10, fw - targetSize - 32);
  const ty = 16 + Math.random() * Math.max(10, fh - targetSize - 32);
  target.style.left = tx + "px";
  target.style.top = ty + "px";

  let cx = fw / 2 - 16;
  let cy = fh - 46;
  crosshair.style.left = cx + "px";
  crosshair.style.top = cy + "px";

  let dragging = false;
  let done = false;

  function pointFromEvent(e) {
    return e.touches && e.touches.length ? e.touches[0] : e;
  }

  function start(e) {
    if (done) return;
    dragging = true;
  }

  function move(e) {
    if (mgStale(session)) {
      field.removeEventListener("mousemove", move);
      field.removeEventListener("touchmove", move);
      return;
    }
    if (!dragging || done) return;
    const rect = field.getBoundingClientRect();
    const p = pointFromEvent(e);
    cx = p.clientX - rect.left - 16;
    cy = p.clientY - rect.top - 16;
    crosshair.style.left = cx + "px";
    crosshair.style.top = cy + "px";
  }

  function end() {
    if (!dragging || done) return;
    dragging = false;
    done = true;
    const centerX = cx + 16;
    const centerY = cy + 16;
    const targetCenterX = tx + targetSize / 2;
    const targetCenterY = ty + targetSize / 2;
    const dist = Math.hypot(centerX - targetCenterX, centerY - targetCenterY);
    const perf = clamp01(1 - dist / targetSize);
    spawnMuzzleFlash(field, centerX, centerY);
    if (perf > 0.7) mgResultText(container, "DEAD ON TARGET", "great");
    else if (perf > 0.35) mgResultText(container, "CLOSE ENOUGH", "good");
    else mgResultText(container, "MISSED THE MARK", "fail");
    setTimeout(() => onDone(perf), 700);
  }

  crosshair.addEventListener("mousedown", start);
  crosshair.addEventListener("touchstart", start, { passive: true });
  field.addEventListener("mousemove", move);
  field.addEventListener("touchmove", move, { passive: true });
  field.addEventListener("mouseup", end);
  field.addEventListener("touchend", end);
}

// ---------- Breach code ----------
// Memorize a short sequence of directional icons shown all at once, then
// reproduce it by tapping a fixed grid. Different exposure (all-at-once,
// hidden, then recalled) from a flash-one-at-a-time memory game.

function playBreach(container, tier, onDone, session) {
  const seqLen = [3, 4, 5, 6, 7, 8][tier];
  const icons = ["⬆", "➡", "⬇", "⬅"];
  const sequence = Array.from({ length: seqLen }, () => icons[Math.floor(Math.random() * icons.length)]);
  const revealMs = 1100 + seqLen * 380;

  container.innerHTML = `
    <div class="mg-breach-sequence" id="mg-seq">${sequence.map((i) => `<span>${i}</span>`).join("")}</div>
    <div class="mg-pattern-status" id="mg-status">Memorize the breach code...</div>
  `;

  setTimeout(() => {
    if (mgStale(session)) return;
    const seqEl = container.querySelector("#mg-seq");
    if (seqEl) seqEl.classList.add("mg-breach-hidden");
    const status = container.querySelector("#mg-status");
    if (status) status.textContent = "Enter the code";

    const grid = document.createElement("div");
    grid.className = "mg-pattern-grid mg-breach-grid";
    grid.innerHTML = icons.map((i) => `<div class="mg-pad mg-breach-pad" data-icon="${i}">${i}</div>`).join("");
    container.appendChild(grid);

    let playerIdx = 0;
    grid.querySelectorAll(".mg-breach-pad").forEach((pad) => {
      pad.addEventListener("click", () => {
        if (mgStale(session)) return;
        const icon = pad.dataset.icon;
        pad.classList.add("mg-pad-lit");
        setTimeout(() => pad.classList.remove("mg-pad-lit"), 150);
        if (icon === sequence[playerIdx]) {
          playerIdx++;
          if (playerIdx >= sequence.length) {
            mgResultText(container, "BREACH SUCCESSFUL", "great");
            setTimeout(() => onDone(1), 700);
          }
        } else {
          const perf = clamp01(playerIdx / sequence.length);
          mgResultText(container, "WRONG CODE", perf > 0.4 ? "ok" : "fail");
          grid.querySelectorAll(".mg-breach-pad").forEach((p) => (p.style.pointerEvents = "none"));
          setTimeout(() => onDone(perf * 0.8), 700);
        }
      });
    });
  }, revealMs);
}

// ---------- Rapid fire ----------
// A fixed time window, targets keep spawning and stay up until clicked — pure
// speed/APM instead of takedown's per-target expiry pressure.

function playRapidfire(container, tier, onDone, session) {
  const totalMs = [6000, 6500, 7000, 7500, 8000, 8500][tier];
  const spawnGapMs = [520, 470, 420, 380, 340, 300][tier];

  container.innerHTML = `
    <div class="mg-takedown-field" id="mg-field"></div>
    <div class="mg-pattern-status" id="mg-status">Hits: 0 · Time: ${(totalMs / 1000).toFixed(1)}s</div>
  `;
  const field = container.querySelector("#mg-field");
  const status = container.querySelector("#mg-status");
  let hits = 0;
  let ended = false;
  const startT = Date.now();
  const expectedSpawns = Math.max(3, Math.round(totalMs / spawnGapMs));

  function updateStatus() {
    const remain = Math.max(0, (totalMs - (Date.now() - startT)) / 1000);
    status.textContent = `Hits: ${hits} · Time: ${remain.toFixed(1)}s`;
  }

  function finish() {
    if (ended) return;
    ended = true;
    const perf = clamp01(hits / expectedSpawns);
    mgResultText(
      container,
      perf >= 0.7 ? "RAPID CLEAR" : perf >= 0.35 ? "DECENT PACE" : "TOO SLOW",
      perf >= 0.7 ? "great" : perf >= 0.35 ? "ok" : "fail"
    );
    setTimeout(() => onDone(perf), 700);
  }

  function spawnOne() {
    if (mgStale(session) || ended) return;
    if (Date.now() - startT >= totalMs) {
      finish();
      return;
    }
    const target = document.createElement("div");
    target.className = "mg-target";
    target.innerHTML = ENEMY_SILHOUETTE_SVG;
    const fw = field.clientWidth - 44;
    const fh = field.clientHeight - 44;
    target.style.left = Math.random() * Math.max(fw, 10) + "px";
    target.style.top = Math.random() * Math.max(fh, 10) + "px";
    let hit = false;
    target.addEventListener("click", () => {
      if (hit || ended) return;
      hit = true;
      hits++;
      updateStatus();
      spawnMuzzleFlash(field, target.offsetLeft + 22, target.offsetTop + 22);
      target.classList.add("mg-target-down");
      setTimeout(() => target.remove(), 160);
    });
    field.appendChild(target);
    setTimeout(spawnOne, spawnGapMs);
  }

  const statusInterval = setInterval(() => {
    if (mgStale(session) || ended) {
      clearInterval(statusInterval);
      return;
    }
    updateStatus();
    if (Date.now() - startT >= totalMs) {
      clearInterval(statusInterval);
      finish();
    }
  }, 200);

  spawnOne();
}

// ---------- Steady aim ----------
// A reticle drifts in a slow 2D loop around a fixed mark; click when it lines
// up. Continuous 2D drift instead of a 1D back-and-forth bar.

function playAim(container, tier, onDone, session) {
  const speed = [1.0, 1.15, 1.3, 1.5, 1.7, 1.9][tier];
  const zoneRadius = [50, 44, 38, 33, 28, 24][tier];

  container.innerHTML = `
    <div class="mg-aim-field" id="mg-aim-field">
      <div class="mg-aim-zone" style="width:${zoneRadius * 2}px;height:${zoneRadius * 2}px;"></div>
      <div class="mg-aim-reticle" id="mg-aim-reticle"></div>
    </div>
    <div class="mg-pattern-status">Click when the reticle lines up on the mark</div>
  `;
  const field = container.querySelector("#mg-aim-field");
  const reticle = container.querySelector("#mg-aim-reticle");
  let done = false;
  let raf = null;
  let lastX = 0;
  let lastY = 0;
  const startT = performance.now();

  function tick(now) {
    if (mgStale(session) || done) return;
    const t = ((now - startT) / 1000) * speed;
    const fw = field.clientWidth || 300;
    const fh = field.clientHeight || 200;
    lastX = fw / 2 + Math.sin(t * 1.3) * fw * 0.32;
    lastY = fh / 2 + Math.sin(t * 0.9 + 1.2) * fh * 0.32;
    reticle.style.left = lastX + "px";
    reticle.style.top = lastY + "px";
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);

  field.addEventListener("click", () => {
    if (done) return;
    done = true;
    if (raf) cancelAnimationFrame(raf);
    const fw = field.clientWidth || 300;
    const fh = field.clientHeight || 200;
    const dist = Math.hypot(lastX - fw / 2, lastY - fh / 2);
    const perf = clamp01(1 - dist / (zoneRadius + 20));
    spawnMuzzleFlash(field, lastX, lastY);
    if (perf > 0.75) mgResultText(container, "DEAD-ON LOCK", "great");
    else if (perf > 0.4) mgResultText(container, "CLOSE SHOT", "good");
    else mgResultText(container, "OFF TARGET", "fail");
    setTimeout(() => onDone(perf), 700);
  });
}

const MINIGAME_PLAYERS = {
  charge: playCharge,
  drag: playDrag,
  breach: playBreach,
  rapidfire: playRapidfire,
  aim: playAim,
};

function startMinigame(contract, container, onDone) {
  const player = MINIGAME_PLAYERS[contract.minigame];
  if (!player) {
    onDone(0.5);
    return;
  }
  player(container, contract.tier, onDone, window.__mgSession);
}
