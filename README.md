# 🤖 Couz-ia E-Boutique IA & Telegram Bot 🚀

[![GitHub Pages](https://img.shields.io/badge/Boutique%20Web-Acc%C3%A9der-blue?style=for-the-badge&logo=github)](https://ia-local.github.io/shop/) [![Telegram Bot](https://img.shields.io/badge/Bot%20Telegram-Discuter-blue?style=for-the-badge&logo=telegram)](https://t.me/meta_Pibot/todo_list) ## 🚀 Description du Projet

Ce projet combine une solution d'e-boutique légère déployée sur GitHub Pages avec un bot Telegram interactif. L'objectif est d'offrir une plateforme de gestion de produits et d'interaction client, enrichie par des fonctionnalités d'Intelligence Artificielle (IA) pour la génération de contenu et la conversation.

Le backend (serveur Node.js) gère une API REST pour les produits et les clients, et intègre un bot Telegram `Telegraf` propulsé par Groq pour les conversations IA et les interactions de commande. Le frontend (situé dans le dossier `docs/`) est une interface web simple pour la boutique, hébergée sur GitHub Pages. Le serveur intègre également un chatbot interactif directement dans le terminal pour les tests et interactions rapides.

### Fonctionnalités Clés :

* **E-Boutique statique sur GitHub Pages :**
    * Affichage des produits avec détails et stock.
    * Interface simple et responsive pour une bonne expérience utilisateur sur tous les appareils.
* **API RESTful :**
    * Gestion des produits (CRUD : Créer, Lire, Mettre à jour, Supprimer le stock).
    * Gestion des clients (CRUD basique en mémoire).
    * **Génération de contenu IA :** L'IA (Groq) peut générer des descriptions de produits et des plans d'affaires via des requêtes API dédiées.
* **Bot Telegram interactif (`@Worker_ia_Pibot`) :**
    * **Menu interactif via boutons inline :** Accès facile aux produits, informations sur l'IA, aide, et lien direct vers la boutique web.
    * **Conversation IA :** Le bot utilise un modèle de langage (actuellement `gemma-2-9b-it`) et un **rôle d'assistant métier** pour répondre aux questions des utilisateurs de manière pertinente et responsable, en se concentrant sur les informations de l'e-boutique.
    * **Gestion des articles :** Commande `/updatedb` pour rafraîchir les articles de la boutique avec de nouvelles données aléatoires.
    * **Communication de groupe :** Commande `/send_topic` pour envoyer des messages à un groupe Telegram désigné, utile pour le support ou les notifications.
* **Chatbot Terminal Interactif :**
    * Une interface de conversation basée sur Groq directement dans votre terminal, utile pour le débogage et les tests rapides de l'IA avec un **rôle de système général**.
* **Architecture modulaire :** Séparation claire entre le frontend, le backend et les différentes instances d'IA (Telegram et Terminal).

## 🛠️ Technologies Utilisées

* **Backend :** Node.js, Express.js
* **Base de Données (Locale) :** Fichier `db_article.json` (JSON pour les produits)
* **Bot Telegram :** `telegraf.js`
* **Intelligence Artificielle :** Groq API (modèles `llama3-8b-8192`, `gemma-2-9b-it`)
* **Frontend :** HTML, CSS, JavaScript
* **Hébergement Frontend :** GitHub Pages
* **Gestion de dépendances :** `npm`
* **Variables d'environnement :** `dotenv`
* **CORS :** `cors`

## ⚙️ Installation et Démarrage

Suivez ces étapes pour configurer et exécuter le projet localement.

### Prérequis

* [Node.js](https://nodejs.org/en/download/) (version 16 ou supérieure recommandée)
* `npm` (normalement inclus avec Node.js)
* Un compte Telegram et un bot créé via [@BotFather](https://t.me/botfather).
* Une clé API Groq (disponible sur [Groq Console](https://console.groq.com/)).

### Étapes d'installation

1.  **Clonez le dépôt :**
    ```bash
    git clone [https://github.com/](https://github.com/)<votre_utilisateur>/<votre_repo>.git
    cd <votre_repo>
    ```
    *(Remplacez `<votre_utilisateur>` et `<votre_repo>` par les informations réelles de votre dépôt.)*

2.  **Installez les dépendances :**
    ```bash
    npm install
    ```

3.  **Configurez les variables d'environnement :**
    Créez un fichier `.env` à la racine du projet et ajoutez-y les informations suivantes :
    ```dotenv
    TELEGRAM_BOT_TOKEN=VOTRE_TOKEN_BOT_TELEGRAM
    GROQ_API_KEY=VOTRE_CLE_API_GROQ
    PORT=3000
    TARGET_TELEGRAM_GROUP_ID=-1001234567890 # REMPLACEZ PAR L'ID DE VOTRE GROUPE
    ```
    * Remplacez `VOTRE_TOKEN_BOT_TELEGRAM` par le token obtenu via BotFather.
    * Remplacez `VOTRE_CLE_API_GROQ` par votre clé API Groq.
    * `TARGET_TELEGRAM_GROUP_ID` : L'ID numérique de votre groupe Telegram où le bot doit envoyer des messages (souvent négatif, ex: `-1001234567890`). Pour l'obtenir, ajoutez le bot au groupe et utilisez un bot comme [@RawDataBot](https://t.me/RawDataBot) pour voir l'ID du chat.

4.  **Structure des fichiers de rôles IA :**
    Assurez-vous d'avoir un dossier `role/` à la racine de votre projet, contenant les fichiers JSON suivants :
    * `role/roles-system.json` : Définit le rôle général de l'IA (utilisé pour le chatbot terminal).
        ```json
        {
          "system": {
            "content": "You are a helpful general assistant for an e-commerce store."
          }
        }
        ```
    * `role/roles-assistant.json` : Définit le rôle spécifique de l'assistant métier (utilisé pour le bot Telegram).
        ```json
        {
          "assistant": {
            "content": "You are a specialized e-commerce assistant, focused on sales, customer support, and product information."
          }
        }
        ```
    * `role/roles-user.json` : Définit le rôle de l'utilisateur (peut être utilisé pour structurer les conversations).
        ```json
        {
          "user": {
            "content": "I am a customer Browse your store."
          }
        }
        ```

5.  **Structure des fichiers statiques du Frontend :**
    Assurez-vous que votre dossier `docs/` contient les fichiers `index.html`, `shop.html`, `contact.html`, `outils-ia.html`, `dashboard.html`, `style.css`, `card.css`, ainsi que le fichier `db_article.json` pour la base de données locale des produits.

6.  **Démarrez le serveur :**
    ```bash
    node serveur.js
    ```
    Le serveur Express démarrera sur `http://localhost:3000`. Le bot Telegram sera lancé (si le token est configuré) et le **chatbot terminal** démarrera automatiquement dans la même fenêtre de console.

## 🚀 Utilisation

### Accéder à l'E-Boutique (Frontend)

* **Localement :** Ouvrez votre navigateur et naviguez vers `http://localhost:3000/shop.html`.
* **Sur GitHub Pages :** Une fois déployé, votre boutique sera accessible à `https://votre_utilisateur.github.io/votre_repo/shop.html`.

### Interagir avec le Bot Telegram

Recherchez votre bot par son nom d'utilisateur (celui que vous avez défini via BotFather, ex: `@Worker_ia_Pibot`) dans Telegram et démarrez une conversation.

**Commandes Bot:**

* `/start` : Lance le bot et affiche le menu interactif avec les boutons.
* `/shop` : Affiche la liste des produits disponibles.
* `/updatedb` : (Commande administrateur) Met à jour la base de données des produits avec de nouveaux articles dynamiques.
* `/aboutai` : Fournit des informations sur l'intégration de l'IA.
* `/help` : Affiche la liste de toutes les commandes disponibles.
* `/send_topic [votre sujet]` : Envoie un message avec la thématique spécifiée au groupe Telegram configuré (`TARGET_TELEGRAM_GROUP_ID`).
* **Boutons du menu `/start` (via inline keyboard) :**
    * **🛒 Voir les produits** : Affiche la liste des produits (équivalent à `/shop`).
    * **🌐 Visiter la Boutique Web** : Ouvre votre page `shop.html` hébergée sur GitHub Pages.
    * **🤖 À propos de l'IA** : Fournit des informations sur l'IA (équivalent à `/aboutai`).
    * **❓ Aide & Commandes** : Affiche le message d'aide (équivalent à `/help`).
    * **🚀 Ouvrir le Dashboard** : Ouvre la Web App (`dashboard.html`) directement dans Telegram (si configuré via BotFather).

### Interagir avec le Chatbot Terminal

Après le démarrage du serveur, le chatbot terminal s'activera automatiquement dans votre console.

* Tapez votre message après le prompt `Vous: ` et appuyez sur `Entrée`.
* Pour quitter le chatbot et arrêter le serveur, appuyez sur `Ctrl+C`.

### API Backend

Vous pouvez interagir avec l'API RESTful via `http://localhost:3000/api/...` (ou l'URL de votre serveur déployé).

* `GET /api/products` : Récupère tous les produits.
* `POST /api/products` : Ajoute un nouveau produit (nécessite un corps JSON).
* `PUT /api/products/:id` : Met à jour un produit existant (nécessite un corps JSON).
* `PATCH /api/products/:id/stock` : Met à jour le stock d'un produit (nécessite un corps JSON `{"stock": N}`).
* `DELETE /api/products/:id` : Supprime un produit.
* `GET /api/customers` : Récupère tous les clients.
* `POST /api/customers` : Ajoute un nouveau client (nécessite un corps JSON).
* `POST /api/generate-product-description` : Génère une description de produit via l'IA (nécessite `{ "productName": "...", "productFeatures": "..." }`).
* `POST /api/generate-business-plan` : Génère un plan d'affaires via l'IA (nécessite `{ "companyName": "...", "industry": "...", "productOrService": "..." }`).

## ☁️ Déploiement

### Déploiement du Frontend (GitHub Pages)

Votre dossier `docs/` est configuré pour être déployé en tant que GitHub Pages.

1.  Assurez-vous que tous vos fichiers frontend (HTML, CSS, JS, `db_article.json`) sont dans le dossier `docs/`.
2.  Allez dans les **Settings** de votre dépôt GitHub.
3.  Cliquez sur **Pages** dans la barre latérale gauche.
4.  Sous "Build and deployment", sélectionnez la source **Deploy from a branch**.
5.  Choisissez votre branche principale (généralement `main` ou `master`) et le dossier `/docs`.
6.  Cliquez sur **Save**.
7.  GitHub Pages construira et déploiera automatiquement votre site. L'URL sera affichée dans cette même section.

### Déploiement du Backend (Node.js/Express)

Le backend Node.js (`serveur.js`) doit être déployé sur un serveur capable d'exécuter des applications Node.js, tel que :

* **Heroku**
* **Render**
* **Vercel** (uniquement si vous adaptez pour une architecture serverless)
* Un **VPS** (Virtual Private Server)

Assurez-vous que vos variables d'environnement (`TELEGRAM_BOT_TOKEN`, `GROQ_API_KEY`, `PORT`, `TARGET_TELEGRAM_GROUP_ID`) sont correctement configurées sur votre plateforme d'hébergement.

### Configuration de la Web App (si utilisée)

Si vous utilisez la fonctionnalité Web App Telegram (comme le bouton "Ouvrir le Dashboard") :

1.  Assurez-vous que l'URL de votre `dashboard.html` (ou autre page de Web App) est accessible via GitHub Pages après déploiement.
2.  Allez sur [@BotFather](https://t.me/botfather) dans Telegram.
3.  Sélectionnez votre bot, puis **Bot Settings > Menu button > Configure web app URL**.
4.  Entrez l'URL exacte de votre Web App (ex: `https://votre_utilisateur.github.io/votre_repo/dashboard.html`).

## 🤝 Contribution

Les contributions sont les bienvenues ! Si vous souhaitez améliorer ce projet, veuillez suivre ces étapes :

1.  Forkez ce dépôt.
2.  Créez une nouvelle branche pour votre fonctionnalité (`git checkout -b feature/nouvelle-fonctionnalite`).
3.  Effectuez vos modifications et testez-les.
4.  Commitez vos changements (`git commit -m 'feat: ajoute une nouvelle fonctionnalité'`).
5.  Poussez votre branche (`git push origin feature/nouvelle-fonctionnalite`).
6.  Ouvrez une Pull Request.

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Contact

Pour toute question ou information, n'hésitez pas à contacter :

* **Votre Nom/Alias :** <Votre Nom>
* **GitHub :** [@<votre_utilisateur>](https://github.com/<votre_utilisateur>)
* **Email :** <votre_email@example.com>

---# Les-Douceurs--De-Dobs
