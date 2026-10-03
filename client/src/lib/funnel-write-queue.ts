import type { Funnel } from "@shared/schema";
import { DOCUMENT_VERSION, type WriteControl } from "@shared/funnel-document";

export interface FunnelWrite {
  data: Partial<Funnel>;
  publish?: boolean;
  restoreId?: number;
  documentVersion?: 1 | 2 | 3 | 4 | 5 | 6;
}
type Request = FunnelWrite & { control: WriteControl };
export type FunnelSender = (request: Request) => Promise<Funnel>;

/** One version cursor and one in-flight request for every editor write. */
export class FunnelWriteQueue {
  private tail: Promise<unknown> = Promise.resolve();
  private unresolved?: Request;
  private conflict?: unknown;
  constructor(private version: number, private send: FunnelSender,
    private receive: (funnel: Funnel, request: FunnelWrite) => void,
    private pause = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))) {}

  write(write: FunnelWrite): Promise<Funnel> {
    const captured = structuredClone(write);
    const result = this.tail.then(async () => {
      if (this.conflict) throw this.conflict;
      // A response may have been lost after a successful commit. Resolve that
      // exact mutation first, before choosing the version for any later write.
      if (this.unresolved) await this.perform(this.unresolved);
      const request: Request = { ...captured, control: {
        documentVersion: captured.documentVersion ?? DOCUMENT_VERSION, expectedVersion: this.version,
        mutationId: crypto.randomUUID(), ...(captured.publish ? { publish: true } : {}),
      } };
      return this.perform(request);
    });
    this.tail = result.catch(() => undefined);
    return result;
  }

  private async perform(request: Request): Promise<Funnel> {
    this.unresolved = request;
    for (let attempt = 0; ; attempt++) {
      try {
        const result = await this.send(request);
        this.version = result.editVersion!;
        this.unresolved = undefined;
        this.receive(result, request);
        return result;
      } catch (error) {
        const status = (error as { status?: number })?.status;
        if (status && status >= 400 && status < 500) {
          this.unresolved = undefined;
          if (status === 409) this.conflict = error;
          throw error;
        }
        if (attempt >= 2) throw error;
        await this.pause(1000 * 2 ** attempt);
      }
    }
  }
}
