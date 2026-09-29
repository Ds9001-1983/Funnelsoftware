import { describe, expect, it, vi } from "vitest";
import { FunnelWriteQueue, type FunnelSender } from "./funnel-write-queue";
import type { Funnel } from "@shared/schema";

const result = (version: number) => ({ editVersion: version } as Funnel);
const pause = async () => undefined;
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(r => { resolve = r; }); return { promise, resolve }; }

describe("serialized editor writes", () => {
  it("orders autosave, publish and restore with consecutive versions", async () => {
    const first = deferred<Funnel>();
    const send = vi.fn<FunnelSender>().mockReturnValueOnce(first.promise).mockResolvedValueOnce(result(4)).mockResolvedValueOnce(result(5));
    const queue = new FunnelWriteQueue(2, send, vi.fn(), pause);
    const autosave = queue.write({ data: { name: "A" } });
    const publish = queue.write({ data: { name: "B", status: "published" }, publish: true });
    const restore = queue.write({ data: {}, restoreId: 7 });
    await Promise.resolve();
    expect(send).toHaveBeenCalledTimes(1);
    first.resolve(result(3));
    await Promise.all([autosave, publish, restore]);
    expect(send.mock.calls.map(([request]) => request.control.expectedVersion)).toEqual([2, 3, 4]);
    expect(send.mock.calls[1][0].data.name).toBe("B");
    expect(send.mock.calls[1][0].control.publish).toBe(true);
    expect(send.mock.calls[2][0].restoreId).toBe(7);
  });
  it("retries a lost response using the identical mutation, then advances", async () => {
    const send = vi.fn<FunnelSender>().mockRejectedValueOnce(new TypeError("offline")).mockResolvedValueOnce(result(10)).mockResolvedValueOnce(result(11));
    const queue = new FunnelWriteQueue(9, send, vi.fn(), pause);
    await queue.write({ data: { name: "A" } });
    await queue.write({ data: { name: "B" } });
    expect(send.mock.calls[0][0]).toEqual(send.mock.calls[1][0]);
    expect(send.mock.calls[2][0].control.expectedVersion).toBe(10);
  });
  it("resolves an uncertain commit before accepting a new payload", async () => {
    const send = vi.fn<FunnelSender>().mockRejectedValueOnce(new TypeError()).mockRejectedValueOnce(new TypeError()).mockRejectedValueOnce(new TypeError()).mockResolvedValueOnce(result(1)).mockResolvedValueOnce(result(2));
    const queue = new FunnelWriteQueue(0, send, vi.fn(), pause);
    await expect(queue.write({ data: { name: "A" } })).rejects.toThrow();
    await queue.write({ data: { name: "B" } });
    expect(send.mock.calls[0][0]).toEqual(send.mock.calls[3][0]);
    expect(send.mock.calls[4][0].control.expectedVersion).toBe(1);
  });
  it("stops all queued writes after a conflict without retrying or overwriting", async () => {
    const error = Object.assign(new Error("changed elsewhere"), { status: 409 });
    const send = vi.fn<FunnelSender>().mockRejectedValue(error);
    const queue = new FunnelWriteQueue(0, send, vi.fn(), pause);
    const a = queue.write({ data: { name: "A" } });
    const b = queue.write({ data: { name: "B" } });
    await expect(a).rejects.toBe(error);
    await expect(b).rejects.toBe(error);
    expect(send).toHaveBeenCalledTimes(1);
  });
});
