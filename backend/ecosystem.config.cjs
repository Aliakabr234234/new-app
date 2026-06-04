module.exports = {
  apps: [{
    name: 'resourceflow-api',
    script: 'dist/server.js',
    cwd: '/var/www/resourceflow/backend',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
    },
    max_memory_restart: '500M',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: '/var/log/resourceflow/error.log',
    out_file: '/var/log/resourceflow/out.log',
  }]
};
