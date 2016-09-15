export default function (agent, fakeResponse) {
  const r = {
    calls: {},
    request: (method, path, data, handler) => {
      const key = `${method.toUpperCase()} ${path}`;
      r.calls[key] = { method, path, data, handler };
      handler(null, { body: fakeResponse[key] });
    }
  }
  return r;
}
