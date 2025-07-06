const { Telegraf, Markup } = require('telegraf');
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

// Ajout d'Inquirer.js
const inquirer = require('inquirer');

// --- Configuration du Serveur Express ---
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware pour parser le JSON des requêtes HTTP
app.use(bodyParser.json());

// --- Configuration CORS pour permettre les requêtes depuis GitHub Pages ---
const corsOptions = {
    origin: 'http://localhost:3000', // Pour le développement local
    // EN PRODUCTION, DÉCOMMENTEZ ET REMPLACEZ PAR VOTRE URL GITHUB PAGES :
    // origin: 'https://votre_utilisateur.github.io', // Exemple pour un repo racine
    // origin: 'https://votre_utilisateur.github.io/votre_repo', // Exemple pour un repo non-racine
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204
};
app.use(cors(corsOptions));

// Servir les fichiers statiques depuis le répertoire 'docs'
app.use(express.static('docs'));
console.log('Serving static files from docs/');

// --- Configuration du Fichier de Données pour les Produits (db_article.json) ---
const PRODUCTS_FILE = 'docs/db_article.json';

// Fonction utilitaire pour lire les données des produits
async function readProductsData() {
    try {
        if (!fs.existsSync(PRODUCTS_FILE)) {
            console.warn(`File ${PRODUCTS_FILE} not found. Creating with empty array.`);
            await fs.promises.writeFile(PRODUCTS_FILE, '[]', 'utf8');
            return [];
        }
        const data = await fs.promises.readFile(PRODUCTS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading products data:', error);
        return [];
    }
}

// Fonction utilitaire pour écrire les données des produits
async function writeProductsData(data) {
    try {
        await fs.promises.writeFile(PRODUCTS_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error('Error writing products data:', error);
    }
}

// --- Fonctions pour la génération dynamique d'articles ---
function generateRandomProduct(index) {
    const categories = ['Tech', 'Maison', 'Bureau', 'Sport', 'Bien-être', 'Santé', 'Éducation', 'Divertissement', 'Sécurité', 'Mode'];
    const adjs = ['Innovant', 'Intelligent', 'Écologique', 'Portable', 'Connecté', 'Intuitif', 'Performant', 'Élégant', 'Robuste', 'Compact'];
    const nouns = ['Assistant', 'Capteur', 'Kit', 'Module', 'Solution', 'Dispositif', 'Système', 'Plateforme', 'Robot', 'Logiciel'];

    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const randomAdj = adjs[Math.floor(Math.random() * adjs.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];

    const productName = `${randomAdj} ${randomNoun} ${randomCategory} ${index + 1}`;
    const productDescription = `Découvrez notre ${randomNoun} ${randomAdj}, une solution avancée pour optimiser votre quotidien dans le domaine de ${randomCategory.toLowerCase()}. Conçu pour la performance et la simplicité, il intègre une IA de pointe pour une expérience utilisateur sans précédent.`;

    return {
        id: `prod-${Date.now()}-${index}`,
        name: productName,
        description: productDescription,
        price: parseFloat((Math.random() * 100 + 20).toFixed(2)),
        imageUrl: `https://via.placeholder.com/300x200?text=${encodeURIComponent(productName.substring(0,20))}`,
        stock: Math.floor(Math.random() * 50) + 1
    };
}

async function updateArticlesDynamically() {
    const newArticles = [];
    for (let i = 0; i < 10; i++) {
        newArticles.push(generateRandomProduct(i));
    }
    await writeProductsData(newArticles);
    console.log('Database updated with 10 new dynamic articles.');
    return newArticles;
}


// --- Routes API pour la Gestion des Produits (avec Stock) ---

app.get('/api/products', async (req, res) => {
    const products = await readProductsData();
    res.json(products);
});

app.post('/api/products', async (req, res) => {
    const { name, description, price, imageUrl, stock } = req.body;
    if (!name || !price) {
        return res.status(400).json({ error: 'Le nom et le prix du produit sont requis.' });
    }

    const products = await readProductsData();
    const newProduct = {
        id: `prod-${Date.now()}`,
        name,
        description: description || '',
        price: parseFloat(price),
        imageUrl: imageUrl || '',
        stock: parseInt(stock) >= 0 ? parseInt(stock) : 0
    };
    products.push(newProduct);
    await writeProductsData(products);
    res.status(201).json(newProduct);
});

app.put('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description, price, imageUrl, stock } = req.body;
    let products = await readProductsData();
    const productIndex = products.findIndex(p => p.id === id);

    if (productIndex === -1) {
        return res.status(404).json({ error: 'Produit non trouvé.' });
    }

    if (name) products[productIndex].name = name;
    if (description !== undefined) products[productIndex].description = description;
    if (price !== undefined) products[productIndex].price = parseFloat(price);
    if (imageUrl !== undefined) products[productIndex].imageUrl = imageUrl;
    if (stock !== undefined) products[productIndex].stock = parseInt(stock) >= 0 ? parseInt(stock) : products[productIndex].stock;

    await writeProductsData(products);
    res.json(products[productIndex]);
});

app.patch('/api/products/:id/stock', async (req, res) => {
    const { id } = req.params;
    const { stock } = req.body;

    if (stock === undefined || parseInt(stock) < 0) {
        return res.status(400).json({ error: 'Le stock doit être un nombre positif.' });
    }

    let products = await readProductsData();
    const productIndex = products.findIndex(p => p.id === id);

    if (productIndex === -1) {
        return res.status(404).json({ error: 'Produit non trouvé.' });
    }

    products[productIndex].stock = parseInt(stock);
    await writeProductsData(products);
    res.json(products[productIndex]);
});

app.delete('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    let products = await readProductsData();
    const initialLength = products.length;
    products = products.filter(p => p.id !== id);

    if (products.length === initialLength) {
        return res.status(404).json({ error: 'Produit non trouvé.' });
    }

    await writeProductsData(products);
    res.status(204).send();
});


// --- Données et Routes pour les Clients (restent en mémoire pour cet exemple) ---
let customers = [
    { id: 'cust-1', name: 'Alice Dubois', email: 'alice.d@example.com', phone: '0612345678' },
    { id: 'cust-2', name: 'Bob Martin', email: 'bob.m@example.com', phone: '0787654321' }
];

app.get('/api/customers', (req, res) => {
    res.json(customers);
});

app.post('/api/customers', (req, res) => {
    const { name, email, phone } = req.body;
    if (!name || !email) {
        return res.status(400).json({ error: 'Le nom et l\'email du client sont requis.' });
    }
    const newCustomer = { id: `cust-${Date.now()}`, name, email, phone: phone || '' };
    customers.push(newCustomer);
    res.status(201).json(newCustomer);
});


// --- Configuration du Bot Telegram ---
const bot = new Telegraf('7097263805:AAHBgLY4BvfkpYFyLkA5u1G6hYd4XF2xFe0', {
    telegram: {
      webhookReply: true,
    },
  });

// REMPLACEZ CETTE VALEUR PAR L'ID NUMÉRIQUE DE VOTRE GROUPE TELEGRAM !
// Pour l'obtenir, ajoutez le bot au groupe, envoyez un message, puis utilisez un bot comme @RawDataBot pour voir l'ID du chat (c'est souvent un nombre négatif).
const TARGET_TELEGRAM_GROUP_ID = '-1001234567890'; // <-- Exemple, changez-le !

const botsNetwork = {
    workerPibot: {
        processBackend: async (task) => {
            console.log("Processing backend task in @worker_Pibot:", task);
            return `@worker_Pibot a exécuté la tâche backend: ${task}`;
        }
    },
    neofsPibot: {
        processFrontend: async (uiTask) => {
            console.log("Processing UI/UX task in @neofs_Pibot:", uiTask);
            return `@neofs_Pibot a généré une nouvelle interface pour la tâche: ${uiTask}`;
        }
    },
    piIaBot: {
        processVisualAnalysis: async (input) => {
            console.log("Processing visual analysis in @Pi-ia_bot:", input);
            const imageUrl = await generateImage(input);
            return `@Pi-ia_bot a analysé l'image et voici le résultat : ${imageUrl}`;
        }
    }
};

const card = "update";

// Fonction pour échapper les caractères HTML spéciaux
function escapeHtmlCharacters(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// --- Fonctions de génération de contenu via Groq ---
async function generateCardContent(prompt) {
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: "Tu es un assistant IA spécialisé dans la génération de contenu pour des fiches produits et des cartes d'informations. Ton objectif est de produire des descriptions claires, concises et informatives, en veillant à la précision des informations pour le bénéfice de nos clients." },
                { role: 'user', content: prompt },
            ],
            model: 'llama-3.1-8b-instant', // Peut être changé pour 'llama3-70b-8192' pour des tâches plus complexes
            temperature: 0.7,
            max_tokens: 1024,
        });
        return chatCompletion.choices[0].message.content;
    } catch (error) {
        console.error('Failed to generate card content with Groq:', error);
        return 'Une erreur est survenue lors de la génération de contenu IA.';
    }
}

