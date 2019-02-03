export class KhabindOptions {
    idlFile: string;
    nativeLib: string;
    sourcesDir: string;
    chopPrefix: string;
    autoGC: boolean;
    includes: Array<string>;
    emccOptimizationLevel: string;
    emccArgs: Array<string>;
}
