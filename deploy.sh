#!/bin/bash
set -e # Stop on error

# 0. Set repository name
if [ -z "$1" ]; then
  echo "⚠️  No repository argument provided. Ensure GITHUB_REPOSITORY is set in env."
else
  export GITHUB_REPOSITORY=$1
fi

if [ -z "$GITHUB_REPOSITORY" ]; then
  echo "❌ Error: GITHUB_REPOSITORY is not set."
  exit 1
fi

# 1. Load Environment Variables explicitly
if [ -f .env ]; then
  set -o allexport
  source .env
  set +o allexport
elif [ -f .env.production ]; then
  echo "⚠️ .env not found, using .env.production"
  set -o allexport
  source .env.production
  set +o allexport
else
  echo "❌ Error: No .env file found!"
  exit 1
fi

echo "🚀 Deploying ${GITHUB_REPOSITORY}..."

# Encode Password for URL (handle special chars like #)
if command -v python3 &> /dev/null; then
    ENCODED_PASSWORD=$(python3 -c "import urllib.parse, sys; print(urllib.parse.quote(sys.argv[1], safe=''))" "$POSTGRES_PASSWORD")
else
    echo "⚠️ Python3 not found! Password encoding might fail."
    ENCODED_PASSWORD="$POSTGRES_PASSWORD"
fi

export DATABASE_URL="postgresql://${POSTGRES_USER}:${ENCODED_PASSWORD}@db:5432/${POSTGRES_DB}?schema=public"
echo "✅ DATABASE_URL constructed (password encoded)"

# 2. Pull new images
docker compose -f docker-compose.prod.yml pull app

# 3. Restart containers (Recreate to pick up new image/config)  
docker compose -f docker-compose.prod.yml up -d --remove-orphans --force-recreate

# 4. Run Migrations
echo "📦 Running database migrations..."
docker exec app node node_modules/prisma/build/index.js migrate deploy

# 5. Clean up
docker image prune -f

echo "✅ Deployment Success!"
