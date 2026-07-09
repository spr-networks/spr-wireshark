# syntax=docker/dockerfile:1@sha256:87999aa3d42bdc6bea60565083ee17e86d1f3339802f543c0d03998580f9cb89
ARG NODE_ALPINE_REF=node:alpine@sha256:e88a35be04478413b7c71c455cd9865de9b9360e1f43456be5951032d7ac1a66
FROM ${NODE_ALPINE_REF}

COPY . /app
WORKDIR /app
RUN yarn install --frozen-lockfile

USER 1000:1000
EXPOSE 3000
ENTRYPOINT ["yarn", "run", "start"]
