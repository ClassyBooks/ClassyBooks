FROM node:22.21-alpine3.21

WORKDIR /

COPY package*.json ./
RUN npm install

COPY . .
WORKDIR /client
RUN yarn
RUN yarn add pm2 --global
RUN yarn build

WORKDIR /

ENV PORT=8080

EXPOSE 8080

CMD ["pm2", "start", "./server/index.js", "--no-daemon"]