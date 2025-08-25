// Recipe Card Component
const { useState, useEffect } = React;

function RecipeCard({ recipe, onViewDetails, onToggleFavorite, isFavorited = false }) {
    const [isLoading, setIsLoading] = useState(false);
    const [imageError, setImageError] = useState(false);

    const handleToggleFavorite = async (e) => {
        e.stopPropagation();
        setIsLoading(true);
        try {
            await onToggleFavorite(recipe.spoonacular_id || recipe.id);
        } catch (error) {
            helpers.showToast('Error updating favorites: ' + error.message, 'danger');
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageError = () => {
        setImageError(true);
    };

    const getImageUrl = () => {
        if (imageError || !recipe.image_url) {
            return helpers.getPlaceholderImage();
        }
        return recipe.image_url;
    };

    return (
        <div className="recipe-card fade-in" onClick={() => onViewDetails(recipe)}>
            <div className="recipe-card-image">
                <img 
                    src={getImageUrl()}
                    alt={recipe.title}
                    onError={handleImageError}
                />
                <button
                    className={`favorite-btn position-absolute top-0 end-0 m-2 ${isFavorited ? 'favorited' : ''}`}
                    onClick={handleToggleFavorite}
                    disabled={isLoading}
                    title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                >
                    <i className={`fas fa-heart ${isLoading ? 'fa-spin' : ''}`}></i>
                </button>
            </div>
            
            <div className="recipe-card-content">
                <h3 className="recipe-title">{recipe.title}</h3>
                
                <div className="recipe-meta">
                    <div className="recipe-time">
                        <i className="fas fa-clock"></i>
                        {helpers.formatCookingTime(recipe.ready_in_minutes)}
                    </div>
                    <div className={`recipe-difficulty ${helpers.getDifficultyClass(recipe.difficulty_level)}`}>
                        {recipe.difficulty_level || 'Medium'}
                    </div>
                </div>

                {recipe.summary && (
                    <p className="recipe-summary">
                        {helpers.truncateText(recipe.summary, 120)}
                    </p>
                )}

                <div className="recipe-tags">
                    {recipe.servings && (
                        <span className="recipe-tag">
                            <i className="fas fa-users"></i> {helpers.formatServings(recipe.servings)}
                        </span>
                    )}
                    {recipe.cuisine_types && recipe.cuisine_types.length > 0 && (
                        <span className="recipe-tag">
                            {helpers.getCuisineFlag(recipe.cuisine_types[0])} {helpers.capitalize(recipe.cuisine_types[0])}
                        </span>
                    )}
                    {recipe.average_rating > 0 && (
                        <span className="recipe-tag">
                            <i className="fas fa-star text-warning"></i> {recipe.average_rating.toFixed(1)}
                        </span>
                    )}
                </div>

                <div className="recipe-actions">
                    <button className="btn btn-primary btn-sm">
                        View Recipe
                    </button>
                    <span className="text-muted small">
                        {recipe.meal_types && recipe.meal_types.length > 0 && 
                            helpers.capitalize(recipe.meal_types[0])
                        }
                    </span>
                </div>
            </div>
        </div>
    );
}
