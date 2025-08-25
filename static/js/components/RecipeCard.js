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
        <div 
            className="recipe-card glass-card interactive-element float-element" 
            onClick={() => onViewDetails(recipe)}
            style={{ animationDelay: `${Math.random() * 0.3}s` }}
        >
            <div className="recipe-card-image">
                <img 
                    src={getImageUrl()}
                    alt={recipe.title}
                    onError={handleImageError}
                />
                <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-end justify-content-between p-3">
                    <div className="d-flex gap-2">
                        {recipe.dietary_info && recipe.dietary_info.map(diet => (
                            <span 
                                key={diet} 
                                className="badge"
                                style={{
                                    background: 'rgba(0, 212, 255, 0.2)',
                                    color: 'var(--primary-cyan)',
                                    border: '1px solid rgba(0, 212, 255, 0.3)',
                                    backdropFilter: 'blur(10px)'
                                }}
                            >
                                {helpers.capitalize(diet)}
                            </span>
                        ))}
                    </div>
                    <button
                        className={`favorite-btn ${isFavorited ? 'favorited' : ''}`}
                        onClick={handleToggleFavorite}
                        disabled={isLoading}
                        title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                    >
                        <i className={`fas fa-heart ${isLoading ? 'fa-pulse' : ''}`}></i>
                    </button>
                </div>
            </div>
            
            <div className="recipe-card-content">
                <h3 className="recipe-title">{recipe.title}</h3>
                
                <div className="recipe-meta">
                    <div className="recipe-time">
                        <i className="fas fa-clock me-2"></i>
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
                        <span className="recipe-tag interactive-element">
                            <i className="fas fa-users me-1"></i> {helpers.formatServings(recipe.servings)}
                        </span>
                    )}
                    {recipe.cuisine_types && recipe.cuisine_types.length > 0 && (
                        <span className="recipe-tag interactive-element">
                            {helpers.getCuisineFlag(recipe.cuisine_types[0])} {helpers.capitalize(recipe.cuisine_types[0])}
                        </span>
                    )}
                    {recipe.average_rating > 0 && (
                        <span className="recipe-tag interactive-element">
                            <i className="fas fa-star me-1" style={{color: 'var(--neon-green)'}}></i> {recipe.average_rating.toFixed(1)}
                        </span>
                    )}
                </div>

                <div className="recipe-actions">
                    <button className="btn btn-primary btn-sm">
                        <i className="fas fa-eye me-2"></i>
                        View Recipe
                    </button>
                    <span className="text-secondary small">
                        {recipe.meal_types && recipe.meal_types.length > 0 && (
                            <>
                                <i className="fas fa-utensils me-1"></i>
                                {helpers.capitalize(recipe.meal_types[0])}
                            </>
                        )}
                    </span>
                </div>
            </div>
        </div>
    );
}
