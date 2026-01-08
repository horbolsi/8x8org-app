module.exports = {
    apps: [
        {
            name: '8x8org-ecosystem',
            script: './index.js',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'production',
                PORT: 3000
            },
            env_development: {
                NODE_ENV: 'development',
                PORT: 3001
            },
            error_file: './logs/ecosystem-error.log',
            out_file: './logs/ecosystem-out.log',
            log_file: './logs/ecosystem-combined.log',
            time: true,
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true,
            kill_timeout: 5000,
            wait_ready: true,
            listen_timeout: 10000,
            shutdown_with_message: true
        },
        {
            name: '8x8org-scheduler',
            script: './services/scheduler.js',
            instances: 1,
            autorestart: true,
            watch: false,
            env: {
                NODE_ENV: 'production'
            },
            error_file: './logs/scheduler-error.log',
            out_file: './logs/scheduler-out.log'
        },
        {
            name: '8x8org-email-worker',
            script: './services/email-worker.js',
            instances: 1,
            autorestart: true,
            watch: false,
            env: {
                NODE_ENV: 'production'
            },
            error_file: './logs/email-error.log',
            out_file: './logs/email-out.log'
        }
    ]
};
