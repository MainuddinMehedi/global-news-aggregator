import { useEffect, useState } from "react";

interface ValidationResult {
  isValidating: boolean;
  isValidated: boolean;
  validationError: string;
  detectedType: string;
}

const initialState: ValidationResult = {
  isValidating: false,
  isValidated: false,
  validationError: "",
  detectedType: "",
};

export function useDebouncedUrlValidation(
  url: string,
  delayMs = 600,
): ValidationResult {
  const [state, setState] = useState<ValidationResult>(initialState);

  useEffect(() => {
    if (!url.trim()) {
      setState(initialState);
      return;
    }

    try {
      new URL(url);
    } catch {
      setState({
        ...initialState,
        validationError:
          "Invalid URL format. Make sure to include http:// or https://",
      });
      return;
    }

    setState({ ...initialState, isValidating: true });

    const controller = new AbortController();

    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/locked-topics/check-source?url=${encodeURIComponent(url)}`,
          {
            signal: controller.signal,
          },
        );
        if (res.ok) {
          const json = await res.json();
          if (json.valid) {
            setState({
              isValidating: false,
              isValidated: true,
              validationError: "",
              detectedType: json.type,
            });
          } else {
            setState({
              ...initialState,
              validationError: json.error || "Source validation failed.",
            });
          }
        } else {
          setState({
            ...initialState,
            validationError: "Could not connect to validation server.",
          });
        }
      } catch (err: any) {
        if (err.name === "AbortError") return;
        setState({
          ...initialState,
          validationError: "Could not connect to validation server.",
        });
      }
    }, delayMs);

    return () => {
      clearTimeout(delayDebounceFn);
      controller.abort();
    };
  }, [url, delayMs]);

  return state;
}
