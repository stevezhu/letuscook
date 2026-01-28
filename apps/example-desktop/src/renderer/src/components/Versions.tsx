import { useState } from 'react';

export function Versions() {
  const [versions] = useState(window.api.getVersions());

  console.debug(versions);

  return null;
}