// Nouvelle fonction générique pour l'interaction chatbot CLI (utilise gemma2-9b-it)
async function getGroqChatResponse(prompt, model = 'gemma2-9b-it', systemMessage = "Tu es un assistant IA convivial et utile, prêt à répondre aux questions des clients et à les guider. Tu es spécialisé dans l'information sur les produits, la boutique, et le support général. Réponds de manière concise et amicale.") {
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemMessage },
                { role: 'user', content: prompt },
            ],
            model: model,
            temperature: 0.7,
            max_tokens: 4048,
        });
        return chatCompletion.choices[0].message.content;
    } catch (error) {
        console.error(`Failed to generate chat completion with ${model}:`, error);
        return 'Désolé, je ne peux pas traiter votre demande pour le moment.';
    }
}


// Routes API pour les outils IA
app.post('/api/generate-product-description', async (req, res) => {
    const { productName, productDetails } = req.body;
    if (!productName) {
        return res.status(400).json({ error: 'Le nom du produit est requis pour la description IA.' });
    }
    const prompt = `Génère une description de produit détaillée pour "${productName}". Détails additionnels : ${productDetails || 'Aucun.'}. Format: Description de 3-4 phrases, incluant 3 points clés, et 2 phrases sur les avantages.`;
    const description = await generateCardContent(prompt);
    res.json({ description });
});

