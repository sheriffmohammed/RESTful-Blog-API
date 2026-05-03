# Blogging Platform Frontend

A React frontend for the Blogging Platform API. The app lets users browse posts, register, log in, create and edit posts, comment, like posts or comments, and manage their own profile content.

## Features

- Public post feed
- User registration and login
- JWT-based authenticated sessions
- Create, edit, and delete posts
- View individual posts with comments
- Add, edit, and delete comments
- Like and unlike posts or comments
- View users who liked posts or comments
- Upload local avatar and post images during development
- Responsive app shell with React Router navigation

## Tech Stack

- React
- TypeScript
- Vite
- React Router DOM
- CSS

## Dependencies

Runtime dependencies installed by `npm install`:

| Package | Purpose |
| --- | --- |
| `react` | UI library |
| `react-dom` | React browser rendering |
| `react-router-dom` | Client-side routing |

Development dependencies installed by `npm install`:

| Package | Purpose |
| --- | --- |
| `@vitejs/plugin-react` | React support for Vite |
| `typescript` | Type checking and compilation |
| `vite` | Development server and production build tool |
| `@types/react` | React TypeScript types |
| `@types/react-dom` | React DOM TypeScript types |
| `@types/node` | Node.js TypeScript types used by the Vite config |

## Project Structure

```text
.
+-- index.html
+-- package.json
+-- vite.config.ts
+-- src
|   +-- App.tsx
|   +-- main.tsx
|   +-- styles.css
|   +-- components
|   +-- lib
|   +-- pages
+-- public
    +-- uploads
```

## Getting Started

### Prerequisites

- Node.js 20 or newer
- npm
- The backend API running at `http://127.0.0.1:8000`

### Installation

Install dependencies:

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

The frontend will run at:

```text
http://127.0.0.1:5173
```

## Backend Connection

By default, the frontend uses relative API paths and the Vite development server proxies backend requests to:

```text
http://127.0.0.1:8000
```

This proxy is configured in `vite.config.ts`.

For a deployed environment, you can set:

```env
VITE_API_BASE_URL=https://your-api-domain.com
```

When this variable is set, API calls are sent to that base URL instead of using local relative paths.

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check and build the production app |
| `npm run preview` | Preview the production build locally |

## App Routes

| Route | Description |
| --- | --- |
| `/` | Public home feed |
| `/login` | Login page |
| `/register` | Registration page |
| `/me` | Current user's posts and profile area |
| `/posts/new` | Create a new post |
| `/posts/:postId` | View a single post |
| `/posts/:postId/edit` | Edit an existing post |

## Authentication

The app stores the JWT access token locally and sends it with protected API requests:

```http
Authorization: Bearer <access_token>
```

If the token is invalid or expired, the user is logged out.

## Image Uploads

During development, the Vite server includes a local upload endpoint:

```text
POST /__uploads
```

Uploaded files are saved under:

```text
public/uploads
```

The frontend then stores the returned image path with the user or post data. This is intended for local development and should be replaced with a real file storage service for production.

## Build

Create a production build:

```bash
npm run build
```

Preview the build:

```bash
npm run preview
```

## Notes

- The backend must be running before using the app in development.
- The frontend expects the backend routes from the Blogging Platform API project.
- Uploaded files in `public/uploads` are local development assets.
