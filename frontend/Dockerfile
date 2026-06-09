FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./

# Remove package-lock.json to avoid architecture mismatch with host (glibc vs musl)
# and force npm to resolve the correct optional dependencies for Alpine.
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
