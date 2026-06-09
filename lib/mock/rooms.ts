export type RoomStatus = "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";
export type RoomType = "STANDARD" | "DELUXE" | "SUITE";

export interface MockRoom {
  id: number;
  roomNumber: string;
  roomType: RoomType;
  floor: number;
  price: number;
  status: RoomStatus;
  isActive: boolean;
  maxGuests: number;
  description: string;
  imageUrl: string;
}

export const mockRooms: MockRoom[] = [
  {
    id: 1,
    roomNumber: "101",
    roomType: "STANDARD",
    floor: 1,
    price: 1200,
    status: "AVAILABLE",
    isActive: true,
    maxGuests: 2,
    description: "ห้องมาตรฐาน เตียงควีนไซส์",
    imageUrl: "/mock_room.png",
  },
  {
    id: 2,
    roomNumber: "102",
    roomType: "STANDARD",
    floor: 1,
    price: 1200,
    status: "OCCUPIED",
    isActive: true,
    maxGuests: 2,
    description: "ห้องมาตรฐาน วิวเมือง",
    imageUrl: "/mock_room.png",
  },
  {
    id: 3,
    roomNumber: "201",
    roomType: "DELUXE",
    floor: 2,
    price: 1800,
    status: "AVAILABLE",
    isActive: true,
    maxGuests: 3,
    description: "ห้องดีลักซ์ พร้อมโซฟา",
    imageUrl: "/mock_room.png",
  },
  {
    id: 4,
    roomNumber: "202",
    roomType: "DELUXE",
    floor: 2,
    price: 1800,
    status: "MAINTENANCE",
    isActive: true,
    maxGuests: 3,
    description: "ปิดปรับปรุงระบบแอร์",
    imageUrl: "/mock_room.png",
  },
  {
    id: 5,
    roomNumber: "301",
    roomType: "SUITE",
    floor: 3,
    price: 2800,
    status: "AVAILABLE",
    isActive: true,
    maxGuests: 4,
    description: "ห้องสวีท 1 ห้องนั่งเล่น",
    imageUrl: "/mock_room.png",
  },
  {
    id: 6,
    roomNumber: "302",
    roomType: "SUITE",
    floor: 3,
    price: 3000,
    status: "OCCUPIED",
    isActive: true,
    maxGuests: 4,
    description: "ห้องสวีทวิวสวน",
    imageUrl: "/mock_room.png",
  },
];
