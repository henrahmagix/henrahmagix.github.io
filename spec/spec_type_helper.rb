RSpec.configure do |config|
  dir_types = {
    %w[spec features] => :feature
  }

  dir_types.each do |dir_parts, type|
    config.define_derived_metadata(file_path: /#{dir_parts.flatten.join(File::SEPARATOR) + File::SEPARATOR}/) do |metadata|
      metadata[:type] ||= type
    end
  end
end
