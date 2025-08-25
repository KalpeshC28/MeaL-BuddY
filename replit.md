# Smart Recipe Generator

## Overview

Smart Recipe Generator is a full-stack web application that helps users discover, search, and manage recipes. The application integrates with the Spoonacular API to provide comprehensive recipe data including ingredients, instructions, nutritional information, and cooking details. Users can search for recipes with various filters, save favorites, rate recipes, and maintain their cooking history.

**Recent Updates (January 2025):**
- Removed PostgreSQL dependency - now works as a simple web app with in-memory storage
- Complete UI transformation to futuristic design with glassmorphism effects
- Dark theme with neon cyan, purple, and pink accents
- Modern Space Grotesk and JetBrains Mono typography
- Smooth animations, floating elements, and interactive transitions
- Enhanced loading screen and micro-interactions throughout the app

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Technology**: React with vanilla JavaScript (using Babel for JSX transformation)
- **UI Framework**: Bootstrap 5 for responsive design and components
- **Component Structure**: Modular React components including RecipeCard, RecipeFilter, RecipeDetail, and UserHistory
- **State Management**: React hooks (useState, useEffect) for local component state
- **Styling**: Custom CSS with CSS variables for theming, gradient designs, and responsive layouts
- **API Communication**: Axios for HTTP requests with credential support

### Backend Architecture
- **Framework**: Flask (Python) with modular route organization
- **Database ORM**: SQLAlchemy with declarative base model pattern
- **Authentication**: Session-based authentication with password hashing using Werkzeug
- **API Design**: RESTful endpoints under `/api` prefix for clean separation
- **CORS**: Enabled for cross-origin requests with credential support
- **Logging**: Built-in Python logging for debugging and error tracking

### Data Storage Solutions
- **Database**: SQL database with SQLAlchemy ORM (configured via DATABASE_URL environment variable)
- **Schema Design**: Relational model with User, Recipe, UserFavorite, SearchHistory, RecipeRating, and ShoppingList tables
- **User Management**: Secure password hashing and user session management
- **Recipe Caching**: Local recipe storage to reduce API calls and improve performance
- **Connection Pooling**: Configured with pool recycling and pre-ping for connection reliability

### Authentication and Authorization
- **Session Management**: Flask sessions with configurable secret key
- **Password Security**: Werkzeug password hashing with salt
- **User Model**: Flask-Login UserMixin integration for authentication state
- **Access Control**: Session-based authentication checks for protected endpoints
- **Registration/Login**: Complete user registration and authentication flow

### Service Layer Architecture
- **Recipe Service**: Dedicated service class for Spoonacular API integration
- **API Abstraction**: Clean separation between external API calls and application logic
- **Error Handling**: Comprehensive error handling for API failures and rate limiting
- **Data Processing**: Recipe data normalization and formatting for consistent application use

## External Dependencies

### Third-Party APIs
- **Spoonacular API**: Primary recipe data source providing search, detailed recipe information, and nutritional data
- **API Key Management**: Environment variable configuration for secure API key storage

### Frontend Libraries
- **React 18**: Component-based UI library loaded via CDN
- **Bootstrap 5**: CSS framework for responsive design and pre-built components
- **Font Awesome 6**: Icon library for user interface elements
- **Axios**: HTTP client for API communication
- **Babel Standalone**: JSX transformation for in-browser React compilation

### Backend Dependencies
- **Flask**: Core web framework
- **Flask-SQLAlchemy**: Database ORM integration
- **Flask-CORS**: Cross-origin resource sharing support
- **Flask-Login**: User session management (referenced in models)
- **Werkzeug**: WSGI utilities and security functions
- **Requests**: HTTP library for external API calls

### Infrastructure Components
- **ProxyFix**: Werkzeug middleware for handling reverse proxy headers
- **Environment Configuration**: Database URL and API keys via environment variables
- **Static File Serving**: Flask static file handling for CSS, JavaScript, and assets
- **Template Engine**: Jinja2 templating for HTML rendering