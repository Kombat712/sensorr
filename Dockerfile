FROM node:14-alpine3.15

RUN npm install pm2 -g

WORKDIR /app/sensorr

COPY .babelrc package.json yarn.lock ecosystem.config.js webpack.*.js ./
COPY config.docker.json config.default.json
COPY bin ./bin
COPY server ./server
COPY shared ./shared
COPY src ./src
COPY docker-entrypoint.sh ./docker-entrypoint.sh

RUN mkdir -p config && chmod 666 config && mkdir -p blackhole && chmod 660 blackhole \
    && apk add --no-cache python3 build-base \
    && yarn config set network-timeout 300000 \
    && yarn install --ignore-engines \
    && yarn run build \
    && apk del build-base python3 && rm -rf /var/cache/apk/*

EXPOSE 5070

CMD ["./docker-entrypoint.sh"]
