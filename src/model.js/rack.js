import { User } from "./user";
import { Team } from "./team";

function parseIntSafe(val, defaultValue = 0) {
  if (typeof val === "number") return Math.floor(val);
  if (typeof val === "string") return parseInt(val, 10) || defaultValue;
  return defaultValue;
}
function parseFloatSafe(val) {
  if (typeof val === "number") return val;
  if (typeof val === "string") return parseFloat(val);
  return null;
}

export class Rack {
  constructor(obj) {
    obj = obj || {};
    // ScannedBy may be object or ID
    let scannedByObj =
      typeof obj.scannedBy === "object"
        ? new User(obj.scannedBy)
        : null;
    let scannedById =
      typeof obj.scannedBy === "string"
        ? obj.scannedBy
        : scannedByObj
        ? scannedByObj.id
        : obj.scannedById || "";
    // Team: object or undefined
    let teamObj =
      typeof obj.team === "object" ? new Team(obj.team) : null;

    this.id = obj._id || "";
    this.rackNo = obj.rackNo || "";
    this.partNo = obj.partNo || "";
    this.mrp = parseFloatSafe(obj.mrp);
    this.nextQty = parseIntSafe(obj.nextQty);
    this.location = obj.location || "";
    this.siteName = obj.siteName || "";
    this.scannedById = scannedById;
    this.createdAt = obj.createdAt ? new Date(obj.createdAt) : null;
    this.updatedAt = obj.updatedAt ? new Date(obj.updatedAt) : null;
    this.materialDescription = obj.materialDescription || "";
    this.ndp = parseFloatSafe(obj.ndp);
    this.team = teamObj;
    this.scannedBy = scannedByObj;
  }

  static fromJson(json) {
    return new Rack(json);
  }

  toJson() {
    return {
      _id: this.id,
      rackNo: this.rackNo,
      partNo: this.partNo,
      mrp: this.mrp,
      nextQty: this.nextQty,
      location: this.location,
      siteName: this.siteName,
      scannedById: this.scannedById,
      createdAt: this.createdAt ? this.createdAt.toISOString() : undefined,
      updatedAt: this.updatedAt ? this.updatedAt.toISOString() : undefined,
      materialDescription: this.materialDescription,
      ndp: this.ndp,
    };
  }
}
