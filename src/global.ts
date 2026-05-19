export class Global {
    private static instance: Global;

    static getInstance() {
        if(!Global.instance) {
            Global.instance = new Global();
        }
        return Global.instance;
    }
}