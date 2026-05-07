FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ARG VITE_API_URL_VENTAS=http://52.55.215.132:8080
ARG VITE_API_URL_DESPACHOS=http://52.55.215.132:8081

ENV VITE_API_URL_VENTAS=$VITE_API_URL_VENTAS
ENV VITE_API_URL_DESPACHOS=$VITE_API_URL_DESPACHOS

RUN npm run build

FROM nginx:alpine

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]