FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
EXPOSE 3000
COPY . .
RUN npm run build
RUN npx prisma generate
CMD ["npm", "run","start:dev"]
