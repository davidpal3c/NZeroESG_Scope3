# build Stage
FROM node:20-alpine AS builder

WORKDIR /app

ARG NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_BACKEND_URL=${NEXT_PUBLIC_BACKEND_URL}

COPY package*.json ./
RUN npm install


COPY . .

RUN npm run build

# production Image
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app ./

ENV PORT=3000

EXPOSE 3000

# Using whatever port Render gives (default 10000), fallback 3000
# ENV PORT=10000

# EXPOSE 10000


CMD ["npm", "run", "start"]
# CMD ["sh", "-c", "PORT=${PORT:-3000} npm run start"]