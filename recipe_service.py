import os
import requests
import json
import logging
from app import db
from models import Recipe

class RecipeService:
    def __init__(self):
        self.api_key = os.environ.get("SPOONACULAR_API_KEY", "default_key")
        self.base_url = "https://api.spoonacular.com/recipes"
        
    def search_recipes(self, query="", cuisine="", meal_type="", diet="", max_results=12):
        """Search for recipes using Spoonacular API"""
        try:
            params = {
                "apiKey": self.api_key,
                "query": query,
                "number": max_results,
                "addRecipeInformation": True,
                "fillIngredients": True
            }
            
            if cuisine:
                params["cuisine"] = cuisine
            if meal_type:
                params["type"] = meal_type
            if diet:
                params["diet"] = diet
                
            response = requests.get(f"{self.base_url}/complexSearch", params=params)
            response.raise_for_status()
            
            data = response.json()
            recipes = []
            
            for recipe_data in data.get('results', []):
                recipe = self._process_recipe_data(recipe_data)
                if recipe:
                    recipes.append(recipe)
                    
            return recipes
            
        except requests.RequestException as e:
            logging.error(f"Error searching recipes: {e}")
            return []
    
    def get_recipe_details(self, recipe_id):
        """Get detailed recipe information"""
        try:
            params = {
                "apiKey": self.api_key,
                "includeNutrition": True
            }
            
            response = requests.get(f"{self.base_url}/{recipe_id}/information", params=params)
            response.raise_for_status()
            
            recipe_data = response.json()
            return self._process_recipe_data(recipe_data, detailed=True)
            
        except requests.RequestException as e:
            logging.error(f"Error getting recipe details: {e}")
            return None
    
    def get_recipe_instructions(self, recipe_id):
        """Get recipe cooking instructions"""
        try:
            params = {"apiKey": self.api_key}
            
            response = requests.get(f"{self.base_url}/{recipe_id}/analyzedInstructions", params=params)
            response.raise_for_status()
            
            return response.json()
            
        except requests.RequestException as e:
            logging.error(f"Error getting recipe instructions: {e}")
            return []
    
    def _process_recipe_data(self, recipe_data, detailed=False):
        """Process and save recipe data to database"""
        try:
            spoonacular_id = recipe_data['id']
            
            # Check if recipe already exists
            existing_recipe = Recipe.query.filter_by(spoonacular_id=spoonacular_id).first()
            if existing_recipe:
                return existing_recipe.to_dict()
            
            # Extract cuisine types
            cuisine_types = []
            if 'cuisines' in recipe_data:
                cuisine_types = recipe_data['cuisines']
            
            # Extract meal types
            meal_types = []
            if 'dishTypes' in recipe_data:
                meal_types = recipe_data['dishTypes']
            
            # Extract dietary information
            dietary_info = []
            if recipe_data.get('vegetarian'):
                dietary_info.append('vegetarian')
            if recipe_data.get('vegan'):
                dietary_info.append('vegan')
            if recipe_data.get('glutenFree'):
                dietary_info.append('gluten-free')
            if recipe_data.get('dairyFree'):
                dietary_info.append('dairy-free')
            
            # Process ingredients
            ingredients = []
            if 'extendedIngredients' in recipe_data:
                for ingredient in recipe_data['extendedIngredients']:
                    ingredients.append({
                        'name': ingredient.get('name', ''),
                        'amount': ingredient.get('amount', 0),
                        'unit': ingredient.get('unit', ''),
                        'original': ingredient.get('original', '')
                    })
            
            # Process instructions
            instructions = ""
            if 'instructions' in recipe_data and recipe_data['instructions']:
                instructions = recipe_data['instructions']
            elif 'analyzedInstructions' in recipe_data:
                instruction_steps = []
                for instruction_group in recipe_data['analyzedInstructions']:
                    for step in instruction_group.get('steps', []):
                        instruction_steps.append(f"{step['number']}. {step['step']}")
                instructions = "\n".join(instruction_steps)
            
            # Process nutrition info
            nutrition_info = {}
            if 'nutrition' in recipe_data:
                nutrition_info = {
                    'calories': recipe_data['nutrition'].get('nutrients', [{}])[0].get('amount', 0),
                    'protein': next((n['amount'] for n in recipe_data['nutrition'].get('nutrients', []) if n['name'] == 'Protein'), 0),
                    'carbs': next((n['amount'] for n in recipe_data['nutrition'].get('nutrients', []) if n['name'] == 'Carbohydrates'), 0),
                    'fat': next((n['amount'] for n in recipe_data['nutrition'].get('nutrients', []) if n['name'] == 'Fat'), 0)
                }
            
            # Determine difficulty level
            ready_time = recipe_data.get('readyInMinutes', 30)
            if ready_time <= 20:
                difficulty = 'Easy'
            elif ready_time <= 45:
                difficulty = 'Medium'
            else:
                difficulty = 'Hard'
            
            # Create new recipe
            recipe = Recipe(
                spoonacular_id=spoonacular_id,
                title=recipe_data.get('title', ''),
                image_url=recipe_data.get('image', ''),
                ready_in_minutes=ready_time,
                servings=recipe_data.get('servings', 1),
                summary=recipe_data.get('summary', ''),
                instructions=instructions,
                ingredients=json.dumps(ingredients),
                cuisine_types=','.join(cuisine_types),
                meal_types=','.join(meal_types),
                dietary_info=','.join(dietary_info),
                nutrition_info=json.dumps(nutrition_info),
                difficulty_level=difficulty
            )
            
            db.session.add(recipe)
            db.session.commit()
            
            return recipe.to_dict()
            
        except Exception as e:
            logging.error(f"Error processing recipe data: {e}")
            db.session.rollback()
            return None
    
    def adjust_servings(self, recipe_data, new_servings):
        """Adjust recipe ingredients for different serving sizes"""
        try:
            original_servings = recipe_data.get('servings', 1)
            if original_servings == 0:
                original_servings = 1
                
            multiplier = new_servings / original_servings
            
            adjusted_ingredients = []
            ingredients = json.loads(recipe_data.get('ingredients', '[]'))
            
            for ingredient in ingredients:
                adjusted_ingredient = ingredient.copy()
                if 'amount' in adjusted_ingredient:
                    adjusted_ingredient['amount'] = round(adjusted_ingredient['amount'] * multiplier, 2)
                adjusted_ingredients.append(adjusted_ingredient)
            
            adjusted_recipe = recipe_data.copy()
            adjusted_recipe['ingredients'] = json.dumps(adjusted_ingredients)
            adjusted_recipe['servings'] = new_servings
            
            return adjusted_recipe
            
        except Exception as e:
            logging.error(f"Error adjusting servings: {e}")
            return recipe_data

# Initialize service
recipe_service = RecipeService()
