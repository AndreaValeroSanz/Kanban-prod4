import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: String,
    surname1: String,
    surname2: String,
    email: String,
    password: String,
    avatar: String
});

const User = mongoose.model("users", userSchema);

export default User;