FROM node:6.2.2-slim
WORKDIR /var/www
EXPOSE 9294
COPY package.json ./package.json
RUN npm install --quiet
COPY . .
CMD ["node", "server"]
