module.exports = {
  apps: [
    {
      name: 'crowned',
      script: './server.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'production',
        HOST: '0.0.0.0',
        PORT: 8765,
      },
      env_development: {
        NODE_ENV: 'development',
        HOST: '127.0.0.1',
        PORT: 8765,
      },
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
