"use client";

import { useEffect, useRef } from "react";

export function TimezoneInput() {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.value = Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
  }, []);

  return <input ref={ref} type="hidden" name="timezone" defaultValue="UTC" />;
}
