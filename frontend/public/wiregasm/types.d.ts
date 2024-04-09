export interface EmscriptenFileSystem {
    writeFile(path: string, data: string | ArrayBufferView, opts?: {
        flags?: string | undefined;
    }): void;
    readdir(path: string): string[];
    mkdirTree(path: string, mode?: number): any;
    mkdir(path: string, mode?: number): any;
}
export interface EmscriptenHeap {
    buffer: ArrayBufferLike;
}
export interface EmscriptenModule {
    FS: EmscriptenFileSystem;
    HEAPU8: EmscriptenHeap;
    _malloc(size: number): number;
}
export interface Vector<T> {
    size(): number;
    get(index: number): T;
}
export interface DataSource {
    name: string;
    data: string;
}
export interface ProtoTree {
    label: string;
    filter: string;
    start: number;
    length: number;
    data_source_idx: number;
    type: "proto" | "url" | "framenum" | "";
    url?: string;
    fnum?: number;
    tree: Vector<ProtoTree>;
}
export interface Frame {
    number: number;
    comments: Vector<string>;
    data_sources: Vector<DataSource>;
    tree: Vector<ProtoTree>;
    follow: Vector<Vector<string>>;
}
export interface CompleteField {
    field: string;
    type: string;
    name: string;
}
export interface FramesResponse {
    frames: Vector<FrameMeta>;
    matched: number;
}
export interface FollowPayload {
    number: number;
    server: number;
    data: string;
}
export interface Follow {
    shost: string;
    sport: string;
    sbytes: number;
    chost: string;
    cport: string;
    cbytes: number;
    payloads: Vector<FollowPayload>;
}
export interface FrameMeta {
    number: number;
    comments: boolean;
    ignored: boolean;
    marked: boolean;
    bg: number;
    fg: number;
    columns: Vector<string>;
}
export interface LoadSummary {
    filename: string;
    file_type: string;
    file_length: number;
    file_encap_type: string;
    packet_count: number;
    start_time: number;
    stop_time: number;
    elapsed_time: number;
}
export interface LoadResponse {
    code: number;
    error: string;
    summary: LoadSummary;
}
export interface DissectSession {
    /**
     * Free up any memory used by the session
     */
    delete(): void;
    /**
     * Load a packet trace file for analysis.
     *
     * @returns Response containing the status and summary
     */
    load(): LoadResponse;
    /**
     * Get Packet List information for a range of packets.
     *
     * @param filter Output those frames that pass this filter expression
     * @param skip Skip N frames
     * @param limit Limit the output to N frames
     */
    getFrames(filter: string, skip: number, limit: number): FramesResponse;
    /**
     * Get full information about a frame including the protocol tree.
     *
     * @param number Frame number
     */
    getFrame(number: number): Frame;
    follow(follow: string, filter: string): Follow;
}
export interface DissectSessionConstructable {
    new (path: string): DissectSession;
}
export interface CheckFilterResponse {
    ok: boolean;
    error: string;
}
export interface WiregasmLibOverrides {
    /**
     * If set, this method will be called when the runtime needs to load a file,
     * such as a .wasm WebAssembly file, .mem memory init file, or a file generated
     * by the file packager. The function receives the relative path to the file as
     * configured in build process and a prefix (path to the main JavaScript file’s
     * directory), and should return the actual URL.
     *
     * This lets you host file packages or the .mem file etc. on a different location
     * than the directory of the JavaScript file (which is the default expectation),
     * for example if you want to host them on a CDN.
     *
     * @param path Path of the requested file.
     * @param prefix Prefix of the requested path. May be empty.
     *
     * @returns Path to the requested file.
     */
    locateFile?(path: string, prefix: string): string;
    /**
     * Called when something is printed to standard error (stderr)
     *
     * @param error Error content
     */
    printErr?(error: string): void;
    /**
     * Called when something is printed to standard output (stdout)
     *
     * @param message Message content
     */
    print?(message: string): void;
    /**
     * Called from within the Wiregasm Library to notify
     * about any status updates.
     *
     * @param type Type of the status
     * @param message Message content
     */
    handleStatus?(type: number, message: string): void;
    /**
     * If you can fetch the binary yourself, you can set it
     */
    wasmBinary?: ArrayBuffer;
    /**
     * If you want to manually manage the download of .data file packages for
     * custom caching, progress reporting and error handling behavior,
     * you can implement this override.
     */
    getPreloadedPackage?(name: string, size: number): ArrayBuffer;
}
export interface WiregasmLib extends EmscriptenModule {
    DissectSession: DissectSessionConstructable;
    /**
     * Returns the directory where files are uploaded
     *
     * @returns Path of the directory
     */
    getUploadDirectory(): string;
    /**
     * Returns the directory where plugins are stored
     *
     * @returns Path of the plugins directory
     */
    getPluginsDirectory(): string;
    /**
     * Initialize the library, load preferences and register dissectors
     */
    init(): boolean;
    /**
     * Reload lua plugins
     */
    reloadLuaPlugins(): boolean;
    /**
     * Clean up any memory associated with the lib
     */
    destroy(): void;
    /**
     * Check the validity of a filter expression.
     *
     * @param filter A display filter expression
     */
    checkFilter(filter: string): CheckFilterResponse;
    completeFilter(filter: string): {
        err: string;
        fields: Vector<CompleteField>;
    };
    /**
     * Returns the column headers
     */
    getColumns(): Vector<string>;
    /**
     * Creates a new file in the upload directory with the supplied data
     *
     * @param file_name Name of the file
     * @param data_ptr Pointer to the data
     * @param length Length of the data
     */
    upload(file_name: string, data_ptr: number, length: number): string;
}
export type WiregasmLoader = (overrides: WiregasmLibOverrides) => Promise<WiregasmLib>;
export type BeforeInitCallback = (lib: WiregasmLib) => Promise<void>;
/**
 * Converts a Vector to a JS array
 *
 * @param vec Vector
 * @returns JS array of the Vector contents
 */
