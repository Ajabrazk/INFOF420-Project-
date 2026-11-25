# INFO-F420: Computational Geometry — Project

**Topic:** Reconfiguration of Plane Spanning Paths via Flips on Convex Point Sets  
**Main Paper:** O. Aichholzer & J. Dorfer (EuroCG 2025 / arXiv:2507.02740) | https://arxiv.org/abs/2507.02740
**Author:** Anwar Jabrazko (Individual Project — 2026–2027)  
**Live Website:** https://ajabrazk.github.io/INFOF420-Project-/

## How to Run Locally
This is a static web application (HTML/CSS/JavaScript with p5.js and MathJax loaded via CDN). No installation or build step is required:
1. Unzip the project folder (or clone the repository).
2. Open `index.html` directly in any modern web browser (Chrome, Firefox, Edge, Safari), or launch it using VS Code's *Live Server* extension.

## Project Structure
- `index.html` & `style.css` — Layout, theoretical report (*Learn It*), and interactive lab (*Try It*).
- `navigation.js` — Tab switching logic.
- `flip-algorithm.js` — Geometric predicates, Theorem 4.1 $\mathcal{O}(n)$ distance classification, and optimal sequence solver.
- `reconfiguration.js` — Activity 01: Manual reconfiguration sandbox.
- `happyedge.js` — Activity 02: Interactive 4-vertex counterexample and 8-node flip graph.
- `visual-solver.js` — Activity 03: Theorem 4.1 breakdown and step-by-step animation player.
- `AI_JOURNAL.pdf` — Documentation of AI tools, significant prompts, and verification steps.
