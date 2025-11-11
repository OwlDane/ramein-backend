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
exports.Testimonial = void 0;
const typeorm_1 = require("typeorm");
let Testimonial = class Testimonial {
};
exports.Testimonial = Testimonial;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Testimonial.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Testimonial.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Testimonial.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Testimonial.prototype, "company", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], Testimonial.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], Testimonial.prototype, "avatar", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "integer", default: 5 }),
    __metadata("design:type", Number)
], Testimonial.prototype, "rating", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Testimonial.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "integer", default: 0 }),
    __metadata("design:type", Number)
], Testimonial.prototype, "sortOrder", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "createdAt" }),
    __metadata("design:type", Date)
], Testimonial.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: "updatedAt" }),
    __metadata("design:type", Date)
], Testimonial.prototype, "updatedAt", void 0);
exports.Testimonial = Testimonial = __decorate([
    (0, typeorm_1.Entity)("testimonial")
], Testimonial);
//# sourceMappingURL=Testimonial.js.map