const express = require("express");
const morgan = require("morgan");

const _ = require("lodash");
const chalk = require("chalk");

const router = express.Router();
const cardSchema = require("../validators/card");
const CardModel = require("../models/card");
const checkToken = require("./../middleware/checkToken");

const returnCardKeys = [
  "_id",
  "companyName",
  "companyDescription",
  "companyAddress",
  "companyPhoneNumber",
  "companyImageUrl",
  "user_id",
  "createdAt",
  "like_users_id",
];

// Logger Section
// router.use(morgan('dev'));
router.use(morgan("tiny"));
// router.use(morgan('combined'));

//---------- Route: /show ----------
router.get("/show", showAllCardsRequest); // Task Part 7

async function showAllCardsRequest(req, res) {
  try {
    // Find all cards in the Database
    const cardModel = await CardModel.find({});
    if (cardModel.length == 0) {
      console.log(chalk.red("No Cards Found"));
      res.status(200).send("No Cards Found");
      return;
    }
    res.status(200).send(cardModel);
  } catch (error) {
    console.log(chalk.red("Sending Error 400: " + error));
    res.status(400).send(error);
  }
}

//---------- Route: /showbyid ----------
router.get("/showbyid/:id", showCardByIdGetRequest); // Task Part 8

async function showCardByIdGetRequest(req, res) {
  if (!req.params.id) {
    console.log(chalk.red("Sending Error 400, No Card Id Provided"));
    res.status(400).send("No Card Id Provided");
    return;
  }

  try {
    // Find all cards in the Database
    const cardModel = await CardModel.findById(req.params.id);
    if (cardModel.length == 0) {
      console.log(chalk.green("No Cards Found"));
      res.status(200).send("No Cards Found");
      return;
    }
    res.status(200).send(cardModel);
  } catch (error) {
    console.log(chalk.red("Sending Error 400: " + error));
    res.status(400).send(error);
  }
}

router.post("/showbyid", showCardByIdPostRequest); // Task Part 8 (additional post method)

async function showCardByIdPostRequest(req, res) {
  if (!req.body.cardId) {
    console.log(chalk.red("Sending Error 400, No Card Id Provided"));
    res.status(400).send("No Card Id Provided");
    return;
  }

  try {
    // Find all cards in the Database
    const cardModel = await CardModel.findById(req.body.cardId);
    if (cardModel.length == 0) {
      console.log(chalk.green("No Cards Found"));
      res.status(200).send("No Cards Found");
      return;
    }
    res.status(200).send(cardModel);
  } catch (error) {
    console.log(chalk.red("Sending Error 400: " + error));
    res.status(400).send(error);
  }
}

//---------- Route: /showbyuser ----------
router.get("/showbyuser", checkToken, showCardsByUserIdRequest); // Task Part 9

async function showCardsByUserIdRequest(req, res) {
  if (req.biz) {
    try {
      // Find all cards of logedin user in the Database
      const cardModel = await CardModel.find({ user_id: req.uid });
      if (cardModel.length > 0) {
        console.log(cardModel);
        res.status(200).send(cardModel);
      } else {
        console.log(chalk.green("Current user does not own any cards"));
        res.status(200).send("Current user does not own any cards");
      }
    } catch (error) {
      console.log(chalk.red("Sending Error 400: " + error));
      res.status(400).send(error);
    }
  } else {
    console.log(chalk.red(`Regular users can't own cards`));
    res.status(400).send("Regular users can't own cards");
  }
}

//---------- Route: /create ----------
router.post("/create", checkToken, createRequest); // Task Part 10

async function createRequest(req, res) {
  // Debug Print req.body
  console.log(chalk.blue(`Data recieved from POST Method:`));
  console.log(req.body);

  // error exist if validation fails
  // value exist if validation OK
  const { error, value } = cardSchema.newCard.validate(req.body);

  // user is pointer to value object
  const card = value;

  if (error) {
    console.log(chalk.red("Sending Error 400: " + error));
    res.status(400).send(error);
  } else {
    if (req.biz) {
      console.log(chalk.green(`Business user can create new card`));
      try {
        // Set Card creator _id
        card.user_id = req.uid;

        // Task, Part 10.6
        const savedCard = await saveCard(card);
        // Task, Part 10.7
        console.log(
          chalk.green(
            "Sending Status 200, Card saved to Database successfully."
          )
        );
        res.status(201).send(savedCard);
      } catch (error) {
        // Task, Part 10.8
        console.log(chalk.red("Sending Error 500: " + error));
        res.status(500).send(error);
      }
    } else {
      console.log(chalk.red(`Regular user not allowed to create a new card`));
      res.status(400).send("Regular user not allowed to create a new card");
    }
  }
}

function saveCard(card) {
  return new Promise(async (resolve, reject) => {
    try {
      const savedCard = await new CardModel(card).save();
      resolve(_.pick(savedCard, returnCardKeys)); // Lodash module, lives only requiered fields.
    } catch (error) {
      reject(error);
    }
  });
}

//---------- Route: /update ----------
router.put("/update", checkToken, updatePutRequest); // Task Part 11

async function updatePutRequest(req, res) {
  if (req.biz) {
    // Add logic..........

    console.log(chalk.green("Only Biz user can update a card."));
    res.status(200).send({ id: req.body.id });
  } else {
    console.log(chalk.red(`Regular users can't own cards`));
    res.status(400).send("Regular users can't own cards");
  }
}

//---------- Route: /update ----------
router.delete("/delete", checkToken, deleteRequest); // Task Part 12

async function deleteRequest(req, res) {
  if (req.biz || req.admin) {
    console.log(
      chalk.green("Only Biz user or Administrator can delete a card.")
    );
    console.log(chalk.blue("biz " + req.biz));
    console.log(chalk.blue("Admin " + req.admin));

    try {
      // Find card by id in the Database
      const cardModel = await CardModel.findById(req.body.cardId);
      if (cardModel.length == 0) {
        console.log(chalk.green("No Cards Found"));
        res.status(200).send("No Cards Found");
        return;
      }
      const status = await CardModel.deleteOne({ _id: cardModel._id });
      console.log(
        chalk.bgGreenBright(
          `Document with _id: ${cardModel._id} was deleted successfully`
        )
      );
      //res.status(200).send(cardModel);
      res.status(200).send(status);
    } catch (error) {
      console.log(chalk.red("Sending Error 500: " + error));
      res.status(500).send(error);
    }
  } else {
    console.log(chalk.red(`Regular user can't delete card`));
    res.status(400).send("Regular user can't delete card");
  }
}

module.exports = router;
