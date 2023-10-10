interface Meeting {
  id: string;
  users: { user_id: string }[];
}

export class MeetingService {
  constructor(private db: D1Database) {}

  async createMeeting() {
    const id = crypto.randomUUID();
    await this.db
      .prepare("INSERT INTO meetings (id) VALUES (?)")
      .bind(id)
      .run();
    return { id };
  }

  getUserIdsInMeeting(meetingId: string) {
    return this.db
      .prepare("SELECT user_id FROM meetings_users WHERE meeting_id = ?")
      .bind(meetingId)
      .all<{ user_id: string }>();
  }

  getMeetingWithId(id: string) {
    return this.db
      .prepare("SELECT * FROM meetings WHERE id = ?")
      .bind(id)
      .first<Meeting>();
  }

  async addParticipant(meetingId: string, userId: string) {
    const { count } = (await this.db
      .prepare(
        "SELECT COUNT(*) FROM meetings_users WHERE meeting_id = ? AND user_id = ?"
      )
      .bind(meetingId, userId)
      .first<{ count: number }>()) ?? { count: 0 };

    if (count >= 2) {
      // hardcapping the number of peers allowed in the call for this demo
      throw new Error("Maximum number of participants reached");
    }

    await this.db
      .prepare(
        "INSERT OR IGNORE INTO meetings_users (meeting_id, user_id) VALUES (?, ?)"
      )
      .bind(meetingId, userId)
      .run();
  }

  async removeParticipant(meetingId: string, userId: string) {
    await this.db
      .prepare(
        "DELETE FROM meetings_users WHERE meeting_id = ? AND user_id = ?"
      )
      .bind(meetingId, userId)
      .run();
  }
}
