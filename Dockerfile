FROM golang:1.19 AS BACK
WORKDIR /go/src/casibase
COPY . .
RUN go build -o server ./main.go


FROM node:18.0.0 AS FRONT
WORKDIR /web
COPY ./web .
RUN yarn install && yarn run build

FROM debian:latest AS db
LABEL MAINTAINER="https://casibase.org/"
ARG TARGETOS
ARG TARGETARCH
ENV BUILDX_ARCH="${TARGETOS:-linux}_${TARGETARCH:-amd64}"

WORKDIR /
COPY --from=BACK  /go/src/casibase/ ./
COPY --from=FRONT /web/build ./web/build


ENTRYPOINT ["/bin/bash"]
CMD ["/docker-entrypoint.sh"]