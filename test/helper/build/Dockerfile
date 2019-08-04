FROM node:8-alpine

ENV NODE_ENV=production

RUN mkdir /app
WORKDIR /app

COPY package.json .
COPY runner.js .

RUN apk update && apk upgrade
    
RUN npm install --production

USER node

CMD ["node", "runner"]