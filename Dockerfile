FROM golang:1.20 AS BACK
WORKDIR /go/src/casibase
COPY . .
RUN go build -o server ./main.go


FROM debian:latest AS STANDARD
LABEL MAINTAINER="https://casibase.org/"
ARG TARGETOS
ARG TARGETARCH
ENV BUILDX_ARCH="${TARGETOS:-linux}_${TARGETARCH:-amd64}"

WORKDIR /
COPY --from=BACK  /go/src/casibase/ ./


ENTRYPOINT ["/bin/bash"]
CMD ["/docker-entrypoint.sh"]