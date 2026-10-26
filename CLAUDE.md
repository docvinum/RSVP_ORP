# CLAUDE.md

Les consignes pour agents IA de ce dépôt sont centralisées dans **AGENTS.md**, commun à tous les agents :

@AGENTS.md

Pour intégrer la bibliothèque dans une application hôte, voir @docs/ai-integration.md.

Rappels propres à Claude Code :
- Après chaque modification : `npm run typecheck && npm run lint && npm test`.
- Avant un commit touchant `src/` : `npm run build`, puis commitez `dist/`.
- Les décisions de produit (section 4 d'AGENTS.md) ne se modifient qu'avec l'accord de l'humain.
