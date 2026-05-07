# Blogging Platform API

A FastAPI backend for a blogging platform with user authentication, posts, comments, likes, and profile updates.

## Features

- User registration and login
- JWT bearer-token authentication
- Password hashing with Argon2
- Create, read, update, and delete blog posts
- Create, read, update, and delete comments
- Like and unlike posts or comments
- View users who liked a post or comment
- MySQL database integration with SQLModel
- React frontend with light, oceanic, dark grey, and cyberpunk themes
- Environment-based configuration

## Tech Stack

- Python
- FastAPI
- Uvicorn
- SQLModel
- MySQL
- PyMySQL
- PyJWT
- python-dotenv
- pwdlib with Argon2

## Dependencies

Backend dependencies are installed from `requierments.txt`:

| Package | Purpose |
| --- | --- |
| `fastapi[standard]` | API framework and standard FastAPI tooling |
| `uvicorn[standard]` | ASGI server for running the app |
| `sqlmodel` | Database models and SQL queries |
| `pymysql` | MySQL database driver |
| `cryptography` | MySQL authentication support used by PyMySQL |
| `pwdlib[argon2]` | Password hashing |
| `pyjwt` | JWT token encoding and decoding |
| `python-dotenv` | Loading environment variables from `.env` |
| `email-validator` | Email validation for Pydantic `EmailStr` fields |
| `python-multipart` | Form parsing for the login endpoint |

## Project Structure

```text
.
+-- api.py
+-- db.py
+-- db_utils.py
+-- frontend
+|   +-- src
+|   +-- public
+|   +-- package.json
+-- requierments.txt
+-- README.md
```

## Frontend

The React frontend lives in `frontend/`. It includes a grouped theme menu with four saved options:

| Theme | Description |
| --- | --- |
| `light` | Original bright editorial theme |
| `oceanic` | Preserved teal-and-blue dark theme |
| `dark` | New neutral dark grey theme |
| `cyberpunk` | Neon cyan, magenta, and yellow dark theme |

Local frontend upload files and build artifacts are ignored by Git. Local environment overrides such as `.env.local` and `.env.*.local` are also ignored.

## Getting Started

### Prerequisites

- Python 3.10 or newer
- MySQL server
- A MySQL database named `blog`

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd Blogging-platform-api
```

2. Create and activate a virtual environment:

```bash
python -m venv .venv
.venv\Scripts\activate
```

3. Install dependencies:

```bash
pip install -r requierments.txt
```

4. Create a `.env` file in the project root:

```env
DB_USERNAME=your_mysql_username
DB_PASSWORD=your_mysql_password
API_SECRET_KEY=your_secret_key
```

5. Make sure MySQL is running and the `blog` database exists:

```sql
CREATE DATABASE blog;
```

## Database Tables

The SQLModel table models are defined in `db.py`. To create the tables, uncomment the table creation lines at the bottom of `db.py`, run the file once, then comment them again.

```python
engine = create_engine(DATABASE_URL)
SQLModel.metadata.create_all(engine)
```

## Running the API

Start the development server:

```bash
fastapi dev api.py
```

The API will be available at:

```text
http://127.0.0.1:8000
```

Interactive API documentation:

```text
http://127.0.0.1:8000/docs
```

## Authentication

Login uses OAuth2 password form data:

```http
POST /login
```

Send authenticated requests with a bearer token:

```http
Authorization: Bearer <access_token>
```

Access tokens expire after 30 minutes.

## API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/register/` | Register a new user |
| `POST` | `/login` | Login and receive an access token |
| `GET` | `/posts/` | Get all posts |
| `GET` | `/user-posts/{user_id}` | Get posts by user |
| `GET` | `/get-post/{post_id}` | Get a single post |
| `GET` | `/comments/{post_id}` | Get comments for a post |
| `GET` | `/users-who-liked-post/{post_id}` | Get users who liked a post |
| `GET` | `/users-who-liked-comment/{comment_id}` | Get users who liked a comment |

### Protected Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/me/` | Get the current authenticated user |
| `POST` | `/post/` | Create a post |
| `POST` | `/comment/{post_id}` | Add a comment to a post |
| `POST` | `/like-post/{post_id}` | Like a post |
| `POST` | `/like-comment/{comment_id}` | Like a comment |
| `PATCH` | `/update-post/{post_id}` | Update your post |
| `PATCH` | `/edit-comment/{comment_id}` | Edit your comment |
| `PATCH` | `/edit-user-data/` | Update your user data |
| `DELETE` | `/delete-post/{post_id}` | Delete your post |
| `DELETE` | `/delete-comment/{comment_id}` | Delete your comment |
| `DELETE` | `/delete-like-post/{post_id}` | Unlike a post |
| `DELETE` | `/delete-like-comment/{comment_id}` | Unlike a comment |

## Example Requests

### Register

```json
{
  "user_name": "demo_user",
  "email": "demo@example.com",
  "password": "strongpass123",
  "photo_path": "/images/profile.png"
}
```

### Login

```text
username=demo_user
password=strongpass123
```

### Create Post

```json
{
  "content": "My first blog post",
  "photo_path": "/images/post-cover.png"
}
```

### Create Comment

```json
{
  "content": "Nice post"
}
```

## Notes

- `photo_path` is stored as a string. There is no file upload endpoint yet.
- Pagination uses `skip` and `limit` query parameters.
- The API uses a local MySQL database connection at `localhost:3306/blog`.
- The dependency file is currently named `requierments.txt`.
