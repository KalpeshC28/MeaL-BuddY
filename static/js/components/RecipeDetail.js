// Recipe Detail Component
const { useState, useEffect } = React;

function RecipeDetail({ recipe, isOpen, onClose, currentUser }) {
    const [detailedRecipe, setDetailedRecipe] = useState(null);
    const [servings, setServings] = useState(recipe?.servings || 1);
    const [isLoading, setIsLoading] = useState(false);
    const [userRating, setUserRating] = useState(0);
    const [userReview, setUserReview] = useState('');
    const [ratings, setRatings] = useState([]);
    const [showIngredients, setShowIngredients] = useState(true);
    const [showInstructions, setShowInstructions] = useState(false);
    const [showNutrition, setShowNutrition] = useState(false);

    useEffect(() => {
        if (isOpen && recipe) {
            loadRecipeDetails();
            loadRatings();
            setServings(recipe.servings || 1);
        }
    }, [isOpen, recipe]);

    const loadRecipeDetails = async () => {
        setIsLoading(true);
        try {
            const response = await apiService.getRecipeDetail(recipe.spoonacular_id || recipe.id, servings);
            setDetailedRecipe(response.recipe);
        } catch (error) {
            console.error('Error loading recipe details:', error);
            helpers.showToast('Error loading recipe details', 'danger');
        } finally {
            setIsLoading(false);
        }
    };

    const loadRatings = async () => {
        try {
            const response = await apiService.getRecipeRatings(recipe.spoonacular_id || recipe.id);
            setRatings(response.ratings || []);
        } catch (error) {
            console.error('Error loading ratings:', error);
        }
    };

    const handleServingsChange = async (newServings) => {
        if (newServings < 1 || newServings > 12) return;
        
        setServings(newServings);
        setIsLoading(true);
        
        try {
            const response = await apiService.getRecipeDetail(recipe.spoonacular_id || recipe.id, newServings);
            setDetailedRecipe(response.recipe);
        } catch (error) {
            console.error('Error adjusting servings:', error);
            helpers.showToast('Error adjusting servings', 'danger');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRatingSubmit = async () => {
        if (!currentUser) {
            helpers.showToast('Please login to rate recipes', 'warning');
            return;
        }

        if (userRating === 0) {
            helpers.showToast('Please select a rating', 'warning');
            return;
        }

        try {
            await apiService.rateRecipe(recipe.spoonacular_id || recipe.id, userRating, userReview);
            helpers.showToast('Rating submitted successfully', 'success');
            loadRatings();
            setUserRating(0);
            setUserReview('');
        } catch (error) {
            helpers.showToast('Error submitting rating: ' + error.message, 'danger');
        }
    };

    const createShoppingList = async () => {
        if (!currentUser) {
            helpers.showToast('Please login to create shopping lists', 'warning');
            return;
        }

        try {
            await apiService.createShoppingList([recipe.spoonacular_id || recipe.id], `Shopping list for ${recipe.title}`);
            helpers.showToast('Shopping list created successfully', 'success');
        } catch (error) {
            helpers.showToast('Error creating shopping list: ' + error.message, 'danger');
        }
    };

    if (!isOpen || !recipe) return null;

    const currentRecipe = detailedRecipe || recipe;
    const ingredients = helpers.parseIngredients(currentRecipe.ingredients);
    const nutrition = helpers.parseNutrition(currentRecipe.nutrition_info);

    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-xl modal-dialog-scrollable">
                <div className="modal-content">
                    <div className="modal-header">
                        <h4 className="modal-title">{currentRecipe.title}</h4>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    
                    <div className="modal-body">
                        {isLoading && (
                            <div className="loading">
                                <div className="spinner-border"></div>
                                <p>Loading recipe details...</p>
                            </div>
                        )}

                        {!isLoading && (
                            <>
                                {/* Recipe Image */}
                                {currentRecipe.image_url && (
                                    <img 
                                        src={currentRecipe.image_url} 
                                        alt={currentRecipe.title}
                                        className="recipe-detail-image mb-3"
                                    />
                                )}

                                {/* Recipe Meta */}
                                <div className="row mb-4">
                                    <div className="col-md-3">
                                        <div className="text-center">
                                            <i className="fas fa-clock fa-2x text-primary mb-2"></i>
                                            <p><strong>Cooking Time</strong></p>
                                            <p>{helpers.formatCookingTime(currentRecipe.ready_in_minutes)}</p>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="text-center">
                                            <i className="fas fa-users fa-2x text-success mb-2"></i>
                                            <p><strong>Servings</strong></p>
                                            <div className="input-group">
                                                <button 
                                                    className="btn btn-outline-secondary"
                                                    onClick={() => handleServingsChange(servings - 1)}
                                                    disabled={servings <= 1}
                                                >
                                                    -
                                                </button>
                                                <span className="form-control text-center">{servings}</span>
                                                <button 
                                                    className="btn btn-outline-secondary"
                                                    onClick={() => handleServingsChange(servings + 1)}
                                                    disabled={servings >= 12}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="text-center">
                                            <i className="fas fa-signal fa-2x text-warning mb-2"></i>
                                            <p><strong>Difficulty</strong></p>
                                            <span className={`badge ${helpers.getDifficultyClass(currentRecipe.difficulty_level)}`}>
                                                {currentRecipe.difficulty_level || 'Medium'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="text-center">
                                            <i className="fas fa-star fa-2x text-warning mb-2"></i>
                                            <p><strong>Rating</strong></p>
                                            <p>{currentRecipe.average_rating ? currentRecipe.average_rating.toFixed(1) : 'No ratings'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Recipe Summary */}
                                {currentRecipe.summary && (
                                    <div className="mb-4">
                                        <h5>About This Recipe</h5>
                                        <p>{helpers.cleanHtml(currentRecipe.summary)}</p>
                                    </div>
                                )}

                                {/* Navigation Tabs */}
                                <ul className="nav nav-tabs mb-3">
                                    <li className="nav-item">
                                        <button 
                                            className={`nav-link ${showIngredients ? 'active' : ''}`}
                                            onClick={() => {
                                                setShowIngredients(true);
                                                setShowInstructions(false);
                                                setShowNutrition(false);
                                            }}
                                        >
                                            <i className="fas fa-list me-2"></i>Ingredients
                                        </button>
                                    </li>
                                    <li className="nav-item">
                                        <button 
                                            className={`nav-link ${showInstructions ? 'active' : ''}`}
                                            onClick={() => {
                                                setShowIngredients(false);
                                                setShowInstructions(true);
                                                setShowNutrition(false);
                                            }}
                                        >
                                            <i className="fas fa-utensils me-2"></i>Instructions
                                        </button>
                                    </li>
                                    <li className="nav-item">
                                        <button 
                                            className={`nav-link ${showNutrition ? 'active' : ''}`}
                                            onClick={() => {
                                                setShowIngredients(false);
                                                setShowInstructions(false);
                                                setShowNutrition(true);
                                            }}
                                        >
                                            <i className="fas fa-heartbeat me-2"></i>Nutrition
                                        </button>
                                    </li>
                                </ul>

                                {/* Ingredients Tab */}
                                {showIngredients && (
                                    <div className="ingredients-list">
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <h5>Ingredients</h5>
                                            <button className="btn btn-outline-primary btn-sm" onClick={createShoppingList}>
                                                <i className="fas fa-shopping-cart me-2"></i>Add to Shopping List
                                            </button>
                                        </div>
                                        {ingredients.length > 0 ? (
                                            <div className="row">
                                                {ingredients.map((ingredient, index) => (
                                                    <div key={index} className="col-md-6 ingredient-item">
                                                        <span className="ingredient-amount">
                                                            {ingredient.amount} {ingredient.unit}
                                                        </span>
                                                        <span className="ms-2">{ingredient.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-muted">No ingredient information available.</p>
                                        )}
                                    </div>
                                )}

                                {/* Instructions Tab */}
                                {showInstructions && (
                                    <div>
                                        <h5>Instructions</h5>
                                        {currentRecipe.instructions ? (
                                            <div className="instructions-list">
                                                {currentRecipe.instructions.split('\n').map((step, index) => (
                                                    <div key={index} className="instruction-step">
                                                        {step.replace(/^\d+\.\s*/, '')}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-muted">No cooking instructions available.</p>
                                        )}
                                    </div>
                                )}

                                {/* Nutrition Tab */}
                                {showNutrition && (
                                    <div>
                                        <h5>Nutrition Information</h5>
                                        {Object.keys(nutrition).length > 0 ? (
                                            <div className="nutrition-grid">
                                                <div className="nutrition-item">
                                                    <div className="nutrition-value">{helpers.formatNutrition(nutrition.calories)}</div>
                                                    <div className="nutrition-label">Calories</div>
                                                </div>
                                                <div className="nutrition-item">
                                                    <div className="nutrition-value">{helpers.formatNutrition(nutrition.protein, 'g')}</div>
                                                    <div className="nutrition-label">Protein</div>
                                                </div>
                                                <div className="nutrition-item">
                                                    <div className="nutrition-value">{helpers.formatNutrition(nutrition.carbs, 'g')}</div>
                                                    <div className="nutrition-label">Carbs</div>
                                                </div>
                                                <div className="nutrition-item">
                                                    <div className="nutrition-value">{helpers.formatNutrition(nutrition.fat, 'g')}</div>
                                                    <div className="nutrition-label">Fat</div>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-muted">No nutrition information available.</p>
                                        )}
                                    </div>
                                )}

                                {/* Rating Section */}
                                {currentUser && (
                                    <div className="mt-4 p-3 bg-light rounded">
                                        <h6>Rate This Recipe</h6>
                                        <div className="rating-stars mb-2">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <i
                                                    key={star}
                                                    className={`fas fa-star star ${star <= userRating ? 'filled' : ''}`}
                                                    onClick={() => setUserRating(star)}
                                                ></i>
                                            ))}
                                        </div>
                                        <textarea
                                            className="form-control mb-2"
                                            placeholder="Write a review (optional)..."
                                            value={userReview}
                                            onChange={(e) => setUserReview(e.target.value)}
                                            rows="3"
                                        ></textarea>
                                        <button className="btn btn-primary btn-sm" onClick={handleRatingSubmit}>
                                            Submit Rating
                                        </button>
                                    </div>
                                )}

                                {/* Reviews Section */}
                                {ratings.length > 0 && (
                                    <div className="mt-4">
                                        <h6>Reviews</h6>
                                        {ratings.slice(0, 5).map(rating => (
                                            <div key={rating.id} className="border-bottom pb-2 mb-2">
                                                <div className="d-flex justify-content-between">
                                                    <strong>{rating.user}</strong>
                                                    <div>
                                                        {[1, 2, 3, 4, 5].map(star => (
                                                            <i
                                                                key={star}
                                                                className={`fas fa-star ${star <= rating.rating ? 'text-warning' : 'text-muted'}`}
                                                            ></i>
                                                        ))}
                                                    </div>
                                                </div>
                                                {rating.review && <p className="mb-1">{rating.review}</p>}
                                                <small className="text-muted">{helpers.formatDate(rating.created_at)}</small>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
