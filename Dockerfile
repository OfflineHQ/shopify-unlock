FROM node:21.6.2-alpine

ARG SHOPIFY_API_KEY
ENV SHOPIFY_API_KEY=$SHOPIFY_API_KEY
ARG SHOPIFY_OFFLINE_DISCOUNT_ID
ENV SHOPIFY_OFFLINE_DISCOUNT_ID=$SHOPIFY_OFFLINE_DISCOUNT_ID
ARG OFFLINE_WEB_API_URL
ENV OFFLINE_WEB_API_URL=$OFFLINE_WEB_API_URL
ARG OFFLINE_GATES_HANDLE
ENV OFFLINE_GATES_HANDLE=$OFFLINE_GATES_HANDLE
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

EXPOSE 3000

WORKDIR /app
COPY . .

ENV NODE_ENV=production

# Install pnpm
RUN npm install -g pnpm

# Use pnpm instead of npm
RUN pnpm install --prod
# Remove CLI packages since we don't need them in production by default.
# Remove this line if you want to run CLI commands in your container.
RUN pnpm remove @shopify/app @shopify/cli
RUN pnpm run build

CMD ["pnpm", "run", "docker-start"]
