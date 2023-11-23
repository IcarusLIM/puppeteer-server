FROM node

WORKDIR /app

RUN sed -i 's/deb.debian.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apt/sources.list.d/debian.sources
RUN apt update -y
RUN apt install python3 -y
RUN apt install chromium -y

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
ENV PUPPETEER_EXECUTABLE_PATH /usr/bin/chromium
ENV ENV docker

WORKDIR /app

COPY ./package*.json ./
RUN npm config set registry https://registry.npm.taobao.org
RUN npm install