app.post('/api/generate-business-plan', async (req, res) => {
    const { projectDetails } = req.body;
    if (!projectDetails) {
        return res.status(400).json({ error: 'Les détails du projet sont requis pour le business plan IA.' });
    }
    const prompt = `Crée un plan d'affaires concis basé sur les détails suivants: "${projectDetails}". Le plan doit inclure: un résumé, une analyse du marché, un plan de marketing, et une section financière (très brève). Format: en 5-7 paragraphes, clair et structuré.`;
    const content = await generateCardContent(prompt);
    res.json({ content });
});

// --- Commandes Telegram simplifiées et normalisées BotFather ---

// Commande /start améliorée avec des boutons inline
bot.start(async (ctx) => {
    await ctx.reply(
        'Bienvenue sur Couz-ia Bot ! Je peux vous aider à gérer votre boutique et interagir avec nos services IA. Choisissez une option ci-dessous :',
        Markup.inlineKeyboard([
            // Ligne 1 de boutons
            [Markup.button.callback('🛍️ Voir les produits', 'show_products'), Markup.button.url('🌐 Visiter la Boutique Web', 'https://votre_utilisateur.github.io/votre_repo/shop.html')],
            // Ligne 2 de boutons
            [Markup.button.callback('🧠 À propos de l\'IA', 'about_ai'), Markup.button.callback('❓ Aide & Commandes', 'show_help')],
            // Exemple de bouton pour une Web App (Mini-App) - remplacez l'URL et configurez via BotFather
            // Décommenter si vous avez une Web App configurée
            // [Markup.button.webApp('🚀 Ouvrir le Dashboard', 'https://votre_utilisateur.github.io/votre_repo/dashboard.html')]
        ])
    );
});

// Gestionnaire pour le callback 'show_products' (logique de l'ancienne commande /shop)
bot.action('show_products', async (ctx) => {
    // Supprime le clavier inline du message précédent pour nettoyer l'interface
    if (ctx.callbackQuery && ctx.callbackQuery.message && ctx.callbackQuery.message.reply_markup) {
        await ctx.editMessageReplyMarkup({});
    }
    const products = await readProductsData();
    if (products.length === 0) {
        return ctx.reply('Aucun produit disponible pour le moment. Un administrateur peut utiliser /updatedb pour en ajouter.');
    }
    const productList = products.map(p => `- ${escapeHtmlCharacters(p.name)} (${p.price}€) - Stock: ${p.stock}`).join('\n');
    await ctx.reply(`🛍️ Voici nos produits actuels :\n${productList}`, { parse_mode: 'HTML' });
});

// Gestionnaire pour le callback 'about_ai' (logique de l'ancienne commande /aboutai)
bot.action('about_ai', async (ctx) => {
    // Supprime le clavier inline du message précédent
    if (ctx.callbackQuery && ctx.callbackQuery.message && ctx.callbackQuery.message.reply_markup) {
        await ctx.editMessageReplyMarkup({});
    }
    await ctx.reply('🧠 <b>Couz-ia AI</b> est au cœur de notre boutique, offrant des fonctionnalités intelligentes comme la génération de descriptions de produits, l\'analyse de données et l\'optimisation de la gestion des stocks. Nous utilisons des modèles de langage avancés pour rendre votre expérience plus fluide et efficace.', { parse_mode: 'HTML' });
});

// Gestionnaire pour le callback 'show_help' (logique de l'ancienne commande /help)
bot.action('show_help', async (ctx) => {
    // Supprime le clavier inline du message précédent
    if (ctx.callbackQuery && ctx.callbackQuery.message && ctx.callbackQuery.message.reply_markup) {
        await ctx.editMessageReplyMarkup({});
    }
    const products = await readProductsData();
    const topicsList = products.slice(0, 10).map((p, index) => {
        const escapedName = escapeHtmlCharacters(p.name);
        return `${index + 1}. ${escapedName}`;
    }).join('\n');

    const helpMessage = `
Voici les commandes disponibles :

- /start - Message de bienvenue et menu interactif
- /shop - Voir la liste des produits (peut être aussi via le bouton)
- /updatedb - Mettre à jour la base de données des produits (Admin)
- /aboutai - En savoir plus sur l'IA Couz-ia (peut être aussi via le bouton)
- /help - Afficher ce message d'aide
- /send_topic [votre sujet] - Envoyer une thématique au groupe désigné

---

<b>Top 10 Thématiques Actuelles :</b>
${topicsList || 'Aucune thématique disponible.'}
`;
    await ctx.reply(helpMessage, { parse_mode: 'HTML' });
});


// Commande /shop (maintenue pour un accès direct si souhaité)
bot.command('shop', async (ctx) => {
    const products = await readProductsData();
    if (products.length === 0) {
        return ctx.reply('Aucun produit disponible pour le moment. Un administrateur peut utiliser /updatedb pour en ajouter.');
    }
    const productList = products.map(p => `- ${escapeHtmlCharacters(p.name)} (${p.price}€) - Stock: ${p.stock}`).join('\n');
    await ctx.reply(`🛍️ Voici nos produits actuels :\n${productList}`, { parse_mode: 'HTML' });
});

