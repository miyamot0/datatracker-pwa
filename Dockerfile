FROM node:24.22.1-alpine3.24 AS builder
WORKDIR /app

# Build core UI
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build-docker

# Set up hosting
FROM nginx:1.31.8-alpine3.24

# Nuke/swap default html content
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/dist /usr/share/nginx/html

# Nuke/swap nginx defaults (nerf the default config)
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create non-root nginx user
RUN addgroup -S appgroup && \
    adduser -S appuser -G appgroup && \
    chown -R appuser:appgroup /usr/share/nginx/html && \
    chown -R appuser:appgroup /var/cache/nginx && \
    chown -R appuser:appgroup /var/run && \
    chown -R appuser:appgroup /etc/nginx/conf.d

# Run as non-root user
USER appuser

# Internal container port (80 would be root)
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]