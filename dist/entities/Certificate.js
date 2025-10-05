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
exports.Certificate = void 0;
const typeorm_1 = require("typeorm");
const Participant_1 = require("./Participant");
const Event_1 = require("./Event");
let Certificate = class Certificate {
};
exports.Certificate = Certificate;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Certificate.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Certificate.prototype, "participantId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Certificate.prototype, "eventId", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Certificate.prototype, "certificateNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Certificate.prototype, "certificateUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Certificate.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Certificate.prototype, "isVerified", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], Certificate.prototype, "verifiedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Certificate.prototype, "verifiedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Certificate.prototype, "verificationCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], Certificate.prototype, "issuedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Certificate.prototype, "issuedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], Certificate.prototype, "revokedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Certificate.prototype, "revokedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Certificate.prototype, "revocationReason", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Certificate.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Certificate.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Participant_1.Participant, participant => participant.user),
    (0, typeorm_1.JoinColumn)({ name: 'participantId' }),
    __metadata("design:type", Participant_1.Participant)
], Certificate.prototype, "participant", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Event_1.Event, event => event.participants),
    (0, typeorm_1.JoinColumn)({ name: 'eventId' }),
    __metadata("design:type", Event_1.Event)
], Certificate.prototype, "event", void 0);
exports.Certificate = Certificate = __decorate([
    (0, typeorm_1.Entity)()
], Certificate);
//# sourceMappingURL=Certificate.js.map