// Commande /updatedb
bot.command('updatedb', async (ctx) => {
    await ctx.reply('🔄 Mise à jour des articles en cours... Cela peut prendre un moment.');
    try {
        const newArticles = await updateArticlesDynamically();
        const articleNames = newArticles.map(a => escapeHtmlCharacters(a.name)).join(', ');
        await ctx.reply(`✅ Base de données mise à jour avec 10 nouveaux articles dynamiques : ${articleNames}.`);
        await ctx.reply('N\'oubliez pas de rafraîchir la page de la boutique sur le site web pour voir les changements !');
    } catch (error) {
        console.error('Erreur lors de la mise à jour des articles via Telegram:', error);
        await ctx.reply('❌ Désolé, une erreur est survenue lors de la mise à jour des articles.');
    }
});

// Commande /aboutai (maintenue pour un accès direct si souhaité)
bot.command('aboutai', async (ctx) => {
    await ctx.reply('🧠 <b>Couz-ia AI</b> est au cœur de notre boutique, offrant des fonctionnalités intelligentes comme la génération de descriptions de produits, l\'analyse de données et l\'optimisation de la gestion des stocks. Nous utilisons des modèles de langage avancés pour rendre votre expérience plus fluide et efficace.', { parse_mode: 'HTML' });
});

// Commande /send_topic
bot.command('send_topic', async (ctx) => {
    const input = ctx.message.text;
    const topic = input.substring('/send_topic '.length).trim(); // Récupère le texte après la commande

    if (!topic) {
        await ctx.reply('Veuillez fournir un sujet ou une thématique à envoyer. Exemple : <code>/send_topic Nouvel article de blog sur l\'IA</code>', { parse_mode: 'HTML' });
        return;
    }

    try {
        const messageToSend = `<b>Nouvelle Thématique pour le Groupe :</b>\n\n${escapeHtmlCharacters(topic)}`;
        await bot.telegram.sendMessage(TARGET_TELEGRAM_GROUP_ID, messageToSend, { parse_mode: 'HTML' });
        await ctx.reply(`✅ Votre thématique a été envoyée au groupe : "${escapeHtmlCharacters(topic)}"`, { parse_mode: 'HTML' });
    } catch (error) {
        console.error('Erreur lors de l\'envoi de la thématique au groupe:', error);
        await ctx.reply('❌ Désolé, une erreur est survenue lors de l\'envoi de la thématique au groupe. Assurez-vous que l\'ID du groupe est correct et que le bot y est.');
    }
});

// Commande /help (maintenue mais son contenu est aussi accessible via le bouton 'Aide & Commandes')
bot.command('help', async (ctx) => {
    const products = await readProductsData();
    const topicsList = products.slice(0, 10).map((p, index) => {
        const escapedName = escapeHtmlCharacters(p.name);
        return `${index + 1}. ${escapedName}`;
    }).join('\n');

    const helpMessage = `
Voici les commandes disponibles :

- /start - Message de bienvenue et menu interactif
- /shop - Voir la liste des produits
- /updatedb - Mettre à jour la base de données des produits (Admin)
- /aboutai - En savoir plus sur l'IA Couz-ia
- /help - Afficher ce message d'aide
- /send_topic [votre sujet] - Envoyer une thématique au groupe désigné

---

<b>Top 10 Thématiques Actuelles :</b>
${topicsList || 'Aucune thématique disponible.'}
`;
    await ctx.reply(helpMessage, { parse_mode: 'HTML' });
});


// --- Gestion des messages texte pour le bot Telegram (conversations IA) ---
bot.on('text', async (ctx) => {
    const userInput = ctx.message.text;

    // Ignorer les commandes pour ne pas les traiter comme des messages IA
    if (userInput.startsWith('/')) {
        return;
    }

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                // MODIFICATION ICI : Instructions pour l'IA responsable, clients, NLP et Web Sémantique
                { role: 'system', content: `Tu es une Intelligence Artificielle Générale au cœur de notre boutique 🏪. En tant qu'IA responsable, tu interagis avec les clients et gères les opérations de la boutique. Tu maîtrises le traitement du langage naturel (NLP) et les normes du Web sémantique (W3C) pour comprendre au mieux les requêtes, fournir des informations précises et pertinentes, et assurer une expérience client positive et éthique. Tu es dédiée à la satisfaction client et au bon fonctionnement de la boutique en ligne.` },
                { role: 'user', content: userInput },
            ],
            model: 'gemma2-9b-it', // GEMMA2-9B-IT APPLIQUÉ ICI !
            temperature: 0.7,
            max_tokens: 4048,
        });

        await ctx.reply(chatCompletion.choices[0].message.content);
    } catch (error) {
        console.error('Failed to generate chat completion (Telegram) with gemma2-9b-it:', error);
        await ctx.reply('Une erreur est survenue lors du traitement de votre demande de conversation IA.');
    }
});


// --- Lancement des serveurs et de l'interface CLI ---

