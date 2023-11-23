FROM puppeteer-server-buildenv:latest
WORKDIR /app
COPY . .
ENV TZ Asia/Shanghai
ENV PUPPETEER_CACHE_PATH /data
EXPOSE 8080

CMD ["node", "app.js"]