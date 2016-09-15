FROM node:6.2.2-slim
WORKDIR /var/www
COPY package.json ./package.json
RUN npm install --quiet
COPY . .
CMD ["node", "index"]
