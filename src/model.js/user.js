// src/model/user.js

export class User {
  constructor(obj) {
    obj = obj || {};
    this.id = obj.id || obj._id || "";
    this.name = obj.name || "";
    this.email = obj.email || "";
    this.role = obj.role || "";
    this.isActive =
      typeof obj.isActive === "boolean"
        ? obj.isActive
        : typeof obj.isActive === "string"
        ? obj.isActive.toLowerCase() === "true"
        : obj.isActive == null
        ? true
        : !!obj.isActive;
  }

  static fromJson(json) {
    return new User(json);
  }

  toJson() {
    return {
      _id: this.id,
      name: this.name,
      email: this.email,
      role: this.role,
      isActive: this.isActive,
    };
  }

  get initialLetter() {
    return this.name && this.name.length > 0
      ? this.name[0].toUpperCase()
      : "?";
  }
}
