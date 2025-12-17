const express = require("express");
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const VisionBoard = require("../models/Image");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Get the current vision board
router.get("/", async (req, res) => {
  console.log;
  try {
    let board = await VisionBoard.findById("screen_1");
    console.log(board);
    if (!board) {
      board = new VisionBoard(); // create if none exists
      await board.save();
    }
    res.json(board.blocks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload / replace a specific slot image
router.post("/upload", upload.single("image"), async (req, res) => {
  console.log("safhj");
  try {
    const slot = req.query.slot; // slot number from frontend: 0,1,2,3
    if (!["0", "1", "2", "3"].includes(slot)) {
      return res.status(400).json({ error: "Invalid slot" });
    }

    // Upload image to Cloudinary
    const result = await cloudinary.uploader.upload(
      `data:image/jpeg;base64,${req.file.buffer.toString("base64")}`
    );

    // Get or create VisionBoard document
    let board = await VisionBoard.findById("screen_1");
    if (!board) {
      board = new VisionBoard();
    }

    // Update the correct slot
    board.blocks[`block${parseInt(slot) + 1}`] = result.secure_url;

    await board.save();
    res.json(board);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
