importScripts('./regex-core.js');

self.onmessage = function (event) {
  try {
    const result = self.RegexCore.run(event && event.data ? event.data : {});
    self.postMessage({ ok: true, result: result });
  } catch (error) {
    self.postMessage({
      ok: false,
      error: error && error.message ? error.message : 'Regex evaluation failed.',
      code: 'REGEX_ERROR'
    });
  }
};
