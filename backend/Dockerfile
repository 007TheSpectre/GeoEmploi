FROM node:22-alpine

WORKDIR /app

# Avoid Scarf analytics causing build errors
ENV SCARF_ANALYTICS=false

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src
RUN mkdir -p /app/data && chown -R node:node /app/data

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

USER node

CMD ["npm", "start"]
