build_version=$(git rev-parse --short HEAD)

docker build -t puppeteer-server-buildenv:latest . -f dockerfiles/buildenv.Dockerfile

docker build -t puppeteer-server:latest . -f dockerfiles/Dockerfile
docker tag puppeteer-server:latest puppeteer-server:$build_version