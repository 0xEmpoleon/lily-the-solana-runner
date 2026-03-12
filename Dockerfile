FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

# Default port for Next.js/Express, can be overridden by environment variables
EXPOSE 3000

CMD ["npm", "run", "dev"]
