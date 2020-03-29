install:
	rbenv install --skip-existing
	gem install bundler
	bundle install
	bower install

update:
	bundle update

dev:
	bundle exec jekyll serve --drafts
devhttps:
	bundle exec jekyll serve --ssl-cert=.ssl/server.crt --ssl-key=.ssl/server.key --drafts
dist:
	bundle exec jekyll serve
