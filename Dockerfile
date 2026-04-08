FROM node:20-alpine

# better-sqlite3 is a native module and needs build tools
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Generate the Prisma client for the container's platform
RUN npx prisma generate

RUN npm run build

EXPOSE 3000
ENV NODE_ENV=production

CMD ["npm", "start"]
