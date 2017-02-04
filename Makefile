install:
	rbenv install --skip-existing
	gem install bundler
	bundle install
	bower install

update:
	bundle update

# Run both compass and jekyll in one shell. When compass watch is exited, the
# jekyll process exits too. This doesn't happen when typing these out in the
# shell, but does occur when called by Make.
dev:
	bundle exec jekyll serve --drafts & \
	compass watch
dist:
	bundle exec jekyll serve & \
	compass watch
