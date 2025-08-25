from flask import request, jsonify, session, render_template
from werkzeug.security import generate_password_hash, check_password_hash
from app import app, db
from models import User, Recipe, UserFavorite, SearchHistory, RecipeRating, ShoppingList
from recipe_service import recipe_service
import json
import logging

# Serve the React app
@app.route('/')
def index():
    return render_template('index.html')

# API Routes
@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        if not username or not email or not password:
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Check if user already exists
        if User.query.filter_by(username=username).first():
            return jsonify({'error': 'Username already exists'}), 409
        
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already exists'}), 409
        
        # Create new user
        user = User(username=username, email=email)
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        # Log user in
        session['user_id'] = user.id
        
        return jsonify({
            'message': 'User registered successfully',
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        logging.error(f"Registration error: {e}")
        db.session.rollback()
        return jsonify({'error': 'Registration failed'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        user = User.query.filter_by(username=username).first()
        
        if user and user.check_password(password):
            session['user_id'] = user.id
            return jsonify({
                'message': 'Login successful',
                'user': user.to_dict()
            })
        else:
            return jsonify({'error': 'Invalid credentials'}), 401
            
    except Exception as e:
        logging.error(f"Login error: {e}")
        return jsonify({'error': 'Login failed'}), 500

@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    return jsonify({'message': 'Logged out successfully'})

@app.route('/api/user', methods=['GET'])
def get_current_user():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({'user': user.to_dict()})

@app.route('/api/recipes/search', methods=['GET'])
def search_recipes():
    try:
        query = request.args.get('query', '')
        cuisine = request.args.get('cuisine', '')
        meal_type = request.args.get('meal_type', '')
        diet = request.args.get('diet', '')
        max_results = int(request.args.get('max_results', 12))
        
        # Save search to history if user is logged in
        user_id = session.get('user_id')
        if user_id and query:
            search_entry = SearchHistory(
                user_id=user_id,
                query=query,
                cuisine_filter=cuisine,
                meal_type_filter=meal_type,
                dietary_filter=diet
            )
            db.session.add(search_entry)
            db.session.commit()
        
        recipes = recipe_service.search_recipes(query, cuisine, meal_type, diet, max_results)
        return jsonify({'recipes': recipes})
        
    except Exception as e:
        logging.error(f"Search error: {e}")
        return jsonify({'error': 'Search failed'}), 500

@app.route('/api/recipes/<int:recipe_id>', methods=['GET'])
def get_recipe_detail(recipe_id):
    try:
        servings = request.args.get('servings', type=int)
        
        # Try to get from database first
        recipe = Recipe.query.filter_by(spoonacular_id=recipe_id).first()
        
        if not recipe:
            # Fetch from API if not in database
            recipe_data = recipe_service.get_recipe_details(recipe_id)
            if not recipe_data:
                return jsonify({'error': 'Recipe not found'}), 404
        else:
            recipe_data = recipe.to_dict()
        
        # Adjust servings if requested
        if servings and servings != recipe_data.get('servings'):
            recipe_data = recipe_service.adjust_servings(recipe_data, servings)
        
        return jsonify({'recipe': recipe_data})
        
    except Exception as e:
        logging.error(f"Recipe detail error: {e}")
        return jsonify({'error': 'Failed to get recipe details'}), 500

@app.route('/api/favorites', methods=['GET'])
def get_favorites():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        favorites = db.session.query(UserFavorite, Recipe).join(Recipe).filter(
            UserFavorite.user_id == user_id
        ).all()
        
        favorite_recipes = [recipe.to_dict() for _, recipe in favorites]
        return jsonify({'favorites': favorite_recipes})
        
    except Exception as e:
        logging.error(f"Get favorites error: {e}")
        return jsonify({'error': 'Failed to get favorites'}), 500

@app.route('/api/favorites', methods=['POST'])
def add_favorite():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        data = request.get_json()
        recipe_id = data.get('recipe_id')
        
        # Check if recipe exists in database
        recipe = Recipe.query.filter_by(spoonacular_id=recipe_id).first()
        if not recipe:
            # Fetch and save recipe first
            recipe_data = recipe_service.get_recipe_details(recipe_id)
            if not recipe_data:
                return jsonify({'error': 'Recipe not found'}), 404
            recipe = Recipe.query.filter_by(spoonacular_id=recipe_id).first()
        
        # Check if already favorited
        existing_favorite = UserFavorite.query.filter_by(
            user_id=user_id, recipe_id=recipe.id
        ).first()
        
        if existing_favorite:
            return jsonify({'error': 'Recipe already in favorites'}), 409
        
        favorite = UserFavorite(user_id=user_id, recipe_id=recipe.id)
        db.session.add(favorite)
        db.session.commit()
        
        return jsonify({'message': 'Added to favorites'})
        
    except Exception as e:
        logging.error(f"Add favorite error: {e}")
        db.session.rollback()
        return jsonify({'error': 'Failed to add favorite'}), 500

@app.route('/api/favorites/<int:recipe_id>', methods=['DELETE'])
def remove_favorite(recipe_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        recipe = Recipe.query.filter_by(spoonacular_id=recipe_id).first()
        if not recipe:
            return jsonify({'error': 'Recipe not found'}), 404
        
        favorite = UserFavorite.query.filter_by(
            user_id=user_id, recipe_id=recipe.id
        ).first()
        
        if not favorite:
            return jsonify({'error': 'Recipe not in favorites'}), 404
        
        db.session.delete(favorite)
        db.session.commit()
        
        return jsonify({'message': 'Removed from favorites'})
        
    except Exception as e:
        logging.error(f"Remove favorite error: {e}")
        db.session.rollback()
        return jsonify({'error': 'Failed to remove favorite'}), 500

@app.route('/api/history', methods=['GET'])
def get_search_history():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        history = SearchHistory.query.filter_by(user_id=user_id).order_by(
            SearchHistory.created_at.desc()
        ).limit(20).all()
        
        return jsonify({'history': [h.to_dict() for h in history]})
        
    except Exception as e:
        logging.error(f"Get history error: {e}")
        return jsonify({'error': 'Failed to get search history'}), 500

@app.route('/api/recipes/<int:recipe_id>/rating', methods=['POST'])
def rate_recipe(recipe_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        data = request.get_json()
        rating_value = data.get('rating')
        review = data.get('review', '')
        
        if not rating_value or rating_value < 1 or rating_value > 5:
            return jsonify({'error': 'Rating must be between 1 and 5'}), 400
        
        # Get or create recipe
        recipe = Recipe.query.filter_by(spoonacular_id=recipe_id).first()
        if not recipe:
            recipe_data = recipe_service.get_recipe_details(recipe_id)
            if not recipe_data:
                return jsonify({'error': 'Recipe not found'}), 404
            recipe = Recipe.query.filter_by(spoonacular_id=recipe_id).first()
        
        # Check if user already rated this recipe
        existing_rating = RecipeRating.query.filter_by(
            user_id=user_id, recipe_id=recipe.id
        ).first()
        
        if existing_rating:
            existing_rating.rating = rating_value
            existing_rating.review = review
        else:
            new_rating = RecipeRating(
                user_id=user_id,
                recipe_id=recipe.id,
                rating=rating_value,
                review=review
            )
            db.session.add(new_rating)
        
        db.session.commit()
        return jsonify({'message': 'Rating saved successfully'})
        
    except Exception as e:
        logging.error(f"Rate recipe error: {e}")
        db.session.rollback()
        return jsonify({'error': 'Failed to save rating'}), 500

@app.route('/api/recipes/<int:recipe_id>/ratings', methods=['GET'])
def get_recipe_ratings(recipe_id):
    try:
        recipe = Recipe.query.filter_by(spoonacular_id=recipe_id).first()
        if not recipe:
            return jsonify({'ratings': [], 'average': 0})
        
        ratings = RecipeRating.query.filter_by(recipe_id=recipe.id).all()
        return jsonify({
            'ratings': [r.to_dict() for r in ratings],
            'average': recipe.get_average_rating()
        })
        
    except Exception as e:
        logging.error(f"Get ratings error: {e}")
        return jsonify({'error': 'Failed to get ratings'}), 500

@app.route('/api/shopping-list', methods=['POST'])
def create_shopping_list():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        data = request.get_json()
        recipe_ids = data.get('recipe_ids', [])
        list_name = data.get('name', 'My Shopping List')
        
        ingredients = []
        for recipe_id in recipe_ids:
            recipe = Recipe.query.filter_by(spoonacular_id=recipe_id).first()
            if recipe:
                recipe_ingredients = json.loads(recipe.ingredients or '[]')
                ingredients.extend(recipe_ingredients)
        
        shopping_list = ShoppingList(
            user_id=user_id,
            name=list_name,
            items=json.dumps(ingredients)
        )
        
        db.session.add(shopping_list)
        db.session.commit()
        
        return jsonify({'message': 'Shopping list created', 'list': shopping_list.to_dict()})
        
    except Exception as e:
        logging.error(f"Create shopping list error: {e}")
        db.session.rollback()
        return jsonify({'error': 'Failed to create shopping list'}), 500

@app.route('/api/cuisines', methods=['GET'])
def get_cuisines():
    cuisines = [
        'African', 'American', 'British', 'Cajun', 'Caribbean', 'Chinese',
        'Eastern European', 'European', 'French', 'German', 'Greek', 'Indian',
        'Irish', 'Italian', 'Japanese', 'Jewish', 'Korean', 'Latin American',
        'Mediterranean', 'Mexican', 'Middle Eastern', 'Nordic', 'Southern',
        'Spanish', 'Thai', 'Vietnamese'
    ]
    return jsonify({'cuisines': cuisines})

@app.route('/api/meal-types', methods=['GET'])
def get_meal_types():
    meal_types = [
        'main course', 'side dish', 'dessert', 'appetizer', 'salad',
        'bread', 'breakfast', 'soup', 'beverage', 'sauce', 'marinade',
        'fingerfood', 'snack', 'drink'
    ]
    return jsonify({'meal_types': meal_types})

@app.route('/api/diets', methods=['GET'])
def get_diets():
    diets = [
        'gluten free', 'ketogenic', 'vegetarian', 'lacto-vegetarian',
        'ovo-vegetarian', 'vegan', 'pescetarian', 'paleo', 'primal',
        'whole30'
    ]
    return jsonify({'diets': diets})
