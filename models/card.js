import mongoose from 'mongoose';
import { type } from 'os';
const Schema = mongoose.Schema;

const CardSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  taskKey: {
    type: String,
    required: false,
  },
  description: {
    type: String,
    required: true,
  },
  duedate: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: false,
  },
  color: {
    type: String, 
    required: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Referencia al modelo User
    required: true,
  },
  projects_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project', // Referencia al modelo Project
    required: true,
  },
  files: [String], // Almacena las URLs de los archivos subidos
}, { timestamps: false });

const Card = mongoose.model('Card', CardSchema);

export default Card;


