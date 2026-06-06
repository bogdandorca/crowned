const crypto = require('crypto');

function newRequestId() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createLogger({ env = process.env, output = console } = {}) {
  const enabled = env.CROWNED_LOGS === 'json' || env.NODE_ENV === 'production';

  function write(level, message, fields = {}) {
    if (!enabled) return;
    const entry = {
      time: new Date().toISOString(),
      level,
      message,
      ...fields,
    };
    const writer = level === 'error' ? output.error : output.log;
    writer.call(output, JSON.stringify(entry));
  }

  return {
    info(message, fields) {
      write('info', message, fields);
    },
    error(message, fields) {
      write('error', message, fields);
    },
  };
}

module.exports = {
  createLogger,
  newRequestId,
};
