document.addEventListener('DOMContentLoaded', () => {
    const productsContainer = document.getElementById('products-container');
    const loadingMessage = document.getElementById('loading-message');
    const errorMessage = document.getElementById('error-message');

    // Fonction pour masquer les messages de chargement/erreur
    const hideMessages = () => {
        if (loadingMessage) loadingMessage.style.display = 'none';
        if (errorMessage) errorMessage.style.display = 'none';
    };

    // Fonction pour afficher un message d'erreur
    const displayError = (message) => {
        hideMessages();
        if (errorMessage) {
            errorMessage.textContent = `Erreur : ${message}`;
            errorMessage.style.display = 'block';
        }
        if (productsContainer) productsContainer.innerHTML = ''; // Efface les produits en cas d'erreur
    };

    // Fonction pour créer une carte produit
    const createProductCard = (product) => {
        const productCard = document.createElement('div');
        productCard.classList.add('product-card');

        productCard.innerHTML = `
            <img src="${product.imageUrl}" alt="${product.name}" title="${product.description}">
            <div class="product-card-content">
                <h3>${product.name}</h3>
                <p class="description">${product.description}</p>
                <p class="price">${product.price} €</p>
                <p class="stock">Stock: ${product.stock}</p>
                <button data-product-id="${product.id}" ${product.stock === 0 ? 'disabled' : ''}>
                    ${product.stock === 0 ? 'Rupture de stock' : 'Ajouter au panier'}
                </button>
            </div>
        `;
        return productCard;
    };

    // Nouvelle fonction pour récupérer et afficher les produits depuis db_article.json
    const fetchProducts = async () => {
        hideMessages();
        if (loadingMessage) loadingMessage.style.display = 'block';
        if (productsContainer) productsContainer.innerHTML = ''; // Efface les produits précédents

        try {
            const response = await fetch('./db_article.json');

            if (!response.ok) {
                throw new Error(`Erreur HTTP! Statut: ${response.status}`);
            }

            const products = await response.json(); // Parse la réponse JSON

            hideMessages(); // Masque le message de chargement en cas de succès

            if (products.length === 0) {
                productsContainer.innerHTML = '<p>Aucun article disponible pour le moment.</p>';
                return;
            }

            products.forEach(product => {
                const card = createProductCard(product);
                if (productsContainer) productsContainer.appendChild(card);
            });

        } catch (error) {
            console.error('Erreur lors de la récupération des articles:', error);
            displayError(`Impossible de charger les articles. Veuillez réessayer plus tard. (${error.message})`);
        }
    };

    // Lance la récupération des produits au chargement de la page
    fetchProducts();
});