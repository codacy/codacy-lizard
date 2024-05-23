FROM node:lts-alpine3.19 as builder

COPY package.json package-lock.json ./

RUN npm install &&\
    npm cache clean --force

COPY src src
COPY docs docs
COPY tsconfig.json ./

RUN npm run build

FROM python:3.9-alpine3.20

RUN pip install lizard &&\
    apk add --no-cache nodejs npm

RUN adduser -u 2004 -D docker

COPY --from=builder --chown=docker:docker dist dist
COPY --from=builder --chown=docker:docker docs docs
COPY entrypoint.sh entrypoint.sh
RUN chmod +x entrypoint.sh

WORKDIR /src

CMD [ "/entrypoint.sh" ]
