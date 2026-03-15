FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

# Vite default port is 5173, but we can configure it to 3000 for consistency
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
