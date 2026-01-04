# Getting Started with KlassFlow

Welcome to KlassFlow! This guide will help you set up the environment and start using the application.

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (version 20 or higher)
- **Docker** and **Docker Compose** (for the database and mailpit)
- **Git**

## Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-org/klassflow.git
    cd klassflow
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Setup**:
    Copy the example environment file:
    ```bash
    cp .env.example .env
    ```
    Edit `.env` to configure your settings (database URL, auth secret, etc.).

## Running the Application

1.  **Start Infrastructure**:
    Start the PostgreSQL database and MailPit services using Docker:
    ```bash
    docker-compose up -d
    ```

2.  **Database Migration**:
    Initialize the database schema:
    ```bash
    npx prisma migrate dev
    ```

3.  **Start Development Server**:
    ```bash
    npm run dev
    ```

    The application will be accessible at: `http://localhost:3000`

## First Login

- Navigate to `http://localhost:3000`.
- Use the **"Dev Login"** button (if enabled in development) to sign in as a developer / admin.

## Next Steps

- Explore [Classroom Management](classrooms.md)
- Learn about [Session Scheduling](sessions.md)
