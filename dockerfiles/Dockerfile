FROM docker-reg.sogou-inc.com/databus/puppeteer-server-buildenv:latest
WORKDIR /app
COPY . .
ENV TZ Asia/Shanghai
EXPOSE 8081

CMD ["node", "app.js"]