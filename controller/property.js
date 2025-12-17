const { default: mongoose } = require("mongoose");
const { uploadOnCloudinary } = require("../Utility/cloudinary");
const Property = require("../models/property");
const jwt = require("jsonwebtoken");
const Agreement = require("../models/Agreement");
const User = require("../models/user");
const stripe = require("stripe")("");
const cron = require("node-cron");

const createProperty = async (req, res) => {
  console.log(req.body);
  console.log("this is first log in controller ", req.files);
  let imageUrlArray = [];

  let uploadPromises = req.files.map((e) => {
    return uploadOnCloudinary(e.path) // Explicitly return the promise here
      .then((url) => {
        imageUrlArray.push(url);
      })
      .catch((error) => {
        console.error("Error uploading file:", error);
      });
  });

  Promise.all(uploadPromises)
    .then(async () => {
      console.log(req.body);
      // Move the code to extract title and create property inside the Promise.all().then() block
      try {
        const title = req.body.title;
        const description = req.body.description;
        const type = req.body.type;
        const rent = req.body.rent;
        const advance = req.body.advance;
        const bachelor = req.body.bachelor;
        const state = "Malir";
        const city = "karachi";
        const area = "Defence";
        const address = req.body.address;
        const coordinate = req.body.coordinate;
        const assest = imageUrlArray; // Use the updated array of image URLs
        const bedroom = req.body.bedroom;
        const bathroom = req.body.bathroom;
        const areaofhouse = req.body.areaofhouse;
        const peoplesharing = req.body.peoplesharing;
        const propertyowner = req.body.propertyOwner;

        const myData = new Property({
          title: title,
          description: description,
          type: type,
          rent: rent,
          advance: advance,
          bachelor: bachelor,
          state: state,
          city: city,
          area: area,
          address: address,
          coordinate: coordinate,
          assest: assest,
          bedroom: bedroom,
          bathroom: bathroom,
          areaofhouse: areaofhouse,
          peoplesharing: peoplesharing,
          propertyowner: propertyowner,
        });

        // Save the new property to the database
        const savedProperty = await myData.save();

        res.status(201).json({
          success: true,
          property: savedProperty,
        });
      } catch (error) {
        console.error("Error creating Property:", error);
        res.status(500).json({
          success: false,
          error: "Internal Server Error",
        });
      }
    })
    .catch((error) => {
      console.error("Error uploading files:", error);
      res.status(500).json({
        success: false,
        error: "Error uploading files",
      });
    });
};

