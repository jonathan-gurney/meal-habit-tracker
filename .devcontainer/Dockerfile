FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    jq \
    bash \
    ca-certificates \
    procps \
  && rm -rf /var/lib/apt/lists/*

ARG USERNAME=node
USER $USERNAME
