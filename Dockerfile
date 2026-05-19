FROM node:18.18-alpine

# Create app directory
WORKDIR /app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

# Setting the timezone
RUN apk add --no-cache --virtual .gyp \
        python3 \
        make \
        gcc \
        g++ \
        git \
    && npm install \
    && apk del .gyp python3 make gcc g++ git

# Bundle app source
COPY . .

RUN cp production.env .env
#RUN cp -R type_modules/. node_modules

RUN npx prisma generate

EXPOSE 5000
#CMD [ "npm", "run", "start" ]
CMD [ "npm", "run", "serve" ]
