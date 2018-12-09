var signalR: any;
namespace Archetypical.Software {
    interface ICallback<T> {
        (message: T): void;
    }
    export class Conduit {
        connection: any;

        private callbacks: {};

        constructor() {
            this.callbacks = {};
            this.connection = new signalR.HubConnectionBuilder().withUrl("/conduit").build();
            this.connection.start().catch(err => console.error(err.toString())).then(console.log);
            this.connection.onclose(() => {
                setTimeout(this.connection.start(), 1000);
            });
            this.connection.on("conduit", (name: string, obj: any) => {
                var callbacks = this.callbacks[name];
                if (callbacks) {
                    for (var delegate of callbacks) {
                        delegate(obj);
                    }
                }
            });
        }

        public register<T>(typeName: string, delegate: ICallback<T>) {
            this.callbacks[typeName] = this.callbacks[typeName] || [];
            this.callbacks[typeName].push(delegate);
        }

        public subscribe<T>(subscriptionTypeName: string, subscription: T) {
            this.connection.invoke("Subscribe", subscriptionTypeName, subscription);
        }
    }
}