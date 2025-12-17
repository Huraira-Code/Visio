const mongoose = require("mongoose");

const visionBoardSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
    },
    blocks: {
      block1: { type: String, default: "" }, // URL of first image
      block2: { type: String, default: "" }, // URL of second image
      block3: { type: String, default: "" }, // URL of third image
      block4: { type: String, default: "" }, // URL of fourth image
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("screens", visionBoardSchema);
