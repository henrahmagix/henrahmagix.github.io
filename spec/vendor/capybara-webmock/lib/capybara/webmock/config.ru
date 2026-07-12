require 'rack'
$LOAD_PATH.unshift File.join(__dir__, '..', '..')
require 'capybara/webmock/proxy'

app = Capybara::Webmock::Proxy.new(Process.pid)
require "rackup/handler/webrick"
Rackup::Handler::WEBrick.run(app, Port: ENV.fetch('CAPYBARA_WEBMOCK_PROXY_PORT_NUMBER', 9292))
