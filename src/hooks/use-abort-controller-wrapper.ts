import { useEffect, useRef } from 'react';

type Hook<HookProps, ReturnType> = (props: HookProps) => ReturnType;

export const useAbortControllerWrapper = <HookProps, ReturnType>(
  hook: Hook<HookProps, ReturnType>,
  hookProps: HookProps,
): ReturnType => {
  const abortControllerWrappedHook = () => {
    const abortControllerRef = useRef<AbortController | null>(
      new AbortController(),
    );

    // We keep the reference to the fetchOptions in the context
    // so we can update the signal when the component is mounted
    const fetchOptions = {
      signal: abortControllerRef.current?.signal,
      // @ts-expect-error - optional chaining
      ...(hookProps?.context?.fetchOptions ?? {}),
    };

    useEffect(() => {
      abortControllerRef.current = new AbortController();
      fetchOptions.signal = abortControllerRef.current.signal;
      return () => {
        abortControllerRef.current?.abort();
      };
    }, []);

    return hook({
      ...hookProps,
      context: {
        // @ts-expect-error - optional chaining
        ...(hookProps?.context ?? {}),
        fetchOptions,
      },
    });
  };

  return abortControllerWrappedHook();
};
