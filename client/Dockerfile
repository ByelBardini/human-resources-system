FROM node:18-alpine

WORKDIR /app

COPY ../dist ./dist

RUN npm install -g serve

EXPOSE 4174

CMD ["serve", "-s", "dist", "-l", "4174"]