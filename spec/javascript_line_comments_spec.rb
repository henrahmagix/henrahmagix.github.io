require 'nokogiri'

RSpec.describe 'JavaScript line comments that break scripts because they get compressed' do
  it 'do not exist in any file that gets compressed' do
    expect(source_files).to have_no_line_comments_in_scripts(site_files)
  end

  def site_files
    @site_files ||= Dir.glob('_site/**/*.{js,html}')
  end

  def source_files
    @source_files ||= Dir.glob('[!lib]**/*.html') + Dir.glob('_includes/**/*.js') - site_files
  end

  matcher :have_no_line_comments_in_scripts do |site_files|
    match do |filepaths|
      @failures = all_script_lines(filepaths, grep: %r{^\s*//}).filter_map do |line, filepath_lineno|
        next unless (compressed_use = find_compressed_use(site_files, line:))

        "#{filepath_lineno} used in #{compressed_use}\n  #{line}"
      end

      @failures.empty?
    end

    failure_message do |filepath|
      <<~MSG
        expected not to have line comments in compressed scripts, but found:

        #{@failures.join("\n\n")}
      MSG
    end
  end

  def all_script_lines(filepaths, grep:, &)
    filepaths.flat_map do |filepath|
      each_script_line(filepath, grep:, &).map { |line, lineno| [line, "#{filepath}:#{lineno}"] }
    end.reject(&:empty?)
  end

  def each_script_line(filepath, grep:, &)
    source = File.read(filepath)
    if filepath.end_with?('.js')
      source.lines.map(&:chomp)
                  .each.with_index(1, &)
                  .select { |line, _lineno| line =~ grep }
                  .map(&)
    elsif filepath.end_with?('.html')
      Enumerator.new do |yielder|
        each_script(source) do |node|
          node.text.lines.map(&:chomp)
                   .each.with_index(node.line)
                   .select { |line, _lineno| line =~ grep }
                   .each { |line, lineno| yielder << [line, lineno] }
        end
      end
    else
      raise "Unable to find scripts in #{filepath}"
    end
  end

  def each_script(source, &)
    Nokogiri::HTML5.fragment(source).css('script').each(&)
  end

  def find_compressed_use(site_files, line:)
    @compressed_script ||= {}
    site_files.any? do |site_filepath|
      @compressed_script[site_filepath] ||= each_script(File.read(site_filepath)).map(&:text)
      @compressed_script[site_filepath].any? do |script|
        if script.include?(line.strip) && script.count("\n") < 2
          return "a blog post" if site_filepath.match?(%r{/\d\d\d\d/\d\d/\d\d/})
          return site_filepath
        end
      end
    end
  end
end
