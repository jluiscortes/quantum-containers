import { Schema } from 'mongoose';

export const ContainerEventSchema = new Schema({
  containerId: { type: String, required: true },
  state: {
    type: String,
    enum: ['operational', 'damaged', 'unknown'],
    required: true,
  },
  timestamp: { type: Date, required: true },
  source: { type: String, required: true },
});
