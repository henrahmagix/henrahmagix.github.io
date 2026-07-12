require 'rack'

class CapybaraStaticApp
  def self.rack_app(root)
    static_app = new(root)

    Rack::Builder.new do
      map '/' do
        use Rack::Lint
        run static_app
      end
    end.to_app
  end

  attr_reader :root, :server

  def initialize(root)
    @root = root
    @server = Rack::Files.new(root)
  end

  def call(env)
    path = env['PATH_INFO']

    if path != '/' && !path.end_with?('/') && (dir?(path) || file?(path + '.html'))
      # To fix relative resources, viewing a directory must end with / so redirect there.
      return [301, { 'location' => path + '/' }, []]
    end

    path = path.delete_suffix('/') unless path == '/' # normalise for path joining

    # Use index.html for / paths.
    if dir?(path) && file?(path + '.html')
      env['PATH_INFO'] = path + '.html'
    elsif dir?(path) && file?(path + '/index.html')
      env['PATH_INFO'] = path + '/index.html'
    end

    server.call(env)
  end

  def dir?(path)
    File.directory?(File.join(root, path))
  end

  def file?(path)
    File.file?(File.join(root, path))
  end
end
