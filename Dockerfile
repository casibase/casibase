FROM golang:1.17 AS BACK
WORKDIR /go/src/casnode
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 GOPROXY=https://goproxy.cn,direct go build -ldflags="-w -s" -o server . \
    && apt update && apt install wait-for-it && chmod +x /usr/bin/wait-for-it

FROM node:14.17.6 AS FRONT
WORKDIR /web
COPY ./web .
RUN yarn config set registry https://registry.npm.taobao.org
RUN yarn install && yarn run build




FROM casbin/casdoor-all-in-one:latest AS ALLINONE
COPY --from=BACK /go/src/casnode/ ./casnode
COPY --from=BACK /usr/bin/wait-for-it ./casnode
COPY --from=FRONT /web/build ./casnode/web/build
CMD chmod 777 /tmp && service mariadb start&&\
if [ "${MYSQL_ROOT_PASSWORD}" = "" ] ;then MYSQL_ROOT_PASSWORD=123456 ; fi&&\
mysqladmin -u root password ${MYSQL_ROOT_PASSWORD} &&\
./wait-for-it localhost:3306 && (export CASNODE_CONF="/casnode/conf/app.conf"&&./server --createDatabase=true & (./wait-for-it localhost:8000 && cd /casnode && ./server ))

FROM alpine:latest
RUN sed -i 's/https/http/' /etc/apk/repositories
RUN apk add curl
LABEL MAINTAINER="https://casnode.org/"

COPY --from=BACK /go/src/casnode/ ./
COPY --from=BACK /usr/bin/wait-for-it ./
RUN mkdir -p web/build && apk add --no-cache bash coreutils
COPY --from=FRONT /web/build /web/build
CMD ./wait-for-it db:3306 -- ./server