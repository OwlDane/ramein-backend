"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventPackage = exports.PackageType = void 0;
const typeorm_1 = require("typeorm");
const Event_1 = require("./Event");
const Participant_1 = require("./Participant");
var PackageType;
(function (PackageType) {
    PackageType["BASIC"] = "BASIC";
    PackageType["PREMIUM"] = "PREMIUM";
    PackageType["VIP"] = "VIP";
    PackageType["CUSTOM"] = "CUSTOM";
})(PackageType || (exports.PackageType = PackageType = {}));
let EventPackage = class EventPackage {
};
exports.EventPackage = EventPackage;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], EventPackage.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], EventPackage.prototype, "eventId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], EventPackage.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: PackageType,
        default: PackageType.BASIC
    }),
    __metadata("design:type", String)
], EventPackage.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)("decimal", { precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], EventPackage.prototype, "price", void 0);
__decorate([
    (0, typeorm_1.Column)("decimal", { precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], EventPackage.prototype, "originalPrice", void 0);
__decorate([
    (0, typeorm_1.Column)("text"),
    __metadata("design:type", String)
], EventPackage.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: -1 }),
    __metadata("design:type", Number)
], EventPackage.prototype, "maxParticipants", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], EventPackage.prototype, "currentParticipants", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], EventPackage.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], EventPackage.prototype, "isPopular", void 0);
__decorate([
    (0, typeorm_1.Column)("simple-array", { nullable: true }),
    __metadata("design:type", Array)
], EventPackage.prototype, "features", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], EventPackage.prototype, "validFrom", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], EventPackage.prototype, "validUntil", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], EventPackage.prototype, "sortOrder", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], EventPackage.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], EventPackage.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Event_1.Event, event => event.packages),
    (0, typeorm_1.JoinColumn)({ name: "eventId" }),
    __metadata("design:type", Event_1.Event)
], EventPackage.prototype, "event", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Participant_1.Participant, participant => participant.package),
    __metadata("design:type", Array)
], EventPackage.prototype, "participants", void 0);
exports.EventPackage = EventPackage = __decorate([
    (0, typeorm_1.Entity)()
], EventPackage);
//# sourceMappingURL=EventPackage.js.map