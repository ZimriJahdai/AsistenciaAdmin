export type AttendanceLocation = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
};

export type AttendanceRecord = {
  _id: string;
  fullName: string;
  className: string;
  leaderName: string;
  phone: string;
  comment: string;
  location: AttendanceLocation;
  createdAt: string;
  updatedAt: string;
};
