# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
# postinstall 会跑 scripts/copy-lottie-wasm.js，必须先于 install 存在
COPY scripts ./scripts
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

# 运行阶段
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
