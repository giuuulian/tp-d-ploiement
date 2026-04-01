# Application Deployment - CI/CD Pipeline Automatisé

## 📋 Vue d'ensemble

Ce projet démontre un pipeline CI/CD complet et automatisé qui déploie une application Node.js/Express sur une VM Azure. Chaque push sur la branche `main` déclenche automatiquement une chaîne de tests, build, et déploiement sans intervention manuelle.

### Architecture du Pipeline

```
git push (main)
    ↓
[1] Tests Unitaires (Jest)
    ↓
[2] Tests E2E (Cypress)
    ↓ (uniquement si ✓)
[3] Build & Push Image Docker
    ↓
[4] Déploiement sur VM Azure (SSH)
    ↓
[5] Health Check & Vérification
```

---

## 🏗️ Structure du Projet

```
.
├── src/
│   └── app.js                 # Application Express principale
├── tests/
│   └── app.test.js            # Tests unitaires (Jest)
├── cypress/
│   ├── e2e/
│   │   └── api.cy.js          # Tests E2E (Cypress)
│   └── support/
│       └── e2e.js             # Configuration Cypress
├── .github/
│   └── workflows/
│       └── deploy.yml         # Workflow GitHub Actions
├── Dockerfile                 # Image Docker multi-stage
├── docker-compose.yml         # Orchestration Docker local
├── package.json               # Dépendances NPM
├── jest.config.js            # Configuration Jest
├── cypress.config.js         # Configuration Cypress
└── README.md                 # Ce fichier
```

---

## 🚀 Démarrage Rapide (Local)

### Prérequis
- Node.js 18+
- npm
- Docker & Docker Compose (optionnel pour tester localement)

### Installation et exécution

```bash
# 1. Cloner le repository
git clone https://github.com/giuuulian/tp-d-ploiement.git
cd tp-d-ploiement

# 2. Installer les dépendances
npm install

# 3. Lancer l'application en développement
npm start
# L'app será accessible à http://localhost:3000

# 4. Tester les endpoints
curl http://localhost:3000/health
curl http://localhost:3000/api/tasks
```

### Lancement avec Docker

```bash
# Build et démarrer l'application
docker-compose up --build

# L'app será accessible à http://localhost:3000

# Arrêter l'application
docker-compose down
```

---

## 🧪 Tests

### Tests Unitaires

```bash
npm test
```

**Vérifie:**
- ✓ Endpoint `/health` retourne le statut
- ✓ API `/api/tasks` retourne un array
- ✓ Création de tâche avec validations
- ✓ Récupération de tâche inexistante retourne 404

### Tests E2E (Cypress)

```bash
# Mode interactif
npm run cypress:open

# Mode headless (CI/CD)
npm run e2e
```

**Vérifie:**
- ✓ L'application démarre et répond
- ✓ Endpoint `/health` disponible
- ✓ CRUD complet des tâches
- ✓ Workflow complet: créer → lire → modifier → vérifier

---

## 🐳 Docker

### Build manuel

```bash
docker build -t app-deployment:latest .
```

### Exécution manuel

```bash
docker run -d \
  --name myapp \
  -p 3000:3000 \
  -e NODE_ENV=production \
  app-deployment:latest
```

### Vérification

```bash
# Accéder à l'app
curl http://localhost:3000/health

# Voir les logs
docker logs myapp

# Arrêter l'app
docker stop myapp
docker rm myapp
```

---

## 🔄 Pipeline GitHub Actions

### Déclenchement

Le workflow se déclenche **automatiquement** sur:
```
push → branche main
```

### Jobs du Pipeline

#### 1️⃣ **Unit Tests**
- Setup Node.js 18
- Installation des dépendances
- Exécution: `npm test`
- ⛔ Échec → pipeline s'arrête
- ✓ Upload des rapports de couverture

