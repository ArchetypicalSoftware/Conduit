var signalR: any;
namespace Archetypical.Software {
    interface ICallback<T> {
        (message: T): void;
    }
    export class Conduit {
        connection: any;
        public register: (delegate: ICallback<any>) => void;
        private callbacks: ICallback<any>[];

        constructor() {
            this.connection = new signalR.HubConnectionBuilder().withUrl("/conduit").build();
            this.connection.start().catch(err => console.error(err.toString()));
            this.connection.on("conduit", (name: string, obj: any) => {
                console.log(obj);
            });

            this.register = (delegate: ICallback<any>) => {
                this.callbacks.push(delegate);
            }
        }
    }
}