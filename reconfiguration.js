
// Code pour la reconfiguration manuelle (activité 1 du site)

const reconfigurationSketch = (p) => {
  let n = 6;                    // 6 sommets : idéal pour un puzzle accessible et stimulant
  let currentPath = [];         // Chemin actuel manipulé par le joueur
  let targetPath = [];          // Chemin cible à atteindre
  let initialPath = [];         // Sauvegarde pour le bouton "Reset"
  let flipCount = 0;
  let optimalDistance = 0;
  let isSolved = false;
  let selectedEdgeIndex = -1;   // Indice de l'arête sélectionnée pour suppression (-1 = aucune)
  let validReplacements = [];   // Flips valides disponibles pour l'arête sélectionnée

  let centerX, centerY, radius; // géométrie du canvas

  // =========================================================================
  // SETUP
  // =========================================================================
  p.setup = () => {
    const container = document.getElementById('sandbox-canvas-container');
    const w = (container && container.offsetWidth > 100) ? container.offsetWidth : 520;
    const h = 340;

    const canvas = p.createCanvas(w, h);
    canvas.parent('sandbox-canvas-container');

    centerX = p.width / 2;
    centerY = p.height / 2;
    radius = Math.min(centerX, centerY) * 0.72;

    // Lier les boutons HTML
    bindUIButtons();

    // Générer un premier puzzle
    generateNewPuzzle();
  };

  p.windowResized = () => {
    const container = document.getElementById('sandbox-canvas-container');
    if (container && container.offsetWidth > 100) {
      p.resizeCanvas(container.offsetWidth, 340);
      centerX = p.width / 2;
      centerY = p.height / 2;
      radius = Math.min(centerX, centerY) * 0.72;
    }
  };

  // =========================================================================
  // DESSIN 
  // =========================================================================
  p.draw = () => {
    p.background(9, 13, 22); // Fond sombre 

    // 1. Cercle guide de fond
    p.noFill();
    p.stroke(30, 41, 59);
    p.strokeWeight(1.5);
    p.circle(centerX, centerY, radius * 2);

    // 2. Dessiner le chemin cible (en arrière-plan, pointillés discrets rouge/corail)
    drawPath(targetPath, p.color(244, 63, 94, 80), 2, true);

    // 3. Dessiner les arêtes de remplacement valides (si une arête est sélectionnée)
    drawReplacementCandidates();

    // 4. Dessiner le chemin actuel du joueur (bleu cyan vif)
    drawCurrentPathWithHover();

    // 5. Dessiner les sommets
    drawVertices();
  };

  // =========================================================================
  // FONCTIONS DE DESSIN
  // =========================================================================

  function getVertexPos(i) {
    // Les sommets sont numérotés 0 à n-1 dans le sens horaire, débutant en haut
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

  function drawCurrentPathWithHover() {
    const edges = FlipAlgorithm.pathToEdges(currentPath);
    const mouseEdgeIdx = getHoveredEdgeIndex(edges);

    for (let i = 0; i < edges.length; i++) {
      const [u, v] = edges[i];
      const p1 = getVertexPos(u);
      const p2 = getVertexPos(v);

      if (i === selectedEdgeIndex) {
        // Arête sélectionnée pour être retirée (jaune/orange vif)
        p.stroke(251, 191, 36);
        p.strokeWeight(4);
        p.line(p1.x, p1.y, p2.x, p2.y);
      } else if (i === mouseEdgeIdx && selectedEdgeIndex === -1 && !isSolved) {
        // Survol avec la souris
        p.stroke(147, 197, 253);
        p.strokeWeight(3.5);
        p.line(p1.x, p1.y, p2.x, p2.y);
      } else {
        // Arête normale du joueur
        p.stroke(56, 189, 248);
        p.strokeWeight(2.5);
        p.line(p1.x, p1.y, p2.x, p2.y);
      }
    }
  }

  function drawReplacementCandidates() {
    if (selectedEdgeIndex === -1 || isSolved) return;

    for (const flip of validReplacements) {
      const [u, v] = flip.addedEdge;
      const p1 = getVertexPos(u);
      const p2 = getVertexPos(v);

      // Tester si la souris survole cette option verte
      const isHovered = distToSegment(p.mouseX, p.mouseY, p1.x, p1.y, p2.x, p2.y) < 12;

      p.stroke(isHovered ? p.color(52, 211, 153) : p.color(16, 185, 129, 180));
      p.strokeWeight(isHovered ? 4 : 2.5);
      drawDashedLine(p1.x, p1.y, p2.x, p2.y, 8, 5);
    }
  }

  function drawVertices() {
    for (let i = 0; i < n; i++) {
      const pos = getVertexPos(i);
      const d = p.dist(p.mouseX, p.mouseY, pos.x, pos.y);

      p.noStroke();
      if (d < 14) {
        p.fill(248, 250, 252);
        p.circle(pos.x, pos.y, 18);
      } else {
        p.fill(148, 163, 184);
        p.circle(pos.x, pos.y, 12);
      }

      // Numéro du sommet
      p.fill(15, 23, 42);
      p.textSize(10);
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

  // =======================================================================
  // GESTION DES CLICS SOURIS
  // =========================================================================
  p.mousePressed = () => {
    if (p.mouseX < 0 || p.mouseX > p.width || p.mouseY < 0 || p.mouseY > p.height || isSolved) {
      return;
    }

    const currentEdges = FlipAlgorithm.pathToEdges(currentPath);

    // Etape 1 : Si aucune arête n'est sélectionnée, tenter de sélectionner une arête à retirer
    if (selectedEdgeIndex === -1) {
      const clickedIdx = getHoveredEdgeIndex(currentEdges);
      if (clickedIdx !== -1) {
        const removed = currentEdges[clickedIdx];
        const allFlips = FlipAlgorithm.getPossibleFlips(currentPath, n);
        validReplacements = allFlips.filter(f => 
          (f.removedEdge[0] === removed[0] && f.removedEdge[1] === removed[1])
        );

        if (validReplacements.length > 0) {
          selectedEdgeIndex = clickedIdx;
          updateFeedback("Edge selected. Click a dashed green line to complete the flip!");
        } else {
          updateFeedback("This edge cannot be flipped without violating path constraints.");
        }
      }
      return;
    }

    // Etape 2 : Une arête est sélectionnée. Tester si on clique sur une arête candidate verte
    for (const flip of validReplacements) {
      const [u, v] = flip.addedEdge;
      const p1 = getVertexPos(u);
      const p2 = getVertexPos(v);

      if (distToSegment(p.mouseX, p.mouseY, p1.x, p1.y, p2.x, p2.y) < 14) {
        currentPath = flip.nextPath;
        flipCount++;
        selectedEdgeIndex = -1;
        validReplacements = [];
        updateUIStats();

        checkSolved();
        return;
      }
    }

    // Clic dans le vide ou sur l'arête déjà sélectionnée -> annuler
    selectedEdgeIndex = -1;
    validReplacements = [];
    updateFeedback("Selection canceled. Click a blue edge to start.");
  };

  // ======================================================================
  // GESTION DU PUZZLE ET DE L'ÉTAT
  // =======================================================================

  function generateNewPuzzle() {
    isSolved = false;
    flipCount = 0;
    selectedEdgeIndex = -1;
    validReplacements = [];

    // Chemin canonique initial : 0 - 1 - 2 - 3 - 4 - 5
    initialPath = [];
    for (let i = 0; i < n; i++) initialPath.push(i);

    // Créer un chemin cible en effectuant 3 à 5 flips aléatoires valides
    let temp = [...initialPath];
    const steps = 3 + Math.floor(Math.random() * 2);

    for (let s = 0; s < steps; s++) {
      const flips = FlipAlgorithm.getPossibleFlips(temp, n);
      if (flips.length > 0) {
        temp = flips[Math.floor(Math.random() * flips.length)].nextPath;
      }
    }
    targetPath = temp;
    currentPath = [...initialPath];

    // Calculer la distance théorique optimale
    const analysis = FlipAlgorithm.analyzeDistance(initialPath, targetPath, n);
    optimalDistance = analysis.distance;

    updateUIStats();
    updateFeedback("Goal: transform the blue path to match the dashed red target path!");
  }

  function resetCurrentPuzzle() {
    currentPath = [...initialPath];
    flipCount = 0;
    selectedEdgeIndex = -1;
    validReplacements = [];
    isSolved = false;
    updateUIStats();
    updateFeedback("Path reset to initial configuration.");
  }

  function checkSolved() {
    const k1 = currentPath.join(',');
    const k2 = currentPath.slice().reverse().join(',');
    const tar1 = targetPath.join(',');

    if (k1 === tar1 || k2 === tar1) {
      isSolved = true;
      const diff = flipCount - optimalDistance;
      if (diff === 0) {
        updateFeedback(`🏆 Solved in ${flipCount} flips! Perfect theoretical optimum reached.`);
      } else {
        updateFeedback(`✅ Target reached in ${flipCount} flips! Optimal distance is ${optimalDistance} flips (+${diff}).`);
      }
    } else {
      updateFeedback(`Valid flip! (${flipCount} performed).`);
    }
  }

  // =========================================================================
  // OUTILS GÉOMÉTRIQUES INTERNES DE SOURIS
  // =========================================================================

  function getHoveredEdgeIndex(edges) {
    for (let i = 0; i < edges.length; i++) {
      const [u, v] = edges[i];
      const p1 = getVertexPos(u);
      const p2 = getVertexPos(v);
      if (distToSegment(p.mouseX, p.mouseY, p1.x, p1.y, p2.x, p2.y) < 10) {
        return i;
      }
    }
    return -1;
  }

  function distToSegment(px, py, x1, y1, x2, y2) {
    const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (l2 === 0) return p.dist(px, py, x1, y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return p.dist(px, py, x1 + t * (x2 - x1), y1 + t * (y2 - y1));
  }

  // ========================================================================
  // LIAISON AVEC L'INTERFACE HTML
  // =========================================================================

  function updateUIStats() {
    const flipsEl = document.getElementById('reconfig-flips-count');
    const optEl = document.getElementById('reconfig-optimal-count');
    if (flipsEl) flipsEl.innerText = flipCount;
    if (optEl) optEl.innerText = optimalDistance;
  }

  function updateFeedback(msg) {
    const el = document.getElementById('reconfig-status-msg');
    if (el) el.innerText = msg;
  }

  function bindUIButtons() {
    const btnReset = document.getElementById('reconfig-btn-reset');
    const btnNew = document.getElementById('reconfig-btn-new');
    if (btnReset) btnReset.onclick = resetCurrentPuzzle;
    if (btnNew) btnNew.onclick = generateNewPuzzle;
  }
};

new p5(reconfigurationSketch);