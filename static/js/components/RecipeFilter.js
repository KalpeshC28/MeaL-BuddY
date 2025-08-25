// Recipe Filter Component
const { useState, useEffect } = React;

function RecipeFilter({ onFilterChange, onSearch, isLoading = false }) {
    const [filters, setFilters] = useState({
        query: '',
        cuisine: '',
        meal_type: '',
        diet: '',
        max_results: 12
    });

    const [options, setOptions] = useState({
        cuisines: [],
        mealTypes: [],
        diets: []
    });

    useEffect(() => {
        loadFilterOptions();
    }, []);

    const loadFilterOptions = async () => {
        try {
            const [cuisines, mealTypes, diets] = await Promise.all([
                apiService.getCuisines(),
                apiService.getMealTypes(),
                apiService.getDiets()
            ]);

            setOptions({
                cuisines: cuisines.cuisines || [],
                mealTypes: mealTypes.meal_types || [],
                diets: diets.diets || []
            });
        } catch (error) {
            console.error('Error loading filter options:', error);
            helpers.showToast('Error loading filter options', 'danger');
        }
    };

    const handleInputChange = (field, value) => {
        const newFilters = { ...filters, [field]: value };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        onSearch(filters);
    };

    const clearFilters = () => {
        const clearedFilters = {
            query: '',
            cuisine: '',
            meal_type: '',
            diet: '',
            max_results: 12
        };
        setFilters(clearedFilters);
        onFilterChange(clearedFilters);
    };

    return (
        <div className="filter-section">
            <form onSubmit={handleSearch}>
                <div className="row">
                    <div className="col-md-12 mb-3">
                        <label className="form-label">
                            <i className="fas fa-search"></i> Search Recipes
                        </label>
                        <div className="input-group">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Enter ingredients, recipe name, or keywords..."
                                value={filters.query}
                                onChange={(e) => handleInputChange('query', e.target.value)}
                            />
                            <button 
                                type="submit" 
                                className="btn btn-primary"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                ) : (
                                    <i className="fas fa-search me-2"></i>
                                )}
                                Search
                            </button>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-3 mb-3">
                        <label className="form-label">
                            <i className="fas fa-globe"></i> Cuisine
                        </label>
                        <select
                            className="form-select"
                            value={filters.cuisine}
                            onChange={(e) => handleInputChange('cuisine', e.target.value)}
                        >
                            <option value="">All Cuisines</option>
                            {options.cuisines.map(cuisine => (
                                <option key={cuisine} value={cuisine}>
                                    {helpers.getCuisineFlag(cuisine)} {cuisine}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="col-md-3 mb-3">
                        <label className="form-label">
                            <i className="fas fa-utensils"></i> Meal Type
                        </label>
                        <select
                            className="form-select"
                            value={filters.meal_type}
                            onChange={(e) => handleInputChange('meal_type', e.target.value)}
                        >
                            <option value="">All Meal Types</option>
                            {options.mealTypes.map(type => (
                                <option key={type} value={type}>
                                    {helpers.capitalize(type)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="col-md-3 mb-3">
                        <label className="form-label">
                            <i className="fas fa-leaf"></i> Diet
                        </label>
                        <select
                            className="form-select"
                            value={filters.diet}
                            onChange={(e) => handleInputChange('diet', e.target.value)}
                        >
                            <option value="">All Diets</option>
                            {options.diets.map(diet => (
                                <option key={diet} value={diet}>
                                    {helpers.capitalize(diet)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="col-md-3 mb-3">
                        <label className="form-label">
                            <i className="fas fa-list"></i> Results
                        </label>
                        <select
                            className="form-select"
                            value={filters.max_results}
                            onChange={(e) => handleInputChange('max_results', parseInt(e.target.value))}
                        >
                            <option value={6}>6 recipes</option>
                            <option value={12}>12 recipes</option>
                            <option value={24}>24 recipes</option>
                            <option value={36}>36 recipes</option>
                        </select>
                    </div>
                </div>

                <div className="row">
                    <div className="col-12">
                        <div className="d-flex gap-2">
                            <button 
                                type="button" 
                                className="btn btn-outline-primary"
                                onClick={clearFilters}
                            >
                                <i className="fas fa-eraser me-2"></i>
                                Clear Filters
                            </button>
                            <div className="ms-auto">
                                <small className="text-muted">
                                    <i className="fas fa-info-circle me-1"></i>
                                    Tip: Leave search empty to discover random recipes by cuisine or meal type
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
