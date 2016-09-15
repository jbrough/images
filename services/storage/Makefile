.PHONY: set-staging-env set-production-env build push-version auth deploy staging production

SHELL := /bin/bash

SERVICE=images
NAME=images-storage
VERSION=$(shell git rev-parse --short HEAD)

deploy: build auth push-version

staging: set-staging-env deploy

production: set-production-env deploy

set-staging-env:
	$(eval PROJECT = silkfred-1)
	$(eval IMAGE = eu.gcr.io/silkfred-1/$(NAME))

set-production-env:
	$(eval PROJECT = silkfred-1)
	$(eval IMAGE = eu.gcr.io/silkfred-1/$(NAME))

auth:
	gcloud config set project $(PROJECT)
	gcloud docker -a
	kubectl config set-credentials $(SERVICE)
	gcloud container clusters get-credentials $(SERVICE) --zone europe-west1-b

build:
	docker build -t ygt/$(NAME):$(VERSION) .

push-version:
	docker tag ygt/$(NAME):$(VERSION) $(IMAGE):latest
	gcloud docker push $(IMAGE):latest
	docker tag ygt/$(NAME):$(VERSION) $(IMAGE):$(VERSION)
	gcloud docker push $(IMAGE):$(VERSION)
