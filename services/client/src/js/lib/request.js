'use strict';

const TIMEOUT = 900000;

export default function (agent) {
  return (method, url, buf, handler) => {
    if (buf) {
      agent.post(url)
      .timeout(TIMEOUT)
      .set('Content-Type', 'image/jpeg')
      .send(buf)
      .end(handler);
    } else {
      agent[method](url)
      .timeout(TIMEOUT)
      .end(handler);
    }
  };
}
