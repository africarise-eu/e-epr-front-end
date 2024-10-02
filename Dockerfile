# Use the official Node.js image as the base image
FROM node:lts-alpine as build-stage

# make the 'app' folder the current working directory
WORKDIR /app

# copy both 'package.json' and 'package-lock.json' (if available)
COPY package*.json ./

# install project dependencies
RUN npm install

# copy project files and folders to the current working directory (i.e. 'app' folder)
COPY . .
# copy project files and folders to the current working directory (i.e. 'app' folder)
# COPY --chown=node:node . .

# Expose the default Vite dev server port (for development)
EXPOSE ${PORT:-3000}


# Set the default command to start the dev server (for development)
CMD ["npm", "run", "dev"]

# build app for production with minification
RUN npm run build

# production stage
FROM nginx:stable-alpine3.17-slim as production-stage

# remove the default nginx.conf
RUN rm -rf /usr/share/nginx/html/*

# Add nginx config
COPY --from=build-stage /app/docker/nginx/prod.conf /etc/nginx/conf.d

# copying files after build
COPY --from=build-stage /app/dist  /usr/share/nginx/html

#EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