// Fonction d'ASCII Art pour représenter le mobile-first responsive UI
function logMobileUIArt(context = 'main') {
    switch(context) {
        case 'main':
            console.log(`\n`);
            console.log(`✨          ╔═══════════════════════════════╗            ✨`);
            console.log(`✨          ║ ╭───────────────────────────╮ ║            ✨`);
            console.log(`✨          ║ │███████████████████████████│ ║            ✨`);
            console.log(`✨          ║ │                           │ ║            ✨`);
            console.log(`✨          ║ │   Bienvenue dans le CLI   │ ║            ✨`);
            console.log(`✨          ║ │   d'administration de la  │ ║            ✨`);
            console.log(`✨          ║ │       Boutique IA !       │ ║            ✨`);
            console.log(`✨          ║ │                           │ ║            ✨`);
            console.log(`✨          ║ │███████████████████████████│ ║            ✨`);
            console.log(`✨          ║ ╰───────────────────────────╯ ║            ✨`);
            console.log(`✨          ╠═══════════════════════════════╣            ✨`);
            console.log(`✨          ║ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ║            ✨`);
            console.log(`✨          ║ │ H │ │ S │ │ C │ │ T │ │ A │ ║            ✨`);
            console.log(`✨          ║ └───┘ └───┘ └───┘ └───┘ └───┘ ║            ✨`);
            console.log(`✨          ╚═══════════════════════════════╝            ✨`);
            console.log(`✨`);
            console.log(`✨   (H: Accueil, S: Boutique, C: Contact, T: Outils IA, A: Admin)`);
            break;
        case 'console': // Correction ici : le cas "console" pour l'affichage de l'ASCII Art
            console.log(`\n`);
            console.log(`✨          ╔═══════════════════════════════╗            ✨`);
            console.log(`✨          ║ ╭───────────────────────────╮ ║            ✨`);
            console.log(`✨          ║ │███████████████████████████│ ║            ✨`);
            console.log(`✨          ║ │                           │ ║            ✨`);
            console.log(`✨          ║ │    🤖 Assistant Chatbot   │ ║            ✨`);
            console.log(`✨          ║ │          en ligne         │ ║            ✨`);
            console.log(`✨          ║ │                           │ ║            ✨`);
            console.log(`✨          ║ │███████████████████████████│ ║            ✨`);
            console.log(`✨          ║ ╰───────────────────────────╯ ║            ✨`);
            console.log(`✨          ╠═══════════════════════════════╣            ✨`);
            console.log(`✨          ║ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ║            ✨`);
            console.log(`✨          ║ │ I │ │ C │ │ P │ │ T │ │ A │ ║            ✨`);
            console.log(`✨          ║ └───┘ └───┘ └───┘ └───┘ └───┘ ║            ✨`);
            console.log(`✨          ╚═══════════════════════════════╝            ✨`);
            console.log(`✨`);
            console.log(`✨ (I: Info, C: Commande, P: Produit, T: Support Technique, A: Autre)`);
            break;
        case 'products':
            console.log(`\n`);
            console.log(`✨  ╔═════════════════════════╗`);
            console.log(`✨  ║    📦 Gestion Produits 📦   ║`);
            console.log(`✨  ╚═════════════════════════╝`);
            break;
        case 'customers':
            console.log(`\n`);
            console.log(`✨  ╔═════════════════════════╗`);
            console.log(`✨  ║    👥 Gestion Clients 👥    ║`);
            console.log(`✨  ╚═════════════════════════╝`);
            break;
        case 'telegram_send':
            console.log(`\n`);
            console.log(`✨  ╔═════════════════════════╗`);
            console.log(`✨  ║    💬 Envoi Telegram 💬   ║`);
            console.log(`✨  ╚═════════════════════════╝`);
            break;
        case 'update_db':
            console.log(`\n`);
            console.log(`✨  ╔═════════════════════════╗`);
            console.log(`✨  ║    🔄 Mise à Jour DB 🔄   ║`);
            console.log(`✨  ╚═════════════════════════╝`);
            break;
    }
}

