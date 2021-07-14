FROM golang:1.17-rc-buster
WORKDIR /casnode
COPY ./ /casnode
RUN go env -w CGO_ENABLED=0 GOPROXY=https://goproxy.io,direct GOOS=linux GOARCH=amd64 \
    && apt update && apt install sudo \
    && wget https://nodejs.org/dist/v12.22.0/node-v12.22.0-linux-x64.tar.gz \
    && sudo tar xf node-v12.22.0-linux-x64.tar.gz \
    && sudo apt install wait-for-it
ENV PATH=$PATH:/casnode/node-v12.22.0-linux-x64/bin
RUN npm install -g yarn \
    && cd web \
    && yarn install \
    && yarn run build \
    && rm -rf node_modules \
    && cd /casnode \
    && go build main.go
FROM golang:alpine3.14
COPY --from=0 /casnode   /casnode
COPY --from=0 /usr/bin/wait-for-it  /casnode
RUN go env -w CGO_ENABLED=0 GOPROXY=https://goproxy.io,direct \
    && set -eux \
    && sed -i 's/dl-cdn.alpinelinux.org/mirrors.ustc.edu.cn/g' /etc/apk/repositories \
    && apk update \
    && apk upgrade \
    && apk add bash coreutils
CMD cd /casnode && ./wait-for-it db:3306 && ./main
