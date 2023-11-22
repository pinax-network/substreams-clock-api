import client from "./createClient.js";

class ClickhouseStore {
  private ChainsPromise: Promise<string[]> | undefined = undefined;

  constructor() {
    // Fetch data initially
    this.fetchData();

    // Fetch periodically
    setInterval(() => {
      this.fetchData();
    }, 10000); // in milliseconds
  }

  private fetchData() {
    this.ChainsPromise = client
      .query({ query: "SELECT DISTINCT chain FROM module_hashes", format: "JSONEachRow" })
      .then((response) => response.json<Array<{ chain: string }>>())
      .then((chains) => chains.map(({ chain }) => chain))
      .catch(() => []);
  }

  public get chains() {
    return this.ChainsPromise;
  }
}

export const store = new ClickhouseStore();
