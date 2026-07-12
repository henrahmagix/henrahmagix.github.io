require 'capybara/webmock'

Capybara::Webmock.start_timeout = 5

RSpec.configure do |config|
  config.before(:each, :js) { Capybara::Webmock.start }
  config.after(:suite) { Capybara::Webmock.stop }
end
