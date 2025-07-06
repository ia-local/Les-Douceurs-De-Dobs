const { Telegraf } = require('telegraf');
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const fs = require('fs'); // Utilisé pour db_article.json. À remplacer par Firebase si migration.
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config(); // Charge les variables d'environnement depuis .env

// --- Configuration du Serveur Express ---
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware pour parser le JSON des requêtes HTTP
app.use(bodyParser.json());

// --- Configuration CORS pour permettre les requêtes depuis GitHub Pages ---
const corsOptions = {
    origin: 'http://localhost:3000', // Pour le développement local
    // En production, décommentez la ligne ci-dessous et remplacez par votre URL GitHub Pages :
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
const PRODUCTS_FILE = 'docs/db_article.json'; // Ajusté pour refléter le placement dans docs/

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
        return []; // Retourne un tableau vide en cas d'erreur
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


const bot = new Telegraf('7097263805:AAHBgLY4BvfkpYFyLkA5u1G6hYd4XF2xFe0', {
    telegram: {
      webhookReply: true,
    },
  });

const TARGET_TELEGRAM_GROUP_ID = '-1001234567890'; // <-- REMPLACEZ CETTE VALEUR !

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

// --- Fonctions de génération de contenu via Groq ---
async function generateCardContent(prompt) {
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: "Tu es un assistant IA spécialisé dans la génération de contenu pour des fiches produits ou des cartes d'informations. Tu génères des réponses concises et informatives." },
                { role: 'user', content: prompt },
            ],
            model: 'llama-3.1-8b-instant',
            temperature: 0.7,
            max_tokens: 1024,
        });
        return chatCompletion.choices[0].message.content;
    } catch (error) {
        console.error('Failed to generate card content with Groq:', error);
        return 'Une erreur est survenue lors de la génération de contenu IA.';
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

// Commande /start
bot.start(async (ctx) => {
    await ctx.reply('Bienvenue sur Couz-ia Bot ! Je peux vous aider à gérer votre boutique et interagir avec nos services IA. Utilisez /help pour voir mes commandes.');
});

// Commande /shop
bot.command('shop', async (ctx) => {
    const products = await readProductsData();
    if (products.length === 0) {
        return ctx.reply('Aucun produit disponible pour le moment. Un administrateur peut utiliser /updatedb pour en ajouter.');
    }
    const productList = products.map(p => `- ${p.name} (${p.price}€) - Stock: ${p.stock}`).join('\n');
    await ctx.reply(`🛍️ Voici nos produits actuels :\n${productList}`);
});

// Commande /updatedb
bot.command('updatedb', async (ctx) => {
    await ctx.reply('🔄 Mise à jour des articles en cours... Cela peut prendre un moment.');
    try {
        const newArticles = await updateArticlesDynamically();
        const articleNames = newArticles.map(a => a.name).join(', ');
        await ctx.reply(`✅ Base de données mise à jour avec 10 nouveaux articles dynamiques : ${articleNames}.`);
        await ctx.reply('N\'oubliez pas de rafraîchir la page de la boutique sur le site web pour voir les changements !');
    } catch (error) {
        console.error('Erreur lors de la mise à jour des articles via Telegram:', error);
        await ctx.reply('❌ Désolé, une erreur est survenue lors de la mise à jour des articles.');
    }
});

// Commande /aboutai
bot.command('aboutai', async (ctx) => {
    await ctx.reply('🧠 **Couz-ia AI** est au cœur de notre boutique, offrant des fonctionnalités intelligentes comme la génération de descriptions de produits, l\'analyse de données et l\'optimisation de la gestion des stocks. Nous utilisons des modèles de langage avancés pour rendre votre expérience plus fluide et efficace.');
});

// NOUVELLE COMMANDE : /openshop
bot.command('openshop', async (ctx) => {
    const shopUrl = 'https://t.me/meta_Pibot/todo_list'; // L'URL de votre application web GitHub Pages
    await ctx.reply('Cliquez sur le bouton ci-dessous pour ouvrir notre boutique en ligne :', {
        reply_markup: {
            inline_keyboard: [
                [{ text: '🛍️ Ouvrir la Boutique Couz-ia', url: shopUrl }]
            ]
        }
    });
});

// Commande /help
bot.command('help', async (ctx) => {
    const helpMessage = `
Voici les commandes disponibles :

- /start - Message de bienvenue
- /shop - Voir la liste des produits
- /updatedb - Mettre à jour la base de données des produits (Admin)
- /aboutai - En savoir plus sur l'IA Couz-ia
- /help - Afficher ce message d'aide
- /reference_article - Envoyer les détails du premier article à un groupe
- /openshop - Ouvrir la boutique web Couz-ia sur GitHub Pages
`;
    await ctx.reply(helpMessage, { parse_mode: 'Markdown' });
});

// --- Commande /reference_article (existante) ---
bot.command('reference_article', async (ctx) => {
    try {
        const products = await readProductsData();
        if (products.length === 0) {
            await ctx.reply('Aucun produit n\'est disponible pour créer un article de référence. Utilisez /updatedb pour générer des articles.');
            return;
        }

        const referenceArticle = products[0];

        const message = `*Article de Référence (via Couz-ia Bot)*\n\n` +
                        `*Nom* : ${referenceArticle.name}\n` +
                        `*Description* : ${referenceArticle.description}\n` +
                        `*Prix* : ${referenceArticle.price.toFixed(2)}€\n` +
                        `*Stock* : ${referenceArticle.stock}\n` +
                        `*Image* : ${referenceArticle.imageUrl}\n` +
                        `\nID Produit: \`${referenceArticle.id}\``;

        await bot.telegram.sendMessage(TARGET_TELEGRAM_GROUP_ID, message, { parse_mode: 'Markdown' });
        await ctx.reply('L\'article de référence a été envoyé au groupe Telegram désigné !');

    } catch (error) {
        console.error('Erreur lors de l\'envoi de l\'article de référence au groupe:', error);
        await ctx.reply('Désolé, une erreur est survenue lors de l\'envoi de l\'article de référence. Assurez-vous que l\'ID du groupe est correct et que le bot y est.');
    }
});


// --- Gestion des messages texte pour le bot Telegram (conversations IA) ---
bot.on('text', async (ctx) => {
    const userInput = ctx.message.text;

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: `Tu es un AGI une intelligence artificielle Généralr au coeur de notre boutique 🏪 de model:gemma2-9b-it en constantes evolution de haut potentiel maîtrisant les normes du Web sémantique W3C, langage de programmation associée les techniques et les méthodes d'apprentissage automatique. Tu es au cœur de notre salon télégram pour le compte de la boutique en ligne sut .` },
                { role: 'user', content: userInput },
            ],
            model: 'gemma2-9b-it',
            temperature: 0.7,
            max_tokens: 4048,
        });

        await ctx.reply(chatCompletion.choices[0].message.content);
    } catch (error) {
        console.error('Failed to generate chat completion (Telegram) with gemma2-9b-it:', error);
        await ctx.reply('Une erreur est survenue lors du traitement de votre demande de conversation IA.');
    }
});


// --- Lancement des serveurs ---

app.listen(PORT, () => {
    console.log(`E-boutique backend & API running on http://localhost:${PORT}`);
});

if (process.env.TELEGRAM_BOT_TOKEN) {
    bot.launch().then(() => console.log('Telegram bot launched! ✨ Worker-ia_Pibot.'))
                 .catch(err => console.error('Failed to launch Telegram bot:', err));
} else {
    console.warn('TELEGRAM_BOT_TOKEN is not set in .env. Telegram bot will not be launched.');
}


// Gérer l'arrêt propre du bot et du serveur
process.once('SIGINT', () => {
    console.log('Stopping bot and server (SIGINT)');
    bot.stop('SIGINT');
    process.exit(0);
});
process.once('SIGTERM', () => {
    console.log('Stopping bot and server (SIGTERM)');
    bot.stop('SIGTERM');
    process.exit(0);
});

async function generateImage(input) {
    console.warn("generateImage function is a placeholder and needs implementation if used.");
    return `URL_image_pour_${input.replace(/\s/g, '_')}.jpg`;
}