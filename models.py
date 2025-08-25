# Models file - simplified version without database
# This file is kept for compatibility but no longer uses database models

# Placeholder for any future data structures if needed
class SimpleUser:
    def __init__(self, username, email):
        self.username = username
        self.email = email

class SimpleRecipe:
    def __init__(self, recipe_data):
        self.data = recipe_data
        
    def to_dict(self):
        return self.data