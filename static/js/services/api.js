// API service for handling HTTP requests
class ApiService {
    constructor() {
        this.baseURL = '/api';
        this.axios = axios.create({
            baseURL: this.baseURL,
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    // Auth endpoints
    async register(userData) {
        try {
            const response = await this.axios.post('/register', userData);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async login(credentials) {
        try {
            const response = await this.axios.post('/login', credentials);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async logout() {
        try {
            const response = await this.axios.post('/logout');
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getCurrentUser() {
        try {
            const response = await this.axios.get('/user');
            return response.data;
        } catch (error) {
            if (error.response?.status === 401) {
                return { user: null };
            }
            throw this.handleError(error);
        }
    }

    // Recipe endpoints
    async searchRecipes(params = {}) {
        try {
            const response = await this.axios.get('/recipes/search', { params });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getRecipeDetail(recipeId, servings = null) {
        try {
            const params = servings ? { servings } : {};
            const response = await this.axios.get(`/recipes/${recipeId}`, { params });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // Favorites endpoints
    async getFavorites() {
        try {
            const response = await this.axios.get('/favorites');
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async addFavorite(recipeId) {
        try {
            const response = await this.axios.post('/favorites', { recipe_id: recipeId });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async removeFavorite(recipeId) {
        try {
            const response = await this.axios.delete(`/favorites/${recipeId}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // History endpoint
    async getSearchHistory() {
        try {
            const response = await this.axios.get('/history');
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // Rating endpoints
    async rateRecipe(recipeId, rating, review = '') {
        try {
            const response = await this.axios.post(`/recipes/${recipeId}/rating`, {
                rating,
                review
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getRecipeRatings(recipeId) {
        try {
            const response = await this.axios.get(`/recipes/${recipeId}/ratings`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // Shopping list endpoint
    async createShoppingList(recipeIds, name = 'My Shopping List') {
        try {
            const response = await this.axios.post('/shopping-list', {
                recipe_ids: recipeIds,
                name
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // Options endpoints
    async getCuisines() {
        try {
            const response = await this.axios.get('/cuisines');
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getMealTypes() {
        try {
            const response = await this.axios.get('/meal-types');
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getDiets() {
        try {
            const response = await this.axios.get('/diets');
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    handleError(error) {
        if (error.response) {
            // Server responded with error status
            return new Error(error.response.data.error || 'Server error occurred');
        } else if (error.request) {
            // Request was made but no response received
            return new Error('Network error - please check your connection');
        } else {
            // Something else happened
            return new Error('An unexpected error occurred');
        }
    }
}

// Export API service instance
const apiService = new ApiService();
