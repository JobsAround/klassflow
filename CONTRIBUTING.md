# Contributing to KlassFlow Core

Thank you for your interest in contributing to KlassFlow Core! We welcome contributions from everyone.

## Getting Started

1.  **Fork the repository** on GitHub.
2.  **Clone your fork** locally:
    ```bash
    git clone https://github.com/your-username/klassflow.git
    cd klassflow
    ```
3.  **Install dependencies**:
    ```bash
    npm install
    ```
4.  **Start the development server**:
    ```bash
    # Start the Docker database (optional if you have local Postgres)
    docker-compose up -d db

    # Migrate the database
    npx prisma migrate dev

    # Start the app
    npm run dev
    ```
    The app will be available at `http://localhost:3000`.

## Development Workflow

1.  **Create a branch** for your feature or fix:
    ```bash
    git checkout -b feature/my-new-feature
    ```
2.  **Make your changes**. Please follow the existing code style.
3.  **Commit your changes** with a descriptive message.
    ```bash
    git commit -m "feat: add amazing new feature"
    ```
    We follow [Conventional Commits](https://www.conventionalcommits.org/).
4.  **Push to your fork**:
    ```bash
    git push origin feature/my-new-feature
    ```
5.  **Open a Pull Request** against the `main` branch of the original repository.

## Project Structure

*   `src/app`: Next.js App Router pages and API routes.
*   `src/components`: UI components (built with Shadcn/ui and TailwindCSS).
*   `src/lib`: Utility functions, database client, email service.
*   `prisma`: Database schema and migrations.

## Testing

Please ensure your changes work as expected.
*   **Manual Testing**: Verify the relevant flows in the browser.
*   **Linting**: Run `npm run lint` to catch code style issues.

## Reporting Issues

If you find a bug or have a feature request, please open an issue on GitHub.

Thank you for contributing!
