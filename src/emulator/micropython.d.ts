declare module '@micropython/micropython-webassembly-pyscript' {
    export function loadMicroPython(options?: {
        stdout?: (text: string) => void;
        locateFile?: (path: string, prefix: string) => string;
    }): Promise<any>;
}
