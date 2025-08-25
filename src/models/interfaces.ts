export interface IUser {
  id?: string;
  email: string;
  password: string;
  name: string;
  phone: string;
  address: string;
  education: string;
  isVerified?: boolean;
  verificationToken?: string | null;
  tokenExpiry?: Date | null;
  resetToken?: string | null;
  resetTokenExpiry?: Date | null;
  role?: 'USER' | 'ADMIN';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IEvent {
  id?: string;
  title: string;
  date: Date;
  time: string;
  location: string;
  flyer: string;
  certificate?: string;
  description: string;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy: string;
  isPublished?: boolean;
}

export interface IParticipant {
  id?: string;
  userId: string;
  eventId: string;
  tokenNumber: string;
  hasAttended?: boolean;
  attendedAt?: Date | null;
  certificateUrl?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IEventCategory {
  id?: string;
  nama_kategori: string;
  slug: string;
  kategori_logo?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
