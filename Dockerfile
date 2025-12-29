FROM node:18-alpine

RUN apk add --no-cache nginx

WORKDIR /app

COPY admin/package*.json ./
RUN npm install

COPY admin/ .

COPY website/ ./website

COPY nginx.conf /etc/nginx/http.d/default.conf

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

ENV ADMIN_USER=zeus-john
ENV ADMIN_PASS=123654789

ENTRYPOINT ["/entrypoint.sh"]