const myProperty = async (req, res) => {
  try {
    // Validate input
    if (!req.body.propertyowner) {
      return res.status(400).json({ error: "Property owner is required" });
    }
    console.log(req.body.propertyowner);
    // Fetch data from the database
    const myData = await Property.find(
      { propertyowner: req.body.propertyowner },
      "_id title description type rent advance bachelor state city area address assest bedroom bathroom areaofhouse propertyowner propertySelling peoplesharing coordinate rented"
    )
      .populate("propertyowner")
      .exec();

    // Check if any data was found
    if (myData.length === 0) {
      return res.status(200).json(myData);
    }

    // Send response
    res.status(200).json(myData);
  } catch (error) {
    // Log the error and send a server error response
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const MyAgreement = async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader.split(" ")[1];
  console.log(token);
  const verify = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  const _id = verify.response._id;
  try {
    // Validate input
    console.log(_id);
    // Fetch data from the database
    const myData = await Property.find(
      { "propertySelling.agreementMaker": _id }, // Corrected the property path
      "_id title description type rent advance bachelor state city area address assest bedroom bathroom areaofhouse propertyowner propertySelling peoplesharing coordinate rented"
    )
      .populate("propertyowner")
      .exec();

    // Check if any data was found
    if (myData.length === 0) {
      return res.status(200).json(myData);
    }

    // Send response
    res.status(200).json(myData);
  } catch (error) {
    // Log the error and send a server error response
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const freshRecommendation = async (req, res) => {
  try {
    // Validate input
    if (!req.body.propertyowner) {
      return res.status(400).json({ error: "Property owner is required" });
    }

    // Fetch data from the database
    const myData = await Property.find(
      {
        $and: [
          { propertyowner: { $ne: req.body.propertyowner } }, // Property owner not equal
          { "propertySelling.agreement": { $ne: true } }, // Agreement maker not equal
        ],
      }, // Use $ne for not equal
      "_id title description type rent advance bachelor state city area address assest bedroom bathroom areaofhouse propertyowner propertySelling peoplesharing coordinate rented"
    )
      .populate("propertyowner") // This will replace the ObjectId with the full User document
      .exec();

    // Check if any data was found
    if (myData.length === 0) {
      return res.status(404).json(myData);
    }

    // Send response
    res.status(200).json(myData);
  } catch (error) {
    // Log the error and send a server error response
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const buyerDetail = async (req, res) => {
  try {
    // Validate input
    const authHeader = req.headers.authorization;
    const token = authHeader.split(" ")[1];
    console.log(token);
    const verify = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const _id = verify.response._id;

    // Fetch data from the database
    const myData = await Property.find(
      {
        $and: [
          { propertyowner: _id }, // Property owner not equal
          { "propertySelling.agreement": true }, // Agreement maker not equal
        ],
      }, // Use $ne for not equal
      "_id title description type rent advance bachelor state city area address assest bedroom bathroom areaofhouse propertyowner propertySelling peoplesharing coordinate rented"
    )
      .populate("propertySelling.agreementMaker")
      .exec();

    // Check if any data was found
    if (myData.length === 0) {
      return res.status(200).json(myData);
    }

    // Send response
    res.status(200).json(myData);
  } catch (error) {
    // Log the error and send a server error response
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const makeAgreement = async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader.split(" ")[1];

  try {
    // Verify the JWT token and get the user ID
    const verify = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const _id = verify.response._id;

    // Step 1: Find the Property first to check if it exists
    const property = await Property.findById(req.body.propertyId);

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    // Step 2: Create a new Agreement
    const newAgreement = new Agreement({
      PropertyId: req.body.propertyId,
      buyerId: _id,
      agreementPricePaid: req.body.agreementPricePaid,
    });

    const savedAgreement = await newAgreement.save(); // Save the agreement

    // Step 3: Update the Property and link the Agreement
    const updatedProperty = await Property.findByIdAndUpdate(
      req.body.propertyId,
      {
        $set: {
          "propertySelling.agreement": true,
          "propertySelling.agreementMaker": new mongoose.Types.ObjectId(_id),
        },
        $push: {
          "propertySelling.agreementIds": savedAgreement._id, // Push agreement ID
        },
      },
      { new: true, runValidators: true } // Return updated property
    );

    if (!updatedProperty) {
      return res
        .status(502)
        .json({ error: "Operation not performed, property not updated" });
    }

    // Step 4: Return the updated property and agreement details
    res.status(200).json({ updatedProperty, agreement: savedAgreement });
  } catch (error) {
    console.error("Error making agreement:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const agreementDetailShow = async (req, res) => {
  const propertyId = req.body.propertyId;
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Authorization header missing" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Verify token
    const verify = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const _id = verify.response._id;

    // Find property by ID
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Extract ownerId and agreementMakerId
    const propertyOwner = property.propertyowner;
    const propertyBuyerId = property.propertySelling.agreementMaker;
    const AgreementDetail =
      property.propertySelling.agreementIds[
        property.propertySelling.agreementIds.length - 1
      ];
    console.log(propertyOwner);
    console.log(AgreementDetail.toString());
    console.log(propertyBuyerId.toString());

    // Fetch owner and agreement maker details
    const owner = await User.findById(propertyOwner);
    const agreementMakerID = await User.findById(propertyBuyerId.toString());
    const agreementDetails = await Agreement.findById(
      AgreementDetail.toString()
    );

    if (!owner || !agreementMakerID) {
      return res
        .status(404)
        .json({ message: "Owner or Agreement Maker not found" });
    }

    // Respond with details
    res.status(200).json({
      property,
      owner,
      agreementMakerID,
      agreementDetails,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const AccceptAgreement = async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Authorization header missing" });
  }

  const token = authHeader.split(" ")[1];
  const agreementId = req.body.Id;

  try {
    // Verify token
    const verify = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const _id = verify.response._id;

    // Find agreement by ID
    const agreement = await Agreement.findById(agreementId);
    if (!agreement) {
      return res.status(404).json({ message: "Agreement not found" });
    }

    // Check if _id matches buyerId
    if (_id == agreement.buyerId.toString()) {
      agreement.agreementBuyer = true;
    } else {
      agreement.agreementOwner = true;
    }

    // Save updated agreement
    await agreement.save();

    res.status(200).json({ message: "Agreement updated successfully" });
  } catch (error) {
    console.error(error);
  }
};

const RejectAgreement = async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Authorization header missing" });
  }

  const token = authHeader.split(" ")[1];
  const agreementId = req.body.Id;
  const propertId = req.body.propertyId;
  const amount = req.body.amount;
  const recipientId = req.body.recipientId;
  console.log(req.body.recipientId);
  try {
    // Verify token
    const verify = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Find agreement by ID
    const agreement = await Agreement.findById(agreementId);
    const property = await Property.findById(propertId);

    if (!agreement) {
      return res.status(404).json({ message: "Agreement not found" });
    }

    agreement.agreementSuccess = false;
    property.propertySelling.agreement = false;
    property.propertySelling.agreementMaker = null;

    // Save updated agreement
    await agreement.save();
    await property.save();
    // Create a Transfer to the connected account
    const transfer = await stripe.transfers.create({
      amount: amount, // amount in cents
      currency: "usd",
      destination: recipientId, // Connected Account ID (acct_...)
    });
    res
      .status(200)
      .json({ message: "Agreement Rejected successfully", transfer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const MakeNegotationPrice = async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Authorization header missing" });
  }

  const token = authHeader.split(" ")[1];
  const agreementId = req.body.agreementId;
  const negotationPrice = req.body.negotationPrice;
  try {
    // Verify token
    const verify = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Find agreement by ID
    const agreement = await Agreement.findById(agreementId);

    if (!agreement) {
      return res.status(404).json({ message: "Agreement not found" });
    }

    agreement.negotationPrice = negotationPrice;

    // Save updated agreement
    await agreement.save();
    res.status(200).json({ message: "Negotation Price Updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const pricePaid = async (req, res) => {
  try {
    const { amount, currency, recipientType, recipientId } = req.body;

    if (!amount || !currency || !recipientType || !recipientId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validate recipient type
    if (recipientType !== "card" && recipientType !== "bank_account") {
      return res.status(400).json({ error: "Invalid recipient type" });
    }

    // Create a Transfer to the connected account
    const transfer = await stripe.transfers.create({
      amount: amount, // amount in cents
      currency: currency,
      destination: recipientId, // Connected Account ID (acct_...)
    });

    res.status(200).json({ success: true, transfer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

const DealDone = async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Authorization header missing" });
  }

  const token = authHeader.split(" ")[1];
  const propertId = req.body.propertyId;
  const recipientId = req.body.recipientID;
  const amount = req.body.amount;
  const agreementID = req.body.agreementID;

  try {
    // Verify token
    const verify = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Find the property
    const property = await Property.findById(propertId);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Set the property as rented and set the deal done date
    property.rented = true;
    const today = new Date();
    property.propertySelling.dealDoneDate = today;

    // Save the updated property details
    await property.save();

    // Create a Transfer to the connected account using Stripe
    const transfer = await stripe.transfers.create({
      amount: amount, // amount in cents
      currency: "usd",
      destination: recipientId, // Connected Account ID (acct_...)
    });

    // Schedule a cron job to update the property and agreement after 30 days
    const dealDoneDate = property.propertySelling.dealDoneDate;
    const delayInMs = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    const cronTime = new Date(dealDoneDate.getTime() + delayInMs);

    // Prepare cron job schedule to run after 30 days
    const cronExpression = `0 ${cronTime.getMinutes()} ${cronTime.getHours()} ${cronTime.getDate()} ${
      cronTime.getMonth() + 1
    } *`;

    // Schedule the cron job to update agreement and property after 30 days
    cron.schedule(cronExpression, async () => {
      try {
        // Find the agreement to update
        const agreement = await Agreement.findById(agreementID);
        const property = await Property.findById(propertId);

        if (agreement && property) {
          // Update agreement and property
          agreement.agreementSuccess = false;
          property.propertySelling.agreement = false;
          property.propertySelling.agreementMaker = null;
          property.propertySelling.dealDoneDate = null;

          // Save updated agreement and property
          await agreement.save();
          await property.save();

          console.log(
            `Agreement and property updated after 30 days for property ${propertId}`
          );
        }
      } catch (error) {
        console.error("Error in cron job:", error);
      }
    });

    // Respond with success
    res.status(200).json({ message: "Deal done successfully", transfer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// const myProperty = async (req, res) => {
//   try {
//     const myData = await Property.find(
//       {},
//       "_id title description type rent advance bachelor state city area address assest bedroom bathroom areaofhouse"
//     ).exec();
//     res.json(myData);
//   } catch (error) {
//     console.log(error);
//   }
// };

const getPropertyById = async (req, res) => {
  try {
    console.log("get property by id", req.body);
    // Validate input
    if (!req.body.id) {
      return res.status(400).json({ error: "Property ID is required" });
    }

    // Fetch property from the database
    const property = await Property.findById(req.body.id)
      .populate("propertyowner") // Populate property owner details
      .exec();

    // Check if property exists
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    // Send response
    res.status(200).json(property);
  } catch (error) {
    console.error("Error fetching property:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  createProperty,
  myProperty,
  freshRecommendation,
  makeAgreement,
  MyAgreement,
  agreementDetailShow,
  buyerDetail,
  AccceptAgreement,
  RejectAgreement,
  MakeNegotationPrice,
  pricePaid,
  DealDone,
  getPropertyById,
};
