let ioInstance = null;

const setIO = (io) => {
  ioInstance = io;
};

const emitUpdate = (key, payload = {}) => {
  if (!ioInstance) return;
  ioInstance.emit(`${key}:update`, { key, ...payload, ts: Date.now() });
};

module.exports = { setIO, emitUpdate };
