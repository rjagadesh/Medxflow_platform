import api from "./axios-instance";

const apiRequest = (route, options = {}) => {
  const { payload, params, metadata, ...rest } = options;
  console.log("metadata1212", metadata);
  if (route.method === "post") {
    const isFunction = typeof route.url === "function";
    if (isFunction) {
      const url = route.url(metadata.id || metadata.uid, metadata.token);
      return api.post(url, payload, { params, metadata, ...rest });
    }
    return api.post(route.url, payload, {
      params,
      metadata: metadata,
      ...rest,
    });
  } else if (route.method === "get") {
    const isFunction = typeof route.url === "function";
    if (isFunction) {
      const url = route.url(metadata.id);
      return api.get(url, { params, metadata, ...rest });
    }
    return api.get(route.url, {
      params,
      metadata,
      ...rest,
    });
  } else if (route.method === "delete") {
    const isFunction = typeof route.url === "function";
    if (isFunction) {
      const url = route.url(metadata.id);
      return api.delete(url, { data: payload, params, metadata, ...rest });
    }

    return api.delete(route.url, {
      data: payload,
      params,
      metadata,
      ...rest,
    });
  } else if (route.method === "put") {
    const isFunction = typeof route.url === "function";
    if (isFunction) {
      const url = route.url(metadata.id);
      return api.put(url, payload, { params, metadata, ...rest });
    }

    return api.put(route.url, payload, { params, metadata, ...rest });
  } else if (route.method === "patch") {
    const isFunction = typeof route.url === "function";
    if (isFunction) {
      const url = route.url(metadata.id);
      return api.put(url, payload, { params, metadata, ...rest });
    }
    return api.patch(route.url, payload, { params, metadata, ...rest });
  }
};

export default apiRequest;
