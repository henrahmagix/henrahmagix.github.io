install:
	rbenv install --skip-existing
	gem install bundler
	bundle install

update:
	bundle update