#### 2️⃣ **E2E Tests**
- **Dépend de:** Unit Tests ✓
- Démarrage de l'application en arrière-plan
- Attente du health check (max 60 secondes)
- Exécution: `npm run e2e` (Cypress)
- ⛔ Échec → pipeline s'arrête
- ✓ Upload des vidéos Cypress si échec

#### 3️⃣ **Build & Push Docker**
- **Dépend de:** Unit Tests ✓ + E2E Tests ✓
- Build de l'image: `app-deployment:latest` et `app-deployment:SHA`
- Login Docker Hub (secrets)
- Push de l'image vers Docker Hub
- ⛔ Échec → pipeline s'arrête

#### 4️⃣ **Deploy to Azure**
- **Dépend de:** Build & Push ✓
- Connexion SSH à la VM
- Pull de l'image depuis Docker Hub
- **Arrêt du conteneur existant** (idempotent)
- Démarrage du nouveau conteneur avec le même nom
- **Health check** (30 tentatives, 2s d'intervalle)
- Vérification des endpoints

---

## 🔐 GitHub Secrets (Configuration Requise)

Avant que le pipeline fonctionne, configurez ces secrets dans GitHub:

```
Settings → Secrets and variables → Actions → New repository secret
```

| Secret | Valeur | Exemple |
|--------|--------|---------|
| `DOCKER_USERNAME` | Votre username Docker Hub | `giulianp` |
| `DOCKER_PASSWORD` | Token Docker Hub (pas le mot de passe!) | `dckr_pat_...` |
| `AZURE_VM_IP` | IP publique de la VM Azure | `132.164.96.206` |
| `AZURE_VM_USER` | User SSH sur la VM | `azureuser` |
| `AZURE_SSH_KEY` | Clé privée SSH (copier/coller complètement) | `-----BEGIN OPENSSH...` |

### Création du token Docker Hub

1. Aller sur https://hub.docker.com/settings/security
2. Cliquer "New Access Token"
3. Copier le token généré
4. Ajouter en secret GitHub: `DOCKER_PASSWORD`

### Récupération de la clé SSH Azure

```bash
# Si vous avez la clé localement
cat ~/.ssh/id_rsa | pbcopy  # macOS
cat ~/.ssh/id_rsa | xclip   # Linux
type C:\Users\YourUser\.ssh\id_rsa | clip  # Windows
```

---

## ✔️ Points Clés du Déploiement

### 1. **Idempotence**

Le déploiement est **entièrement idempotent**: relancer le workflow ne crée pas de problème.

```bash
# Scénario: pousser le même commit 2 fois
docker stop myapp || true      # Arrête le conteneur s'il existe
docker rm myapp || true        # Supprime s'il existe
docker pull image:latest       # Pull de la nouvelle image
docker run -d --name myapp ... # Redémarre avec le même nom
```

→ **Résultat:** Un seul conteneur actif à la fin.

### 2. **Production Ready**

- ✓ Dockerfile multi-stage (optimisé)
- ✓ User non-root dans le conteneur
- ✓ Health check configuré
- ✓ Port exposé: 3000
- ✓ Redémarrage automatique

### 3. **Sécurité**

- Aucune clé secrète en clair dans le repository
- Secrets stockés dans GitHub
- Clés SSH supprimées après déploiement
- User non-root dans le conteneur Docker

---

## 📊 Application API

### Endpoints disponibles

#### Health Check
```
GET /health
```
**Response:** `200 OK`
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0"
}
```

#### Lister toutes les tâches
```
GET /api/tasks
```

#### Créer une tâche
```
POST /api/tasks
Content-Type: application/json

{
  "title": "Ma nouvelle tâche"
}
```

#### Récupérer une tâche
```
GET /api/tasks/:id
```

#### Modifier une tâche
```
PUT /api/tasks/:id
Content-Type: application/json

{
  "title": "Titre modifié",
  "completed": true
}
```

#### Supprimer une tâche
```
DELETE /api/tasks/:id
```

---

## 🧹 Nettoyage

### Local
```bash
# Arrêter l'app et nettoyer Docker
docker-compose down

