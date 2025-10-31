export async function tryProviders<T>(
  providers: Array<() => Promise<T>>,
  isAcceptable: (value: T) => boolean = (value) => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return Boolean(value);
  }
): Promise<T> {
  let lastError: unknown = null;
  let lastResult: T | undefined;

  for (const provider of providers) {
    try {
      const result = await provider();
      lastResult = result;
      if (isAcceptable(result)) {
        return result;
      }
    } catch (error) {
      lastError = error;
    }
  }

  if (lastResult !== undefined) {
    return lastResult;
  }

  if (lastError) {
    throw lastError;
  }

  throw new Error('All providers failed');
}
