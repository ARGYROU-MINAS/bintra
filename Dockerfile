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
USER node
WORKDIR /usr/src/app
COPY --from=builder tmp/node_modules node_modules

# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

EXPOSE 8080
CMD [ "node", "app.js" ]
