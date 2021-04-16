FROM node:14 as builder

RUN apt update && apt install -y vim

USER node
WORKDIR /tmp

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm ci

FROM node:14
WORKDIR /usr/src/app
RUN chown node:node /usr/src/app
USER node
WORKDIR /usr/src/app
COPY --from=builder --chown=node:node tmp/node_modules node_modules

# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY --chown=node:node . .

EXPOSE 8080
CMD [ "node", "app.js" ]
