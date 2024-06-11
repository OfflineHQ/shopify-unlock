FROM node:21.6.2-alpine

ARG SHOPIFY_API_KEY
ENV SHOPIFY_API_KEY=$SHOPIFY_API_KEY
ARG SHOPIFY_OFFLINE_DISCOUNT_ID
ENV SHOPIFY_OFFLINE_DISCOUNT_ID=$SHOPIFY_OFFLINE_DISCOUNT_ID
ARG OFFLINE_WEB_API_URL
ENV OFFLINE_WEB_API_URL=$OFFLINE_WEB_API_URL
ARG OFFLINE_GATES_HANDLE
ENV OFFLINE_GATES_HANDLE=$OFFLINE_GATES_HANDLE

EXPOSE 3000

WORKDIR /app
COPY . .

ENV NODE_ENV=production

RUN npm install --omit=dev
# Remove CLI packages since we don't need them in production by default.
# Remove this line if you want to run CLI commands in your container.
RUN npm remove @shopify/app @shopify/cli
RUN npm run build

# You'll probably want to remove this in production, it's here to make it easier to test things!
RUN rm -f prisma/dev.sqlite

CMD ["npm", "run", "docker-start"]
