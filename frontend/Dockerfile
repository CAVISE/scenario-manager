FROM node:22-alpine AS builder
WORKDIR /app

ENV HUSKY=0
RUN corepack enable

COPY package.json yarn.lock ./
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn \
    yarn install --frozen-lockfile --non-interactive

COPY . .
RUN yarn build

FROM nginx:stable-alpine AS production

COPY --from=builder /app/dist /var/www/html
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
