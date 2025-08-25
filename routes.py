from flask import request, jsonify, session, render_template
from app import app
from recipe_service import recipe_service
import json
import logging

# In-memory storage for demo (will reset when server restarts)
users = {}
user_favorites = {}
search_history = {}

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
        if username in users:
            return jsonify({'error': 'Username already exists'}), 409
        
        # Create new user (simplified)
        user_id = len(users) + 1
        users[username] = {
            'id': user_id,
            'username': username,
            'email': email,
            'password': password  # In production, this should be hashed!
        }
        
        # Log user in
        session['user_id'] = user_id
        session['username'] = username
        
        return jsonify({
            'message': 'User registered successfully',
            'user': {'id': user_id, 'username': username, 'email': email}
        }), 201
        
    except Exception as e:
        logging.error(f"Registration error: {e}")
        return jsonify({'error': 'Registration failed'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        user = users.get(username)
        
        if user and user['password'] == password:
            session['user_id'] = user['id']
            session['username'] = username
            return jsonify({
                'message': 'Login successful',
                'user': {'id': user['id'], 'username': username, 'email': user['email']}
            })
        else:
            return jsonify({'error': 'Invalid credentials'}), 401
            
    except Exception as e:
        logging.error(f"Login error: {e}")
        return jsonify({'error': 'Login failed'}), 500

@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    session.pop('username', None)
    return jsonify({'message': 'Logged out successfully'})

@app.route('/api/user', methods=['GET'])
def get_current_user():
    user_id = session.get('user_id')
    username = session.get('username')
    if not user_id or not username:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user = users.get(username)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({'user': {'id': user['id'], 'username': username, 'email': user['email']}})

@app.route('/api/recipes/search', methods=['GET'])
def search_recipes():
    try:
        query = request.args.get('query', '')
        cuisine = request.args.get('cuisine', '')
        meal_type = request.args.get('meal_type', '')
        diet = request.args.get('diet', '')
        max_results = int(request.args.get('max_results', 12))
        
        # Save search to history if user is logged in (simplified)
        username = session.get('username')
        if username and query:
            if username not in search_history:
                search_history[username] = []
            search_history[username].append({
                'query': query,
                'cuisine': cuisine,
                'meal_type': meal_type,
                'diet': diet
            })
            # Keep only last 20 searches
            search_history[username] = search_history[username][-20:]
        
        recipes = recipe_service.search_recipes(query, cuisine, meal_type, diet, max_results)
        return jsonify({'recipes': recipes})
        
    except Exception as e:
        logging.error(f"Search error: {e}")
        return jsonify({'error': 'Search failed'}), 500

@app.route('/api/recipes/<int:recipe_id>', methods=['GET'])
def get_recipe_detail(recipe_id):
    try:
        servings = request.args.get('servings', type=int)
        
        # Get recipe details from API
        recipe_data = recipe_service.get_recipe_details(recipe_id)
        if not recipe_data:
            return jsonify({'error': 'Recipe not found'}), 404
        
        # Adjust servings if requested (simplified)
        if servings and servings != recipe_data.get('servings'):
            recipe_data = recipe_service.adjust_servings(recipe_data, servings)
        
        return jsonify({'recipe': recipe_data})
        
    except Exception as e:
        logging.error(f"Recipe detail error: {e}")
        return jsonify({'error': 'Failed to get recipe details'}), 500

@app.route('/api/favorites', methods=['GET'])
def get_favorites():
    username = session.get('username')
    if not username:
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        favorites = user_favorites.get(username, [])
        return jsonify({'favorites': favorites})
        
    except Exception as e:
        logging.error(f"Get favorites error: {e}")
        return jsonify({'error': 'Failed to get favorites'}), 500

@app.route('/api/favorites', methods=['POST'])
def add_favorite():
    username = session.get('username')
    if not username:
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        data = request.get_json()
        recipe_id = data.get('recipe_id')
        
        # Get recipe details to store
        recipe_data = recipe_service.get_recipe_details(recipe_id)
        if not recipe_data:
            return jsonify({'error': 'Recipe not found'}), 404
        
        # Initialize user favorites if not exists
        if username not in user_favorites:
            user_favorites[username] = []
        
        # Check if already favorited
        existing = any(fav.get('spoonacular_id') == recipe_id for fav in user_favorites[username])
        if existing:
            return jsonify({'error': 'Recipe already in favorites'}), 409
        
        user_favorites[username].append(recipe_data)
        return jsonify({'message': 'Added to favorites'})
        
    except Exception as e:
        logging.error(f"Add favorite error: {e}")
        return jsonify({'error': 'Failed to add favorite'}), 500

@app.route('/api/favorites/<int:recipe_id>', methods=['DELETE'])
def remove_favorite(recipe_id):
    username = session.get('username')
    if not username:
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        if username not in user_favorites:
            return jsonify({'error': 'Recipe not in favorites'}), 404
        
        # Remove from favorites
        user_favorites[username] = [
            fav for fav in user_favorites[username] 
            if fav.get('spoonacular_id') != recipe_id
        ]
        
        return jsonify({'message': 'Removed from favorites'})
        
    except Exception as e:
        logging.error(f"Remove favorite error: {e}")
        return jsonify({'error': 'Failed to remove favorite'}), 500

@app.route('/api/history', methods=['GET'])
def get_search_history():
    username = session.get('username')
    if not username:
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        history = search_history.get(username, [])
        # Add mock created_at for compatibility
        formatted_history = []
        for i, h in enumerate(history):
            formatted_history.append({
                'id': i,
                'query': h['query'],
                'cuisine_filter': h['cuisine'],
                'meal_type_filter': h['meal_type'],
                'dietary_filter': h['diet'],
                'created_at': '2025-01-01T00:00:00Z'  # Mock timestamp
            })
        
        return jsonify({'history': formatted_history})
        
    except Exception as e:
        logging.error(f"Get history error: {e}")
        return jsonify({'error': 'Failed to get search history'}), 500

# Simplified rating system (no persistence)
@app.route('/api/recipes/<int:recipe_id>/rating', methods=['POST'])
def rate_recipe(recipe_id):
    username = session.get('username')
    if not username:
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        data = request.get_json()
        rating_value = data.get('rating')
        review = data.get('review', '')
        
        if not rating_value or rating_value < 1 or rating_value > 5:
            return jsonify({'error': 'Rating must be between 1 and 5'}), 400
        
        # For demo purposes, just return success
        return jsonify({'message': 'Rating submitted successfully'})
        
    except Exception as e:
        logging.error(f"Rate recipe error: {e}")
        return jsonify({'error': 'Failed to save rating'}), 500

@app.route('/api/recipes/<int:recipe_id>/ratings', methods=['GET'])
def get_recipe_ratings(recipe_id):
    try:
        # Return empty ratings for demo
        return jsonify({
            'ratings': [],
            'average': 0
        })
        
    except Exception as e:
        logging.error(f"Get ratings error: {e}")
        return jsonify({'error': 'Failed to get ratings'}), 500

@app.route('/api/shopping-list', methods=['POST'])
def create_shopping_list():
    username = session.get('username')
    if not username:
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        data = request.get_json()
        recipe_ids = data.get('recipe_ids', [])
        list_name = data.get('name', 'My Shopping List')
        
        # For demo purposes, just return success
        return jsonify({'message': 'Shopping list created', 'list': {'name': list_name}})
        
    except Exception as e:
        logging.error(f"Create shopping list error: {e}")
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