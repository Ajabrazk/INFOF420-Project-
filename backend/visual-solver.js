/**
 * visual-solver.js
 * Activité 03 : Visualisation de l'algorithme et solveur pas-à-pas.
 * Affiche la décomposition du Théorème 4.1 (diagonales, arêtes communes, cas détecté, formule)
 * et anime la séquence de flips étape par étape avec un lecteur interactif.
 */

const visualSolverSketch = (p) => {
  const n = 6;
  let initialPath = [];
  let targetPath = [];
  let sequence = [];       // Liste des chemins [P_in, P_1, ..., P_tar]
  let currentStep = 0;
  let isPlaying = false;
  let playTimer = null;

  let centerX, centerY, radius;

  // =========================================================================
  // SETUP
  // =========================================================================
  p.setup = () => {
    const container = document.getElementById('solver-canvas-container');
    const w = (container && container.offsetWidth > 100) ? container.offsetWidth : 520;
    const h = 340;

    const canvas = p.createCanvas(w, h);
    canvas.parent('solver-canvas-container');

    centerX = p.width / 2;
    centerY = p.height / 2;
    radius = Math.min(centerX, centerY) * 0.72;

    bindControls();
    loadNewInstance();
  };

  p.windowResized = () => {
    const container = document.getElementById('solver-canvas-container');
    if (container && container.offsetWidth > 100) {
      p.resizeCanvas(container.offsetWidth, 340);
      centerX = p.width / 2;
      centerY = p.height / 2;
      radius = Math.min(centerX, centerY) * 0.72;
    }
  };

  // =========================================================================
  // DESSIN (DRAW)
  // =========================================================================
  p.draw = () => {
    p.background(9, 13, 22);

    // 1. Cercle guide de fond
    p.noFill();
    p.stroke(30, 41, 59);
    p.strokeWeight(1.5);
    p.circle(centerX, centerY, radius * 2);

    // 2. Chemin cible P_tar en arrière-plan (pointillés corail)
    drawPath(targetPath, p.color(244, 63, 94, 85), 2, true);

    // 3. Chemin de l'étape courante
    if (sequence.length > 0) {
      const activePath = sequence[currentStep];
      drawActivePath(activePath);
    }

    // 4. Sommets
    drawVertices();
  };

  // =========================================================================
  // FONCTIONS DE DESSIN GÉOMÉTRIQUE
  // =========================================================================
  function getVertexPos(i) {
    const angle = -p.HALF_PI + (i * p.TWO_PI) / n;
    return {
      x: centerX + radius * p.cos(angle),
      y: centerY + radius * p.sin(angle)
    };
  }

  function drawPath(path, col, weight, isDashed = false) {
    if (!path || path.length < 2) return;
    p.stroke(col);
    p.strokeWeight(weight);

    for (let i = 0; i < path.length - 1; i++) {
      const p1 = getVertexPos(path[i]);
      const p2 = getVertexPos(path[i + 1]);
      if (isDashed) {
        drawDashedLine(p1.x, p1.y, p2.x, p2.y, 6, 6);
      } else {
        p.line(p1.x, p1.y, p2.x, p2.y);
      }
    }
  }

  function drawActivePath(path) {
    const edges = FlipAlgorithm.pathToEdges(path);
    const targetEdgesSet = new Set(FlipAlgorithm.pathToEdges(targetPath).map(e => `${Math.min(e[0], e[1])}-${Math.max(e[0], e[1])}`));

    // Identifier l'arête qui vient d'être ajoutée lors de cette étape (s'il y en a une)
    let addedEdgeKey = null;
    if (currentStep > 0 && sequence[currentStep - 1]) {
      const prevEdges = new Set(FlipAlgorithm.pathToEdges(sequence[currentStep - 1]).map(e => `${Math.min(e[0], e[1])}-${Math.max(e[0], e[1])}`));
      const found = edges.find(e => !prevEdges.has(`${Math.min(e[0], e[1])}-${Math.max(e[0], e[1])}`));
      if (found) addedEdgeKey = `${Math.min(found[0], found[1])}-${Math.max(found[0], found[1])}`;
    }

    for (const [u, v] of edges) {
      const p1 = getVertexPos(u);
      const p2 = getVertexPos(v);
      const k = `${Math.min(u, v)}-${Math.max(u, v)}`;
      const isHappy = targetEdgesSet.has(k);         // Arête partagée avec la cible
      const isNewlyAdded = (k === addedEdgeKey);     // Vient d'être ajoutée par ce flip

      if (isHappy) {
        // Déjà présente dans la cible (Happy Edge / Cible validée) : Vert émeraude !
        p.stroke(16, 185, 129);
        p.strokeWeight(isNewlyAdded ? 4 : 3);
      } else if (isNewlyAdded) {
        // Arête intermédiaire qui vient d'être ajoutée (ex: transition sur le bord) : Jaune vif
        p.stroke(251, 191, 36);
        p.strokeWeight(3.5);
      } else {
        // Arête temporaire non présente dans la cible : Bleu cyan
        p.stroke(56, 189, 248);
        p.strokeWeight(2.5);
      }
      p.line(p1.x, p1.y, p2.x, p2.y);
    }
  }

  function drawVertices() {
    for (let i = 0; i < n; i++) {
      const pos = getVertexPos(i);
      p.noStroke();
      p.fill(148, 163, 184);
      p.circle(pos.x, pos.y, 14);

      p.fill(15, 23, 42);
      p.textSize(9);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(i, pos.x, pos.y);
    }
  }

  function drawDashedLine(x1, y1, x2, y2, dashLen, gapLen) {
    const totalDist = p.dist(x1, y1, x2, y2);
    const numDashes = Math.floor(totalDist / (dashLen + gapLen));
    const dx = (x2 - x1) / totalDist;
    const dy = (y2 - y1) / totalDist;

    let cx = x1;
    let cy = y1;
    for (let i = 0; i < numDashes; i++) {
      p.line(cx, cy, cx + dx * dashLen, cy + dy * dashLen);
      cx += dx * (dashLen + gapLen);
      cy += dy * (dashLen + gapLen);
    }
    p.line(cx, cy, x2, y2);
  }

  // =========================================================================
  // LOGIQUE DU SOLVEUR ET DU THÉORÈME 4.1
  // =========================================================================
  function loadNewInstance() {
    stopPlay();

    // 1. Générer P_in = [0, 1, 2, 3, 4, 5]
    initialPath = [];
    for (let i = 0; i < n; i++) initialPath.push(i);

    // 2. Générer P_tar par 3 ou 4 flips aléatoires valides
    let temp = [...initialPath];
    const steps = 3 + Math.floor(Math.random() * 2);
    for (let s = 0; s < steps; s++) {
      const flips = FlipAlgorithm.getPossibleFlips(temp, n);
      if (flips.length > 0) {
        temp = flips[Math.floor(Math.random() * flips.length)].nextPath;
      }
    }
    targetPath = temp;

    // 3. Exécuter l'analyse structurelle du Théorème 4.1
    const analysis = FlipAlgorithm.analyzeDistance(initialPath, targetPath, n);

    // 4. Calculer la séquence optimale
    sequence = FlipAlgorithm.findOptimalSequence(initialPath, targetPath, n) || [initialPath];
    currentStep = 0;

    // 5. Mettre à jour l'affichage HTML
    updateAnalysisUI(analysis);
    updateStepUI();
  }

  function updateAnalysisUI(analysis) {
    const badgeEl = document.getElementById('solver-case-badge');
    const formulaEl = document.getElementById('solver-formula');
    const explanationEl = document.getElementById('solver-explanation');

    if (badgeEl) {
      badgeEl.innerText = analysis.detectedCase || "Analyzed";
    }
    if (formulaEl) {
      formulaEl.innerText = `Distance: ${analysis.distance} flips (k=${analysis.k}, l=${analysis.l}, m=${analysis.m})`;
    }
    if (explanationEl) {
      explanationEl.innerText = analysis.explanation;
    }
  }

  function updateStepUI() {
    const stepNumEl = document.getElementById('solver-step-num');
    const stepTotalEl = document.getElementById('solver-step-total');
    const stepDescEl = document.getElementById('solver-step-desc');

    const total = Math.max(0, sequence.length - 1);
    if (stepNumEl) stepNumEl.innerText = currentStep;
    if (stepTotalEl) stepTotalEl.innerText = total;

    if (stepDescEl) {
      if (currentStep === 0) {
        stepDescEl.innerText = "Step 0: Initial configuration (Pin). Click Play or Next to animate the optimal sequence.";
      } else if (currentStep === total) {
        stepDescEl.innerText = `Step ${currentStep}: Target configuration (Ptar) reached in ${total} flips!`;
      } else {
        stepDescEl.innerText = `Step ${currentStep} of ${total}: Intermediate plane spanning path.`;
      }
    }
  }

  // =========================================================================
  // CONTRÔLES DU LECTEUR (PLAY / PAUSE / STEP)
  // =========================================================================
  function stepForward() {
    if (currentStep < sequence.length - 1) {
      currentStep++;
      updateStepUI();
    } else {
      stopPlay();
    }
  }

  function stepBackward() {
    if (currentStep > 0) {
      currentStep--;
      updateStepUI();
    }
  }

  function togglePlay() {
    if (isPlaying) {
      stopPlay();
    } else {
      startPlay();
    }
  }

  function startPlay() {
    if (currentStep >= sequence.length - 1) {
      currentStep = 0;
      updateStepUI();
    }
    isPlaying = true;
    const playBtn = document.getElementById('solver-btn-play');
    if (playBtn) playBtn.innerText = "⏸ Pause";

    playTimer = setInterval(() => {
      if (currentStep < sequence.length - 1) {
        stepForward();
      } else {
        stopPlay();
      }
    }, 1100);
  }

  function stopPlay() {
    isPlaying = false;
    if (playTimer) clearInterval(playTimer);
    playTimer = null;
    const playBtn = document.getElementById('solver-btn-play');
    if (playBtn) playBtn.innerText = "▶ Play";
  }

  function bindControls() {
    const btnPlay = document.getElementById('solver-btn-play');
    const btnNext = document.getElementById('solver-btn-next');
    const btnPrev = document.getElementById('solver-btn-prev');
    const btnNew  = document.getElementById('solver-btn-new');

    if (btnPlay) btnPlay.onclick = togglePlay;
    if (btnNext) btnNext.onclick = () => { stopPlay(); stepForward(); };
    if (btnPrev) btnPrev.onclick = () => { stopPlay(); stepBackward(); };
    if (btnNew)  btnNew.onclick  = () => { loadNewInstance(); };
  }
};

new p5(visualSolverSketch);