# Nettoyer cache npm
npm cache clean --force
rm -rf node_modules package-lock.json
```

### VM Azure
```bash
# S'il faut arrêter le conteneur
ssh -i ~/.ssh/azure_key azureuser@132.164.96.206

# Depuis la VM
docker stop myapp
docker rm myapp
docker rmi app-deployment:latest
```

---

## 🔍 Dépannage

### Pipeline échoue au test unitaire
```bash
# Essayer localement
npm install
npm test

# Vérifier que Jest est bien configuré
cat jest.config.js
```

### Pipeline échoue au test E2E
```bash
# L'app peut ne pas démarrer assez vite, vérifier les logs:
npm start

# Tester manuellement
curl http://localhost:3000/health

# Vérifier Cypress en local
npm run cypress:open
```

### Docker push échoue
- Vérifier les secrets: `DOCKER_USERNAME` et `DOCKER_PASSWORD`
- Vérifier que le token Docker est valide (pas expiré)
- Vérifier les droits d'accès sur Docker Hub

### Déploiement SSH échoue
- Vérifier la clé SSH: `AZURE_SSH_KEY`
- Vérifier l'IP: `AZURE_VM_IP`
- Vérifier l'user: `AZURE_VM_USER`
- S'assurer que Docker Hub login fonctionne sur la VM

```bash
ssh -i /path/to/key azureuser@132.164.96.206
echo "password" | docker login -u username --password-stdin
```

---

## 📈 Monitoring et Logs

### Logs du workflow GitHub
```
Repository → Actions → Cliquer sur le workflow → Voir les logs de chaque job
```

### Logs de la VM Azure
```bash
ssh -i ~/.ssh/azure_key azureuser@132.164.96.206
docker logs myapp
docker ps -a
```

### Vérifier l'application en ligne
```bash
curl -v http://132.164.96.206:3000/health
curl http://132.164.96.206:3000/api/tasks
```

---

## 🎯 Choix Techniques

| Composant | Choix | Raison |
|-----------|-------|--------|
| **Language** | Node.js 18 | Léger, rapide, parfait pour démos |
| **Framework** | Express | Minimaliste, performant, simple |
| **Tests Unitaires** | Jest | Standard facto JavaScript, simple |
| **Tests E2E** | Cypress | Intuitif, fiable, rapide |
| **Container** | Docker multi-stage | Léger (alpine), optimisé |
| **Orche. Local** | Docker Compose | Facilité pour dev local |
| **CI/CD** | GitHub Actions | Intégré à GitHub, gratuit, puissant |
| **Déploiement** | SSH + Docker | Contrôle complet, idempotent, simple |

---

## 📝 Ensemble de Délivérable

✅ Application fonctionnelle (Express API CRUD)
✅ Tests unitaires (Jest) - exécutables en CI
✅ Tests E2E complets (Cypress) - exécutables en CI
✅ Dockerfile optimisé et sécurisé
✅ Docker Compose pour dev local
✅ Workflow GitHub Actions complet
✅ Déploiement automatique sur VM Azure
✅ Health check et vérification endpoints
✅ Déploiement idempotent et production-ready
✅ Ces secrets gérés via GitHub Secrets
✅ README documenté
✅ Application accessible via IP publique Azure

---

## 🔗 Ressources Utiles

- [Node.js Docs](https://nodejs.org/docs)
- [Express.js](https://expressjs.com/)
- [Jest Documentation](https://jestjs.io/)
- [Cypress Documentation](https://docs.cypress.io/)
- [Docker Documentation](https://docs.docker.com/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Azure VM Setup](https://learn.microsoft.com/en-us/azure/)

---

## 📄 License

MIT

---

**Créé pour démontrer une pipeline CI/CD professionnelle et entièrement automatisée.**
