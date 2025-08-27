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
exports.Event = void 0;
const typeorm_1 = require("typeorm");
const Participant_1 = require("./Participant");
const Certificate_1 = require("./Certificate");
const EventPackage_1 = require("./EventPackage");
let Event = class Event {
};
exports.Event = Event;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Event.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Event.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Date)
], Event.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Event.prototype, "time", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Event.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)("text"),
    __metadata("design:type", String)
], Event.prototype, "flyer", void 0);
__decorate([
    (0, typeorm_1.Column)("text", { nullable: true }),
    __metadata("design:type", String)
], Event.prototype, "certificate", void 0);
__decorate([
    (0, typeorm_1.Column)("text"),
    __metadata("design:type", String)
], Event.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Event.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Event.prototype, "isPublished", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Event.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Event.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Participant_1.Participant, participant => participant.event),
    __metadata("design:type", Array)
], Event.prototype, "participants", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Certificate_1.Certificate, certificate => certificate.event),
    __metadata("design:type", Array)
], Event.prototype, "certificates", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => EventPackage_1.EventPackage, eventPackage => eventPackage.event),
    __metadata("design:type", Array)
], Event.prototype, "packages", void 0);
exports.Event = Event = __decorate([
    (0, typeorm_1.Entity)()
], Event);
//# sourceMappingURL=Event.js.map