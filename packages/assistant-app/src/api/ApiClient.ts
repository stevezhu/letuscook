export interface ApiClient {
  example: {
    test: () => Promise<{ message: string }>;
  };
}
