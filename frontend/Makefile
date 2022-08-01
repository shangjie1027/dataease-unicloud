# .PHONY: dist build
# install:
# 	@npm install

# dev: install
# 	@npm run dev

# build:
# 	@npm run build
REGISTRY ?= harbor-local.unicloudsrv.com/moove
PLATFORM ?= linux/amd64,linux/arm64

DOCKERFILE ?= Dockerfile
IMAGE ?=ucm-bi-de-ui

ifeq ($(origin VERSION), undefined)
VERSION := $(shell git describe --dirty=${BUILD_VERSION} --always --tags | sed 's/-/./g')
endif
GIT_TREE_STATE:="dirty"

.PHONY: build
build:
	wget http://10.253.17.224:80/artifactory/node_modules/ucm-bi-de-ui/ucm-bi-de-ui_220610/node_modules.zip
	unzip  node_modules.zip
	chmod -R +x node_modules/.bin
	npm run build

.PHONY: image.push
image.push:build
	docker buildx build --push --platform $(PLATFORM) -f $(DOCKERFILE) --tag $(REGISTRY)/$(IMAGE):$(VERSION) .

.PHONY: buildtar
buildtar:
	envsubst < build/template/ansible.yaml.template > ansible.yaml
	envsubst < build/template/install.sh.template > install.sh
	cd release/ && 	tar -czvf ../${JOB_NAME}-${BUILD_VERSION}.tar.gz `ls`
	tar -czvf ${JOB_NAME}.tar.gz  ansible.yaml  install.sh ${JOB_NAME}-${BUILD_VERSION}.tar.gz
	rm -rf  ${JOB_NAME}-${BUILD_VERSION}.tar.gz
	mv ${JOB_NAME}.tar.gz ${JOB_NAME}-${BUILD_VERSION}.tar.gz
	curl -u admin:Unicloud@1234 -X PUT 'http://10.253.17.224/artifactory/front_dist/${JOB_NAME}/${BUILD_VERSION}/${JOB_NAME}-${BUILD_VERSION}.tar.gz' -T ./${JOB_NAME}-${BUILD_VERSION}.tar.gz

.PHONY: clean
clean:
	rm -rf node_modules
	rm -rf node_modules.zip
	rm -rf release

