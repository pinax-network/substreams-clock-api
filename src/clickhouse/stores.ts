import client from "./createClient.js";

class ClickhouseStore {
  private ChainsPromise: Promise<string[]> | undefined = undefined;

  constructor() {
    // Fetch data initially
    this.fetchData();

    // Set up a timer to fetch data periodically (e.g., every 1 hour)
    setInterval(() => {
      this.fetchData();
    }, 10000); // 3600000 milliseconds = 1 hour
  }

  private fetchData() {
    this.ChainsPromise = client
      .query({ query: "SELECT DISTINCT chain FROM blocks", format: "JSONEachRow" })
      .then((response) => response.json<Array<{ chain: string }>>())
      .then((chains) => chains.map(({ chain }) => chain))
      .catch(() => []);
  }

  public get chains() {
    return this.ChainsPromise;
  }
}

export const store = new ClickhouseStore();
