
// Moteur algorithmique 


const FlipAlgorithm = (() => {

  // =====================================================================
  // 1. UTILITAIRES GÉOMÉTRIQUES SUR UN CERCLE CONVEXE
  // =========================================================================

  function normalizeEdge(u, v) {
    return u < v ? [u, v] : [v, u];
  }

  function edgeKey(u, v) {
    const [a, b] = normalizeEdge(u, v);
    return `${a}-${b}`;
  }

  /**
   * Une arête (u, v) est une diagonale si ce n'est pas une arête de l'enveloppe convexe.
   * Sur un cercle de n sommets (0 à n-1), les arêtes du bord sont consécutives modulo n.
   */
  function isDiagonal(u, v, n) {
    const diff = Math.abs(u - v);
    return diff > 1 && diff !== n - 1;
  }

  /**
   * Vérifie si deux segments se croisent strictement à l'intérieur du cercle.
   * Deux cordes (a, b) et (c, d) se croisent ssi leurs extrémités s'entrelacent.
   */
  function edgesCross(e1, e2) {
    const [a, b] = normalizeEdge(e1[0], e1[1]);
    const [c, d] = normalizeEdge(e2[0], e2[1]);

    // Si elles partagent un sommet commun, elles ne se croisent pas à l'intérieur
    if (a === c || a === d || b === c || b === d) return false;

    // Entrelacement cyclique
    return (a < c && c < b && b < d) || (c < a && a < d && d < b);
  }

  function pathToEdges(path) {
    const edges = [];
    for (let i = 0; i < path.length - 1; i++) {
      edges.push(normalizeEdge(path[i], path[i + 1]));
    }
    return edges;
  }

  /**
   * Vérifie qu'un chemin est un chemin couvrant planaire valide (Plane Spanning Path).
   */
  function isValidPlaneSpanningPath(path, n) {
    if (!path || path.length !== n) return false;
    if (new Set(path).size !== n) return false; // Tous les sommets doivent être visités

    const edges = pathToEdges(path);
    for (let i = 0; i < edges.length; i++) {
      for (let j = i + 1; j < edges.length; j++) {
        if (edgesCross(edges[i], edges[j])) return false;
      }
    }
    return true;
  }

  // ====================================================================
  // 2. GÉNÉRATEUR DES FLIPS ÉLÉMENTAIRES (Sections 1 & 3 du papier)
  // =========================================================================

  /**
   * Génère tous les flips valides possibles à partir d'un chemin donné.
   * Couper une arête (p_i, p_i+1) divise le chemin en 2 morceaux.
   * Il y a exactement 3 manières de reconnecter les extrémités libres.
   */
  function getPossibleFlips(path, n) {
    const validFlips = [];

    for (let i = 0; i < path.length - 1; i++) {
      const removedEdge = normalizeEdge(path[i], path[i + 1]);

      const prefix = path.slice(0, i + 1);
      const suffix = path.slice(i + 1);

      // Les 3 reconnexions possibles 
      const candidatePaths = [
        [...prefix.slice().reverse(), ...suffix], // inversion préfixe
        [...prefix, ...suffix.slice().reverse()], // inversion suffixe
        [...suffix, ...prefix]                   // cycle puis coupure
      ];

      for (const newPath of candidatePaths) {
        if (isValidPlaneSpanningPath(newPath, n)) {
          const oldEdges = new Set(pathToEdges(path).map(e => edgeKey(e[0], e[1])));
          const addedEdge = pathToEdges(newPath).find(e => !oldEdges.has(edgeKey(e[0], e[1])));

          if (addedEdge) {
            validFlips.push({
              removedEdge,
              addedEdge,
              nextPath: newPath
            });
          }
        }
      }
    }

    return validFlips;s
  }

  // =======================================================================
  // 3. ANALYSE ET CALCUL DE DISTANCE MINIMALE (Théorème 4.1 du papier)
  // =========================================================================

  /**
   * Vérifie si un sommet v se trouve strictement entre u et w en tournant dans le sens horaire.
   */
  function isBetweenClockwise(v, u, w) {
    if (u < w) return v > u && v < w;
    return v > u || v < w;
  }

  /**
   * Détermine si une diagonale commune d = (u, v) est bonne
   */
  function isGoodHappyDiagonal(u, v, Pin, Ptar, n) {
    // Récupérer le voisin adjacent à u (autre que v) dans chaque chemin
    const neighborU_Pin = getAdjacentNeighbor(Pin, u, v);
    const neighborU_Ptar = getAdjacentNeighbor(Ptar, u, v);

    // Si u a un voisin dans les deux chemins, on teste s'ils partent du même côté
    if (neighborU_Pin !== null && neighborU_Ptar !== null) {
      const sidePin = isBetweenClockwise(neighborU_Pin, u, v);
      const sidePtar = isBetweenClockwise(neighborU_Ptar, u, v);
      return sidePin === sidePtar;
    }

    // Sinon, on teste à l'autre extrémité v
    const neighborV_Pin = getAdjacentNeighbor(Pin, v, u);
    const neighborV_Ptar = getAdjacentNeighbor(Ptar, v, u);

    if (neighborV_Pin !== null && neighborV_Ptar !== null) {
      const sidePin = isBetweenClockwise(neighborV_Pin, v, u);
      const sidePtar = isBetweenClockwise(neighborV_Ptar, v, u);
      return sidePin === sidePtar;
    }

    return true;
  }

  function getAdjacentNeighbor(path, vertex, exclude) {
    const idx = path.indexOf(vertex);
    if (idx === -1) return null;
    if (idx > 0 && path[idx - 1] !== exclude) return path[idx - 1];
    if (idx < path.length - 1 && path[idx + 1] !== exclude) return path[idx + 1];
    return null;
  }

  /**
   * Calcule la distance minimale exacte et le cas du théorème 4.1
   */
  function analyzeDistance(Pin, Ptar, n) {
    const edgesIn = pathToEdges(Pin);
    const edgesTar = pathToEdges(Ptar);
    const setTar = new Set(edgesTar.map(e => edgeKey(e[0], e[1])));

    // 1. Nombre de diagonales k et l
    const k = edgesIn.filter(e => isDiagonal(e[0], e[1], n)).length;
    const l = edgesTar.filter(e => isDiagonal(e[0], e[1], n)).length;

    // 2. Trouver m : nombre max de bonnes diagonales dans un sous chemin continu
    // d'arêtes communes, conformément au Théorème 4.1.
    let maxGoodInSubpath = 0;
    let currentGoodCount = 0;

    for (let i = 0; i < Pin.length - 1; i++) {
      const u = Pin[i];
      const v = Pin[i + 1];
      const key = edgeKey(u, v);

      if (setTar.has(key)) {
        // C'est une arête commune (happy edge)
        if (isDiagonal(u, v, n) && isGoodHappyDiagonal(u, v, Pin, Ptar, n)) {
          currentGoodCount++;
        }
        if (currentGoodCount > maxGoodInSubpath) {
          maxGoodInSubpath = currentGoodCount;
        }
      } else {
        // Le sous-chemin continu d'arêtes communes s'arrête ici
        currentGoodCount = 0;
      }
    }

    const m = maxGoodInSubpath;

    // 3. Classification selon le Théorème 4.1
    let detectedCase = "";
    let distance = 0;
    let explanation = "";

    if (m >= 1) {
      detectedCase = "Case 1";
      distance = k + l - 2 * m;
      explanation = `Cas 1 détecté : Il existe un sous-chemin continu avec m = ${m} bonne(s) diagonale(s) commune(s). Distance = k + l - 2m = ${k} + ${l} - 2(${m}) = ${distance}.`;
    } else {
      // Aucune bonne diagonale commune (m = 0)
      const commonGap = findCommonBoundaryGap(edgesIn, edgesTar, n);
      const canDoType3 = checkType3Possibility(edgesIn, edgesTar, n);

      if (canDoType3) {
        detectedCase = "Case 2a";
        distance = k + l - 1;
        explanation = `Cas 2a détecté : Une paire de diagonales peut être directement échangée via un flip de Type 3. Distance = k + l - 1 = ${distance}.`;
      } else if (commonGap !== null) {
        detectedCase = "Case 2b";
        distance = k + l;
        explanation = `Cas 2b détecté : Présence d'un "gap" commun sur l'enveloppe convexe en (${commonGap[0]}, ${commonGap[1]}). Distance = k + l = ${distance}.`;
      } else {
        detectedCase = "Case 2c";
        distance = k + l + 1;
        explanation = `Cas 2c détecté : Aucun gap commun ni échange Type 3 possible. Distance = k + l + 1 = ${distance}.`;
      }
    }

    return {
      distance,
      detectedCase,
      k,
      l,
      m,
      explanation
    };
  }

  function findCommonBoundaryGap(edgesIn, edgesTar, n) {
    const inSet = new Set(edgesIn.map(e => edgeKey(e[0], e[1])));
    const tarSet = new Set(edgesTar.map(e => edgeKey(e[0], e[1])));

    for (let i = 0; i < n; i++) {
      const next = (i + 1) % n;
      const key = edgeKey(i, next);
      if (!inSet.has(key) && !tarSet.has(key)) {
        return [i, next];
      }
    }
    return null;
  }

  function checkType3Possibility(edgesIn, edgesTar, n) {
    const diagIn = edgesIn.filter(e => isDiagonal(e[0], e[1], n));
    const diagTar = edgesTar.filter(e => isDiagonal(e[0], e[1], n));

    for (const [u1, v1] of diagIn) {
      for (const [u2, v2] of diagTar) {
        if (
          (u2 === (u1 + 1) % n && v2 === (v1 - 1 + n) % n) ||
          (u2 === (u1 - 1 + n) % n && v2 === (v1 + 1) % n)
        ) {
          return true;
        }
      }
    }
    return false;
  }

  // =====================================================================
  // 4. RÉSOLVEUR OPTIMAL PAR BFS (Pour l'animation et le mode jeu)
  // =========================================================================

  function findOptimalSequence(Pin, Ptar, n) {
    const canonical = p => {
      const s1 = p.join(',');
      const s2 = p.slice().reverse().join(',');
      return s1 < s2 ? s1 : s2;
    };

    const startKey = canonical(Pin);
    const targetKey = canonical(Ptar);

    if (startKey === targetKey) return [Pin];

    const queue = [[Pin]];
    const visited = new Set([startKey]);

    while (queue.length > 0) {
      const currentSeq = queue.shift();
      const currentPath = currentSeq[currentSeq.length - 1];

      const flips = getPossibleFlips(currentPath, n);

      for (const flip of flips) {
        const next = flip.nextPath;
        const key = canonical(next);

        if (key === targetKey) {
          return [...currentSeq, next];
        }

        if (!visited.has(key)) {
          visited.add(key);
          queue.push([...currentSeq, next]);
        }
      }
    }
    return null;
  }

  return {
    normalizeEdge,
    isDiagonal,
    edgesCross,
    pathToEdges,
    isValidPlaneSpanningPath,
    getPossibleFlips,
    analyzeDistance,
    findOptimalSequence
  };

})();