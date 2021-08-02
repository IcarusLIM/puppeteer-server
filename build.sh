build_version=$(git rev-parse --short HEAD)

docker build -t docker-reg.sogou-inc.com/databus/puppeteer-server-buildenv:latest . -f dockerfiles/buildenv.Dockerfile
docker push docker-reg.sogou-inc.com/databus/puppeteer-server-buildenv:latest

docker build -t docker-reg.sogou-inc.com/databus/puppeteer-server:$build_version . -f dockerfiles/Dockerfile
docker push docker-reg.sogou-inc.com/databus/puppeteer-server:$build_version

docker tag docker-reg.sogou-inc.com/databus/databus-web:$build_version docker-reg.sogou-inc.com/databus/puppeteer-server:latest
docker push docker-reg.sogou-inc.com/databus/puppeteer-server:latest

sed -i 's/docker-reg.sogou-inc.com\/databus\/puppeteer-server:.*/docker-reg.sogou-inc.com\/databus\/puppeteer-server:'$build_version'/g' './deploy/deployment.yaml'

cd deploy
kubectl apply -f .