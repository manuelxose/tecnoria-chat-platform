FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/portal/package.json ./apps/portal/package.json
RUN npm install
COPY apps/portal ./apps/portal
RUN npm run build -w @tecnoria-chat/portal
CMD ["npm", "run", "serve:ssr", "-w", "@tecnoria-chat/portal"]
