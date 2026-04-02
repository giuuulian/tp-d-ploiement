# CI/CD Pipeline - Déploiement Automatisé

Pipeline CI/CD complet déployant une application Node.js/Express sur Azure.

---

## Fonctionnement du Pipeline

Quand on fais `git push origin main`, voici ce qui se passe automatiquement :

1. **Tests unitaires** — Jest valide la logique de l'API (6 tests)
2. **Tests E2E** — L'app démarre et on teste les workflows complets (8 scénarios)
3. **Build Docker** — L'image est construite et poussée vers Docker Hub
4. **Déploiement Azure** — La nouvelle image est déployée via SSH sur la VM

Si une étape échoue, la suite s'arrête immédiatement.

---

## Déclenchement du Déploiement

À chaque push sur `main`, GitHub Actions démarre la chaîne complète.

```bash
git push origin main
→ Tests lancés
→ Build lancé
→ Deploy lancé
```

Tu peux suivre en temps réel sur : https://github.com/giuuulian/tp-d-ploiement/actions

**Si un test échoue**, le déploiement n'a pas lieu. Il faut corriger et repousser.

---

## Choix Techniques

**Pourquoi Node.js + Express ?** C'est léger, rapide, et idéal pour une démo CI/CD.

**Pourquoi Jest pour les tests ?** C'est la norme JavaScript. Simple à configurer, exécution rapide.

**Pourquoi Node.js pour l'E2E au lieu de Cypress ?** J'ai eu des problèmes avec Cypress. Ala placej'ai choisi d'utilsier un client HTTP JavaScript pur.

**Pourquoi Docker multi-stage ?** L'image finale est légère (~120MB) car on n'embarque que le production code. La première étape (builder) sert juste à compiler, puis on jette les devDependencies.

**Pourquoi GitHub Actions ?** C'est intégré à GitHub, gratuit, et les logs sont visibles directement. Pas de compte externe à gérer.

**Pourquoi SSH + Docker sur Azure ?** Contrôle total, simple, et le déploiement est idempotent (relançable sans risque). Pas besoin de Kubernetes pour une démo.

---

**App live :** http://132.164.96.206:3000/health
