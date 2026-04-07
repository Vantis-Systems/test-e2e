FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json .
RUN npm install --production
COPY server.js .

FROM node:20-alpine
RUN addgroup -g 1000 app && adduser -u 1000 -G app -s /bin/sh -D app
WORKDIR /app
COPY --from=builder /app .
USER 1000
EXPOSE 8080
CMD ["node", "server.js"]
