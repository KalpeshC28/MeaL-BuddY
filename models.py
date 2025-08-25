from datetime import datetime
from app import db
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    favorites = db.relationship('UserFavorite', backref='user', lazy=True, cascade='all, delete-orphan')
    search_history = db.relationship('SearchHistory', backref='user', lazy=True, cascade='all, delete-orphan')
    recipe_ratings = db.relationship('RecipeRating', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat()
        }

class Recipe(db.Model):
    __tablename__ = 'recipes'
    
    id = db.Column(db.Integer, primary_key=True)
    spoonacular_id = db.Column(db.Integer, unique=True, nullable=False)
    title = db.Column(db.String(200), nullable=False)
    image_url = db.Column(db.String(500))
    ready_in_minutes = db.Column(db.Integer)
    servings = db.Column(db.Integer)
    summary = db.Column(db.Text)
    instructions = db.Column(db.Text)
    ingredients = db.Column(db.Text)  # JSON string
    cuisine_types = db.Column(db.String(200))  # Comma-separated
    meal_types = db.Column(db.String(200))  # Comma-separated
    dietary_info = db.Column(db.String(200))  # Comma-separated
    nutrition_info = db.Column(db.Text)  # JSON string
    difficulty_level = db.Column(db.String(20))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    favorites = db.relationship('UserFavorite', backref='recipe', lazy=True, cascade='all, delete-orphan')
    ratings = db.relationship('RecipeRating', backref='recipe', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'spoonacular_id': self.spoonacular_id,
            'title': self.title,
            'image_url': self.image_url,
            'ready_in_minutes': self.ready_in_minutes,
            'servings': self.servings,
            'summary': self.summary,
            'instructions': self.instructions,
            'ingredients': self.ingredients,
            'cuisine_types': self.cuisine_types.split(',') if self.cuisine_types else [],
            'meal_types': self.meal_types.split(',') if self.meal_types else [],
            'dietary_info': self.dietary_info.split(',') if self.dietary_info else [],
            'nutrition_info': self.nutrition_info,
            'difficulty_level': self.difficulty_level,
            'created_at': self.created_at.isoformat(),
            'average_rating': self.get_average_rating()
        }
    
    def get_average_rating(self):
        if self.ratings:
            return sum(rating.rating for rating in self.ratings) / len(self.ratings)
        return 0

class UserFavorite(db.Model):
    __tablename__ = 'user_favorites'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    recipe_id = db.Column(db.Integer, db.ForeignKey('recipes.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    __table_args__ = (db.UniqueConstraint('user_id', 'recipe_id'),)

class SearchHistory(db.Model):
    __tablename__ = 'search_history'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    query = db.Column(db.String(200), nullable=False)
    cuisine_filter = db.Column(db.String(50))
    meal_type_filter = db.Column(db.String(50))
    dietary_filter = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'query': self.query,
            'cuisine_filter': self.cuisine_filter,
            'meal_type_filter': self.meal_type_filter,
            'dietary_filter': self.dietary_filter,
            'created_at': self.created_at.isoformat()
        }

class RecipeRating(db.Model):
    __tablename__ = 'recipe_ratings'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    recipe_id = db.Column(db.Integer, db.ForeignKey('recipes.id'), nullable=False)
    rating = db.Column(db.Integer, nullable=False)  # 1-5 stars
    review = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (db.UniqueConstraint('user_id', 'recipe_id'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'rating': self.rating,
            'review': self.review,
            'created_at': self.created_at.isoformat(),
            'user': self.user.username if self.user else None
        }

class ShoppingList(db.Model):
    __tablename__ = 'shopping_lists'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    items = db.Column(db.Text)  # JSON string
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'items': self.items,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
