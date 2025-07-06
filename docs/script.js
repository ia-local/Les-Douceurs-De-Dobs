// docs/script.js

// IMPORTANT : Mettez à jour cette URL avec l'URL de votre backend srv.js une fois déployé
const BASE_URL = 'http://localhost:3000'; // Changez ceci pour votre URL de déploiement (ex: https://votreboutique.render.com)

document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    loadCustomers();

    // --- Gestion du Thème (Clair/Sombre) ---
    const themeToggleBtn = document.getElementById('theme-toggle');
    const body = document.body;

    // Charger le thème sauvegardé
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        body.classList.add(savedTheme);
        if (savedTheme === 'dark-theme') {
            themeToggleBtn.textContent = 'Basculer le Thème 🌙';
        } else {
            themeToggleBtn.textContent = 'Basculer le Thème ☀️';
        }
    } else {
        // Définir un thème par défaut si aucun n'est sauvegardé (par exemple, light)
        body.classList.add('light-theme'); // Ou ne rien faire pour laisser le style.css par défaut
        themeToggleBtn.textContent = 'Basculer le Thème ☀️';
    }

    // Basculer le thème au clic
    themeToggleBtn.addEventListener('click', () => {
        if (body.classList.contains('dark-theme')) {
            body.classList.remove('dark-theme');
            body.classList.add('light-theme');
            themeToggleBtn.textContent = 'Basculer le Thème ☀️';
            localStorage.setItem('theme', 'light-theme');
        } else {
            body.classList.remove('light-theme');
            body.classList.add('dark-theme');
            themeToggleBtn.textContent = 'Basculer le Thème 🌙';
            localStorage.setItem('theme', 'dark-theme');
        }
    });
    // --- Fin Gestion du Thème ---


    // Gestion du formulaire d'ajout de produit
    document.getElementById('add-product-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        const name = document.getElementById('product-name').value;
        const description = document.getElementById('product-description').value;
        const price = parseFloat(document.getElementById('product-price').value);
        const imageUrl = document.getElementById('product-image-url').value;

        try {
            const response = await fetch(`${BASE_URL}/api/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, description, price, imageUrl }),
            });
            const newProduct = await response.json();
            if (response.ok) {
                alert('Produit ajouté avec succès !');
                document.getElementById('add-product-form').reset();
                loadProducts(); // Recharger la liste des produits
            } else {
                alert('Erreur lors de l\'ajout du produit : ' + (newProduct.error || 'Erreur inconnue'));
            }
        } catch (error) {
            console.error('Erreur réseau lors de l\'ajout de produit:', error);
            alert('Impossible de joindre le serveur. Vérifiez que le backend est en cours d\'exécution.');
        }
    });

    // Gestion du formulaire d'ajout de client
    document.getElementById('add-customer-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        const name = document.getElementById('customer-name').value;
        const email = document.getElementById('customer-email').value;
        const phone = document.getElementById('customer-phone').value;

        try {
            const response = await fetch(`${BASE_URL}/api/customers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, phone }),
            });
            const newCustomer = await response.json();
            if (response.ok) {
                alert('Client ajouté avec succès !');
                document.getElementById('add-customer-form').reset();
                loadCustomers(); // Recharger la liste des clients
            } else {
                alert('Erreur lors de l\'ajout du client : ' + (newCustomer.error || 'Erreur inconnue'));
            }
        } catch (error) {
            console.error('Erreur réseau lors de l\'ajout de client:', error);
            alert('Impossible de joindre le serveur. Vérifiez que le backend est en cours d\'exécution.');
        }
    });

    // Gestion du formulaire de génération de description de produit AI
    document.getElementById('generate-product-description-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        const productName = document.getElementById('ai-product-name').value;
        const productDetails = document.getElementById('ai-product-details').value;
        const outputDiv = document.getElementById('ai-product-description-output');
        outputDiv.textContent = 'Génération en cours...';
        outputDiv.classList.add('alert-info'); // Classe Bootstrap pour indiquer un état de chargement

        try {
            const response = await fetch(`${BASE_URL}/api/generate-product-description`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ productName, productDetails }),
            });
            const data = await response.json();
            outputDiv.classList.remove('alert-info');
            if (response.ok) {
                outputDiv.textContent = data.description;
                outputDiv.classList.add('alert-success'); // Succès
            } else {
                outputDiv.textContent = 'Erreur: ' + (data.error || 'Impossible de générer la description.');
                outputDiv.classList.add('alert-danger'); // Échec
            }
        } catch (error) {
            console.error('Erreur réseau lors de la génération de description:', error);
            outputDiv.textContent = 'Erreur réseau: Impossible de joindre le backend IA.';
            outputDiv.classList.remove('alert-info');
            outputDiv.classList.add('alert-danger'); // Échec réseau
        } finally {
            // Supprimer les classes de succès/erreur après un délai ou une autre action
            setTimeout(() => {
                outputDiv.classList.remove('alert-success', 'alert-danger');
            }, 5000); // Ex: retirer après 5 secondes
        }
    });

    // Gestion du formulaire de génération de business plan AI
    document.getElementById('generate-business-plan-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        const projectDetails = document.getElementById('ai-project-details').value;
        const outputDiv = document.getElementById('ai-business-plan-output');
        outputDiv.textContent = 'Génération du business plan en cours...';
        outputDiv.classList.add('alert-info');

        try {
            const response = await fetch(`${BASE_URL}/api/generate-business-plan`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ projectDetails }),
            });
            const data = await response.json();
            outputDiv.classList.remove('alert-info');
            if (response.ok) {
                outputDiv.textContent = data.content;
                // Optionnel: proposer un téléchargement si l'API renvoie un lien direct pour le fichier
                outputDiv.classList.add('alert-success');
            } else {
                outputDiv.textContent = 'Erreur: ' + (data.error || 'Impossible de générer le business plan.');
                outputDiv.classList.add('alert-danger');
            }
        } catch (error) {
            console.error('Erreur réseau lors de la génération du business plan:', error);
            outputDiv.textContent = 'Erreur réseau: Impossible de joindre le backend IA.';
            outputDiv.classList.remove('alert-info');
            outputDiv.classList.add('alert-danger');
        } finally {
            setTimeout(() => {
                outputDiv.classList.remove('alert-success', 'alert-danger');
            }, 5000);
        }
    });

});

