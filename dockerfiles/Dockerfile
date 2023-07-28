FROM puppeteer-server-buildenv:latest
WORKDIR /app
COPY . .
ENV TZ Asia/Shanghai
ENV PUPPETEER_CACHE_PATH /data
EXPOSE 8081

CMD ["node", "app.js"]