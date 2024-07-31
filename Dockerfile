FROM ubuntu:23.10 as builder
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update
RUN apt-get install -y --no-install-recommends nftables iproute2 netcat-traditional inetutils-ping net-tools nano ca-certificates git curl sudo
RUN mkdir /code
WORKDIR /code
ARG TARGETARCH
RUN curl -O https://dl.google.com/go/go1.22.1.linux-${TARGETARCH}.tar.gz
RUN rm -rf /usr/local/go && tar -C /usr/local -xzf go1.22.1.linux-${TARGETARCH}.tar.gz
ENV PATH="/usr/local/go/bin:$PATH"
# deps for go code
RUN apt-get install -y --no-install-recommends libpcap-dev gcc
COPY go/ /code

ARG USE_TMPFS=true
ENV CGO_ENABLED=1
RUN --mount=type=tmpfs,target=/tmpfs \
    [ "$USE_TMPFS" = "true" ] && ln -s /tmpfs /root/go; \
    go build -ldflags "-s -w" -o /wireshark_plugin /code/


# build ui
FROM node:18 as builder-ui
WORKDIR /app
COPY frontend ./
ARG USE_TMPFS=true
RUN --mount=type=tmpfs,target=/tmpfs \
    [ "$USE_TMPFS" = "true" ] && \
        mkdir /tmpfs/cache /tmpfs/node_modules && \
        ln -s /tmpfs/node_modules /app/node_modules && \
        ln -s /tmpfs/cache /usr/local/share/.cache; \
    yarn install --network-timeout 86400000 && yarn run build

# link to main image
FROM ghcr.io/spr-networks/container_template:latest
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update
RUN apt-get install -y --no-install-recommends tcpdump tshark
COPY scripts /scripts/
COPY --from=builder /wireshark_plugin /
COPY --from=builder-ui /app/build/ /ui/
COPY dot11-sample.pcap /tmp/test.pcap
##TBD split from builder
ENTRYPOINT ["/scripts/startup.sh"]
