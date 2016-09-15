FROM node:6.2.2
RUN apt-get update && apt-get upgrade -y && apt-get install -y libvips && apt-get install -y libvips-tools
WORKDIR /var/www
EXPOSE 9293
COPY package.json ./package.json
RUN npm install --quiet
COPY . .
CMD ["node", "server"]
