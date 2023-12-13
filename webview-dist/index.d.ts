export declare type PluginEvent = {
    id: number;
    uuid: string;
    connected: boolean;
    vibration: boolean;
    event: string | object;
    timestamp: number;
    name: string;
    buttons: ReadonlyArray<number>;
    axes: ReadonlyArray<number>;
    mapping: string;
    power_info: string;
};
declare type UnlistenFn = () => void;
declare type Callback = (response: PluginEvent) => void;
export declare const getGamepads: () => Gamepad[] | null[];
export declare const execute: (cb: Callback) => Promise<UnlistenFn>;
export {};