// Fonctions pour charger les données
async function loadProducts() {
    const productListDiv = document.getElementById('product-list');
    productListDiv.innerHTML = '<p class="text-center w-100">Chargement des produits...</p>'; // Message de chargement
    try {
        const response = await fetch(`${BASE_URL}/api/products`);
        const products = await response.json();
        productListDiv.innerHTML = ''; // Nettoyer avant d'ajouter

        if (products.length === 0) {
            productListDiv.innerHTML = '<p class="text-center w-100">Aucun produit disponible pour le moment.</p>';
            return;
        }

        products.forEach(product => {
            const colDiv = document.createElement('div');
            colDiv.classList.add('col'); // Colonne pour la grille Bootstrap
            const productCard = document.createElement('div');
            productCard.classList.add('card', 'h-100', 'product-card'); // h-100 pour hauteur égale
            productCard.innerHTML = `
                <img src="${product.imageUrl || 'https://via.placeholder.com/300x200?text=Produit+IA'}" class="card-img-top" alt="${product.name}">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${product.name}</h5>
                    <p class="card-text">${product.description || 'Pas de description.'}</p>
                    <p class="mt-auto fs-4 text-end text-success">${product.price.toFixed(2)} €</p>
                    <button class="btn btn-primary mt-2" onclick="alert('Ajouter ${product.name} au panier (fonctionnalité non implémentée)');">Ajouter au panier</button>
                </div>
            `;
            productListDiv.appendChild(colDiv);
        });
    } catch (error) {
        console.error('Erreur lors du chargement des produits:', error);
        productListDiv.innerHTML = '<p class="text-center text-danger w-100">Impossible de charger les produits. Le backend est-il en cours d\'exécution et accessible depuis cette URL?</p>';
    }
}

async function loadCustomers() {
    const customerListDiv = document.getElementById('customer-list');
    customerListDiv.innerHTML = '<p class="text-center w-100">Chargement des clients...</p>';
    try {
        const response = await fetch(`${BASE_URL}/api/customers`);
        const customers = await response.json();
        customerListDiv.innerHTML = ''; // Nettoyer avant d'ajouter

        if (customers.length === 0) {
            customerListDiv.innerHTML = '<p class="text-center w-100">Aucun client enregistré pour le moment.</p>';
            return;
        }

        customers.forEach(customer => {
            const customerItem = document.createElement('li'); // Utilisation de <li> pour les listes Bootstrap
            customerItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');
            customerItem.innerHTML = `
                <div>
                    <strong>${customer.name}</strong><br>
                    <small class="text-muted">${customer.email}</small>
                </div>
                <span>${customer.phone || 'N/A'}</span>
            `;
            customerListDiv.appendChild(customerItem);
        });
    } catch (error) {
        console.error('Erreur lors du chargement des clients:', error);
        customerListDiv.innerHTML = '<p class="text-center text-danger w-100">Impossible de charger les clients. Le backend est-il en cours d\'exécution et accessible depuis cette URL?</p>';
    }
}