FROM node:lts-alpine3.21 as builder

COPY package.json package-lock.json ./
COPY src src
# copy to test the build with docs
COPY docs docs
COPY tsconfig.json ./

RUN npm install &&\
    npm run build

FROM python:3.9.21-alpine3.21

RUN pip install lizard &&\
    apk add --no-cache nodejs &&\
    adduser -u 2004 -D docker &&\
    mkdir /codacy &&\
    chown docker:docker /codacy

COPY --from=builder --chown=docker:docker node_modules node_modules
COPY --from=builder --chown=docker:docker dist dist
COPY --from=builder --chown=docker:docker docs docs
COPY --chmod=550 --chown=docker:docker entrypoint.sh entrypoint.sh

WORKDIR /src

CMD [ "/entrypoint.sh" ]
