"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const signalR = __importStar(require("@aspnet/signalr"));
function find(array, predicate) {
    let first = null;
    array.every((x) => {
        if (predicate(x)) {
            first = x;
            return false;
        }
        return true;
    });
    return first;
}
class Conduit {
    constructor(host = null, logLevel = signalR.LogLevel.Error) {
        this._pushHandler = (payload) => {
            const eventKey = payload.eventKey;
            const message = payload.message;
            const handlers = this._eventHandlers.filter(x => x.eventKey === eventKey);
            if (handlers) {
                handlers.forEach(x => {
                    try {
                        x.callback(message);
                    }
                    catch (err) {
                        // tslint:disable-next-line:no-console
                        console.log('conduit: ' + err);
                    }
                });
            }
        };
        this._connectionPromise = null;
        this._connection = null;
        this._eventHandlers = [];
        this._id = 1;
        this._logLevel = logLevel;
        this._host = host || '';
        this._closedByUser = false;
        this._filters = [];
        this._subscriptions = [];
    }
    subscribe(eventKey, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!eventKey || typeof eventKey !== 'string') {
                throw new Error('eventKey must be a valid string');
            }
            if (!callback || typeof callback !== 'function') {
                throw new Error('handler must be a valid function');
            }
            this._closedByUser = false;
            this._subscriptions.push({
                eventKey,
                isSent: false,
            });
            yield this._start();
            yield this._processQueue();
            const handler = {
                callback,
                eventKey,
                id: this._id++,
            };
            this._eventHandlers.push(handler);
            return handler.id;
        });
    }
    applyFilter(filterName, filter) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!filterName || typeof filterName !== 'string') {
                throw new Error('filterName must be a valid string');
            }
            if (!filter || typeof filter !== 'object') {
                throw new Error('filter must be a valid object');
            }
            let entry = find(this._filters, x => x.filterName === filterName);
            if (!entry) {
                entry = {
                    filter,
                    filterName,
                    isSent: false,
                };
                this._filters.push(entry);
            }
            else {
                entry.isSent = false;
                entry.filter = filter;
            }
            yield this._processQueue();
        });
    }
    unsubscribe(id) {
        if (!id || typeof id !== 'number') {
            throw new Error('id must be a valid number');
        }
        const originalLength = this._eventHandlers.length;
        this._eventHandlers = this._eventHandlers.filter(x => x.id !== id);
        return this._eventHandlers.length !== originalLength;
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._connection) {
                this._closedByUser = true;
                this._id = 1;
                yield this._connection.stop();
                this._connection = null;
                this._connectionPromise = null;
                this._filters = [];
                this._subscriptions = [];
            }
        });
    }
    isConnected() {
        if (this._connection) {
            return this._connection.state === signalR.HubConnectionState.Connected;
        }
        return false;
    }
    _start() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._connectionPromise === null) {
                this._connection = new signalR.HubConnectionBuilder()
                    .withUrl(`${this._host}/conduit`)
                    .configureLogging(this._logLevel)
                    .build();
                this._connection.on('conduit', this._pushHandler);
                this._connection.onclose(() => {
                    this._connectionPromise = null;
                    this._connection = null;
                    if (!this._closedByUser) {
                        this._start();
                    }
                });
                try {
                    this._connectionPromise = this._connection.start();
                    yield this._connectionPromise;
                    yield this._processQueue();
                }
                catch (err) {
                    this._connectionPromise = null;
                    // tslint:disable-next-line:no-console
                    console.log('conduit: ' + err);
                    setTimeout(() => this._start(), 5000);
                }
            }
            return this._connectionPromise;
        });
    }
    _processQueue() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isConnected()) {
                // Filters
                const filtersToSend = this._filters.filter(x => !x.isSent);
                filtersToSend.forEach((x) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        x.isSent = true;
                        yield this._connection.invoke('ApplyFilter', x.filterName, x.filter);
                    }
                    catch (_a) {
                        x.isSent = false;
                        // tslint:disable-next-line:no-empty
                    }
                }));
                // Subscriptions
                const subscriptionsToSend = this._subscriptions.filter(x => !x.isSent);
                subscriptionsToSend.forEach((x) => __awaiter(this, void 0, void 0, function* () {
                    if (find(this._subscriptions, y => y.eventKey === x.eventKey && y.isSent)) {
                        x.isSent = true;
                    }
                    else {
                        try {
                            x.isSent = true;
                            yield this._connection.invoke('SubscribeToEventAsync', x.eventKey);
                        }
                        catch (_b) {
                            x.isSent = false;
                            // tslint:disable-next-line:no-empty
                        }
                    }
                }));
            }
        });
    }
}
exports.Conduit = Conduit;
//# sourceMappingURL=index.js.map