# eEPR UI

This repo contains the ui for the eEPR web application and connects with the APIs from the api repo.

## Project setup

```
# npm
npm install
```

### Compiles and hot-reloads for development

```
# npm
npm run dev
```

### Compiles and minifies for production

```
# npm
npm run build
```

### Deployment Notes

1. As node alpine is used for development, use the latest version of nodejs when deploying. (v21.7.3 as of now)

2. Make a copy of `.example.env` & rename it to `.env`, then set `VITE_BASE_URL=/` and `VITE_API_URL` to the URL where
   the backend api repo is hosted

3. Run `npm run lint` to ensure linting is within limits.

4. In 'test' environment, run `npm run dev` in the project directory and use the `index.html` in project directory.

5. In 'develop' and 'validate', run the `npm run build` command once to build the project and a /dist directory will be
   created. Use the dist directory inside & set the starting point as the `index.html` inside `dist`
   directory as the project folder for ui. No additional commands to build or run.

### Required Environment Variable

1 Base URL for the application
VITE_BASE_URL=/

# Base URL for the API

2 VITE_API_URL=