// Fonction pour démarrer l'interface CLI interactive
async function startInteractiveCLI() {
    logMobileUIArt('main'); // Afficher l'ASCII Art principal au début
    console.log('\n--- Interface d\'Administration CLI ---');
    let running = true;
    while (running) {
        const { mainAction } = await inquirer.prompt([
            {
                type: 'list',
                name: 'mainAction',
                message: 'Que souhaitez-vous faire ?',
                choices: [
                    'Gestion des Produits',
                    'Gestion des Clients',
                    'Mettre à jour les articles dynamiquement (Admin)',
                    'Envoyer une thématique au groupe Telegram',
                    'Afficher l\'interface console (ASCII Art)',
                    'Parler avec l\'Assistant IA (Chatbot)', // Nouvelle option pour le chatbot
                    'Quitter l\'interface CLI'
                ]
            }
        ]);

        switch (mainAction) {
            case 'Gestion des Produits':
                await productManagementMenu();
                break;
            case 'Gestion des Clients':
                await customerManagementMenu();
                break;
            case 'Mettre à jour les articles dynamiquement (Admin)':
                logMobileUIArt('update_db');
                console.log('  > Mise à jour des articles en cours... Cela peut prendre un moment.');
                try {
                    await updateArticlesDynamically();
                    console.log('  > ✅ Base de données mise à jour avec 10 nouveaux articles.');
                    console.log('  > N\'oubliez pas de rafraîchir la page de la boutique sur le site web pour voir les changements !');
                } catch (error) {
                    console.error('  > ❌ Erreur lors de la mise à jour des articles :', error.message);
                }
                break;
            case 'Envoyer une thématique au groupe Telegram':
                logMobileUIArt('telegram_send');
                const { topic } = await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'topic',
                        message: 'Entrez la thématique à envoyer au groupe Telegram :',
                        validate: input => input.length > 0 ? true : 'La thématique ne peut pas être vide.'
                    }
                ]);
                try {
                    const messageToSend = `<b>Nouvelle Thématique pour le Groupe (via CLI) :</b>\n\n${escapeHtmlCharacters(topic)}`;
                    await bot.telegram.sendMessage(TARGET_TELEGRAM_GROUP_ID, messageToSend, { parse_mode: 'HTML' });
                    console.log(`  > ✅ Thématique "${topic}" envoyée au groupe Telegram.`);
                } catch (error) {
                    console.error('  > ❌ Erreur lors de l\'envoi au groupe Telegram :', error.message);
                    console.error('  > Assurez-vous que TARGET_TELEGRAM_GROUP_ID est correct et que le bot est dans le groupe.');
                }
                break;
            case 'Afficher l\'interface console (ASCII Art)':
                logMobileUIArt('console');
                console.log('  > Ceci est l\'interface console (ASCII Art).');
                break;
            case 'Parler avec l\'Assistant IA (Chatbot)': // Nouveau cas pour le chatbot
                await startAIChatbotCLI();
                break;
            case 'Quitter l\'interface CLI':
                running = false;
                console.log('  > Quitter l\'interface CLI. Le serveur continue de fonctionner.');
                break;
        }
        if(running) { // Only show "Back to CLI" if not quitting
            console.log('\n--- Retour au menu principal CLI ---');
        }
    }
}

