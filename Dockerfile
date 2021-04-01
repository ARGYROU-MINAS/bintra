FROM node:12 as builder

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN apt update && apt install -y vim
RUN npm ci

FROM node:12
WORKDIR /usr/src/app
COPY --from=builder node_modules node_modules

# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

EXPOSE 8080
CMD [ "node", "app.js" ]
