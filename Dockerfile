FROM nginx:alpine

ARG SERVER_IP

RUN apk add --no-cache openssl

RUN mkdir -p /etc/nginx/ssl && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/nginx.key \
    -out /etc/nginx/ssl/nginx.crt \
    -subj "/CN=${SERVER_IP}" \
    -addext "subjectAltName = IP:${SERVER_IP}"


# Create the specific subdirectory for the game
RUN mkdir -p /usr/share/nginx/html/demo

# Copy the game files INTO that subdirectory
COPY landing-page /usr/share/nginx/html
COPY build/web /usr/share/nginx/html/demo

# Set proper permissions
RUN chown -R nginx:nginx /usr/share/nginx/html
RUN chmod -R 755 /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
