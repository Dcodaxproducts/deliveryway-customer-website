export type LatestRequest = {
  signal: AbortSignal;
};

export const createLatestRequestCoordinator = () => {
  let activeController: AbortController | null = null;

  return {
    start(): LatestRequest {
      activeController?.abort();
      activeController = new AbortController();

      return { signal: activeController.signal };
    },
    isCurrent(request: LatestRequest) {
      return (
        activeController?.signal === request.signal && !request.signal.aborted
      );
    },
    cancel() {
      activeController?.abort();
      activeController = null;
    },
  };
};
