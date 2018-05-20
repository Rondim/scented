FROM node:9-alpine

COPY . /home/node/app

WORKDIR /home/node/app

EXPOSE 1337

CMD node server.js



