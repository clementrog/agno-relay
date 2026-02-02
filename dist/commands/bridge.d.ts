export interface BridgeOptions {
    url: string;
    port: number;
    allowAuthPassthrough: boolean;
    trace: boolean;
}
export declare function runBridge(options: BridgeOptions): Promise<void>;
