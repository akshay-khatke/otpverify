

export const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : false;

export const logger = {
  log: (tag: string, ...args: any[]) => {
    if (isDev) {
      console.log(`${tag}`, ...args);
    }
  },
  info: (tag: string, ...args: any[]) => {
    if (isDev) {
      console.info(`${tag}`, ...args);
    }
  },
  warn: (tag: string, ...args: any[]) => {
    if (isDev) {
      console.warn(`${tag}`, ...args);
    }
  },
  error: (tag: string, ...args: any[]) => {
    if (isDev) {
      console.error(`${tag}`, ...args);
    }
  },
};


export const withLog = <T extends (...args: any[]) => any>(
  fn: T,
  label: string
): T => {
  return ((...args: any[]) => {
    if (isDev) {
      console.log(`${label} Request:`, args);
    }
    try {
      const res = fn(...args);
      if (res instanceof Promise) {
        return res
          .then((val) => {
            if (isDev) {
              console.log(`${label} Response:`, val);
            }
            return val;
          })
          .catch((err) => {
            if (isDev) {
              console.error(`${label} Error:`, err);
            }
            throw err;
          });
      }
      if (isDev) {
        console.log(`${label} Response:`, res);
      }
      return res;
    } catch (err) {
      if (isDev) {
        console.error(`${label} Error:`, err);
      }
      throw err;
    }
  }) as T;
};


export function LogMethod(tag?: string) {
  return function (
    _target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const label = tag ? `${tag}.${propertyKey}` : propertyKey;

    descriptor.value = function (...args: any[]) {
      if (isDev) {
        console.log(`🚀 [${label}] Called with:`, args);
      }
      const result = originalMethod.apply(this, args);

      if (result instanceof Promise) {
        return result
          .then((res) => {
            if (isDev) {
              console.log(`${label} Resolved:`, res);
            }
            return res;
          })
          .catch((err) => {
            if (isDev) {
              console.error(`${label} Rejected:`, err);
            }
            throw err;
          });
      }

      if (isDev) {
        console.log(`${label} Result:`, result);
      }
      return result;
    };

    return descriptor;
  };
}
