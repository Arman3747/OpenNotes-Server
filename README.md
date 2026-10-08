![App Screenshot](https://i.ibb.co/TD506KZZ/Open-Notes-Hero.png)

# Blogging platform - (OpenNotes)

In this Web App, you can post a blog and share

## Live Link

- Please Visit [OpenNotes](#) !

## 🚀 Key Features of OpenNotes

- 👥 **User Role Detection in Navbar**  
  Dynamically shows or hides options in the navigation bar based on whether the user is logged in or not.
- 🔐 **JWT Authentication System**  
  All private routes are protected using JSON Web Tokens (JWT), with support for email/password and Google sign-in.

---

## 👤 User Model

**Fields & Validation:**

Required indicates whether a value must be supplied when creating a user. Fields with defaults or automatic values can be omitted.

| Field          | Type       | Required | Details                                                                                                     |
| -------------- | ---------- | -------- | ----------------------------------------------------------------------------------------------------------- |
| id             | string     | No       | Primary key; automatically generated UUID with `uuid()`                                                     |
| email          | string     | Yes      | Unique email address; email format validation is not defined in this model                                  |
| password       | string     | No       | Nullable password field; store a password hash, not plain text                                              |
| name           | string     | No       | User’s name; nullable                                                                                       |
| username       | string     | No       | Unique username when provided; nullable                                                                     |
| profilePhoto   | string     | No       | Profile photo reference or URL; nullable                                                                    |
| boi            | string     | No       | User biography; nullable; field name preserved as `boi`                                                     |
| role           | Role       | No       | Defaults to `USER`; allowed values depend on the `Role` enum definition `SUPER_ADMIN, ADMIN, USER`          |
| phone          | string     | No       | Phone number; nullable                                                                                      |
| country        | string     | No       | User’s country; nullable                                                                                    |
| status         | UserStatus | No       | Defaults to `ACTIVE`; allowed values depend on the `UserStatus` enum definition `ACTIVE, INACTIVE, BLOCKED` |
| isVerified     | boolean    | No       | Defaults to `false`; indicates whether the user is verified                                                 |
| website        | string     | No       | User’s website; nullable                                                                                    |
| instagram      | string     | No       | Instagram reference; nullable                                                                               |
| followersCount | integer    | No       | Followers count; defaults to `0`                                                                            |
| followingCount | integer    | No       | Following count; defaults to `0`                                                                            |
| postsCount     | integer    | No       | Post count; defaults to `0`                                                                                 |
| lastLoginAt    | DateTime   | No       | Last login timestamp; nullable                                                                              |
| deletedAt      | DateTime   | No       | Soft deletion timestamp; nullable                                                                           |
| createdAt      | DateTime   | No       | Automatically defaults to the current timestamp with `now()`                                                |
| updatedAt      | DateTime   | No       | Automatically managed by Prisma using `@updatedAt`                                                          |

**Relations:**

| Field     | Type           | Required | Details                                                                                    |
| --------- | -------------- | -------- | ------------------------------------------------------------------------------------------ |
| posts     | BlogPost[]     | No       | Related blog posts; can be empty                                                           |
| comments  | Comment[]      | No       | Related comments; can be empty                                                             |
| likes     | Like[]         | No       | Related likes; can be empty                                                                |
| bookmark  | Bookmark[]     | No       | Related bookmarks; can be empty                                                            |
| following | Follower[]     | No       | Follower records using the named relation `following`                                      |
| followers | Follower[]     | No       | Follower records using the named relation `followers`                                      |
| userId    | Notification[] | No       | Notification records using the named relation `userId`; a relation list, not a scalar ID   |
| senderId  | Notification[] | No       | Notification records using the named relation `senderId`; a relation list, not a scalar ID |
| analytics | Analytics[]    | No       | Related analytics records; can be empty                                                    |

## 🗂️ Categories Model

**Fields & Validation:**

| Field                | Type     | Required | Details                                                           |
| -------------------- | -------- | -------- | ----------------------------------------------------------------- |
| id                   | string   | No       | Primary key; automatically generated UUID using `uuid()`          |
| categoriesName       | string   | Yes      | Category name; no uniqueness or minimum length constraint defined |
| icon                 | string   | No       | Optional category icon reference; nullable                        |
| categoriesPostsCount | integer  | No       | Number of posts in the category; defaults to `0`                  |
| createdAt            | DateTime | No       | Creation timestamp; defaults to the current time using `now()`    |
| updatedAt            | DateTime | No       | Timestamp automatically managed by Prisma using `@updatedAt`      |

**Relations:**

| Field | Type       | Required | Details                               |
| ----- | ---------- | -------- | ------------------------------------- |
| posts | BlogPost[] | No       | Related blog posts; can be empty list |

## 📝 BlogPost Model

**Fields & Validation:**

Required indicates whether a value must be supplied when creating a blog post. Fields with defaults or automatic values can be omitted. Required foreign keys can also be populated through their corresponding relation inputs.

| Field         | Type               | Required | Details                                                                                                                                       |
| ------------- | ------------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| id            | string             | No       | Primary key; automatically generated UUID with `uuid()`                                                                                       |
| title         | string             | Yes      | Blog post title; no minimum or maximum length defined in this model                                                                           |
| slug          | string             | No       | Unique slug when provided; nullable; no automatic slug generation defined                                                                     |
| content       | Json               | Yes      | JSON content for an editor such as Tiptap, Slate, BlockNote, Editor.js, or Draft.js; editor-specific structure is not validated by this model |
| coverImage    | string             | No       | Cover image reference or URL; nullable                                                                                                        |
| categoryId    | string             | Yes      | Foreign key referencing `Categories.id`; can be populated through the `category` relation                                                     |
| isFeatured    | boolean            | No       | Defaults to `false`; intended for admin-only changes, which must be enforced in application logic                                             |
| tags          | string[]           | No       | List of tag strings; can be empty; no explicit `@default` declared                                                                            |
| status        | BlogPostStatus     | No       | Defaults to `PUBLISHED`; other allowed values depend on the enum definition `DRAFT, PUBLISHED`                                                |
| visibility    | BlogPostVisibility | No       | Defaults to `PUBLIC`; other allowed values depend on the enum definition `PUBLIC, PRIVATE`                                                    |
| views         | integer            | No       | View count; defaults to `0`                                                                                                                   |
| readTime      | integer            | No       | Reading duration; nullable; unit is not specified in this model                                                                               |
| likesCount    | integer            | No       | Like count; defaults to `0`                                                                                                                   |
| commentsCount | integer            | No       | Comment count; defaults to `0`                                                                                                                |
| sharesCount   | integer            | No       | Share count; defaults to `0`                                                                                                                  |
| authorId      | string             | Yes      | Foreign key referencing `User.id`; can be populated through the `author` relation                                                             |
| createdAt     | DateTime           | No       | Automatically defaults to the current timestamp with `now()`                                                                                  |
| updatedAt     | DateTime           | No       | Automatically managed by Prisma using `@updatedAt`                                                                                            |
| publishedAt   | DateTime           | No       | Publication timestamp; nullable; not automatically set by this model                                                                          |

**Relations:**

| Field         | Type           | Required | Details                                                                                |
| ------------- | -------------- | -------- | -------------------------------------------------------------------------------------- |
| category      | Categories     | Yes      | Related category; linked through `categoryId` referencing `Categories.id`              |
| comments      | Comment[]      | No       | Related comments; can be empty                                                         |
| likes         | Like[]         | No       | Related likes; can be empty                                                            |
| bookmarks     | Bookmark[]     | No       | Related bookmarks; can be empty                                                        |
| Notifications | Notification[] | No       | Related notifications; can be empty; field capitalization preserved as `Notifications` |
| analytics     | Analytics[]    | No       | Related analytics records; can be empty                                                |
| author        | User           | Yes      | Related author; linked through `authorId` referencing `User.id`                        |

## 💬 Comment Model

**Fields & Validation:**

Required indicates whether a value must be supplied when creating a comment. Fields with defaults or automatic values can be omitted. Required foreign keys can also be populated through their corresponding relation inputs.

| Field      | Type     | Required | Details                                                                                    |
| ---------- | -------- | -------- | ------------------------------------------------------------------------------------------ |
| id         | string   | No       | Primary key; automatically generated UUID with `uuid()`                                    |
| content    | string   | Yes      | Comment text; no minimum or maximum length defined in this model                           |
| likesCount | integer  | No       | Like count; defaults to `0`                                                                |
| isEdited   | boolean  | No       | Defaults to `false`; indicates whether the comment has been edited                         |
| authorId   | string   | Yes      | Foreign key referencing `User.id`; can be populated through the `author` relation          |
| postId     | string   | Yes      | Foreign key referencing `BlogPost.id`; can be populated through the `commentPost` relation |
| createdAt  | DateTime | No       | Automatically defaults to the current timestamp with `now()`                               |
| updatedAt  | DateTime | No       | Automatically managed by Prisma using `@updatedAt`                                         |

**Relations:**

| Field       | Type     | Required | Details                                                                                  |
| ----------- | -------- | -------- | ---------------------------------------------------------------------------------------- |
| author      | User     | Yes      | Comment author; linked through `authorId` referencing `User.id`                          |
| commentPost | BlogPost | Yes      | Blog post associated with the comment; linked through `postId` referencing `BlogPost.id` |
| likes       | Like[]   | No       | Related likes; can be empty                                                              |

---

# ROUTES

### AUTH Routes

| Route                          | Method | Description             |
| ------------------------------ | ------ | ----------------------- |
| `/api/v1/auth/register`        | POST   | Create a new `USER`     |
| `/api/v1/auth/login`           | POST   | `USER` Login            |
| `/api/v1/auth/logout`          | POST   | `USER` Logout           |
| `/api/v1/auth/refresh-token`   | POST   | Get New `Refresh Token` |
| `/api/v1/auth/change-password` | POST   | Change User Password    |
| `/api/v1/auth/forgot-password` | POST   | Forgot Password         |
| `/api/v1/auth/reset-password`  | POST   | Reset User Password     |

### USER Routes

| Route                  | Method | Description                         |
| ---------------------- | ------ | ----------------------------------- |
| `/api/v1/user/me`      | GET    | GET `USER` Details                  |
| `/api/v1/user/:userId` | GET    | GET `USER` Details with `userId`    |
| `/api/v1/user/:userId` | PATCH  | Update `USER` Details with `userId` |

### CATEGORY Routes

| Route                            | Method | Description                                                        |
| -------------------------------- | ------ | ------------------------------------------------------------------ |
| `/api/v1/categories`             | GET    | GET All Category                                                   |
| `/api/v1/categories/:categoryId` | GET    | GET a single Category with categoryId                              |
| `/api/v1/categories`             | POST   | POST a Category - only `ADMIN AND SUPER_ADMIN` can post a Category |

### POSTS Routes

| Route                                  | Method | Description                   |
| -------------------------------------- | ------ | ----------------------------- |
| `/api/v1/post?page=1&limit=10`         | GET    | GET All POST                  |
| `/api/v1/post?search=nextjs&tag=react` | GET    | GET All POST                  |
| `/api/v1/post?authorId=USER_UUID`      | GET    | GET All POST                  |
| `/api/v1/post/:postId`                 | GET    | GET A Single POST with postId |
| `/api/v1/post/slug/:slug`              | GET    | GET A Single POST with slug   |
| `/api/v1/post`                         | POST   | CREATE A Single POST          |
| `/api/v1/post/:postId`                 | PATCH  | UPDATE A Single POST          |

---

## npm packages in Server Side

- Use [TypeScript](https://www.typescriptlang.org/) to add static typing, catch errors early, and make JavaScript code easier to maintain.
- Use [ts-node-dev](https://www.npmjs.com/package/ts-node-dev) to run TypeScript applications and automatically restart them when code changes during development.
- Use [node.js](https://nodejs.org/) for server-side scripting and building web applications.
- Uses [express](https://expressjs.com/) to build web applications and APIs easily with routing, middleware, and request handling.
- Uses [cors](https://expressjs.com/en/resources/middleware/cors.html) for enabling controlled access to resources from different origins in web applications.
- Uses [dotenv](https://dotenvx.com/) environment variables from a .env file into process.env for secure configuration management.
- Uses [cookie-parser](https://www.npmjs.com/package/cookie-parser) in Express to parse and manage cookies from incoming client requests easily.
- Uses [JWT](https://jwt.io/) to securely transmit user authentication data between client and server in web applications.
- Use [bcryptjs](https://www.npmjs.com/package/bcryptjs) to securely hash passwords and verify entered passwords against stored hashes during login.
- Use [Multer](https://www.npmjs.com/package/multer) to handle file uploads, such as images, in Express applications.
- Use [Cloudinary](https://www.npmjs.com/package/cloudinary) to upload, store, optimize, transform, and deliver images and videos from the cloud.
- Use [multer-storage-cloudinary](https://www.npmjs.com/package/multer-storage-cloudinary) to automatically store files uploaded through Multer in Cloudinary.
- Use [Nodemailer](https://www.npmjs.com/package/nodemailer) to send emails, including verification links, password resets, and notifications, from Node.js applications.
- Use [PostgreSQL](https://www.postgresql.org/) to store, organize, and query relational data, including users, posts, comments, and transactions.
- Use [Prisma](https://www.prisma.io/) to interact with databases through type-safe queries, define data models, and manage migrations.
- Use [Zod](https://zod.dev/) to define validation schemas, validate incoming data, and infer TypeScript types automatically.
- Uses [Vercel](https://vercel.com/) for deploying, hosting, and scaling frontend web applications with speed, simplicity, and automation.

## Technologies Used

- ![typescript](https://img.shields.io/badge/typescript-v6.0.3-155dfc?logo=typescript&logoColor=%233178C6)
- ![Node.js](https://img.shields.io/badge/nodedotjs-v25.9.1-155dfc?logo=nodedotjs&logoColor=%235FA04E)
- ![Express](https://img.shields.io/badge/Express-v5.2.1-155dfc?logo=express&logoColor=%23000000)
- ![.env](https://img.shields.io/badge/.env-v17.4.2-155dfc?logo=dotenv&logoColor=%23ECD53F)
- ![JWT](https://img.shields.io/badge/jsonwebtokens-v9.0.3-155dfc?logo=jsonwebtokens&logoColor=%23000000)
- ![PostgreSQL](https://img.shields.io/badge/postgresql-v8.21.0-155dfc?logo=postgresql&logoColor=%234169E1)
- ![prisma](https://img.shields.io/badge/prisma-v7.8.0-155dfc?logo=prisma&logoColor=%232D3748)
- ![zod](https://img.shields.io/badge/zod-v4.6.1-155dfc?logo=zod&logoColor=%23408AFF)
- ![cloudinary](https://img.shields.io/badge/cloudinary-v1.41.3-155dfc?logo=cloudinary&logoColor=%233448C5)
- ![Vercel](https://img.shields.io/badge/Vercel-ffffff?logo=vercel&logoColor=%23000000)

## 🛠️ Installation & Setup Instructions

Follow the steps below to set up the **OpenNotes** application locally:

---

### 1. Clone the Repositories

```bash
git clone https://github.com/Arman3747/OpenNotes-Server.git
git clone https://github.com/Arman3747/OpenNotes-Client.git
```

---

### 2. Client Setup

```bash
cd OpenNotes-Client
npm install
```

Create a `.env.local` file in the root of the client folder and add the following:

```env
update later
VITE_apiKey=your_firebase_key

```

Then start the client:

```bash
npm run dev
```

---

### 3. Server Setup

```bash
cd OpenNotes-Server
npm install
```

Create a `.env` file in the root of the server folder and add the following:

```env

# Server
PORT="5000"
NODE_ENV="development"

#DataBase
DATABASE_URL="postgresql://postgres:postgres_password@localhost:5432/db_name?schema=public"

#BCRYPT
SALT_ROUND=your_bcrypt_salt_round

#JWT
JWT_ACCESS_SECRET = your_jwt_access_secret
JWT_ACCESS_EXPIRES = your_jwt_access_expires_eg_1d
JWT_REFRESH_SECRET = your_jwt_refresh_secret
JWT_REFRESH_EXPIRES = your_jwt_refresh_expires_eg_30d
JWT_RESET_PASS_SECRET = your_jwt_reset_secret
JWT_RESET_PASS_EXPIRES = your_jwt_reset_expires_eg_10m

#RESET_PASS_LINK
RESET_PASS_LINK=http://localhost:3000/resetPassword

#Email sender
EMAIL=your_email_address
app_pass=smtp_password


#CLOUDINARY
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

```

Then start the server:

```bash
npm run dev
```

---

### Thank you for Reading!
