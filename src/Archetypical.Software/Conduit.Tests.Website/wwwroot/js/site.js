var signalR;
var Archetypical;
(function (Archetypical) {
    var Software;
    (function (Software) {
        var Conduit = /** @class */ (function () {
            function Conduit() {
                var _this = this;
                this.callbacks = {};
                this.connection = new signalR.HubConnectionBuilder().withUrl("/conduit").build();
                this.connection.start().catch(function (err) { return console.error(err.toString()); }).then(console.log);
                this.connection.onclose(function () {
                    setTimeout(_this.connection.start(), 1000);
                });
                this.connection.on("conduit", function (name, obj) {
                    var callbacks = _this.callbacks[name];
                    if (callbacks) {
                        for (var _i = 0, callbacks_1 = callbacks; _i < callbacks_1.length; _i++) {
                            var delegate = callbacks_1[_i];
                            delegate(obj);
                        }
                    }
                });
            }
            Conduit.prototype.register = function (typeName, delegate) {
                this.callbacks[typeName] = this.callbacks[typeName] || [];
                this.callbacks[typeName].push(delegate);
            };
            Conduit.prototype.subscribe = function (subscriptionTypeName, subscription) {
                this.connection.invoke("Subscribe", subscriptionTypeName, subscription);
            };
            return Conduit;
        }());
        Software.Conduit = Conduit;
    })(Software = Archetypical.Software || (Archetypical.Software = {}));
})(Archetypical || (Archetypical = {}));
//# sourceMappingURL=site.js.map