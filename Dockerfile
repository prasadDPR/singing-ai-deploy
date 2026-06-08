FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps || (cat /root/.npm/_logs/*.log && exit 1)
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]