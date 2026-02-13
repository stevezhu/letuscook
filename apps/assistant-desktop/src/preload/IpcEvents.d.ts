export type IpcEvents = {
  ping: () => void;
  'example:test': () => Promise<{ message: string }>;
};
