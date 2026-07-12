return if (mtime_after = ENV['WAIT_JEKYLL_BUILD']).to_s == ""

# Wait until a _site file has changed after the given time.
require 'time'
mtime_after = Time.parse(mtime_after)
start = Time.now
timeout = Time.now + 1

n = 0
result = loop do
  break :timeout if Time.now >= timeout

  latest_mtime = Dir.glob('_site/**/*').map { File.mtime(it) }.max
  break Time.now - start if latest_mtime >= mtime_after

  n += 1
end

if n.zero?
  puts "JekyllBuildHelper didn't have to wait"
else
  if result == :timeout
    puts "JekyllBuildHelper didn't find a change"
  else
    puts "JekyllBuildHelper waited #{result.truncate(2)}s"
  end
end