async function productManagementMenu() {
    logMobileUIArt('products');
    let runningProductMenu = true;
    while(runningProductMenu) {
        const { productAction } = await inquirer.prompt([
            {
                type: 'list',
                name: 'productAction',
                message: 'Gestion des Produits - Que souhaitez-vous faire ?',
                choices: [
                    'Voir tous les produits',
                    'Ajouter un nouveau produit',
                    'Mettre à jour un produit existant',
                    'Mettre à jour le stock d\'un produit',
                    'Supprimer un produit',
                    'Retour au menu principal'
                ]
            }
        ]);

        switch (productAction) {
            case 'Voir tous les produits':
                const products = await readProductsData();
                if (products.length === 0) {
                    console.log('  > Aucun produit disponible pour le moment.');
                } else {
                    console.log('  > Liste des produits actuels :');
                    products.forEach(p => console.log(`    - [${p.id}] ${p.name} (${p.price}€) - Stock: ${p.stock}`));
                }
                break;
            case 'Ajouter un nouveau produit':
                const newProductDetails = await inquirer.prompt([
                    { name: 'name', message: 'Nom du produit:', validate: input => input.length > 0 ? true : 'Le nom ne peut pas être vide.' },
                    { name: 'description', message: 'Description du produit (optionnel):' },
                    { name: 'price', message: 'Prix du produit:', validate: input => !isNaN(parseFloat(input)) && parseFloat(input) > 0 ? true : 'Le prix doit être un nombre positif.' },
                    { name: 'imageUrl', message: 'URL de l\'image (optionnel):' },
                    { name: 'stock', message: 'Stock initial:', validate: input => !isNaN(parseInt(input)) && parseInt(input) >= 0 ? true : 'Le stock doit être un nombre positif ou nul.' }
                ]);
                try {
                    const products = await readProductsData();
                    const newProduct = {
                        id: `prod-${Date.now()}`,
                        name: newProductDetails.name,
                        description: newProductDetails.description || '',
                        price: parseFloat(newProductDetails.price),
                        imageUrl: newProductDetails.imageUrl || '',
                        stock: parseInt(newProductDetails.stock)
                    };
                    products.push(newProduct);
                    await writeProductsData(products);
                    console.log(`  > ✅ Produit "${newProduct.name}" ajouté avec succès.`);
                } catch (error) {
                    console.error('  > ❌ Erreur lors de l\'ajout du produit :', error.message);
                }
                break;
            case 'Mettre à jour un produit existant':
                const productsToUpdate = await readProductsData();
                if (productsToUpdate.length === 0) {
                    console.log('  > Aucun produit à mettre à jour.');
                    break;
                }
                const { productIdToUpdate } = await inquirer.prompt([
                    {
                        type: 'list',
                        name: 'productIdToUpdate',
                        message: 'Sélectionnez le produit à mettre à jour:',
                        choices: productsToUpdate.map(p => ({ name: `${p.name} (ID: ${p.id})`, value: p.id }))
                    }
                ]);
                const productToModify = productsToUpdate.find(p => p.id === productIdToUpdate);
                const updatedDetails = await inquirer.prompt([
                    { name: 'name', message: `Nouveau nom (${productToModify.name}):`, default: productToModify.name },
                    { name: 'description', message: `Nouvelle description (${productToModify.description}):`, default: productToModify.description },
                    { name: 'price', message: `Nouveau prix (${productToModify.price}):`, default: productToModify.price.toString(), validate: input => input === '' || (!isNaN(parseFloat(input)) && parseFloat(input) >= 0) ? true : 'Le prix doit être un nombre positif ou nul.' },
                    { name: 'imageUrl', message: `Nouvelle URL d'image (${productToModify.imageUrl}):`, default: productToModify.imageUrl },
                    { name: 'stock', message: `Nouveau stock (${productToModify.stock}):`, default: productToModify.stock.toString(), validate: input => input === '' || (!isNaN(parseInt(input)) && parseInt(input) >= 0) ? true : 'Le stock doit être un nombre positif ou nul.' }
                ]);

                try {
                    Object.assign(productToModify, updatedDetails);
                    productToModify.price = parseFloat(productToModify.price);
                    productToModify.stock = parseInt(productToModify.stock);
                    await writeProductsData(productsToUpdate);
                    console.log(`  > ✅ Produit "${productToModify.name}" mis à jour avec succès.`);
                } catch (error) {
                    console.error('  > ❌ Erreur lors de la mise à jour du produit :', error.message);
                }
                break;
            case 'Mettre à jour le stock d\'un produit':
                const productsForStock = await readProductsData();
                if (productsForStock.length === 0) {
                    console.log('  > Aucun produit pour mettre à jour le stock.');
                    break;
                }
                const { productIdForStock } = await inquirer.prompt([
                    {
                        type: 'list',
                        name: 'productIdForStock',
                        message: 'Sélectionnez le produit dont vous voulez modifier le stock:',
                        choices: productsForStock.map(p => ({ name: `${p.name} (Stock actuel: ${p.stock})`, value: p.id }))
                    }
                ]);
                const productToUpdateStock = productsForStock.find(p => p.id === productIdForStock);
                const { newStock } = await inquirer.prompt([
                    {
                        name: 'newStock',
                        message: `Nouveau stock pour "${productToUpdateStock.name}" (actuel: ${productToUpdateStock.stock}):`,
                        validate: input => !isNaN(parseInt(input)) && parseInt(input) >= 0 ? true : 'Le stock doit être un nombre positif ou nul.'
                    }
                ]);
                try {
                    productToUpdateStock.stock = parseInt(newStock);
                    await writeProductsData(productsForStock);
                    console.log(`  > ✅ Stock de "${productToUpdateStock.name}" mis à jour à ${newStock}.`);
                } catch (error) {
                    console.error('  > ❌ Erreur lors de la mise à jour du stock :', error.message);
                }
                break;
            case 'Supprimer un produit':
                const productsToDelete = await readProductsData();
                if (productsToDelete.length === 0) {
                    console.log('  > Aucun produit à supprimer.');
                    break;
                }
                const { productIdToDelete } = await inquirer.prompt([
                    {
                        type: 'list',
                        name: 'productIdToDelete',
                        message: 'Sélectionnez le produit à supprimer:',
                        choices: productsToDelete.map(p => ({ name: `${p.name} (ID: ${p.id})`, value: p.id }))
                    }
                ]);
                const { confirmDelete } = await inquirer.prompt([
                    {
                        type: 'confirm',
                        name: 'confirmDelete',
                        message: `Êtes-vous sûr de vouloir supprimer ce produit (ID: ${productIdToDelete}) ?`,
                        default: false
                    }
                ]);
                if (confirmDelete) {
                    try {
                        const filteredProducts = productsToDelete.filter(p => p.id !== productIdToDelete);
                        await writeProductsData(filteredProducts);
                        console.log(`  > ✅ Produit (ID: ${productIdToDelete}) supprimé avec succès.`);
                    } catch (error) {
                        console.error('  > ❌ Erreur lors de la suppression du produit :', error.message);
                    }
                } else {
                    console.log('  > Suppression annulée.');
                }
                break;
            case 'Retour au menu principal':
                runningProductMenu = false;
                break;
        }
        if(runningProductMenu) {
             console.log('\n--- Retour au menu de gestion des produits ---');
        }
    }
}

