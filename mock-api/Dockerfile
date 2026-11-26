# DataStorm mock API — fake data for local UI previews (no DB, no deps).
FROM node:22-alpine
WORKDIR /app
COPY server.mjs ./
ENV PORT=8000 MOCK_LATENCY_MS=250
EXPOSE 8000
USER node
CMD ["node", "server.mjs"]
