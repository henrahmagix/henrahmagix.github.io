install:
	rbenv install --skip-existing
	gem install bundler
	bundle install
	bower install

update:
	bundle update

ENV=`cat .env`

dev:
	env $(ENV) bundle exec jekyll serve --incremental --host 0.0.0.0
devhttps:
	bundle exec jekyll serve --incremental --host 0.0.0.0 --ssl-cert=.ssl/server.crt --ssl-key=.ssl/server.key --drafts
