import { User } from "./user";

export class Team {
  constructor(obj) {
    obj = obj || {};
    // Handle leader and members either as objects or as IDs
    let teamLeaderObj = obj.teamLeader
      ? typeof obj.teamLeader === "object"
        ? new User(obj.teamLeader)
        : null
      : null;

    let leaderId =
      typeof obj.teamLeader === "string"
        ? obj.teamLeader
        : teamLeaderObj
        ? teamLeaderObj.id
        : obj.teamLeaderId || null;

    // Members: list of users or list of IDs
    let membersList = null,
      memberIdList = null;
    if (Array.isArray(obj.members) && obj.members.length > 0) {
      if (typeof obj.members[0] === "object") {
        membersList = obj.members.map((m) => new User(m));
        memberIdList = membersList.map((m) => m.id);
      } else {
        memberIdList = obj.members.map((m) => String(m));
      }
    }

    this.id = obj._id || "";
    this.siteName = obj.siteName || "";
    this.location = obj.location || "";
    this.description = obj.description || "";
    this.isNewSite = !!obj.isNewSite;
    this.status = obj.status || "active";
    this.createdAt = obj.createdAt ? new Date(obj.createdAt) : null;
    this.updatedAt = obj.updatedAt ? new Date(obj.updatedAt) : null;
    this.teamLeaderId = leaderId;
    this.teamLeader = teamLeaderObj;
    this.memberIds = memberIdList;
    this.members = membersList;
  }

  static fromJson(json) {
    return new Team(json);
  }

  toJson() {
    return {
      _id: this.id,
      siteName: this.siteName,
      location: this.location,
      description: this.description,
      isNewSite: this.isNewSite,
      status: this.status,
      teamLeader: this.teamLeader ? this.teamLeader.toJson() : this.teamLeaderId,
      members: this.members
        ? this.members.map((m) => m.toJson())
        : this.memberIds || [],
      createdAt: this.createdAt
        ? this.createdAt.toISOString()
        : undefined,
      updatedAt: this.updatedAt ? this.updatedAt.toISOString() : undefined,
    };
  }
}
