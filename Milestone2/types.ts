import { ObjectId } from "mongodb";

export interface Team {
    id: number;
    name: string;
    founded: number;
    active: boolean;
    image: string;
};

export interface Driver {
    id: number;
    name: string;
    description: string;
    age: number;
    active: boolean;
    birthdate: string;
    image: string;
    category: string;
    hobbies: string[];
    team_id: number;
    team: Team;
}

export interface User {
    _id?: ObjectId;
    email: string;
    password?: string;
    role: "ADMIN" | "USER";
}

export interface FlashMessage {
    type: "error" | "success";
    message: string;
}
