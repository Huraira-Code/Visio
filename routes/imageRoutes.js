const express = require("express");
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const VisionBoard = require("../models/Image");
const axios = require("axios");

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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

router.post("/AiCreation", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ message: "Prompt is required" });
    }

    const seed = Math.floor(Math.random() * 1e9);

    // 1️⃣ Create AI job
    const createRes = await axios.post(
      "https://api.deapi.ai/api/v1/client/txt2img",
      {
        model: "Flux1schnell",
        prompt,
        steps: 4,
        width: 1280,
        height: 720,
        seed,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.DEAPI_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const requestId = createRes.data.data.request_id;
    console.log(requestId);
    // 2️⃣ Poll job status
    let imageBase64 = null;

    for (let i = 0; i < 12; i++) {
      await sleep(3000); // wait 3 seconds

      const statusRes = await axios.get(
        `https://api.deapi.ai/api/v1/client/request-status/${requestId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.DEAPI_KEY}`,
            Accept: "application/json",
          },
        }
      );

      const job = statusRes.data.data;
      console.log("this is job", job);
      if (job.status === "done") {
        imageBase64 = job;
        break;
      }

      if (job.status === "failed") {
        return res.status(500).json({
          message: "AI generation failed",
        });
      }
    }

    if (!imageBase64) {
      return res.status(408).json({
        message: "Image generation timeout",
      });
    }

    // 3️⃣ Return image to frontend
    res.json({
      success: true,
      image: imageBase64.result_url,
      seed,
      requestId,
    });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({
      message: "AI image generation error",
    });
  }
});

// Helper to download image as buffer from a URL
async function downloadImage(url) {
  const response = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(response.data, "binary");
}

router.post("/uploadFromUrl", async (req, res) => {
  try {
    const { url, slot } = req.body;
    
    if (!url || !slot) {
      return res.status(400).json({ error: "Both url and slot are required" });
    }

    if (!["0", "1", "2", "3"].includes(slot.toString())) {
      return res.status(400).json({ error: "Invalid slot" });
    }

    // 1️⃣ Download the image
    const imageBuffer = await downloadImage(url);

    // 2️⃣ Upload to Cloudinary
    const result = await cloudinary.uploader.upload(
      `data:image/jpeg;base64,${imageBuffer.toString("base64")}`
    );

    // 3️⃣ Get or create VisionBoard
    let board = await VisionBoard.findById("screen_1");
    if (!board) {
      board = new VisionBoard();
      board.blocks = {}; // initialize blocks if needed
    }

    // 4️⃣ Update the correct block
    board.blocks[`block${parseInt(slot) + 1}`] = result.secure_url;
    await board.save();

    // 5️⃣ Return Cloudinary URL
    res.json({
      success: true,
      cloudinaryUrl: result.secure_url,
      block: `block${parseInt(slot) + 1}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to upload image from URL" });
  }
});

module.exports = router;