export function vectorToArray<T>(vec: Vector<T>): T[];
/**
 * Wraps the WiregasmLib lib functionality and manages a single DissectSession
 */
export class Wiregasm {
    lib: WiregasmLib;
    initialized: boolean;
    session: DissectSession | null;
    uploadDir: string;
    pluginsDir: string;
    constructor();
    /**
     * Initialize the wrapper and the Wiregasm module
     *
     * @param loader Loader function for the Emscripten module
     * @param overrides Overrides
     */
    init(loader: WiregasmLoader, overrides?: WiregasmLibOverrides, beforeInit?: BeforeInitCallback): Promise<void>;
    /**
     * Check the validity of a filter expression.
     *
     * @param filter A display filter expression
     */
    test_filter(filter: string): CheckFilterResponse;
    complete_filter(filter: string): {
        err: string;
        fields: CompleteField[];
    };
    reload_lua_plugins(): void;
    add_plugin(name: string, data: string | ArrayBufferView, opts?: object): void;
    /**
     * Load a packet trace file for analysis.
     *
     * @returns Response containing the status and summary
     */
    load(name: string, data: string | ArrayBufferView, opts?: object): LoadResponse;
    /**
     * Get Packet List information for a range of packets.
     *
     * @param filter Output those frames that pass this filter expression
     * @param skip Skip N frames
     * @param limit Limit the output to N frames
     */
    frames(filter: string, skip?: number, limit?: number): FramesResponse;
    /**
     * Get full information about a frame including the protocol tree.
     *
     * @param number Frame number
     */
    frame(num: number): Frame;
    follow(follow: string, filter: string): Follow;
    destroy(): void;
    /**
     * Returns the column headers
     */
    columns(): string[];
}

//# sourceMappingURL=types.d.ts.map
