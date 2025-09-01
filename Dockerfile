FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
#RUN npx prisma migrate deploy
#RUN npx prisma generate
#RUN npm run prisma:seed
EXPOSE 9000
CMD ["npm", "run", "start"]
