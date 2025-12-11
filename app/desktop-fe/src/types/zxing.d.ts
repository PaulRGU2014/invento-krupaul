declare module '@zxing/browser' {
  import type { BarcodeFormat, Result as ZXResult } from '@zxing/library';

  export type Result = ZXResult;

  type HintMap = Map<unknown, unknown>;

  export interface IScannerControls {
    stop(): void;
  }

  export class BrowserMultiFormatReader {
    constructor(hints?: HintMap, timeBetweenScansMillis?: number);
    decodeFromVideoDevice(
      deviceId: string | undefined,
      videoElement: HTMLVideoElement,
      callback: (result: Result | undefined, error: unknown, controls: IScannerControls | undefined) => void
    ): Promise<IScannerControls>;
    listVideoInputDevices(): Promise<MediaDeviceInfo[]>;
    reset(): void;
    setHints(hints: HintMap): void;
  }

  export { BarcodeFormat };
}