var signalR;
var Archetypical;
(function (Archetypical) {
    var Software;
    (function (Software) {
        var Conduit = /** @class */ (function () {
            function Conduit() {
                var _this = this;
                this.connection = new signalR.HubConnectionBuilder().withUrl("/conduit").build();
                this.connection.start().catch(function (err) { return console.error(err.toString()); });
                this.connection.on("conduit", function (name, obj) {
                    console.log(obj);
                });
                this.register = function (delegate) {
                    _this.callbacks.push(delegate);
                };
            }
            return Conduit;
        }());
        Software.Conduit = Conduit;
    })(Software = Archetypical.Software || (Archetypical.Software = {}));
})(Archetypical || (Archetypical = {}));
//# sourceMappingURL=site.js.map