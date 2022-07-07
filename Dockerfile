FROM node:18-slim AS base

ARG NODE_ENV=production

WORKDIR /misskey

ENV BUILD_DEPS autoconf automake file g++ gcc libc-dev libtool make nasm python3 git pkg-config zlib1g-dev
ENV RUNTIME_DEPS ffmpeg tini

FROM base AS builder

COPY . ./

RUN apt-get update && \
	apt-get -qy dist-upgrade &&\
	apt-get install -qy  $BUILD_DEPS && \
	git submodule update --init && \
	yarn install && \
	yarn build && \
	rm -rf .git && \
	apt-get -qy clean

FROM base AS runner

RUN apt-get update && apt-get -qy install $RUNTIME_DEPS && apt-get -qy clean

ENTRYPOINT ["/usr/bin/tini", "--"]

COPY --from=builder /misskey/node_modules ./node_modules
COPY --from=builder /misskey/built ./built
COPY --from=builder /misskey/packages/backend/node_modules ./packages/backend/node_modules
COPY --from=builder /misskey/packages/backend/built ./packages/backend/built
COPY --from=builder /misskey/packages/client/node_modules ./packages/client/node_modules
COPY . ./

VOLUME [ "/misskey/.config/" ]

ENV NODE_ENV=production
CMD ["npm", "run", "migrateandstart"]
