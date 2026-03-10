FROM node:22-alpine
WORKDIR /app
COPY package.json tsconfig.base.json ./
COPY apps/chat-api/package.json ./apps/chat-api/package.json
COPY packages/core/package.json ./packages/core/package.json
RUN npm install
COPY packages ./packages
COPY apps/chat-api ./apps/chat-api
RUN npm run build -w @tecnoria-chat/core && npm run build -w @tecnoria-chat/chat-api
CMD ["npm", "run", "start", "-w", "@tecnoria-chat/chat-api"]
