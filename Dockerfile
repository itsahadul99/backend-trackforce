# ---------- Dependencies ----------
FROM node:22-alpine AS deps

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./

RUN npm ci


# ---------- Builder ----------
FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Dummy DATABASE_URL only for prisma generate validation.
# Real DATABASE_URL will come from Azure DevOps Library at runtime.
ARG DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"
ENV DATABASE_URL=${DATABASE_URL}

RUN npm run build

RUN npm prune --omit=dev


# ---------- Runner ----------
FROM node:22-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat dumb-init

ENV NODE_ENV=production
ENV PORT=80

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 80

ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "dist/index.js"]
