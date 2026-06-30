# Sparkl — Node web service
FROM node:20-alpine
WORKDIR /app

# install deps first (better layer caching)
COPY package*.json ./
RUN npm install --omit=dev

# app source
COPY . .

# Render provides PORT (defaults to 10000); server.js reads process.env.PORT
ENV NODE_ENV=production
EXPOSE 10000
CMD ["npm", "start"]
