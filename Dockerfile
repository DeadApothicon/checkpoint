FROM node:20-alpine

# better-sqlite3 is a native module and needs build tools
RUN apk add --no-cache python3 make g++ linux-headers

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Generate the Prisma client for the container's platform
RUN npx prisma generate

# Supply placeholder values for variables Next.js requires at build time.
# These are overridden at runtime by the env vars set in Portainer.
ENV NEXTAUTH_SECRET=build-placeholder
ENV NEXTAUTH_URL=http://localhost:3000
ENV DATABASE_URL=file:/tmp/build.db

RUN npm run build

EXPOSE 3000
ENV NODE_ENV=production

CMD ["npm", "start"]
