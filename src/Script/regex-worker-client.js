(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.RegexWorkerClient = api;
})(typeof self !== 'undefined' ? self : (typeof globalThis !== 'undefined' ? globalThis : this), function () {
  'use strict';

  function create(workerUrl, WorkerConstructor) {
    const WorkerImpl = WorkerConstructor || (typeof Worker !== 'undefined' ? Worker : null);
    const active = new Map();

    function cancel(channel, reason) {
      const key = channel || 'default';
      const entry = active.get(key);
      if (!entry) return;
      active.delete(key);
      clearTimeout(entry.timer);
      try { entry.worker.terminate(); } catch (_) {}
      const error = new Error(reason || 'Regex operation cancelled.');
      error.code = 'CANCELLED';
      entry.reject(error);
    }

    function cancelAll(reason) {
      Array.from(active.keys()).forEach(key => cancel(key, reason || 'Regex operation cancelled.'));
    }

    function run(payload, options) {
      const opts = options || {};
      const channel = opts.channel || 'default';
      const timeoutMs = Number.isFinite(opts.timeoutMs) && opts.timeoutMs > 0 ? opts.timeoutMs : 2000;
      cancel(channel, 'Superseded by a newer regex operation.');

      return new Promise((resolve, reject) => {
        if (!WorkerImpl) {
          const error = new Error('Web Workers are unavailable. Open Regex Pro through a local HTTP server to run protected regex operations.');
          error.code = 'WORKER_UNAVAILABLE';
          reject(error);
          return;
        }

        let worker;
        try {
          worker = new WorkerImpl(workerUrl);
        } catch (cause) {
          const error = new Error('Could not start the regex worker. Use a local HTTP server instead of opening index.html directly.');
          error.code = 'WORKER_UNAVAILABLE';
          error.cause = cause;
          reject(error);
          return;
        }

        const entry = { worker: worker, timer: null, reject: reject };
        const finish = (callback, value) => {
          if (active.get(channel) !== entry) return;
          active.delete(channel);
          clearTimeout(entry.timer);
          try { worker.terminate(); } catch (_) {}
          callback(value);
        };

        entry.timer = setTimeout(() => {
          const error = new Error('Regex evaluation exceeded ' + timeoutMs + ' ms and was stopped to keep the interface responsive.');
          error.code = 'REGEX_TIMEOUT';
          finish(reject, error);
        }, timeoutMs);
        active.set(channel, entry);
        worker.onmessage = event => {
          const message = event && event.data ? event.data : {};
          if (!message.ok) {
            const error = new Error(message.error || 'Regex worker failed.');
            error.code = message.code || 'REGEX_ERROR';
            finish(reject, error);
          } else finish(resolve, message.result);
        };
        worker.onerror = event => {
          if (event && typeof event.preventDefault === 'function') event.preventDefault();
          const error = new Error('Regex worker failed unexpectedly. Check the pattern and reload the app if the problem continues.');
          error.code = 'WORKER_ERROR';
          finish(reject, error);
        };

        try { worker.postMessage(payload); }
        catch (error) { finish(reject, error); }
      });
    }

    return { run: run, cancel: cancel, cancelAll: cancelAll };
  }

  return { create: create };
});
