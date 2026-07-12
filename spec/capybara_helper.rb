require 'capybara/rspec'
require 'support/capybara_static_app'

Capybara.javascript_driver = :selenium_chrome_headless # Firefox doesn't support console logs
Capybara.server = :webrick

Capybara.always_include_port = true
Capybara.reuse_server = true
Capybara.raise_server_errors = true

Capybara.app = CapybaraStaticApp.rack_app(File.join(__dir__, '..', '_site'))
