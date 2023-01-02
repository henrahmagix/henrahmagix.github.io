install:
	rbenv install --skip-existing
	gem install bundler
	bundle install
	bower install

update:
	bundle update

ENV=`cat .env`
PORT?=4000

dev:
	env $(ENV) bundle exec jekyll serve --incremental --host 0.0.0.0 --drafts --port $(PORT)
devhttps:
	bundle exec jekyll serve --incremental --host 0.0.0.0 --port $(PORT) --ssl-cert=.ssl/server.crt --ssl-key=.ssl/server.key --drafts
