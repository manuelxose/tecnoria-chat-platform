FROM node:22-alpine
WORKDIR /app
COPY package.json tsconfig.base.json ./
COPY apps/ingest-worker/package.json ./apps/ingest-worker/package.json
COPY packages/core/package.json ./packages/core/package.json
RUN npm install
COPY packages ./packages
COPY apps/ingest-worker ./apps/ingest-worker
RUN npm run build -w @tecnoria-chat/core && npm run build -w @tecnoria-chat/ingest-worker
CMD ["npm", "run", "start", "-w", "@tecnoria-chat/ingest-worker", "--", "--watch"]
