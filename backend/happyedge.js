/**
 * happyedge.js
 * Activité 02 : Le Paradoxe des Arêtes Communes (Happy Edge Property).
 * Reproduit fidèlement la Section 2 et la Figure 2 du papier :
 * Flip graph des 8 chemins sur 4 sommets en position convexe.
 */

const happyEdgeSketch = (p) => {
  const n = 4;

  // Définition canonique des 8 chemins sur 4 sommets (Figure 2 du papier)
  // Sommets : 0: top-left, 1: top-right, 2: bottom-right, 3: bottom-left
  const PATHS = [
    { id: 0, name: "P_in", path: [1, 0, 2, 3], hasHappy: true },    // edges: (0,1), (0,2), (2,3)
    { id: 1, name: "Path 1", path: [0, 1, 2, 3], hasHappy: false },  // edges: (0,1), (1,2), (2,3)
    { id: 2, name: "Path 2", path: [2, 3, 0, 1], hasHappy: false },  // edges: (2,3), (3,0), (0,1)
    { id: 3, name: "Path 3", path: [0, 1, 3, 2], hasHappy: false },  // edges: (0,1), (1,3), (2,3)
    { id: 4, name: "P_tar", path: [3, 0, 2, 1], hasHappy: true },   // edges: (3,0), (0,2), (1,2)
    { id: 5, name: "Path 5", path: [3, 0, 1, 2], hasHappy: false },  // edges: (3,0), (0,1), (1,2)
    { id: 6, name: "Path 6", path: [1, 2, 3, 0], hasHappy: false },  // edges: (1,2), (2,3), (3,0)
    { id: 7, name: "Path 7", path: [2, 1, 3, 0], hasHappy: false }   // edges: (1,2), (1,3), (3,0)
  ];

  // Les 14 transitions exactes du Flip Graph de la Figure 2
  const GRAPH_EDGES = [
    { from: 0, to: 1, type: "Type 1" },
    { from: 0, to: 2, type: "Type 1" },
    { from: 0, to: 3, type: "Type 3" },
    { from: 1, to: 5, type: "Type 2" },
    { from: 1, to: 6, type: "Type 2" },
    { from: 1, to: 3, type: "Type 1" },
    { from: 2, to: 5, type: "Type 2" },
    { from: 2, to: 6, type: "Type 2" },
    { from: 2, to: 3, type: "Type 1" },
    { from: 4, to: 5, type: "Type 1" },
    { from: 4, to: 6, type: "Type 1" },
    { from: 4, to: 7, type: "Type 3" },
    { from: 5, to: 7, type: "Type 1" },
    { from: 6, to: 7, type: "Type 1" }
  ];

  // La séquence minimale de 3 flips reliant Pin (0) à Ptar (4)
  const OPTIMAL_SEQUENCE = [0, 1, 6, 4];
  const STEP_EXPLANATIONS = [
    "Step 0 (Initial P_in): The happy diagonal (0,2) is present (green). Look at the graph: ALL outgoing transitions remove this diagonal!",
    "Step 1 (Type 1 Flip): The diagonal (0,2) is flipped out to a convex hull edge. The happy edge is temporarily destroyed.",
    "Step 2 (Type 2 Flip): Realigning the path along the boundary (shifting the gap). Still no happy edge.",
    "Step 3 (Type 1 Flip): The happy diagonal (0,2) is finally restored to reach Ptar! The happy edge property fails."
  ];

  let currentPathId = 0;
  let sequenceStep = 0;

  let leftCenterX, leftCenterY, circleRadius;
  let nodePositions = [];

  // =========================================================================
  // SETUP
  // =========================================================================
  p.setup = () => {
    const container = document.getElementById('counterexample-canvas-container');
    const w = (container && container.offsetWidth > 100) ? container.offsetWidth : 550;
    const h = 380;

    const canvas = p.createCanvas(w, h);
    canvas.parent('counterexample-canvas-container');

    computeLayout();
    bindUI();
    updateUI();
  };

  p.windowResized = () => {
    const container = document.getElementById('counterexample-canvas-container');
    if (container && container.offsetWidth > 100) {
      p.resizeCanvas(container.offsetWidth, 380);
      computeLayout();
    }
  };

  function computeLayout() {
    // Moitié gauche : cercle géométrique
    leftCenterX = p.width * 0.24;
    leftCenterY = p.height * 0.5;
    circleRadius = Math.min(p.width * 0.18, 90);

    // Moitié droite : les 8 nœuds du Flip Graph disposés comme dans la Figure 2
    const rightX = p.width * 0.65;
    const spanX = p.width * 0.14;
    const centerY = p.height * 0.5;
    const spanY = 110;

    nodePositions = [
      { id: 0, x: rightX - spanX * 1.3, y: centerY },             // 0: Pin (centre gauche)
      { id: 1, x: rightX - spanX * 0.5, y: centerY - spanY },     // 1: haut gauche
      { id: 2, x: rightX - spanX * 0.5, y: centerY + spanY },     // 2: bas gauche
      { id: 3, x: rightX - spanX * 0.4, y: centerY },             // 3: intérieur gauche

      { id: 4, x: rightX + spanX * 1.3, y: centerY },             // 4: Ptar (centre droit)
      { id: 5, x: rightX + spanX * 0.5, y: centerY + spanY },     // 5: bas droit
      { id: 6, x: rightX + spanX * 0.5, y: centerY - spanY },     // 6: haut droit
      { id: 7, x: rightX + spanX * 0.4, y: centerY }              // 7: intérieur droit
    ];
  }

  // =========================================================================
  // DESSIN (DRAW)
  // =========================================================================
  p.draw = () => {
    p.background(9, 13, 22);

    // 1. Séparateur vertical subtil entre le cercle et le graphe
    p.stroke(255, 255, 255, 12);
    p.strokeWeight(1);
    p.line(p.width * 0.46, 20, p.width * 0.46, p.height - 20);

    // 2. Dessiner le cercle des 4 points à gauche
    drawLeftCircle();

    // 3. Dessiner le Flip Graph à droite
    drawFlipGraph();
  };

  // =========================================================================
  // DESSIN DU CERCLE GÉOMÉTRIQUE (GAUCHE)
  // =========================================================================
  function get4VertexPos(i) {
    // 0: top-left, 1: top-right, 2: bottom-right, 3: bottom-left
    const angle = -p.PI * 0.75 + (i * p.HALF_PI);
    return {
      x: leftCenterX + circleRadius * p.cos(angle),
      y: leftCenterY + circleRadius * p.sin(angle)
    };
  }

  function drawLeftCircle() {
    // Titre de section
    p.noStroke();
    p.fill(148, 163, 184);
    p.textSize(11);
    p.textAlign(p.CENTER, p.TOP);
    p.text("GEOMETRIC CONFIGURATION", leftCenterX, 16);

    // Cercle de fond
    p.noFill();
    p.stroke(30, 41, 59);
    p.strokeWeight(1.5);
    p.circle(leftCenterX, leftCenterY, circleRadius * 2);

    // Arêtes du chemin actif
    const activeData = PATHS[currentPathId];
    const edges = FlipAlgorithm.pathToEdges(activeData.path);

    for (const [u, v] of edges) {
      const p1 = get4VertexPos(u);
      const p2 = get4VertexPos(v);

      if ((u === 0 && v === 2) || (u === 2 && v === 0)) {
        // La Happy Edge (0, 2) brille en vert !
        p.stroke(16, 185, 129);
        p.strokeWeight(4);
      } else {
        p.stroke(56, 189, 248);
        p.strokeWeight(2.5);
      }
      p.line(p1.x, p1.y, p2.x, p2.y);
    }

    // Sommets
    for (let i = 0; i < n; i++) {
      const pos = get4VertexPos(i);
      p.noStroke();
      p.fill(248, 250, 252);
      p.circle(pos.x, pos.y, 18);

      p.fill(15, 23, 42);
      p.textSize(10);
      p.textStyle(p.BOLD);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(i, pos.x, pos.y);
    }
    p.textStyle(p.NORMAL);

    // Légende sous le cercle
    p.textSize(11);
    if (activeData.hasHappy) {
      p.fill(16, 185, 129);
      p.text("● Happy diagonal (0,2) PRESENT", leftCenterX, leftCenterY + circleRadius + 30);
    } else {
      p.fill(244, 63, 94);
      p.text("✕ Happy diagonal (0,2) REMOVED", leftCenterX, leftCenterY + circleRadius + 30);
    }
  }

  // =========================================================================
  // DESSIN DU FLIP GRAPH (DROITE - Figure 2)
  // =========================================================================
  function drawFlipGraph() {
    p.noStroke();
    p.fill(148, 163, 184);
    p.textSize(11);
    p.textAlign(p.CENTER, p.TOP);
    p.text("FLIP GRAPH (8 PATHS ON 4 VERTICES)", p.width * 0.72, 16);

    // 1. Tracer les arêtes de transition du graphe
    for (const edge of GRAPH_EDGES) {
      const n1 = nodePositions[edge.from];
      const n2 = nodePositions[edge.to];

      p.stroke(40, 56, 80);
      p.strokeWeight(1.2);
      p.line(n1.x, n1.y, n2.x, n2.y);
    }

    // 2. Tracer les 8 nœuds
    for (const node of nodePositions) {
      const isCurrent = (node.id === currentPathId);
      const isStart = (node.id === 0);
      const isTarget = (node.id === 4);
      const hasHappy = PATHS[node.id].hasHappy;

      // Halo pour le nœud actif
      if (isCurrent) {
        p.noFill();
        p.stroke(255, 255, 255, 120);
        p.strokeWeight(6);
        p.circle(node.x, node.y, 34);
      }

      // Couleur de fond du nœud
      p.strokeWeight(2);
      if (isStart) {
        p.stroke(56, 189, 248);     // Cyan pour Pin
        p.fill(16, 37, 69);
      } else if (isTarget) {
        p.stroke(244, 63, 94);      // Rose pour Ptar
        p.fill(40, 16, 32);
      } else {
        p.stroke(hasHappy ? p.color(16, 185, 129) : p.color(71, 85, 105));
        p.fill(15, 23, 42);
      }

      p.circle(node.x, node.y, 24);

      // Pastille verte sur les nœuds qui ont la happy edge
      if (hasHappy) {
        p.noStroke();
        p.fill(16, 185, 129);
        p.circle(node.x + 8, node.y - 8, 8);
      }

      // Label du nœud
      p.noStroke();
      p.fill(isCurrent ? 255 : 203);
      p.textSize(9);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(PATHS[node.id].name, node.x, node.y);
    }
  }

  // =========================================================================
  // INTERACTION SOURIS : CLIQUER SUR LES NŒUDS DU GRAPHE
  // =========================================================================
  p.mousePressed = () => {
    if (p.mouseX < p.width * 0.46 || p.mouseX > p.width || p.mouseY < 0 || p.mouseY > p.height) {
      return;
    }

    for (const node of nodePositions) {
      if (p.dist(p.mouseX, p.mouseY, node.x, node.y) < 18) {
        currentPathId = node.id;
        // Synchroniser avec la séquence si le nœud fait partie du chemin optimal
        const seqIdx = OPTIMAL_SEQUENCE.indexOf(currentPathId);
        if (seqIdx !== -1) {
          sequenceStep = seqIdx;
        }
        updateUI();
        return;
      }
    }
  };

  // =========================================================================
  // NAVIGATION PAR ÉTAPES & UI
  // =========================================================================
  function nextStep() {
    if (sequenceStep < OPTIMAL_SEQUENCE.length - 1) {
      sequenceStep++;
      currentPathId = OPTIMAL_SEQUENCE[sequenceStep];
      updateUI();
    }
  }

  function prevStep() {
    if (sequenceStep > 0) {
      sequenceStep--;
      currentPathId = OPTIMAL_SEQUENCE[sequenceStep];
      updateUI();
    }
  }

  function resetToStart() {
    sequenceStep = 0;
    currentPathId = OPTIMAL_SEQUENCE[0]; // Pin
    updateUI();
  }

  function updateUI() {
    const stateEl = document.getElementById('he-current-state');
    const msgEl = document.getElementById('he-status-msg');

    if (stateEl) {
      const pData = PATHS[currentPathId];
      stateEl.innerText = `${pData.name} ${pData.hasHappy ? "(with happy edge)" : "(no happy edge)"}`;
      stateEl.className = pData.hasHappy ? "highlight-cyan" : "highlight-rose";
    }

    if (msgEl) {
      msgEl.innerText = STEP_EXPLANATIONS[sequenceStep];
    }
  }

  function bindUI() {
    const btnNext = document.getElementById('he-btn-next');
    const btnPrev = document.getElementById('he-btn-prev');
    const btnReset = document.getElementById('he-btn-reset');

    if (btnNext) btnNext.onclick = nextStep;
    if (btnPrev) btnPrev.onclick = prevStep;
    if (btnReset) btnReset.onclick = resetToStart;
  }
};

new p5(happyEdgeSketch);