async function customerManagementMenu() {
    logMobileUIArt('customers');
    let runningCustomerMenu = true;
    while(runningCustomerMenu) {
        const { customerAction } = await inquirer.prompt([
            {
                type: 'list',
                name: 'customerAction',
                message: 'Gestion des Clients - Que souhaitez-vous faire ?',
                choices: [
                    'Voir tous les clients',
                    'Ajouter un nouveau client',
                    'Retour au menu principal'
                ]
            }
        ]);

        switch (customerAction) {
            case 'Voir tous les clients':
                if (customers.length === 0) {
                    console.log('  > Aucun client disponible pour le moment.');
                } else {
                    console.log('  > Liste des clients actuels :');
                    customers.forEach(c => console.log(`    - [${c.id}] ${c.name} (${c.email}) - Téléphone: ${c.phone || 'N/A'}`));
                }
                break;
            case 'Ajouter un nouveau client':
                 const newCustomerDetails = await inquirer.prompt([
                    { name: 'name', message: 'Nom du client:', validate: input => input.length > 0 ? true : 'Le nom ne peut pas être vide.' },
                    { name: 'email', message: 'Email du client:', validate: input => input.length > 0 && input.includes('@') ? true : 'Veuillez entrer une adresse email valide.' },
                    { name: 'phone', message: 'Téléphone du client (optionnel):' }
                ]);
                try {
                    const newCustomer = { id: `cust-${Date.now()}`, ...newCustomerDetails };
                    customers.push(newCustomer); // 'customers' est en mémoire pour cet exemple
                    console.log(`  > ✅ Client "${newCustomer.name}" ajouté avec succès.`);
                } catch (error) {
                    console.error('  > ❌ Erreur lors de l\'ajout du client :', error.message);
                }
                break;
            case 'Retour au menu principal':
                runningCustomerMenu = false;
                break;
        }
        if(runningCustomerMenu) {
            console.log('\n--- Retour au menu de gestion des clients ---');
        }
    }
}

// Nouvelle fonction pour le chatbot CLI
async function startAIChatbotCLI() {
    logMobileUIArt('console'); // Affiche l'ASCII Art "console" pour le chatbot
    console.log('\n--- Assistant IA (Chatbot) ---');
    console.log('Tapez votre question ou choisissez une option. Tapez "quitter" pour revenir au menu principal.');

    let runningChatbot = true;
    while(runningChatbot) {
        const { chatInput } = await inquirer.prompt([
            {
                type: 'list',
                name: 'chatInput',
                message: 'Comment puis-je vous aider ?',
                choices: [
                    '1. Informations sur les produits',
                    '2. État de ma commande',
                    '3. Support technique',
                    '4. Autres questions',
                    'Poser une question libre', // Option pour taper une question
                    'Quitter le Chatbot'
                ]
            },
            {
                type: 'input',
                name: 'freeTextInput',
                message: 'Votre question libre:',
                when: (answers) => answers.chatInput === 'Poser une question libre',
                validate: input => input.length > 0 ? true : 'Veuillez taper une question.'
            }
        ]);

        let userPrompt = '';
        if (chatInput === 'Quitter le Chatbot') {
            runningChatbot = false;
            console.log('  > Retour au menu principal CLI.');
            break;
        } else if (chatInput === 'Poser une question libre') {
            userPrompt = chatInput.freeTextInput;
        } else {
            userPrompt = chatInput; // Utilise l'option de la liste comme prompt
        }

        if (userPrompt) {
            console.log(`\n  Vous: ${userPrompt}`);
            console.log('  Assistant IA: (réponse en cours...)');
            const aiResponse = await getGroqChatResponse(userPrompt, 'gemma2-9b-it', `Tu es un assistant chatbot pour la boutique Couz-ia, conçu pour guider les clients. Tu réponds aux questions sur les produits, les commandes, le support technique et d'autres requêtes générales. Sois concis, utile et courtois. Utilise les informations de la boutique quand cela est pertinent. Si une question semble concerner des opérations sensibles ou des données personnelles, indique que tu ne peux pas y répondre directement et suggère de contacter un agent humain.`);
            console.log(`  Assistant IA: ${aiResponse}\n`);
        }
    }
}


app.listen(PORT, async () => {
    console.log(`✨ ----------------------------------------------------------->`);
    console.log(`✨`);
    console.log(`✨ E-boutique backend & API running on http://localhost:${PORT}`);
    console.log(`✨`);
    console.log(`✨ Server Telegram running ✨.Worker-ia_Pibot.`);
    console.log(`✨`);
    console.log(`✨ ----------------------------------------------------------->`);

    // Lancer le bot Telegram et ensuite l'interface CLI interactive
    if (process.env.TELEGRAM_BOT_TOKEN) {
        bot.launch().then(() => {
            console.log('Telegram bot launched! ✨ Worker-ia_Pibot.');
            startInteractiveCLI(); // Lance la CLI directement
        })
        .catch(err => {
            console.error('Failed to launch Telegram bot:', err);
            startInteractiveCLI(); // Lance la CLI même si le bot Telegram échoue
        });
    } else {
        console.warn('TELEGRAM_BOT_TOKEN n\'est pas configuré dans votre .env. Le bot Telegram ne sera pas lancé.');
        startInteractiveCLI(); // Lance la CLI si le bot Telegram n'est pas configuré
    }
});


// Gérer l'arrêt propre du bot et du serveur
process.once('SIGINT', () => {
    console.log('Stopping bot and server (SIGINT)');
    if (bot) bot.stop('SIGINT');
    process.exit(0);
});
process.once('SIGTERM', () => {
    console.log('Stopping bot and server (SIGTERM)');
    if (bot) bot.stop('SIGTERM');
    process.exit(0);
});

async function generateImage(input) {
    console.warn("generateImage function is a placeholder and needs implementation if used.");
    return `URL_image_pour_${input.replace(/\s/g, '_')}.jpg`;
}