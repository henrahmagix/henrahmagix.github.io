require 'capybara_helper'

RSpec.describe 'Admin login', :js do
  it 'accepts a GitHub token, checks it, and redirects' do |example|
    puts current_url
    visit '/'
    puts current_url
    click_on 'Blog'
    puts current_url
    visit '/admin'
    fill_in 'token', with: 'abc123'
    puts current_url
    click_on 'Login'
    puts current_url
    puts Capybara::Webmock.proxied_requests.reject { it.uri.to_s =~ /google\.com|googleapis/ }.map(&:inspect)
    puts page.driver.browser.logs.get(:browser)
  end
end
