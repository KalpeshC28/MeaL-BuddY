// Utility helper functions
const helpers = {
    // Format cooking time
    formatCookingTime(minutes) {
        if (!minutes) return 'Unknown';
        
        if (minutes < 60) {
            return `${minutes} min`;
        } else {
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = minutes % 60;
            return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
        }
    },

    // Clean HTML from recipe summaries
    cleanHtml(html) {
        if (!html) return '';
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    },

    // Truncate text to specified length
    truncateText(text, maxLength = 150) {
        if (!text) return '';
        const cleaned = this.cleanHtml(text);
        if (cleaned.length <= maxLength) return cleaned;
        return cleaned.substring(0, maxLength).replace(/\s+\S*$/, '') + '...';
    },

    // Format nutrition value
    formatNutrition(value, unit = '') {
        if (!value || value === 0) return 'N/A';
        return `${Math.round(value)}${unit}`;
    },

    // Get difficulty color class
    getDifficultyClass(difficulty) {
        switch (difficulty?.toLowerCase()) {
            case 'easy':
                return 'difficulty-easy';
            case 'medium':
                return 'difficulty-medium';
            case 'hard':
                return 'difficulty-hard';
            default:
                return 'difficulty-medium';
        }
    },

    // Format date
    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    // Format date with time
    formatDateTime(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // Get placeholder image for recipes
    getPlaceholderImage() {
        return 'https://pixabay.com/get/g71f4df243ba4e4f8e88ba0565dd43bc6d5c3fdd988d2cbe5e690569764c45fc720c01da85976fbebbaf5dbc798cc1c5195b3db731811604b0ce1295fdd78647a_1280.jpg';
    },

    // Validate email format
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // Generate random ID
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    },

    // Debounce function for search input
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Show toast notification
    showToast(message, type = 'info') {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0 show`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;

        // Create container if it doesn't exist
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container position-fixed top-0 end-0 p-3';
            container.style.zIndex = '1070';
            document.body.appendChild(container);
        }

        container.appendChild(toast);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 5000);
    },

    // Format serving size
    formatServings(servings) {
        if (!servings || servings === 1) return '1 serving';
        return `${servings} servings`;
    },

    // Parse ingredients JSON safely
    parseIngredients(ingredientsJson) {
        try {
            if (typeof ingredientsJson === 'string') {
                return JSON.parse(ingredientsJson);
            }
            return ingredientsJson || [];
        } catch (error) {
            console.error('Error parsing ingredients:', error);
            return [];
        }
    },

    // Parse nutrition info JSON safely
    parseNutrition(nutritionJson) {
        try {
            if (typeof nutritionJson === 'string') {
                return JSON.parse(nutritionJson);
            }
            return nutritionJson || {};
        } catch (error) {
            console.error('Error parsing nutrition info:', error);
            return {};
        }
    },

    // Scale ingredient amounts
    scaleIngredientAmount(amount, originalServings, newServings) {
        if (!amount || !originalServings || !newServings) return amount;
        const multiplier = newServings / originalServings;
        return Math.round((amount * multiplier) * 100) / 100; // Round to 2 decimal places
    },

    // Capitalize first letter
    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    // Get cuisine flag emoji (simplified mapping)
    getCuisineFlag(cuisine) {
        const flags = {
            'chinese': '🇨🇳',
            'italian': '🇮🇹',
            'mexican': '🇲🇽',
            'indian': '🇮🇳',
            'french': '🇫🇷',
            'japanese': '🇯🇵',
            'thai': '🇹🇭',
            'greek': '🇬🇷',
            'spanish': '🇪🇸',
            'american': '🇺🇸',
            'korean': '🇰🇷',
            'vietnamese': '🇻🇳'
        };
        return flags[cuisine?.toLowerCase()] || '🍽️';
    },

    // Generate shopping list from multiple recipes
    generateShoppingList(recipes) {
        const ingredientMap = new Map();
        
        recipes.forEach(recipe => {
            const ingredients = this.parseIngredients(recipe.ingredients);
            ingredients.forEach(ingredient => {
                const key = ingredient.name?.toLowerCase();
                if (key) {
                    if (ingredientMap.has(key)) {
                        const existing = ingredientMap.get(key);
                        existing.amount += ingredient.amount || 0;
                    } else {
                        ingredientMap.set(key, {
                            name: ingredient.name,
                            amount: ingredient.amount || 0,
                            unit: ingredient.unit || '',
                            recipes: [recipe.title]
                        });
                    }
                }
            });
        });
        
        return Array.from(ingredientMap.values());
    }
};
