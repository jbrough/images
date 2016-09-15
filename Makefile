.PHONY: install auth deploy push-static push-services-staging \
	push-services-production setup test start deployment \
	auth-staging auth-production

SHELL := /bin/bash

include ./env

SERVICE=images
VERSION=$(shell git rev-parse --short HEAD)

auth-staging: set-staging-env auth
auth-production: set-production-env auth

redis-staging: auth-staging deployment-redis
redis-production: auth-production deployment-redis

deploy: push-services push-static set-redis-host deployment

staging: auth-staging deploy

production: auth-production deploy

deployment-redis:
	cat deploy/deployment-redis.yaml | \
	sed "s/{deploymentEnv}/${ENV}/g" |\
	kubectl apply -f -

deployment:
	#kubectl delete deployment images-$(ENV) || true
	cat deploy/deployment.yaml | \
	sed "s/{version}/${VERSION}/g" |\
	sed "s/{deploymentEnv}/${ENV}/g" |\
	sed "s/{gcsBucket}/${BUCKET}/g" |\
	sed "s/{googleProjectId}/${PROJECT}/g" |\
	sed "s/{gcr}/${GCR}/g" |\
	sed "s/{redisHost}/${REDIS_HOST}/g" |\
	sed "s/{replicas}/${REPLICAS}/g" |\
	sed "s/{queueMaxRetries}/100/g" |\
	kubectl apply -f -

set-redis-host:
	$(eval REDIS_HOST = $(shell kubectl describe services | grep 6379 | grep -Eo '[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}'))

set-staging-env:
	$(eval ENV = staging)
	$(eval PROJECT = silkfred-1)
	$(eval GCR = eu\.gcr\.io\/silkfred-1)
	$(eval BUCKET = silkfred)
	$(eval REPLICAS = 2)

set-production-env:
	$(eval ENV = production)
	$(eval PROJECT = silkfred-1)
	$(eval GCR = eu\.gcr\.io\/silkfred-1)
	$(eval BUCKET = silkfred)
	$(eval REPLICAS = 4)

push-static:
	gsutil cp -a public-read ./services/client/_dist/bundle.js gs://$(BUCKET)/dist/$(VERSION).js

test:
	node ./test/run_test.js && node ./test/run_test_reprocess.js

start:
	( cd services/client && npm run dev)
	NODE_ENV=staging node start_dev

setup:
	npm install
	( cd services/client && npm install )
	( cd services/api && npm install )
	( cd services/resizer && npm install )
	( cd services/storage && npm install )
	( cd services/queue && npm install )

push-services:
	( cd services/client && npm install && npm run publish )
	( cd services/api && make $(ENV) )
	( cd services/resizer && make $(ENV) )
	( cd services/storage && make $(ENV) )
	( cd services/queue && make $(ENV) )
	( cd services/task && make $(ENV) )

auth:
	gcloud config set project $(PROJECT)
	gcloud docker -a
	kubectl config set-credentials $(SERVICE)
	gcloud container clusters get-credentials $(SERVICE) --zone europe-west1-b
